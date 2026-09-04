import { NextRequest, NextResponse } from 'next/server';

/**
 * Midtrans Webhook Handler
 * Deprecated per client requirement in favor of Direct Admin WhatsApp orders.
 * Strictly read-only to prevent unauthorized tier mutations.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    status: 'received',
    channel: 'direct_admin_managed',
    message: 'Transaksi otomatis dinonaktifkan. Seluruh aktivasi dikelola langsung oleh tim Admin GoTangguh.'
  });
}
