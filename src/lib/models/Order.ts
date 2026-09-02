export type PaymentStatus = 'PENDING' | 'SETTLEMENT' | 'EXPIRED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  tierPlan: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  amountIdr: number;
  paymentGatewayRef?: string;
  paymentStatus: PaymentStatus;
  snapToken?: string;
  pdfReportId?: string;
  createdAt: string;
  updatedAt?: string;
}
