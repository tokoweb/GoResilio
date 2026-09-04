import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { MultiHazardAssessmentResult, PropertyType, UserPersona } from '../domain/types/hazard.types';
import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine } from '../domain/services/RiskScoringEngine';
import { PerformSiteAssessmentUseCase } from '../application/use_cases/PerformSiteAssessment.usecase';
import fs from 'fs';
import path from 'path';

const scanCache = new Map<string, MultiHazardAssessmentResult>();

export interface TestResultSummary {
  name: string;
  passed: boolean;
  details?: string;
}

function createMockAssessment(overrides: Partial<MultiHazardAssessmentResult> = {}): MultiHazardAssessmentResult {
  return {
    referenceNumber: 'GT-0620-10684',
    evaluatedAt: '2026-09-03T12:00:00Z',
    location: {
      formattedAddress: 'Jl. Percobaan No. 12, Jakarta Pusat',
      latitude: -6.2088,
      longitude: 106.8456,
      country: 'Indonesia'
    },
    propertyType: 'Residential',
    userPersona: 'Home Buyer',
    overallScore: 68,
    overallLevel: 'medium',
    dominantHazard: 'flood',
    scoringStatus: 'complete',
    confidenceScorePct: 92,
    dataCompletenessScorePct: 92,
    modelMetadata: {
      modelName: 'GoTangguh Multi-Hazard Engine',
      modelVersion: '1.4.0',
      overallFormula: '70% Dominant + 30% Mean',
      hazardWeights: { dominantHazard: 0.7, meanHazards: 0.3 },
      missingDataPolicy: 'Dynamic Weight Renormalization',
      scoringCoverage: {
        flood: true,
        earthquake: true,
        heat: true,
        transport: true
      }
    },
    flood: {
      score: 72,
      level: 'high',
      floodClass: 'Sedang',
      floodClassSource: 'BNPB',
      elevationMeters: 8,
      max24hRainfallMm: 120,
      distanceToRiverMeters: 250,
      nearestRiverName: 'Sungai Ciliwung',
      localReliefMeters: -0.8,
      slopeDegrees: 1.2,
      scoreReliability: 'measured',
      observedComponents: 5,
      expectedComponents: 5,
      coveragePct: 100,
      causeId: 'Tapak berada pada elevasi rendah dengan curah hujan tinggi.',
      causeEn: 'Site is situated in low elevation with high precipitation.',
      impactId: 'Potensi genangan pada pekarangan saat hujan deras.',
      impactEn: 'Potential yard ponding during heavy rainstorms.',
      recomId: 'Tinggikan peil lantai bangunan.',
      recomEn: 'Elevate finished floor level.'
    },
    quake: {
      score: 55,
      level: 'medium',
      quakeClass: 'Sedang',
      quakeClassSource: 'BNPB',
      estimatedPgaG: 0.285,
      pgaBmkg: 0.285,
      pgaInaRisk: 0.285,
      pgaSourceLayer: 'BNPB InaRISK',
      historicalQuakesCount150km: 14,
      maxHistoricalMag: 6.2,
      liquefactionRisk: 'Sedang',
      distanceToFaultKm: 42,
      nearestFaultName: 'Sesar Baribis',
      scoreReliability: 'measured',
      observedComponents: 5,
      expectedComponents: 5,
      coveragePct: 100,
      causeId: 'Kedekatan dengan jalur sesar aktif regional.',
      causeEn: 'Proximity to regional active fault system.',
      impactId: 'Guncangan gempa dapat terasa cukup kuat.',
      impactEn: 'Ground shaking may be felt moderately.',
      recomId: 'Terapkan detail struktural tahan gempa.',
      recomEn: 'Apply earthquake-resistant structural detailing.'
    },
    heat: {
      score: 48,
      level: 'medium',
      heatModelLevel: 'Sedang',
      forecastPeakTempC: 33.2,
      avgMaxTempC: 32.5,
      historicalPeakTempC: 36.1,
      projectedTempRise2050C: 1.2,
      climateProjectionModel: 'MRI-AGCM3-2-S (CMIP6)',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 5,
      coveragePct: 80,
      causeId: 'Paparan panas lingkungan perkotaan.',
      causeEn: 'Urban ambient heat exposure.',
      impactId: 'Kenaikan penggunaan pendingin udara.',
      impactEn: 'Increased daytime cooling demands.',
      recomId: 'Terapkan ventilasi silang alami.',
      recomEn: 'Optimize natural cross-ventilation.'
    },
    transport: {
      score: 82,
      level: 'low',
      distanceToNearestRoadMeters: 45,
      nearestRoadName: 'Gang Melati IV',
      distanceToArterialMeters: 380,
      nearestArterialName: 'Jl. Kramat Raya',
      distanceToHospitalMeters: 620,
      nearestHospitalName: 'RS Hermina',
      distanceToTransitHubMeters: 410,
      nearestTransitName: 'Halte TransJakarta',
      distanceToAssemblyPointMeters: 850,
      nearestAssemblyPointName: 'Taman Suropati',
      scoreReliability: 'measured',
      observedComponents: 5,
      expectedComponents: 5,
      coveragePct: 100,
      causeId: 'Konektivitas tapak sangat memadai.',
      causeEn: 'Site connectivity is well-serviced.',
      impactId: 'Waktu evakuasi cepat ke fasilitas umum.',
      impactEn: 'Rapid emergency response accessibility.',
      recomId: 'Jaga akses jalur darurat.',
      recomEn: 'Keep emergency corridor unobstructed.'
    },
    airQuality: {
      currentPm25: 22.4,
      airQualityLevel: 'Sedang',
      maxPm25_24h: 31.0
    },
    prescriptions: [
      {
        id: 'rx-flood-1',
        titleId: 'Tinggikan Peil Lantai',
        titleEn: 'Elevate Floor Level',
        descriptionId: 'Tinggikan peil lantai minimal 50 cm dari muka jalan.',
        descriptionEn: 'Elevate floor by at least 50 cm above street level.',
        priority: 'high',
        hazardCategory: 'flood'
      }
    ],
    ...overrides
  };
}

export async function runPhase11_4Tests(): Promise<{ passed: boolean; results: TestResultSummary[] }> {
  const results: TestResultSummary[] = [];

  // =========================================================================
  // TEST 1: Primary Cards Count Constraint (<= 5 per hazard category)
  // =========================================================================
  try {
    const mock = createMockAssessment();
    const floodCards = ReportMetricRegistry.getPrimaryMetrics('flood', mock, false);
    const quakeCards = ReportMetricRegistry.getPrimaryMetrics('earthquake', mock, false);
    const heatCards = ReportMetricRegistry.getPrimaryMetrics('heat', mock, false);
    const transportCards = ReportMetricRegistry.getPrimaryMetrics('transport', mock, false);

    const countsOk = floodCards.length <= 5 && quakeCards.length <= 5 && heatCards.length <= 5 && transportCards.length <= 5;
    if (!countsOk) {
      throw new Error(`Exceeded max 5 cards: flood=${floodCards.length}, quake=${quakeCards.length}, heat=${heatCards.length}, transport=${transportCards.length}`);
    }
    results.push({ name: 'TEST 1: Card Content Rule (<= 5 Cards per hazard)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 1: Card Content Rule (<= 5 Cards per hazard)', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 2: Zero Technical Badges on Primary Cards
  // =========================================================================
  try {
    const hazardCardPath = path.join(process.cwd(), 'src', 'presentation', 'components', 'dashboard', 'HazardCard.tsx');
    const hazardCardContent = fs.readFileSync(hazardCardPath, 'utf8');

    // Inside renderSurveyGrid, check that badge.label is NOT rendered
    const renderGridRegex = /const renderSurveyGrid = \([\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*};/;
    const gridMatch = hazardCardContent.match(renderGridRegex);
    if (!gridMatch) {
      throw new Error('renderSurveyGrid function not found in HazardCard.tsx');
    }
    const gridBody = gridMatch[0];
    const hasRenderedBadge = gridBody.includes('{badge.label}') || gridBody.includes('resolveSourceBadge');

    if (hasRenderedBadge) {
      throw new Error('Technical badge is still rendered inside renderSurveyGrid in HazardCard.tsx');
    }
    results.push({ name: 'TEST 2: Zero Badges on Primary Cards', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 2: Zero Badges on Primary Cards', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 3: User-Friendly Titles & Diction
  // =========================================================================
  try {
    const mock = createMockAssessment();
    const floodCards = ReportMetricRegistry.getPrimaryMetrics('flood', mock, false);
    const quakeCards = ReportMetricRegistry.getPrimaryMetrics('earthquake', mock, false);
    const heatCards = ReportMetricRegistry.getPrimaryMetrics('heat', mock, false);
    const transportCards = ReportMetricRegistry.getPrimaryMetrics('transport', mock, false);

    const floodLabels = floodCards.map(c => c.labelId);
    const quakeLabels = quakeCards.map(c => c.labelId);
    const heatLabels = heatCards.map(c => c.labelId);
    const transportLabels = transportCards.map(c => c.labelId);

    // Assert required titles exist
    if (!floodLabels.includes('Ketinggian Lokasi') || !floodLabels.includes('Hujan Terberat') || !floodLabels.includes('Jarak ke Sungai / Saluran') || !floodLabels.includes('Bentuk Lahan')) {
      throw new Error(`Flood titles missing friendly labels: ${JSON.stringify(floodLabels)}`);
    }

    if (!quakeLabels.includes('Tingkat Bahaya Gempa') || !quakeLabels.includes('Perkiraan Guncangan') || !quakeLabels.includes('Riwayat Gempa di Sekitar') || !quakeLabels.includes('Gempa Terkuat') || !quakeLabels.includes('Potensi Likuefaksi')) {
      throw new Error(`Quake titles missing friendly labels: ${JSON.stringify(quakeLabels)}`);
    }

    if (!heatLabels.includes('Suhu Prakiraan') || !heatLabels.includes('Suhu Tertinggi') || !heatLabels.includes('Perubahan Suhu ke Depan') || !heatLabels.includes('Paparan Panas Lokasi') || !heatLabels.includes('Kualitas Udara')) {
      throw new Error(`Heat titles missing friendly labels: ${JSON.stringify(heatLabels)}`);
    }

    // Heat MUST NEVER be Beban Panas Bangunan
    if (heatLabels.includes('Beban Panas Bangunan')) {
      throw new Error('Heat primary label must NEVER be "Beban Panas Bangunan"');
    }

    if (!transportLabels.includes('Jalan Terdekat') || !transportLabels.includes('Jalan Utama Terdekat') || !transportLabels.includes('Rumah Sakit Terdekat') || !transportLabels.includes('Transportasi Umum') || !transportLabels.includes('Titik Kumpul Terdekat (OSM)')) {
      throw new Error(`Transport titles missing friendly labels: ${JSON.stringify(transportLabels)}`);
    }

    results.push({ name: 'TEST 3: User-Friendly Titles & Diction', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 3: User-Friendly Titles & Diction', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 4: Short Source Line Provenance
  // =========================================================================
  try {
    const mock = createMockAssessment();
    const floodCards = ReportMetricRegistry.getPrimaryMetrics('flood', mock, false);
    const heatCards = ReportMetricRegistry.getPrimaryMetrics('heat', mock, false);
    const transportCards = ReportMetricRegistry.getPrimaryMetrics('transport', mock, false);

    const elevCard = floodCards.find(c => c.id === 'flood_elevation');
    const riverCard = floodCards.find(c => c.id === 'flood_waterway_distance');
    const forecastCard = heatCards.find(c => c.id === 'heat_forecast_temp');
    const roadCard = transportCards.find(c => c.id === 'transport_road_proximity');

    if (!elevCard?.source.includes('Copernicus DEM · ~90 m')) {
      throw new Error(`Elevation source line incorrect: ${elevCard?.source}`);
    }
    if (!riverCard?.source.includes('OpenStreetMap · Sungai Ciliwung')) {
      throw new Error(`River source line missing waterway name: ${riverCard?.source}`);
    }
    if (!forecastCard?.source.includes('Open-Meteo · Prakiraan 7 hari')) {
      throw new Error(`Heat forecast source line incorrect: ${forecastCard?.source}`);
    }
    if (!roadCard?.source.includes('OpenStreetMap · Gang Melati IV')) {
      throw new Error(`Road source line missing road name: ${roadCard?.source}`);
    }

    results.push({ name: 'TEST 4: Short Source Line Provenance', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 4: Short Source Line Provenance', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 5: Null Semantics (Honest unavailable strings, never 0, Low, Safe)
  // =========================================================================
  try {
    const mockNull = createMockAssessment({
      flood: {
        ...createMockAssessment().flood,
        elevationMeters: null,
        max24hRainfallMm: null,
        distanceToRiverMeters: null,
        nearestRiverName: null,
        waterwayBounded: null
      },
      quake: {
        ...createMockAssessment().quake,
        estimatedPgaG: null,
        pgaBmkg: null,
        pgaInaRisk: null,
        historicalQuakesCount150km: null,
        maxHistoricalMag: null,
        liquefactionRisk: null
      },
      heat: {
        ...createMockAssessment().heat,
        forecastPeakTempC: null,
        avgMaxTempC: null,
        historicalPeakTempC: null,
        projectedTempRise2050C: null
      },
      airQuality: {
        currentPm25: null as any,
        airQualityLevel: null as any,
        maxPm25_24h: null as any
      }
    });

    const floodCards = ReportMetricRegistry.getPrimaryMetrics('flood', mockNull, false);
    const quakeCards = ReportMetricRegistry.getPrimaryMetrics('earthquake', mockNull, false);
    const heatCards = ReportMetricRegistry.getPrimaryMetrics('heat', mockNull, false);

    const elev = floodCards.find(c => c.id === 'flood_elevation');
    const pga = quakeCards.find(c => c.id === 'seismic_pga');
    const liq = quakeCards.find(c => c.id === 'seismic_liquefaction_status');
    const aqi = heatCards.find(c => c.id === 'heat_air_quality');

    if (elev?.value !== null) throw new Error(`Null elevation rendered as ${elev?.value}`);
    if (pga?.value !== null) throw new Error(`Null PGA rendered as ${pga?.value}`);
    if (liq?.value !== null) throw new Error(`Unverified liquefaction rendered as ${liq?.value} instead of null`);
    if (aqi?.value !== null) throw new Error(`Missing PM2.5 rendered as ${aqi?.value} instead of null`);

    results.push({ name: 'TEST 5: Null Semantics (Honest unavailable strings)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 5: Null Semantics (Honest unavailable strings)', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 6: Air Quality Null Safety (Never default to "Sedang")
  // =========================================================================
  try {
    const mockNoAq = createMockAssessment({
      airQuality: {
        currentPm25: null as any,
        airQualityLevel: null as any,
        maxPm25_24h: null as any
      }
    });
    const heatCards = ReportMetricRegistry.getPrimaryMetrics('heat', mockNoAq, false);
    const aqiCard = heatCards.find(c => c.id === 'heat_air_quality');

    if (aqiCard?.value === 'Sedang' || aqiCard?.value === 'Moderate') {
      throw new Error('Air quality defaulted to "Sedang" when PM2.5 is null!');
    }
    if (aqiCard?.value !== null) {
      throw new Error(`Air quality without data should be null, got: ${aqiCard?.value}`);
    }

    results.push({ name: 'TEST 6: Air Quality Null Safety (Never default to "Sedang")', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 6: Air Quality Null Safety (Never default to "Sedang")', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 7: Earthquake PGA & Liquefaction Semantics
  // =========================================================================
  try {
    const mock = createMockAssessment({
      quake: {
        ...createMockAssessment().quake,
        estimatedPgaG: 0.4316,
        liquefactionRisk: null
      }
    });
    const quakeCards = ReportMetricRegistry.getPrimaryMetrics('earthquake', mock, false);
    const pgaCard = quakeCards.find(c => c.id === 'seismic_pga');
    const liqCard = quakeCards.find(c => c.id === 'seismic_liquefaction_status');

    if (!pgaCard?.value?.includes('g')) {
      throw new Error(`PGA card does not include unit 'g': ${pgaCard?.value}`);
    }
    if (pgaCard?.value?.includes('MMI') || pgaCard?.value?.includes('VI') || pgaCard?.value?.includes('VII')) {
      throw new Error(`PGA card contains forbidden fixed MMI conversion: ${pgaCard?.value}`);
    }
    if (liqCard?.value !== null) {
      throw new Error(`Unverified liquefaction should be null, got: ${liqCard?.value}`);
    }

    results.push({ name: 'TEST 7: Earthquake PGA & Liquefaction Semantics', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 7: Earthquake PGA & Liquefaction Semantics', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 8: Transport & Assembly Semantics (OSM Candidate vs Official, Hospital vs Clinic)
  // =========================================================================
  try {
    // 1. Clinic check
    const mockClinic = createMockAssessment({
      transport: {
        ...createMockAssessment().transport,
        nearestHospitalName: 'Klinik Pratama Sehat'
      }
    });
    const clinicCards = ReportMetricRegistry.getPrimaryMetrics('transport', mockClinic, false);
    const clinicCard = clinicCards.find(c => c.id === 'transport_hospital_distance');
    if (clinicCard?.labelId !== 'Fasilitas Kesehatan Terdekat') {
      throw new Error(`Clinic was labeled as hospital: ${clinicCard?.labelId}`);
    }

    // 2. OSM Candidate Assembly Point
    const mockOsmAssembly = createMockAssessment();
    const osmAssemblyCards = ReportMetricRegistry.getPrimaryMetrics('transport', mockOsmAssembly, false);
    const assemblyCard = osmAssemblyCards.find(c => c.id === 'transport_assembly_point_distance');
    if (assemblyCard?.labelId !== 'Titik Kumpul Terdekat (OSM)') {
      throw new Error(`Unverified OSM assembly was not labeled with '(OSM)': ${assemblyCard?.labelId}`);
    }

    results.push({ name: 'TEST 8: Transport & Assembly Semantics (OSM candidate & clinic)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 8: Transport & Assembly Semantics (OSM candidate & clinic)', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 9: Zero Factual Defaults in RiskScoringEngine (No silent Residential / Home Buyer)
  // =========================================================================
  try {
    const assessed = RiskScoringEngine.calculate(
      new Coordinates(-6.2088, 106.8456),
      'Jl. Percobaan',
      'Indonesia',
      undefined, // Missing propertyType
      undefined, // Missing persona
      {
        elevationMeters: 10,
        max24hRainfallMm: 50,
        distanceToRiverMeters: 500,
        nearestRiverName: 'Sungai Ciliwung'
      }
    );

    if (assessed.propertyType === 'Residential') {
      throw new Error('RiskScoringEngine silently defaulted undefined propertyType to "Residential"!');
    }
    if (assessed.userPersona === 'Home Buyer') {
      throw new Error('RiskScoringEngine silently defaulted undefined userPersona to "Home Buyer"!');
    }

    results.push({ name: 'TEST 9: Zero Factual Defaults in RiskScoringEngine', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 9: Zero Factual Defaults in RiskScoringEngine', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 10: Technical Details Modal Completeness (Full parameters preserved)
  // =========================================================================
  try {
    const mock = createMockAssessment();
    const floodTech = ReportMetricRegistry.getMetricsForCategory('flood', mock, false);
    const quakeTech = ReportMetricRegistry.getMetricsForCategory('earthquake', mock, false);
    const heatTech = ReportMetricRegistry.getMetricsForCategory('heat', mock, false);
    const transportTech = ReportMetricRegistry.getMetricsForCategory('transport', mock, false);

    if (floodTech.length < 5 || quakeTech.length < 5 || heatTech.length < 5 || transportTech.length < 5) {
      throw new Error(`Technical modal parameters missing: flood=${floodTech.length}, quake=${quakeTech.length}, heat=${heatTech.length}, transport=${transportTech.length}`);
    }

    // Assert each parameter contains provenance metadata
    for (const p of [...floodTech, ...quakeTech, ...heatTech, ...transportTech]) {
      if (!p.id || !p.labelId || !p.source) {
        throw new Error(`Technical parameter missing required metadata: ${p.id}`);
      }
    }

    results.push({ name: 'TEST 10: Technical Details Modal Completeness', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 10: Technical Details Modal Completeness', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 11: Live Scan Parity (Bali, Jakarta, Manila)
  // =========================================================================
  try {
    const testSites = [
      { name: 'Bali', lat: -8.6705, lng: 115.2126 },
      { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
      { name: 'Manila', lat: 14.5995, lng: 120.9842 }
    ];

    const scans = await Promise.all(testSites.map(async (site) => {
      const cacheKey = `${site.lat},${site.lng}`;
      if (scanCache.has(cacheKey)) {
        return { site, scan: scanCache.get(cacheKey)! };
      }
      const scan = await PerformSiteAssessmentUseCase.execute({
        latitude: site.lat,
        longitude: site.lng,
        formattedAddress: `${site.name} Site`
      });
      scanCache.set(cacheKey, scan);
      return { site, scan };
    }));

    for (const { site, scan } of scans) {
      if (!scan || typeof scan.overallScore !== 'number') {
        throw new Error(`Scan failed for ${site.name}`);
      }

      // Assert parity: Primary cards must strictly match the scan object
      const floodCards = ReportMetricRegistry.getPrimaryMetrics('flood', scan, false);
      const elevCard = floodCards.find(c => c.id === 'flood_elevation');
      if (scan.flood.elevationMeters !== null) {
        if (!elevCard?.value?.includes(String(scan.flood.elevationMeters))) {
          throw new Error(`Elevation card value mismatch for ${site.name}: card=${elevCard?.value}, scan=${scan.flood.elevationMeters}`);
        }
      }

      const quakeCards = ReportMetricRegistry.getPrimaryMetrics('earthquake', scan, false);
      const pgaCard = quakeCards.find(c => c.id === 'seismic_pga');
      const rawPga = scan.quake.estimatedPgaG ?? scan.quake.pgaBmkg ?? scan.quake.pgaInaRisk;
      if (rawPga !== null && rawPga !== undefined) {
        if (!pgaCard?.value?.includes(rawPga.toFixed(3))) {
          throw new Error(`PGA card value mismatch for ${site.name}: card=${pgaCard?.value}, scan=${rawPga}`);
        }
      }
    }

    results.push({ name: 'TEST 11: Live Scan Parity (Bali, Jakarta, Manila)', passed: true });
  } catch (err: any) {
    results.push({ name: 'TEST 11: Live Scan Parity (Bali, Jakarta, Manila)', passed: false, details: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
