import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tierLevel, planName, price, fullName, phone } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { success: false, error: 'MIDTRANS_SERVER_KEY belum dikonfigurasi pada environment variables (.env.local).' },
        { status: 500 }
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const grossAmount = Number(price) || 35000;
    const orderId = `GT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const userEmail = email || 'buyer.demo@gotangguh.id';
    const targetTier = tierLevel || 'Tier 2 Pro (Instant Rp 35rb)';
    const customerName = fullName || 'Pelanggan GoTangguh';
    const customerPhone = phone || '+628123456789';

    // Official Midtrans Snap API Endpoint
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
          name: (planName || 'GoTangguh Tier 2 Pro (3 Laporan PDF)').substring(0, 50)
        }
      ],
      customer_details: {
        first_name: customerName,
        email: userEmail,
        phone: customerPhone
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

    // 2. Record Pending Transaction in MySQL Database
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
          planName || 'GoTangguh Tier 2 Pro (3 Laporan PDF)',
          targetTier,
          grossAmount,
          snapToken,
          redirectUrl
        ]
      );
    } catch (dbErr) {
      console.warn('[Midtrans DB Record Warning]:', dbErr);
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
