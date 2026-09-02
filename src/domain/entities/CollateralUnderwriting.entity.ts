export interface CollateralUnderwritingEntity {
  id: string;
  userId: string;
  debtorName: string;
  collateralRef: string;
  propertyLocation: string;
  loanAmountStr: string;
  compositeScore: number;
  riskLevelDesc: string;
  ltvPolicy: string;
  esgCategory: string;
  createdAt?: string;
}
