import { NextRequest, NextResponse } from 'next/server';

/**
 * Commercial Transaction Gateway Endpoint
 * Currently routed to Direct Admin Consultation & Verification per client specification.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    channel: 'direct_admin_chat',
    message: 'Transaksi dan penerbitan laporan resmi dialihkan melalui kontak langsung Admin/WhatsApp.',
    contact: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281199887766'
  });
}
