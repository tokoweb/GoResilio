import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, isPaid: false, error: 'Parameter order_id wajib disertakan.' },
        { status: 400 }
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    const statusUrl = isProduction
      ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
      : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;

    const authString = Buffer.from(`${serverKey.trim()}:`).toString('base64');

    // 1. Query Official Midtrans Core Status API
    const midtransRes = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      cache: 'no-store'
    });

    const midtransData = await midtransRes.json();
    const rawStatus = (midtransData.transaction_status || '').toLowerCase();
    const statusCode = midtransData.status_code;
    const fraudStatus = (midtransData.fraud_status || '').toLowerCase();
    const paymentType = midtransData.payment_type || 'midtrans_snap';

    const isSettled =
      rawStatus === 'settlement' ||
      (rawStatus === 'capture' && (fraudStatus === 'accept' || !fraudStatus));

    const pool = getDbPool();

    // 2. Query Local Database for User and Target Tier
    const [txRows]: any = await pool.query(
      'SELECT id, order_id as orderId, user_email as userEmail, plan_name as planName, tier_level as tierLevel, amount, transaction_status as transactionStatus FROM payment_transactions WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    let userEmail = txRows && txRows.length > 0 ? txRows[0].userEmail : null;
    let targetTier = txRows && txRows.length > 0 ? txRows[0].tierLevel : 'Tier 2 Pro (Instant Rp 35rb)';

    // If transaction is settled on Midtrans, upgrade database immediately
    if (isSettled) {
      if (txRows && txRows.length > 0) {
        await pool.query(
          'UPDATE payment_transactions SET transaction_status = ?, payment_type = ?, updated_at = NOW() WHERE order_id = ?',
          ['settlement', paymentType, orderId]
        );
      }

      if (userEmail) {
        await pool.query(
          'UPDATE users SET tier_level = ? WHERE email = ?',
          [targetTier, userEmail]
        );

        const [userRows]: any = await pool.query(
          'SELECT id, email, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified FROM users WHERE email = ? LIMIT 1',
          [userEmail]
        );

        const updatedUser = userRows && userRows.length > 0 ? userRows[0] : null;

        return NextResponse.json({
          success: true,
          isPaid: true,
          status: 'settlement',
          orderId,
          grossAmount: midtransData.gross_amount,
          paymentType,
          user: updatedUser,
          message: 'Pembayaran LUNAS terverifikasi oleh server Midtrans.'
        });
      }

      return NextResponse.json({
        success: true,
        isPaid: true,
        status: 'settlement',
        orderId,
        grossAmount: midtransData.gross_amount,
        paymentType,
        message: 'Pembayaran LUNAS terverifikasi oleh server Midtrans.'
      });
    }

    // If pending on Midtrans
    if (rawStatus === 'pending') {
      if (txRows && txRows.length > 0) {
        await pool.query(
          'UPDATE payment_transactions SET transaction_status = ?, payment_type = ?, updated_at = NOW() WHERE order_id = ?',
          ['pending', paymentType, orderId]
        );
      }

      return NextResponse.json({
        success: true,
        isPaid: false,
        status: 'pending',
        orderId,
        paymentType,
        vaNumber: midtransData.va_numbers?.[0]?.va_number || midtransData.permata_va_number || null,
        bank: midtransData.va_numbers?.[0]?.bank || (midtransData.permata_va_number ? 'permata' : null),
        message: 'Pembayaran belum diselesaikan (Status: PENDING). Silakan transfer melalui instruksi pembayaran yang dipilih.'
      });
    }

    // If expired, canceled, or denied
    if (rawStatus === 'expire' || rawStatus === 'cancel' || rawStatus === 'deny') {
      if (txRows && txRows.length > 0) {
        await pool.query(
          'UPDATE payment_transactions SET transaction_status = ?, updated_at = NOW() WHERE order_id = ?',
          [rawStatus, orderId]
        );
      }

      return NextResponse.json({
        success: false,
        isPaid: false,
        status: rawStatus,
        orderId,
        message: `Transaksi tidak berhasil (${rawStatus.toUpperCase()}). Silakan ulangi proses pemesanan.`
      });
    }

    // If 404 / transaction not yet initiated on Midtrans
    return NextResponse.json({
      success: false,
      isPaid: false,
      status: 'unpaid',
      orderId,
      midtransStatusCode: statusCode,
      message: 'Transaksi belum diselesaikan di portal Midtrans. Silakan selesaikan pembayaran terlebih dahulu.'
    });
  } catch (err: any) {
    console.error('[Payment Status API Error]:', err);
    return NextResponse.json(
      { success: false, isPaid: false, error: err.message || 'Gagal mengecek status pembayaran ke Midtrans.' },
      { status: 500 }
    );
  }
}
