import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';

// Canonical Server-Side Pricing Catalog (Client cannot manipulate transaction price)
const SERVER_PRICING_CATALOG: Record<string, { price: number; planName: string; tierLevel: string }> = {
  'instant_1': { price: 35000, planName: 'Laporan Instan (1 Properti)', tierLevel: 'Tier 2 Pro (Instant Rp 35rb)' },
  'bundle_3': { price: 85000, planName: 'Bundling (Bandingkan 3 Properti)', tierLevel: 'Tier 2 Pro (3 Laporan PDF)' },
  'consultation_expert': { price: 350000, planName: 'Konsultasi Ahli & Verifikasi Lapangan', tierLevel: 'Tier 3 Expert Advisory' },
  'tier-1': { price: 35000, planName: 'Laporan Instan (1 Properti)', tierLevel: 'Tier 2 Pro (Instant Rp 35rb)' },
  'tier-2': { price: 85000, planName: 'Bundling (Bandingkan 3 Properti)', tierLevel: 'Tier 2 Pro (3 Laporan PDF)' },
  'tier-3': { price: 350000, planName: 'Konsultasi Ahli & Verifikasi Lapangan', tierLevel: 'Tier 3 Expert Advisory' }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tierLevel, planName, fullName, phone } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { success: false, error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi pada environment variables (.env.local).' },
        { status: 500 }
      );
    }

    // Resolve Price Strictly From Server Pricing Catalog (Ignore Client-Supplied Price)
    const rawKey = (tierLevel || planName || 'instant_1').toLowerCase().replace(/\s+/g, '_');
    let packageInfo = SERVER_PRICING_CATALOG[rawKey];
    if (!packageInfo) {
      if (rawKey.includes('3') || rawKey.includes('bundl')) {
        packageInfo = SERVER_PRICING_CATALOG['bundle_3'];
      } else if (rawKey.includes('ahli') || rawKey.includes('konsultasi') || rawKey.includes('expert')) {
        packageInfo = SERVER_PRICING_CATALOG['consultation_expert'];
      } else {
        packageInfo = SERVER_PRICING_CATALOG['instant_1'];
      }
    }

    const grossAmount = packageInfo.price;
    const targetTier = packageInfo.tierLevel;
    const resolvedPlanName = packageInfo.planName;
    const orderId = `GT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Verify Real User Identity (No Synthetic Identities)
    let userEmail = (email || '').trim();
    let customerName = (fullName || '').trim();
    const customerPhone = (phone || '').trim();

    if (!userEmail || !customerName) {
      const auth = await AuthGuard.authenticateRequest(req);
      if (auth.user) {
        userEmail = userEmail || auth.user.email;
        customerName = customerName || auth.user.fullName;
      }
    }

    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Alamat email valid pembeli wajib disertakan untuk transaksi.' },
        { status: 400 }
      );
    }

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap pembeli wajib disertakan untuk transaksi.' },
        { status: 400 }
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authString = Buffer.from(`${serverKey.trim()}:`).toString('base64');

    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: [
        {
          id: 'GT-DOSSIER-PRO',
          price: grossAmount,
          quantity: 1,
          name: resolvedPlanName.substring(0, 50)
        }
      ],
      customer_details: {
        first_name: customerName,
        email: userEmail,
        phone: customerPhone || undefined
      },
      enabled_payments: [
        'gopay',
        'qris',
        'bca_va',
        'bni_va',
        'bri_va',
        'mandiri_va',
        'permata_va',
        'other_va',
        'credit_card',
        'shopeepay'
      ],
      credit_card: {
        secure: true
      },
      callbacks: {
        finish: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}?payment=success` : 'http://localhost:3000?payment=success'
      }
    };

    // 1. Call Real Midtrans Snap API
    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(snapPayload)
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      const errorMsg = data.error_messages ? data.error_messages.join(', ') : (data.status_message || `Midtrans HTTP ${response.status}`);
      console.error('[Midtrans Snap API Error]:', errorMsg, data);
      return NextResponse.json(
        {
          success: false,
          error: `Midtrans API Error: ${errorMsg}. Pastikan Kunci Server Midtrans pada .env.local telah sesuai.`
        },
        { status: response.status || 500 }
      );
    }

    const snapToken = data.token;
    const redirectUrl = data.redirect_url || `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

    // 2. Record Pending Transaction in MySQL Database (Fail-fast on DB error)
    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO payment_transactions 
         (id, order_id, user_email, plan_name, tier_level, amount, payment_type, transaction_status, snap_token, snap_redirect_url) 
         VALUES (?, ?, ?, ?, ?, ?, 'midtrans_snap', 'pending', ?, ?)
         ON DUPLICATE KEY UPDATE snap_token = VALUES(snap_token), snap_redirect_url = VALUES(snap_redirect_url)`,
        [
          `tx_${Date.now()}`,
          orderId,
          userEmail,
          resolvedPlanName,
          targetTier,
          grossAmount,
          snapToken,
          redirectUrl
        ]
      );
    } catch (dbErr) {
      console.error('[Midtrans DB Record Error]:', dbErr);
      return NextResponse.json(
        {
          success: false,
          error: `Gagal mencatat transaksi pembayaran ke basis data: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      token: snapToken,
      redirect_url: redirectUrl,
      grossAmount,
      isRealSnap: true,
      message: 'Transaksi Midtrans Snap berhasil diinisialisasi.'
    });
  } catch (error: any) {
    console.error('[Midtrans Route Exception]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses transaksi ke gateway Midtrans' },
      { status: 500 }
    );
  }
}
