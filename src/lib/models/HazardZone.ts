import { RiskLevel } from './Property';

export interface HazardZone {
  id: string;
  name: string;
  category: 'flood' | 'earthquake' | 'heat' | 'transport';
  level: RiskLevel;
  score: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  descriptionId: string;
  descriptionEn: string;
  mitigationPrescriptionId: string;
  mitigationPrescriptionEn: string;
  regulationsRef: string; // e.g. 'SNI 1726:2019 / PusGen 2024'
}
