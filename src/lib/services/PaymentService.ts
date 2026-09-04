import { getDbPool } from '../db/connection';

export interface CheckoutPayload {
  tierPlan: string;
  amountIdr: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface PaymentResponse {
  success: boolean;
  orderId: string;
  snapToken?: string;
  snapRedirectUrl?: string;
  message: string;
}

/**
 * PaymentService — Real Midtrans Gateway integration wrapper with MySQL persistence
 */
export class PaymentService {
  static async createCheckout(payload: CheckoutPayload): Promise<PaymentResponse> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY tidak ditemukan pada environment variables (.env.local).');
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const orderId = `MT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const grossAmount = payload.amountIdr || 35000;

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
          name: (payload.tierPlan || 'GoTangguh Tier 2 Pro').substring(0, 50)
        }
      ],
      customer_details: {
        first_name: payload.customerName,
        email: payload.customerEmail,
        phone: payload.customerPhone || undefined
      }
    };

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
      throw new Error(`Midtrans API Error: ${errorMsg}`);
    }

    const snapToken = data.token;
    const snapRedirectUrl = data.redirect_url || `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

    // Record into MySQL Database
    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO payment_transactions 
         (id, order_id, user_email, plan_name, tier_level, amount, payment_type, transaction_status, snap_token, snap_redirect_url) 
         VALUES (?, ?, ?, ?, ?, ?, 'midtrans_snap', 'pending', ?, ?)`,
        [
          `tx_${Date.now()}`,
          orderId,
          payload.customerEmail,
          payload.tierPlan,
          payload.tierPlan,
          grossAmount,
          snapToken,
          snapRedirectUrl
        ]
      );
    } catch (dbErr) {
      console.warn('[PaymentService DB Record Warning]:', dbErr);
    }

    return {
      success: true,
      orderId,
      snapToken,
      snapRedirectUrl,
      message: `Invoice untuk ${payload.tierPlan} (${grossAmount.toLocaleString('id-ID')}) berhasil dibuat.`
    };
  }
}
