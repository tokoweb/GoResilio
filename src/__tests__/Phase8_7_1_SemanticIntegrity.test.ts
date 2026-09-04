import { describe, it, expect } from 'vitest';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { MultiHazardAssessmentResult } from '../domain/entities/MultiHazardAssessment';

describe('Phase 8.7.1 — Semantic Integrity & User-Friendly Presentation', () => {
  const createMockAssessment = (overrides: Partial<MultiHazardAssessmentResult> = {}): MultiHazardAssessmentResult => ({
    assessmentId: 'mock-123',
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      formattedAddress: 'Jakarta, Indonesia',
      administrativeArea: 'DKI Jakarta',
      country: 'Indonesia'
    },
    overallScore: 65,
    overallLevel: 'high',
    dataCoveragePct: 90,
    overallReliability: 'measured',
    confidenceScore: 85,
    analyzedAt: new Date().toISOString(),
    flood: {
      score: 55,
      level: 'medium',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      floodModelLevel: 'Genangan Menengah',
      floodClass: 'Sedang',
      floodClassSource: 'BNPB',
      elevationMeters: 12,
      slopeDegrees: 2.1,
      slopePercent: 3.6,
      slopeClassification: 'Datar',
      localReliefMeters: -0.8,
      localReliefType: 'Cekungan Lokal',
      flowAccumulationPotential: 'Cekungan Rendah',
      distanceToRiverMeters: 45,
      nearestRiverName: 'Kali Ciliwung',
      max24hRainfallMm: 120,
      rainfallPeriod: '2020–2024',
      rainfallDataSource: 'ERA5-Seamless',
      floodDepthMeters: null,
      historicalFloodEventsCount: 3,
      historicalFloodPeriod: '10 Tahun',
      imperviousSurfaceRatioPct: 80,
      nearestDrainageChannel: 'Saluran Tersier',
      distanceToDrainageMeters: 15,
      bnpbInaRiskClass: 'Sedang',
      bnpbFloodHazardIndex: 0.52,
      thinkHazardFloodLevel: 'High',
      thinkHazardGranularity: 'admin2',
      riverDischargeM3s: 180,
      glofasDischargeModelM3s: 180,
      floodZoneType: 'Genangan Menengah',
      potentialDepthRange: null,
      scoreLedger: null,
      causeId: 'Penyebab banjir',
      causeEn: 'Flood cause',
      impactId: 'Dampak banjir',
      impactEn: 'Flood impact',
      recomId: 'Rekomendasi',
      recomEn: 'Recommendation'
    },
    quake: {
      score: 60,
      level: 'medium',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      quakeClass: 'Sedang',
      quakeClassSource: 'BNPB',
      estimatedPgaG: 0.28,
      nearestFaultDistanceKm: 18,
      nearestFaultName: 'Sesar Baribis',
      distanceToFaultKm: 18,
      historicalQuakesCount150km: 12,
      maxHistoricalMag: 5.8,
      soilSiteClass: 'D',
      soilType: 'Tanah Sedang',
      spectralAccelerationSs: 0.85,
      spectralAccelerationS1: 0.38,
      sniStandardRef: 'SNI 1726:2019',
      liquefactionRisk: 'Rendah',
      liquefactionSource: 'BNPB',
      scoreLedger: null,
      bnpbInaRiskClass: 'Sedang',
      causeId: 'Penyebab gempa',
      causeEn: 'Quake cause',
      impactId: 'Dampak gempa',
      impactEn: 'Quake impact',
      recomId: 'Rekomendasi gempa',
      recomEn: 'Quake recommendation'
    },
    heat: {
      score: 45,
      level: 'medium',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      heatModelLevel: 'Paparan Termal Sedang',
      forecastPeakTempC: 33.5,
      avgMaxTempC: 32.1,
      historicalPeakTempC: 37.2,
      historicalPeriod: '2020–2024',
      historicalDataSource: 'ERA5',
      thinkHazardExtremeHeatLevel: 'Medium',
      greenSpaceRatioPct: 15,
      urbanHeatIslandFactor: 'Sedang',
      projectedTempRise2050C: 1.4,
      climateProjectionModel: 'CMIP6',
      acCostIncreasePct: null,
      causeId: 'Penyebab panas',
      causeEn: 'Heat cause',
      impactId: 'Dampak panas',
      impactEn: 'Heat impact',
      recomId: 'Rekomendasi panas',
      recomEn: 'Heat recommendation'
    },
    transport: {
      score: 75,
      level: 'good',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      distanceToRoadMeters: 10,
      nearestRoadName: 'Jl. Sudirman',
      distanceToMajorRoadMeters: 150,
      nearestMajorRoadName: 'Jl. M.H. Thamrin',
      distanceToHospitalMeters: 450,
      nearestHospitalName: 'RS Medika',
      distanceToTransitMeters: 200,
      nearestTransitName: 'Halte Busway Dukuh Atas',
      distanceToAssemblyPointMeters: 300,
      nearestAssemblyPointName: 'Taman Dukuh Atas',
      causeId: 'Penyebab akses',
      causeEn: 'Transport cause',
      impactId: 'Dampak akses',
      impactEn: 'Transport impact',
      recomId: 'Rekomendasi akses',
      recomEn: 'Transport recommendation'
    },
    airQuality: {
      pm2_5Ugm3: 24.5,
      airQualityLevel: 'Sedang',
      maxPm25_24h: 38.0,
      measuredAt: new Date().toISOString()
    },
    ...overrides
  });

  describe('1. Primary Card Limits & Categories', () => {
    it('returns exactly 5 primary cards for flood', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('flood', assessment, false);
      expect(cards.length).toBe(5);
    });

    it('returns exactly 5 primary cards for earthquake', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('earthquake', assessment, false);
      expect(cards.length).toBe(5);
    });

    it('returns exactly 5 primary cards for heat', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('heat', assessment, false);
      expect(cards.length).toBe(5);
    });

    it('returns exactly 5 primary cards for transport', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('transport', assessment, false);
      expect(cards.length).toBe(5);
    });
  });

  describe('2. Flood Primary Cards Semantics', () => {
    it('uses "Bahaya Banjir Wilayah" when official classification is present', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('flood', assessment, false);
      const summaryCard = cards.find(c => c.id === 'flood_assessment_summary');
      expect(summaryCard).toBeDefined();
      expect(summaryCard?.labelId).toBe('Bahaya Banjir Wilayah');
      expect(summaryCard?.value).toBe('Sedang');
      expect(summaryCard?.source).toBe('BNPB inaRISK');
    });

    it('uses "Penilaian Banjir" when only internal score is available', () => {
      const assessment = createMockAssessment({
        flood: {
          ...createMockAssessment().flood,
          floodClass: null as any,
          floodClassSource: null as any,
          score: 62
        }
      });
      const cards = ReportMetricRegistry.getPrimaryMetrics('flood', assessment, false);
      const summaryCard = cards.find(c => c.id === 'flood_assessment_summary');
      expect(summaryCard?.labelId).toBe('Penilaian Banjir');
      expect(summaryCard?.value).toBe('62/100');
    });

    it('identifies local depression as "Cekungan Lokal" instead of raw flow accumulation', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('flood', assessment, false);
      const terrainCard = cards.find(c => c.id === 'flood_terrain_condition');
      expect(terrainCard).toBeDefined();
      expect(terrainCard?.labelId).toBe('Bentuk Lahan');
      expect(terrainCard?.value).toBe('Cekungan Lokal');
    });
  });

  describe('3. Earthquake Primary Cards & Ground Motion', () => {
    it('displays numerical PGA in g without hardcoded MMI scale strings', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('earthquake', assessment, false);
      const pgaCard = cards.find(c => c.id === 'seismic_pga');
      expect(pgaCard).toBeDefined();
      expect(['Perkiraan Kekuatan Guncangan', 'Perkiraan Guncangan']).toContain(pgaCard?.labelId);
      expect(pgaCard?.value).toBe('0.28 g');
      // Must not contain hardcoded fixed MMI
      expect(pgaCard?.value).not.toContain('MMI');
      expect(pgaCard?.value).not.toContain('Kuat');
    });

    it('falls back to "Perlu pemeriksaan" or null when liquefaction risk is unverified', () => {
      const assessment = createMockAssessment({
        quake: {
          ...createMockAssessment().quake,
          liquefactionRisk: null
        }
      });
      const cards = ReportMetricRegistry.getPrimaryMetrics('earthquake', assessment, false);
      const liqCard = cards.find(c => c.id === 'seismic_liquefaction_status');
      expect(liqCard).toBeDefined();
      expect(liqCard?.value === null || liqCard?.value === 'Perlu pemeriksaan').toBe(true);
    });
  });

  describe('4. Heat Primary Cards & Air Quality Null Handling Bug', () => {
    it('uses "Kondisi Panas" or "Paparan Panas Lokasi" and NEVER "Beban Panas Bangunan"', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('heat', assessment, false);
      const heatCard = cards.find(c => c.id === 'heat_location_exposure');
      expect(heatCard).toBeDefined();
      expect(['Kondisi Panas', 'Paparan Panas Lokasi']).toContain(heatCard?.labelId);
      expect(cards.some(c => c.labelId === 'Beban Panas Bangunan')).toBe(false);
    });

    it('CRITICAL: Strictly sets air quality to null when PM2.5 is null (never falling back to "Sedang")', () => {
      const assessment = createMockAssessment({
        airQuality: {
          pm2_5Ugm3: null as any,
          airQualityLevel: null as any,
          maxPm25_24h: null as any,
          measuredAt: null as any
        }
      });
      const cards = ReportMetricRegistry.getPrimaryMetrics('heat', assessment, false);
      const aqiCard = cards.find(c => c.id === 'heat_air_quality');
      expect(aqiCard).toBeDefined();
      expect(aqiCard?.value).toBeNull();
    });
  });

  describe('5. Transport Primary Cards & Healthcare Semantics', () => {
    it('labels facility as "Rumah Sakit Terdekat" when facility is hospital', () => {
      const assessment = createMockAssessment({
        transport: {
          ...createMockAssessment().transport,
          nearestHospitalName: 'RS Siloam Kebon Jeruk'
        }
      });
      const cards = ReportMetricRegistry.getPrimaryMetrics('transport', assessment, false);
      const healthCard = cards.find(c => c.id === 'transport_hospital_distance');
      expect(healthCard?.labelId).toBe('Rumah Sakit Terdekat');
    });

    it('labels facility as "Fasilitas Kesehatan Terdekat" or "Fasilitas Kesehatan" when facility is clinic or puskesmas', () => {
      const assessment = createMockAssessment({
        transport: {
          ...createMockAssessment().transport,
          nearestHospitalName: 'Klinik Pratama Sehat'
        }
      });
      const cards = ReportMetricRegistry.getPrimaryMetrics('transport', assessment, false);
      const healthCard = cards.find(c => c.id === 'transport_hospital_distance');
      expect(['Fasilitas Kesehatan Terdekat', 'Fasilitas Kesehatan']).toContain(healthCard?.labelId);
    });

    it('identifies assembly point from OpenStreetMap', () => {
      const assessment = createMockAssessment();
      const cards = ReportMetricRegistry.getPrimaryMetrics('transport', assessment, false);
      const assemblyCard = cards.find(c => c.id === 'transport_assembly_point_distance');
      expect(assemblyCard).toBeDefined();
      expect(['Titik Kumpul', 'Titik Kumpul Terdekat', 'Titik Kumpul Terdekat (OSM)']).toContain(assemblyCard?.labelId);
      expect(assemblyCard?.source).toContain('OpenStreetMap');
    });
  });
});

