import { HazardZone } from '../models/HazardZone';

/**
 * @deprecated DEMO_ONLY - Static simulated hazard repository for offline UI mockups.
 * MUST NOT be imported or used in live location assessment or scoring pipelines.
 * Live spatial data is provided exclusively by FaultLineSpatialStore, InaRiskBnpbClient, and official external APIs.
 */
export class HazardZoneRepository {
  /**
   * @deprecated DEMO ONLY static zones
   */
  private static defaultZones: HazardZone[] = [
    {
      id: 'hz-baribis-01',
      name: 'Patahan Sesar Baribis (Segmen Jakarta - Bekasi)',
      category: 'earthquake',
      level: 'high',
      score: 78,
      latitude: -6.2800,
      longitude: 106.9200,
      radiusMeters: 15000,
      descriptionId: 'Sesar aktif teridentifikasi dalam PusGen 2024 dengan laju geser ~1.5 mm/tahun.',
      descriptionEn: 'Active fault identified in PusGen 2024 with slip rate ~1.5 mm/yr.',
      mitigationPrescriptionId: 'Wajib perkuatan kolom struktur beton bertulang standar SNI 1726:2019 & sempadan 50m.',
      mitigationPrescriptionEn: 'Reinforced concrete framing per SNI 1726:2019 & 50m fault buffer required.',
      regulationsRef: 'PusGen 2024 / SNI 1726:2019'
    },
    {
      id: 'hz-ciliwung-01',
      name: 'Daerah Aliran Sungai Ciliwung Fluvial Basin',
      category: 'flood',
      level: 'high',
      score: 85,
      latitude: -6.2100,
      longitude: 106.8400,
      radiusMeters: 5000,
      descriptionId: 'Elevasi rendah Copernicus DEM < 8m terhadap muka air banjir kiriman Katulampa.',
      descriptionEn: 'Low Copernicus DEM elevation < 8m vulnerable to upstream fluvial flooding.',
      mitigationPrescriptionId: 'Peninggian peil lantai dasar (+60cm) dan instalasi non-return valve saluran.',
      mitigationPrescriptionEn: 'Elevate ground floor slab (+60cm) and install backflow preventer valves.',
      regulationsRef: 'Peraturan Menteri PUPR No. 28/PRT/M/2015'
    }
  ];

  static async findNearby(lat: number, lng: number): Promise<HazardZone[]> {
    // In-memory / GIS table query
    return this.defaultZones;
  }
}
