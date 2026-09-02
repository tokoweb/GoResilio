import { BookingRepository } from '../repositories/BookingRepository';
import { Booking } from '../models/Booking';

export class BookingService {
  static async createBooking(data: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    targetLocation: string;
    packageType: string;
    notes?: string;
  }): Promise<{ bookingId: string; voucherCode: string }> {
    const voucherCode = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const id = await BookingRepository.create({
      voucherCode,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      targetLocation: data.targetLocation,
      packageType: data.packageType,
      assignedExpert: 'Tim Ahli RDI & BGP Consultant',
      scheduledDate: 'Konfirmasi via WhatsApp / Email',
      status: 'MENUNGGU DISPATCH',
      notes: data.notes
    });

    return { bookingId: id, voucherCode };
  }

  static async getQueue(): Promise<Booking[]> {
    return await BookingRepository.getAll();
  }
}
