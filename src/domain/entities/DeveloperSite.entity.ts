export interface DeveloperSiteEntity {
  id: string;
  userId: string;
  projectName: string;
  locationDesc: string;
  landAreaHa: number;
  dominantHazard: string;
  statusText: string;
  kdbRating: string;
  kdhPct: number;
  complianceStatus: 'VERIFIED' | 'ACTION REQUIRED' | 'PENDING';
  createdAt?: string;
}
