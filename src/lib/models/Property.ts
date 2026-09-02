export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface Property {
  id: string;
  userId: string;
  refNumber: string;
  propertyName: string;
  address: string;
  propertyType: string;
  latitude: number;
  longitude: number;
  overallScore: number;
  riskLevel: RiskLevel;
  floodScore: number;
  quakeScore: number;
  heatScore: number;
  elevationMeters: number;
  faultDistanceKm: number;
  lastUpdatedStr: string;
  createdAt?: string;
}
