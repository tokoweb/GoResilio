import type { AccountRole } from '../../lib/models/User';

export interface UserEntity {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  organization?: string;
  phoneNumber?: string;
  tierLevel: string;
  isVerified: boolean;
  createdAt?: string;
}
