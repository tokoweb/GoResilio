export type AccountRole =
  | 'Home Buyer'
  | 'Property Developer'
  | 'Lender / Bank'
  | 'Consultant / Auditor'
  | 'Super Admin (RDI)';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  organization?: string;
  phoneNumber?: string;
  tierLevel: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}
