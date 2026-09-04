import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';

export const dynamic = 'force-dynamic';

/**
 * Order / Inquiry Status Check
 * Strictly read-only; polling cannot mutate user entitlements.
 */
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

    const pool = getDbPool();
    // Query booking or transaction state
    const [bookingRows]: any = await pool.query(
      'SELECT id, voucher_code as voucherCode, status, package_type as packageType FROM consultation_bookings WHERE voucher_code = ? OR id = ? LIMIT 1',
      [orderId, orderId]
    ).catch(() => [[]]);

    if (bookingRows && bookingRows.length > 0) {
      const booking = bookingRows[0];
      return NextResponse.json({
        success: true,
        orderId,
        status: booking.status,
        packageType: booking.packageType,
        isConfirmed: booking.status === 'DIKONFIRMASI' || booking.status === 'SELESAI'
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: 'MENUNGGU DISPATCH',
      isConfirmed: false
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memeriksa status pesanan' },
      { status: 500 }
    );
  }
}
