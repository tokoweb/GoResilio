import {
  ConsultationBookingRecord,
  IndexedDbRepository
} from '../../infrastructure/database/IndexedDbRepository';

export interface BookingInput {
  fullName: string;
  email: string;
  phone?: string;
  organization: string;
  roleTitle: string;
  packageInterest: string;
  targetLocation: string;
  preferredDate: string;
  notes?: string;
}

export class BookConsultationUseCase {
  public static async execute(input: BookingInput): Promise<{ success: boolean; bookingId: string }> {
    if (!input.fullName || !input.email || !input.preferredDate) {
      throw new Error('Nama lengkap, email, dan tanggal rencana konsultasi wajib diisi.');
    }

    const bookingId = `BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: ConsultationBookingRecord = {
      id: bookingId,
      fullName: input.fullName,
      email: input.email,
      organization: input.organization || '-',
      roleTitle: input.roleTitle || '-',
      packageInterest: input.packageInterest,
      targetLocation: input.targetLocation || 'Indonesia / Regional',
      preferredDate: input.preferredDate,
      notes: input.notes,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // 1. Save to local fallback cache
    try {
      await IndexedDbRepository.saveBooking(record);
    } catch (e) {
      console.warn('IndexedDB fallback cache error:', e);
    }

    // 2. Save directly to MySQL database via API
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: bookingId,
            voucherCode: bookingId,
            clientName: input.fullName,
            clientEmail: input.email,
            clientPhone: input.phone || '+6281200000000',
            targetLocation: input.targetLocation,
            packageType: input.packageInterest,
            assignedExpert: 'Tim Peneliti RDI & BGP Consultant',
            scheduledDate: input.preferredDate,
            status: 'MENUNGGU DISPATCH',
            notes: input.notes
          })
        });
      }
    } catch (apiErr) {
      console.warn('MySQL booking API error:', apiErr);
    }

    return {
      success: true,
      bookingId
    };
  }
}
