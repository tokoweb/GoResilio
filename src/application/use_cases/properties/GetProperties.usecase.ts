import { MySQLPropertyRepository } from '../../../infrastructure/database/repositories/MySQLPropertyRepository';
import type { PropertyEntity } from '../../../domain/entities/Property.entity';

/**
 * GetPropertiesUseCase — Fetches saved property portfolios.
 * GUARANTEE: Fallback demo properties are strictly for portfolio UI visualization
 * and MUST NEVER be ingested into live site assessment or multi-hazard scoring pipelines.
 */
export class GetPropertiesUseCase {
  static async execute(allowDemoFallback: boolean = false): Promise<PropertyEntity[]> {
    const props = await MySQLPropertyRepository.getAll();
    if (props && props.length > 0) {
      return props;
    }

    // Only allow demo properties if explicitly requested in development/demo mode
    const isExplicitDemo = allowDemoFallback && (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true');
    if (!isExplicitDemo) {
      return [];
    }

    // Fallback Demo Portfolio (Development/Demo Mode Only)
    return [
      {
        id: 'prop-1',
        userId: 'usr_buyer_01',
        propertyName: 'Rumah Tinggal Kemang Pratama',
        address: 'Jl. Kemang Pratama Raya Blok AV-12, Sepanjang Jaya, Bekasi',
        propertyType: 'Residential (Rumah Tapak)',
        latitude: -6.2625,
        longitude: 106.992,
        overallScore: 78,
        riskLevel: 'high',
        floodScore: 85,
        quakeScore: 42,
        heatScore: 74,
        elevationMeters: 11.2,
        faultDistanceKm: 18.4,
        lastUpdatedStr: '22 Agustus 2026',
        refNumber: 'GT-BKS-2026-0814'
      },
      {
        id: 'prop-2',
        userId: 'usr_buyer_01',
        propertyName: 'Townhouse Cluster Aster BSD City',
        address: 'Cluster Aster, BSD City Sektor 7, Pagedangan, Tangerang',
        propertyType: 'Residential (Townhouse)',
        latitude: -6.3021,
        longitude: 106.6521,
        overallScore: 28,
        riskLevel: 'low',
        floodScore: 18,
        quakeScore: 32,
        heatScore: 35,
        elevationMeters: 38.5,
        faultDistanceKm: 24.1,
        lastUpdatedStr: '19 Agustus 2026',
        refNumber: 'GT-TNG-2026-0792'
      },
      {
        id: 'prop-3',
        userId: 'usr_buyer_01',
        propertyName: 'Ruko Niaga Sentra Sentul',
        address: 'Kompleks Ruko Sentul City Kav. 88, Babakan Madang, Bogor',
        propertyType: 'Commercial (Ruko / Kantor)',
        latitude: -6.554,
        longitude: 106.862,
        overallScore: 62,
        riskLevel: 'medium',
        floodScore: 30,
        quakeScore: 68,
        heatScore: 45,
        elevationMeters: 215.0,
        faultDistanceKm: 8.2,
        lastUpdatedStr: '15 Agustus 2026',
        refNumber: 'GT-BGR-2026-0641'
      }
    ];
  }
}
