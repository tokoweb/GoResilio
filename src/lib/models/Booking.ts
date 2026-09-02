export type BookingStatus =
  | 'MENUNGGU DISPATCH'
  | 'DIKONFIRMASI'
  | 'SURVEI BERJALAN'
  | 'SELESAI';

export interface Booking {
  id: string;
  voucherCode: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  targetLocation: string;
  packageType: string;
  assignedExpert: string;
  scheduledDate: string;
  status: BookingStatus;
  notes?: string;
  createdAt?: string;
}
