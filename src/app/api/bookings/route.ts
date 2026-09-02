import { NextRequest, NextResponse } from 'next/server';
import { MySQLBookingRepository } from '../../../infrastructure/database/repositories/MySQLBookingRepository';

export async function GET() {
  try {
    const bookings = await MySQLBookingRepository.getAll();
    return NextResponse.json({ success: true, count: bookings.length, data: bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat permohonan konsultasi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = await MySQLBookingRepository.create(body);
    return NextResponse.json({
      success: true,
      id,
      voucherCode: body.voucherCode,
      message: 'Jadwal konsultasi dan survei lapangan berhasil dicatat ke database MySQL.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan pemesanan' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, notes, assignedExpert } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }
    const updated = await MySQLBookingRepository.updateStatusAndNotes(id, status, notes, assignedExpert);
    return NextResponse.json({ success: updated, message: 'Status dan penugasan ahli berhasil diperbarui di database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui status permohonan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }
    const deleted = await MySQLBookingRepository.delete(id);
    return NextResponse.json({ success: deleted, message: 'Permohonan konsultasi berhasil dihapus dari database MySQL.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus permohonan' },
      { status: 500 }
    );
  }
}
