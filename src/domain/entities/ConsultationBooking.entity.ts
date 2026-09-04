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
  status: string;
  role?: string;
  notes?: string;
  adminNotes?: string;
  createdAt?: string;
}
