export interface ConsultationBookingEntity {
  id: string;
  voucherCode: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  targetLocation: string;
  packageType: string;
  assignedExpert: string;
  scheduledDate: string;
  status: 'MENUNGGU DISPATCH' | 'DIKONFIRMASI' | 'SURVEI BERJALAN' | 'SELESAI';
  notes?: string;
  createdAt?: string;
}
