import { NextRequest, NextResponse } from 'next/server';
import { MySQLBookingRepository } from '../../../infrastructure/database/repositories/MySQLBookingRepository';
import { AuthGuard } from '../../../infrastructure/auth/authGuard';
import { RateLimiter } from '../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../infrastructure/security/inputValidator';

export async function GET(req: NextRequest) {
  try {
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    const allBookings = await MySQLBookingRepository.getAll();

    if (user.role === 'Super Admin (RDI)' || user.role === 'Consultant / Auditor') {
      return NextResponse.json({ success: true, count: allBookings.length, data: allBookings });
    }

    // Normal user only gets bookings matching their email
    const userBookings = allBookings.filter((b) => b.clientEmail.toLowerCase() === user.email.toLowerCase());
    return NextResponse.json({ success: true, count: userBookings.length, data: userBookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat permohonan konsultasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const rateLimitRes = RateLimiter.enforce(req, 'booking_submit', 20, 60000);
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json();

    const clientName = InputValidator.validateString(body.clientName || body.fullName, 'nama lengkap', 2, 150);
    const clientEmail = InputValidator.validateEmail(body.clientEmail || body.email);
    const clientPhone = InputValidator.validateString(body.clientPhone || body.phone, 'nomor telepon / WA', 5, 30);
    const targetLocation = InputValidator.validateString(body.targetLocation || body.location, 'lokasi target', 2, 255);
    const packageType = InputValidator.validateString(body.packageType || body.package, 'tipe paket', 2, 120);

    const bookingPayload = {
      ...body,
      clientName,
      clientEmail,
      clientPhone,
      targetLocation,
      packageType,
      notes: body.notes ? InputValidator.sanitizeText(String(body.notes)) : ''
    };

    const id = await MySQLBookingRepository.create(bookingPayload);
    return NextResponse.json({
      success: true,
      id,
      voucherCode: body.voucherCode,
      message: 'Permohonan layanan berhasil dicatat. Tim admin akan menghubungi via WhatsApp/Email.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pemesanan' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Enforce Super Admin or Consultant authority for status modifications
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)', 'Consultant / Auditor']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { id, status, notes, assignedExpert } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }
    const updated = await MySQLBookingRepository.updateStatusAndNotes(id, status, notes, assignedExpert);
    return NextResponse.json({ success: updated, message: 'Status dan penugasan ahli berhasil diperbarui di database.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui status permohonan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Enforce Super Admin authority for deleting bookings
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }
    const deleted = await MySQLBookingRepository.delete(id);
    return NextResponse.json({ success: deleted, message: 'Permohonan konsultasi berhasil dihapus dari database.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus permohonan' },
      { status: 500 }
    );
  }
}
