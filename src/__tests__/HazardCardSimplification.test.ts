import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

export function runHazardCardSimplificationTests(): boolean {
  console.log('================================================================');
  console.log('PHASE 8.7: USER-FRIENDLY HAZARD CARD SIMPLIFICATION TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;

  // Mock comprehensive assessment with all 4 pillars
  const mockAssessment: MultiHazardAssessmentResult = {
    overallScore: 68,
    overallLevel: 'moderate',
    riskCategory: 'moderate',
    flood: {
      score: 55,
      level: 'moderate',
      elevationMeters: 12,
      max24hRainfallMm: 127,
      distanceToRiverMeters: 11,
      nearestRiverName: 'Sungai Ciliwung',
      slopeDegrees: 1.2,
      slopePercent: 2.1,
      slopeClassification: 'Datar',
      localReliefMeters: -0.8,
      localReliefType: 'Cekungan Lokal',
      flowAccumulationPotential: 'Tinggi (Zona Cekungan)',
      floodDepthMeters: null,
      historicalFloodEventsCount: null,
      historicalFloodPeriod: null,
      glofasDischargeModelM3s: 14.5,
      riverDischargeM3s: 14.5,
      bnpbFloodHazardIndex: 0.62,
      floodClass: 'Sedang',
      floodClassSource: 'BNPB',
      bnpbInaRiskClass: 'Sedang',
      thinkHazardFloodLevel: 'Medium',
      floodModelLevel: 'Sedang',
      scoreReliability: 'partially_observed',
      observedComponents: 4,
      expectedComponents: 5,
      coveragePct: 80,
      causeId: 'Lokasi berada pada elevasi 12 mdpl, dengan hujan harian maksimum 127 mm dan badan air terdekat sekitar 11 meter. Kondisi ini dapat meningkatkan potensi genangan saat hujan deras.',
      causeEn: 'Site elevation is 12m with max daily rainfall 127mm and nearest river 11m away.',
      impactId: 'Potensi genangan air pada lantai dasar saat curah hujan tinggi.',
      impactEn: 'Potential ground floor inundation during heavy precipitation.',
      recomId: 'Terapkan elevasi lantai bangunan di atas muka jalan dan sediakan pompa drainase.',
      recomEn: 'Elevate finished floor level above road crest and install drainage pump.'
    },
    quake: {
      score: 78,
      level: 'high',
      quakeClass: 'Tinggi',
      quakeClassSource: 'BNPB',
      bnpbInaRiskClass: 'Tinggi',
      estimatedPgaG: 0.28,
      pgaSourceLayer: 'PGA_MCEG_100',
      pgaMcerS1: 0.35,
      pgaMcerSs: 0.85,
      bnpbQuakeHazardIndex: 0.75,
      historicalQuakesCount150km: 18,
      historicalQuakesCount100km: 6,
      maxHistoricalMag: 6.2,
      recentM5PlusWithin350kmCount: 2,
      recentMaxMagnitude: 5.4,
      nearestEpicenterKm: 42,
      latestQuakeDescription: 'M5.2 - 42 km Barat Daya',
      liquefactionRisk: 'Sedang',
      liquefactionSource: 'BNPB inaRISK',
      soilSiteClass: null,
      soilSiteClassSource: null,
      distanceToFaultKm: 24.5,
      nearestFaultName: 'Sesar Baribis',
      scoreReliability: 'partially_observed',
      observedComponents: 4,
      expectedComponents: 5,
      coveragePct: 80,
      causeId: 'Lokasi berada dalam zona bahaya gempa bumi Tinggi dengan percepatan PGA model 0.28g dan riwayat 18 kejadian gempa dalam 10 tahun.',
      causeEn: 'Site is located in high seismic hazard zone with 0.28g PGA and 18 historical events.',
      impactId: 'Guncangan gempa kuat dapat merusak elemen non-struktural dan struktur fleksibel.',
      impactEn: 'Strong ground shaking can cause non-structural and structural damage.',
      recomId: 'Rancang struktur tahan gempa sesuai SNI 1726 dan lakukan evaluasi geoteknik in-situ.',
      recomEn: 'Design earthquake-resistant structure per SNI 1726 and conduct in-situ geotechnical testing.'
    },
    heat: {
      score: 42,
      level: 'moderate',
      forecastPeakTempC: 32.4,
      avgMaxTempC: 31.8,
      historicalPeakTempC: 34.3,
      historicalDataSource: 'ERA5-Seamless',
      projectedTempIncreaseC: 0.9,
      projectedTempRise2050C: 0.9,
      thinkHazardExtremeHeatLevel: 'Medium',
      coolingDegreeDays: 1420,
      coolingDegreeDaysTier: 'Sedang',
      greenSpaceRatioPct: 18.5,
      heatModelLevel: 'Sedang',
      scoreReliability: 'partially_observed',
      observedComponents: 4,
      expectedComponents: 5,
      coveragePct: 80,
      causeId: 'Suhu prakiraan maksimum mencapai 32.4°C dengan rekor historis 34.3°C dan proyeksi pemanasan +0.9°C pada 2050.',
      causeEn: 'Forecast max temp reaches 32.4°C with historical peak 34.3°C and projected +0.9°C by 2050.',
      impactId: 'Peningkatan konsumsi listrik untuk pendingin udara pada siang hari.',
      impactEn: 'Increased daytime cooling energy demand.',
      recomId: 'Gunakan isolasi termal pada atap dan optimalkan ventilasi silang.',
      recomEn: 'Apply roof thermal insulation and optimize cross ventilation.'
    },
    transport: {
      score: 75,
      level: 'low',
      distanceToRoadMeters: 55,
      nearestRoadName: 'Jl. Melati',
      distanceToMajorRoadMeters: 460,
      nearestMajorRoadName: 'Jl. Raya Utama',
      distanceToHospitalMeters: 581,
      nearestHospitalName: 'RS Medika',
      distanceToTransitMeters: 879,
      nearestTransitName: 'Halte Busway',
      distanceToAssemblyPointMeters: 1200,
      nearestAssemblyPointName: 'Lapangan Terbuka',
      estimatedTravelTimeMinutes: '5 menit berkendara',
      routingSource: 'OSRM Live Routing',
      scoreReliability: 'measured',
      observedComponents: 5,
      expectedComponents: 5,
      coveragePct: 100,
      causeId: 'Aksesibilitas tapak baik dengan jarak jalan terdekat 55m dan jalan utama 460m.',
      causeEn: 'Good site accessibility with access road at 55m and major corridor at 460m.',
      impactId: 'Akses evakuasi dan ambulans dapat menjangkau lokasi dalam waktu cepat.',
      impactEn: 'Rapid emergency response and ambulance access to site.',
      recomId: 'Pastikan jalur masuk bebas dari hambatan parkir liar untuk kelancaran armada darurat.',
      recomEn: 'Keep access clear of unauthorized parking for emergency fleet circulation.'
    },
    airQuality: {
      pm2_5Ugm3: 18.4,
      usAqi: 64,
      airQualityLevel: 'Sedang',
      source: 'Copernicus CAMS'
    },
    evaluatedAt: '2026-09-02T10:00:00Z',
    address: 'Jl. Percobaan No. 10, Jakarta Pusat',
    coordinates: new Coordinates(-6.1754, 106.8272)
  };

  // =========================================================================
  // SECTION 1: Primary Cards Count Constraint (<= 5 per hazard)
  // =========================================================================
  console.log('[SECTION 1] Validating Primary Card Count (<= 5 Cards)...');
  const floodPrimary = ReportMetricRegistry.getPrimaryMetrics('flood', mockAssessment, false);
  const quakePrimary = ReportMetricRegistry.getPrimaryMetrics('earthquake', mockAssessment, false);
  const heatPrimary = ReportMetricRegistry.getPrimaryMetrics('heat', mockAssessment, false);
  const transportPrimary = ReportMetricRegistry.getPrimaryMetrics('transport', mockAssessment, false);

  if (floodPrimary.length > 5 || quakePrimary.length > 5 || heatPrimary.length > 5 || transportPrimary.length > 5) {
    console.error('FAIL [SECTION 1]: Primary cards exceed maximum of 5 cards:', {
      flood: floodPrimary.length,
      quake: quakePrimary.length,
      heat: heatPrimary.length,
      transport: transportPrimary.length
    });
    allPassed = false;
  } else {
    console.log(`✓ PASS [SECTION 1]: All hazard primary card sets have exactly <= 5 cards (Flood: ${floodPrimary.length}, Quake: ${quakePrimary.length}, Heat: ${heatPrimary.length}, Transport: ${transportPrimary.length}).`);
  }

  // =========================================================================
  // SECTION 2: Flood Primary Cards Semantics & Labels Verification
  // =========================================================================
  console.log('\n[SECTION 2] Validating Flood Simplified Primary Cards Labels...');
  const floodLabels = floodPrimary.map(m => m.labelId);
  const expectedFloodLabels = [
    'Ketinggian Lokasi',
    'Hujan Terberat',
    'Jarak ke Sungai / Saluran',
    'Bentuk Lahan',
    'Bahaya Banjir Wilayah'
  ];

  const hasAllFloodLabels = expectedFloodLabels.every(lbl => floodLabels.includes(lbl) || (lbl === 'Bahaya Banjir Wilayah' && (floodLabels.includes('Penilaian Banjir') || floodLabels.includes('Risiko Banjir Area'))));
  if (!hasAllFloodLabels) {
    console.error('FAIL [SECTION 2]: Flood primary labels missing simplified terminology:', { floodLabels, expectedFloodLabels });
    allPassed = false;
  } else {
    console.log('✓ PASS [SECTION 2]: Flood primary cards use user-friendly Indonesian labels without technical jargon.');
  }

  // =========================================================================
  // SECTION 3: Earthquake Primary Cards Semantics & Labels Verification
  // =========================================================================
  console.log('\n[SECTION 3] Validating Earthquake Simplified Primary Cards Labels...');
  const quakeLabels = quakePrimary.map(m => m.labelId);
  const expectedQuakeLabels = [
    'Tingkat Bahaya Gempa',
    'Perkiraan Guncangan',
    'Riwayat Gempa di Sekitar',
    'Gempa Terkuat',
    'Potensi Likuefaksi'
  ];

  const hasAllQuakeLabels = expectedQuakeLabels.every(lbl => quakeLabels.includes(lbl) || (lbl === 'Perkiraan Guncangan' && quakeLabels.includes('Kekuatan Guncangan Model')) || (lbl === 'Gempa Terkuat' && quakeLabels.includes('Gempa Terkuat yang Tercatat')));
  if (!hasAllQuakeLabels) {
    console.error('FAIL [SECTION 3]: Earthquake primary labels missing simplified terminology:', { quakeLabels, expectedQuakeLabels });
    allPassed = false;
  } else {
    console.log('✓ PASS [SECTION 3]: Earthquake primary cards use user-friendly Indonesian labels without technical jargon.');
  }

  // =========================================================================
  // SECTION 4: Heat Primary Cards Semantics & Labels Verification
  // =========================================================================
  console.log('\n[SECTION 4] Validating Heat Simplified Primary Cards Labels...');
  const heatLabels = heatPrimary.map(m => m.labelId);
  const expectedHeatLabels = [
    'Suhu Prakiraan',
    'Suhu Tertinggi',
    'Perubahan Suhu ke Depan',
    'Kualitas Udara',
    'Paparan Panas Lokasi'
  ];

  const hasAllHeatLabels = expectedHeatLabels.every(lbl => heatLabels.includes(lbl) || (lbl === 'Suhu Tertinggi' && heatLabels.includes('Suhu Tertinggi Historis')) || (lbl === 'Paparan Panas Lokasi' && heatLabels.includes('Beban Panas Bangunan')));
  if (!hasAllHeatLabels) {
    console.error('FAIL [SECTION 4]: Heat primary labels missing simplified terminology:', { heatLabels, expectedHeatLabels });
    allPassed = false;
  } else {
    console.log('✓ PASS [SECTION 4]: Heat primary cards use user-friendly Indonesian labels without technical jargon.');
  }

  // =========================================================================
  // SECTION 5: Transport Primary Cards Semantics & Labels Verification
  // =========================================================================
  console.log('\n[SECTION 5] Validating Transport Simplified Primary Cards Labels...');
  const transportLabels = transportPrimary.map(m => m.labelId);
  const expectedTransportLabels = [
    'Jalan Terdekat',
    'Jalan Utama Terdekat',
    'Rumah Sakit Terdekat',
    'Transportasi Umum',
    'Titik Kumpul Terdekat (OSM)'
  ];

  const hasAllTransportLabels = expectedTransportLabels.every(lbl =>
    transportLabels.includes(lbl) ||
    (lbl === 'Rumah Sakit Terdekat' && (transportLabels.includes('Fasilitas Kesehatan') || transportLabels.includes('Fasilitas Kesehatan Terdekat'))) ||
    (lbl === 'Titik Kumpul Terdekat (OSM)' && (transportLabels.includes('Titik Kumpul Terdekat') || transportLabels.includes('Titik Evakuasi Resmi')))
  );
  if (!hasAllTransportLabels) {
    console.error('FAIL [SECTION 5]: Transport primary labels missing simplified terminology:', { transportLabels, expectedTransportLabels });
    allPassed = false;
  } else {
    console.log('✓ PASS [SECTION 5]: Transport primary cards use user-friendly Indonesian labels without technical jargon.');
  }

  // =========================================================================
  // SECTION 6: Data Completeness in Technical Modal / Category Registry
  // =========================================================================
  console.log('\n[SECTION 6] Validating Technical Detail Registry (Zero Data Loss)...');
  const floodDetailed = ReportMetricRegistry.getMetricsForCategory('flood', mockAssessment, false);
  const quakeDetailed = ReportMetricRegistry.getMetricsForCategory('earthquake', mockAssessment, false);
  const heatDetailed = ReportMetricRegistry.getMetricsForCategory('heat', mockAssessment, false);
  const transportDetailed = ReportMetricRegistry.getMetricsForCategory('transport', mockAssessment, false);

  if (floodDetailed.length < 10 || quakeDetailed.length < 8 || heatDetailed.length < 10 || transportDetailed.length < 5) {
    console.error('FAIL [SECTION 6]: Technical detail metrics were prematurely removed from backend registry:', {
      floodLen: floodDetailed.length,
      quakeLen: quakeDetailed.length,
      heatLen: heatDetailed.length,
      trnLen: transportDetailed.length
    });
    allPassed = false;
  } else {
    console.log(`✓ PASS [SECTION 6]: Full technical parameters remain 100% available for technical modal/audits (Flood: ${floodDetailed.length}, Quake: ${quakeDetailed.length}, Heat: ${heatDetailed.length}, Transport: ${transportDetailed.length}).`);
  }

  // =========================================================================
  // SECTION 7: Null Value Handling & Anti-Overclaim
  // =========================================================================
  console.log('\n[SECTION 7] Validating Null Value Handling & Anti-Overclaim...');
  const mockNullAssessment: MultiHazardAssessmentResult = {
    ...mockAssessment,
    quake: {
      ...mockAssessment.quake,
      estimatedPgaG: null,
      maxHistoricalMag: null,
      historicalQuakesCount150km: null,
      liquefactionRisk: null
    },
    flood: {
      ...mockAssessment.flood,
      elevationMeters: null,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      nearestRiverName: null
    }
  };

  const nullQuakePrimary = ReportMetricRegistry.getPrimaryMetrics('earthquake', mockNullAssessment, false);
  const pgaItem = nullQuakePrimary.find(m => m.id === 'seismic_pga');
  const maxMagItem = nullQuakePrimary.find(m => m.id === 'seismic_max_mag');

  if (!pgaItem || pgaItem.value !== 'Belum tersedia' || !maxMagItem || maxMagItem.value !== null) {
    console.error('FAIL [SECTION 7]: Null values must render proper null status or null value:', { pgaItem, maxMagItem });
    allPassed = false;
  } else {
    console.log('✓ PASS [SECTION 7]: Null values correctly handled without fabricating zero or false safety claims.');
  }

  if (allPassed) {
    console.log('\n================================================================');
    console.log('✓ ALL PHASE 8.7 HAZARD CARD SIMPLIFICATION TESTS PASSED (100%)');
    console.log('================================================================\n');
  }

  return allPassed;
}

if (typeof require !== 'undefined' && require.main === module) {
  const success = runHazardCardSimplificationTests();
  process.exit(success ? 0 : 1);
}
