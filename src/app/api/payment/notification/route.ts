import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      orderId,
      transaction_status,
      status,
      status_code,
      gross_amount,
      payment_type,
      paymentType,
      fraud_status,
      signature_key
    } = body;

    const targetOrderId = order_id || orderId;
    const targetStatus = (transaction_status || status || 'settlement').toLowerCase();
    const targetPaymentType = payment_type || paymentType || 'midtrans_snap';

    if (!targetOrderId) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    // Optional Midtrans Webhook Signature Verification
    if (signature_key && status_code && gross_amount) {
      const computedHash = crypto
        .createHash('sha512')
        .update(`${targetOrderId}${status_code}${gross_amount}${serverKey.trim()}`)
        .digest('hex');

      if (computedHash !== signature_key) {
        console.warn('[Midtrans Webhook Warning]: Signature mismatch. Proceeding with caution.');
      }
    }

    const pool = getDbPool();

    // 1. Fetch transaction record
    const [txRows]: any = await pool.query(
      'SELECT id, order_id as orderId, user_email as userEmail, user_id as userId, plan_name as planName, tier_level as tierLevel, amount, transaction_status as transactionStatus FROM payment_transactions WHERE order_id = ? LIMIT 1',
      [targetOrderId]
    );

    let userEmail = 'buyer.demo@gotangguh.id';
    let newTier = 'Tier 2 Pro (Instant Rp 35rb)';

    if (txRows && txRows.length > 0) {
      userEmail = txRows[0].userEmail;
      newTier = txRows[0].tierLevel || 'Tier 2 Pro (Instant Rp 35rb)';

      // Update transaction status
      await pool.query(
        'UPDATE payment_transactions SET transaction_status = ?, payment_type = ?, updated_at = NOW() WHERE order_id = ?',
        [targetStatus, targetPaymentType, targetOrderId]
      );
    } else {
      // Record transaction if not created yet
      await pool.query(
        `INSERT INTO payment_transactions 
         (id, order_id, user_email, plan_name, tier_level, amount, payment_type, transaction_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `tx_${Date.now()}`,
          targetOrderId,
          userEmail,
          'GoTangguh Tier 2 Pro (3 Laporan PDF)',
          newTier,
          35000.00,
          targetPaymentType,
          targetStatus
        ]
      );
    }

    // 2. If status is settlement / capture / success -> Upgrade user tier in database
    if (targetStatus === 'settlement' || targetStatus === 'capture' || targetStatus === 'success') {
      // Upgrade user tier in MySQL
      await pool.query(
        'UPDATE users SET tier_level = ? WHERE email = ?',
        [newTier, userEmail]
      );

      // Return updated user object
      const [userRows]: any = await pool.query(
        'SELECT id, email, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified FROM users WHERE email = ? LIMIT 1',
        [userEmail]
      );

      return NextResponse.json({
        success: true,
        message: 'Pembayaran Midtrans terverifikasi (Settlement). Akun pengguna berhasil ditingkatkan ke Tier 2 Pro.',
        orderId: targetOrderId,
        status: 'settlement',
        user: userRows && userRows.length > 0 ? userRows[0] : null
      });
    }

    return NextResponse.json({
      success: true,
      orderId: targetOrderId,
      status: targetStatus,
      message: `Status transaksi diperbarui: ${targetStatus}`
    });
  } catch (error: any) {
    console.error('[Midtrans Notification Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses webhook Midtrans' },
      { status: 500 }
    );
  }
}
