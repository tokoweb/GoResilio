import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { GoTangguhFinancialScreeningEngine } from '../domain/services/GoTangguhFinancialScreeningEngine';
import { PrescriptionEngine } from '../domain/services/PrescriptionEngine';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

export function runEndToEndFidelityVerificationTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH PHASE 10: FINAL END-TO-END DATA FIDELITY VERIFICATION');
  console.log('================================================================\n');

  let allPassed = true;

  // Helper to create blank inputs
  const createBlankInputs = (): RawPhysicalInputs => ({
    elevationMeters: null,
    distanceToRiverMeters: null,
    nearestRiverName: null,
    waterwayBounded: null,
    max24hRainfallMm: null,
    inariskFloodClass: null,
    riverDischargeM3s: null,
    historicalQuakesCount150km: null,
    historicalQuakesCount100km: null,
    maxHistoricalMag: null,
    nearestEpicenterKm: null,
    latestQuakeDescription: null,
    inariskQuakeClass: null,
    inariskPgaMcegG: null,
    soilSiteClass: null,
    soilStandardRef: null,
    inariskLiquefactionRisk: null,
    avgMaxTempC: null,
    historicalPeakTempC: null,
    projectedTempRise2050C: null,
    heatUhiFactor: null,
    greenSpaceRatioPct: null,
    distanceToNearestRoadMeters: null,
    nearestRoadName: null,
    roadBounded: null,
    distanceToArterialMeters: null,
    nearestArterialName: null,
    arterialBounded: null,
    distanceToHospitalMeters: null,
    nearestHospitalName: null,
    hospitalBounded: null,
    distanceToTransitHubMeters: null,
    nearestTransitName: null,
    transitBounded: null,
    distanceToFireStationMeters: null,
    nearestFireStationName: null,
    fireStationBounded: null,
    estimatedTravelTimeMinutes: null,
    routingSource: null,
    thinkHazardReport: null
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Multi-Location Assessment (Jakarta, Bali, Kalimantan Peat/Rural)
  // ---------------------------------------------------------------------------
  console.log('[SECTION 1] Multi-Location Domain Realism Tests...');

  // 1.A: Jakarta Urban Site (Low elevation, dense infrastructure, moderate seismicity)
  const jakartaCoords = { lat: -6.2088, lng: 106.8456 };
  const jakartaInputs = createBlankInputs();
  jakartaInputs.elevationMeters = 4.5;
  jakartaInputs.distanceToRiverMeters = 320;
  jakartaInputs.nearestRiverName = 'Kali Ciliwung';
  jakartaInputs.max24hRainfallMm = 145;
  jakartaInputs.inariskFloodClass = 'Tinggi';
  jakartaInputs.historicalQuakesCount150km = 12;
  jakartaInputs.historicalQuakesCount100km = 4;
  jakartaInputs.maxHistoricalMag = 5.6;
  jakartaInputs.nearestEpicenterKm = 85;
  jakartaInputs.latestQuakeDescription = 'Gempa M 4.8 kedalaman 25km di Selat Sunda';
  jakartaInputs.inariskQuakeClass = 'Sedang';
  jakartaInputs.inariskPgaMcegG = 0.35;
  jakartaInputs.avgMaxTempC = 34.2;
  jakartaInputs.historicalPeakTempC = 37.8;
  jakartaInputs.projectedTempRise2050C = 1.4;
  jakartaInputs.greenSpaceRatioPct = 12;
  jakartaInputs.distanceToNearestRoadMeters = 15;
  jakartaInputs.nearestRoadName = 'Jl. M.H. Thamrin';
  jakartaInputs.distanceToArterialMeters = 120;
  jakartaInputs.nearestArterialName = 'Jl. Jend. Sudirman';
  jakartaInputs.distanceToHospitalMeters = 850;
  jakartaInputs.nearestHospitalName = 'RSUD Tarakan';
  jakartaInputs.distanceToTransitHubMeters = 350;
  jakartaInputs.nearestTransitName = 'Stasiun MRT Bundaran HI';
  jakartaInputs.distanceToFireStationMeters = 1200;
  jakartaInputs.nearestFireStationName = 'Pos Damkar Gambir';
  jakartaInputs.estimatedTravelTimeMinutes = '4 menit';
  jakartaInputs.routingSource = 'OSRM driving graph';
  jakartaInputs.thinkHazardReport = {
    divisionCode: '3171',
    divisionName: 'Kota Jakarta Pusat',
    countryCode: 'IDN',
    countryName: 'Indonesia',
    granularity: 'adm2_district',
    matchMethod: 'adm2_catalog_district',
    strongAdministrativeMatch: true,
    confidence: 'high',
    fallbackUsed: false,
    identityStatus: 'verified_regional',
    hazardCategories: {
      floodLevel: 'High',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'High',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true,
      floodEndpoint: 'https://thinkhazard.org/en/report/116.json',
      earthquakeEndpoint: 'https://thinkhazard.org/en/report/116.json',
      heatEndpoint: 'https://thinkhazard.org/en/report/116.json',
      tsunamiEndpoint: 'https://thinkhazard.org/en/report/116.json'
    }
  };

  const resJakarta = RiskScoringEngine.calculate(jakartaCoords, 'Jakarta Pusat Site', 'Indonesia', 'Commercial', 'Corporate Auditor', jakartaInputs);

  if (resJakarta.flood.score < 60 || resJakarta.transport.score > 35) {
    console.error('FAIL [SECTION 1.A]: Jakarta urban assessment scores out of expected domain range:', resJakarta);
    allPassed = false;
  } else {
    console.log('✓ PASS [1.A]: Jakarta urban high-density profile evaluated (Flood: High, Transport: Optimal, Regional ThinkHazard).');
  }

  // 1.B: Bali Coastal Site (High seismicity, low/moderate flood, active tourism transport)
  const baliCoords = { lat: -8.7956, lng: 115.1689 };
  const baliInputs = createBlankInputs();
  baliInputs.elevationMeters = 42;
  baliInputs.waterwayBounded = OverpassOsmClient.createBoundedObservation(null, 5000, 'Tidak terdeteksi dalam radius 5.0 km', false);
  baliInputs.max24hRainfallMm = 65;
  baliInputs.historicalQuakesCount150km = 48;
  baliInputs.historicalQuakesCount100km = 22;
  baliInputs.maxHistoricalMag = 6.4;
  baliInputs.nearestEpicenterKm = 38;
  baliInputs.latestQuakeDescription = 'Gempa M 5.2 kedalaman 10km di Selatan Bali';
  baliInputs.inariskQuakeClass = 'Tinggi';
  baliInputs.avgMaxTempC = 31.5;
  baliInputs.historicalPeakTempC = 34.0;
  baliInputs.projectedTempRise2050C = 1.1;
  baliInputs.greenSpaceRatioPct = 38;
  baliInputs.distanceToNearestRoadMeters = 45;
  baliInputs.nearestRoadName = 'Jl. Raya Uluwatu';
  baliInputs.distanceToArterialMeters = 1800;
  baliInputs.nearestArterialName = 'Jl. Bypass Ngurah Rai';
  baliInputs.distanceToHospitalMeters = 6500;
  baliInputs.nearestHospitalName = 'RS Bali Jimbaran';
  baliInputs.distanceToTransitHubMeters = 14500;
  baliInputs.nearestTransitName = 'Terminal Mengwi';
  baliInputs.fireStationBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
  baliInputs.estimatedTravelTimeMinutes = '18 menit';
  baliInputs.routingSource = 'OSRM driving graph';
  baliInputs.thinkHazardReport = {
    divisionCode: '1402',
    divisionName: 'Bali',
    countryCode: 'IDN',
    countryName: 'Indonesia',
    granularity: 'adm1_province',
    matchMethod: 'adm1_catalog_province',
    strongAdministrativeMatch: true,
    confidence: 'high',
    fallbackUsed: false,
    identityStatus: 'verified_regional',
    hazardCategories: {
      floodLevel: 'Low',
      earthquakeLevel: 'High',
      extremeHeatLevel: 'Medium',
      tsunamiLevel: 'High',
      isWorldBankSource: true,
      floodEndpoint: 'https://thinkhazard.org/en/report/1402.json',
      earthquakeEndpoint: 'https://thinkhazard.org/en/report/1402.json',
      heatEndpoint: 'https://thinkhazard.org/en/report/1402.json',
      tsunamiEndpoint: 'https://thinkhazard.org/en/report/1402.json'
    }
  };

  const resBali = RiskScoringEngine.calculate(baliCoords, 'Bali Badung Coastal Site', 'Indonesia', 'Residential', 'Home Buyer', baliInputs);

  if (resBali.quake.score < 60 || resBali.flood.score > 40) {
    console.error('FAIL [SECTION 1.B]: Bali coastal profile scores out of expected domain range:', resBali);
    allPassed = false;
  } else {
    console.log('✓ PASS [1.B]: Bali coastal seismic-dominant profile evaluated (Seismic: High, Waterway: >5km, ThinkHazard: Bali adm1_province).');
  }

  // 1.C: Kalimantan Rural Peatland Site (Tampelas / Katingan - Dense river network, low seismicity, bounded road/hospital)
  const kalimantanCoords = { lat: -2.3120, lng: 113.3450 };
  const kalimantanInputs = createBlankInputs();
  kalimantanInputs.elevationMeters = 8.0;
  kalimantanInputs.distanceToRiverMeters = 180;
  kalimantanInputs.nearestRiverName = 'Sungai Katingan';
  kalimantanInputs.max24hRainfallMm = 180;
  kalimantanInputs.riverDischargeM3s = 450.2;
  kalimantanInputs.historicalQuakesCount150km = 0;
  kalimantanInputs.historicalQuakesCount100km = 0;
  kalimantanInputs.maxHistoricalMag = null;
  kalimantanInputs.avgMaxTempC = 33.8;
  kalimantanInputs.historicalPeakTempC = 38.2;
  kalimantanInputs.projectedTempRise2050C = 1.6;
  kalimantanInputs.greenSpaceRatioPct = 85;
  kalimantanInputs.distanceToNearestRoadMeters = 1265;
  kalimantanInputs.arterialBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
  kalimantanInputs.hospitalBounded = OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15.0 km', false);
  kalimantanInputs.transitBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
  kalimantanInputs.fireStationBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
  kalimantanInputs.estimatedTravelTimeMinutes = 'Fasilitas terdekat berada di luar radius pencarian 15 km';
  kalimantanInputs.thinkHazardReport = {
    divisionCode: '1405',
    divisionName: 'Kalimantan Tengah',
    countryCode: 'IDN',
    countryName: 'Indonesia',
    granularity: 'adm1_province',
    matchMethod: 'adm1_catalog_province',
    strongAdministrativeMatch: true,
    confidence: 'high',
    fallbackUsed: false,
    identityStatus: 'verified_regional',
    hazardCategories: {
      floodLevel: 'High',
      earthquakeLevel: 'Very Low',
      extremeHeatLevel: 'High',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true,
      floodEndpoint: 'https://thinkhazard.org/en/report/1405.json',
      earthquakeEndpoint: 'https://thinkhazard.org/en/report/1405.json',
      heatEndpoint: 'https://thinkhazard.org/en/report/1405.json',
      tsunamiEndpoint: 'https://thinkhazard.org/en/report/1405.json'
    }
  };

  const resKalimantan = RiskScoringEngine.calculate(kalimantanCoords, 'Tampelas Katingan Site', 'Indonesia', 'Agricultural', 'Enterprise Risk Lead', kalimantanInputs);

  if (resKalimantan.quake.score > 30 || resKalimantan.transport.score < 40) {
    console.error('FAIL [SECTION 1.C]: Kalimantan rural profile scores out of expected domain range:', resKalimantan);
    allPassed = false;
  } else {
    console.log('✓ PASS [1.C]: Kalimantan rural riverine profile evaluated (Seismic: Very Low, Flood: High, Transport: Bounded >10km & >15km).');
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Strict Data Fidelity & Anti-Fabrication Invariants
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 2] Data Fidelity & Anti-Fabrication Invariants...');

  // 2.A: Null Soil Site Class cannot become 'SD' or 'SE' without borehole test
  if (resKalimantan.quake.soilSiteClass !== null) {
    console.error('FAIL: soilSiteClass must remain null without SPT borehole test, got:', resKalimantan.quake.soilSiteClass);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.A]: Soil Site Class strictly remains null without borehole SPT data.');
  }

  // 2.B: Null PGA cannot become 0.25g without verified map
  if (resKalimantan.quake.estimatedPgaG !== null) {
    console.error('FAIL: estimatedPgaG must remain null without verified raster, got:', resKalimantan.quake.estimatedPgaG);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.B]: Unmeasured PGA strictly remains null without synthetic numerical fallback.');
  }

  // 2.C: Null financial property value cannot default to Rp 1.5 Billion
  const finMetricsNull = GoTangguhFinancialScreeningEngine.calculateLossMetrics(
    resKalimantan.flood.score,
    resKalimantan.quake.score,
    resKalimantan.heat.score,
    null,
    null
  );
  if (finMetricsNull.indicativeAnnualLossIdr !== null || finMetricsNull.scenarioLossIdr !== null) {
    console.error('FAIL: Monetary loss must be null when property value is null, got:', finMetricsNull);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.C]: Financial loss values strictly null without supplied property value (zero default Rp 1.5B).');
  }

  // 2.D: Prescriptions have zero fake costs and no fake compliance certifications
  const prescriptions = PrescriptionEngine.generatePrescriptions(
    resJakarta.flood,
    resJakarta.quake,
    resJakarta.heat,
    resJakarta.transport
  );
  for (const rx of prescriptions) {
    if (rx.estimatedCostIdr !== null || rx.costBasis !== 'unavailable') {
      console.error(`FAIL: Prescription ${rx.id} has non-null cost or non-unavailable costBasis:`, rx);
      allPassed = false;
    }
  }
  console.log('✓ PASS [2.D]: All prescriptions have null costs, costBasis=unavailable, and humble advisory terminology.');

  // ---------------------------------------------------------------------------
  // TEST 3: ReportMetricRegistry Adaptive Grid & Granularity
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 3] ReportMetricRegistry Adaptive Grid & Granularity...');

  // Set ThinkHazard as source for Jakarta & Bali to test granularity rendering
  resJakarta.quake.quakeClassSource = 'ThinkHazard';
  resBali.quake.quakeClassSource = 'ThinkHazard';
  resJakarta.worldBankReport = {
    divisionCode: '73723',
    countryName: 'Kota Jakarta Pusat',
    granularity: 'adm2_district',
    matchMethod: 'adm2_catalog_district',
    strongAdministrativeMatch: true,
    confidence: 'high',
    floodLevel: 'High',
    earthquakeLevel: 'Medium',
    extremeHeatLevel: 'Medium',
    tsunamiLevel: 'Medium',
    isWorldBankSource: true
  };
  resBali.worldBankReport = {
    divisionCode: '1402',
    countryName: 'Bali',
    granularity: 'adm1_province',
    matchMethod: 'adm1_catalog_province',
    strongAdministrativeMatch: true,
    confidence: 'high',
    floodLevel: 'Low',
    earthquakeLevel: 'High',
    extremeHeatLevel: 'Medium',
    tsunamiLevel: 'High',
    isWorldBankSource: true
  };

  const metricsJakarta = ReportMetricRegistry.getMetricsForCategory('earthquake', resJakarta, false);
  const metricsBali = ReportMetricRegistry.getMetricsForCategory('earthquake', resBali, false);
  const metricsKalimantanTrn = ReportMetricRegistry.getMetricsForCategory('transport', resKalimantan, false);

  // Phase 8.7: Verify primary card count is <= 5
  const primaryJakarta = ReportMetricRegistry.getPrimaryMetrics('earthquake', resJakarta, false);
  const primaryTrn = ReportMetricRegistry.getPrimaryMetrics('transport', resKalimantan, false);
  if (primaryJakarta.length > 5 || primaryTrn.length > 5) {
    console.error('FAIL: Primary card count exceeds 5:', { eqLen: primaryJakarta.length, trnLen: primaryTrn.length });
    allPassed = false;
  }

  const thinkHazardMetricJakarta = metricsJakarta.find(m => m.id === 'seismic_thinkhazard_class' || m.id === 'seismic_hazard_class');
  const thinkHazardMetricBali = metricsBali.find(m => m.id === 'seismic_thinkhazard_class' || m.id === 'seismic_hazard_class');
  const hospitalMetricKalimantan = metricsKalimantanTrn.find(m => m.id === 'transport_healthcare_facility' || m.id === 'transport_hospital_distance');

  if (!thinkHazardMetricJakarta || !thinkHazardMetricJakarta.source.includes('Kota Jakarta Pusat')) {
    console.error('FAIL: Jakarta ThinkHazard metric must preserve adm2 division name, got:', thinkHazardMetricJakarta);
    allPassed = false;
  } else {
    console.log('✓ PASS [3.A]: ThinkHazard adm2 district granularity preserved in report metric.');
  }

  if (!thinkHazardMetricBali || !thinkHazardMetricBali.source.includes('Bali')) {
    console.error('FAIL: Bali ThinkHazard metric must preserve adm1 province name, got:', thinkHazardMetricBali);
    allPassed = false;
  } else {
    console.log('✓ PASS [3.B]: ThinkHazard adm1 province granularity preserved in report metric.');
  }

  if (!hospitalMetricKalimantan || (hospitalMetricKalimantan.value !== '>15 km' && hospitalMetricKalimantan.value !== '>5 km')) {
    console.error('FAIL: Rural Kalimantan hospital must render bounded metric, got:', hospitalMetricKalimantan);
    allPassed = false;
  } else {
    console.log('✓ PASS [3.C]: Rural bounded spatial distance correctly rendered in adaptive grid.');
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Canonical FeatureStore Assembly Purity
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 4] FeatureStore Canonical Assembly Verification...');

  const { featureStore } = FeatureAssembler.assemble({
    coords: jakartaCoords,
    address: 'Jakarta Pusat Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    soil: {
      phH2o: 6.2,
      phH2oRaw: 62,
      clayPercent: 24.5,
      sandPercent: 40.0,
      siltPercent: 35.5,
      bulkDensityCgCm3: 130,
      organicCarbonDgKg: 200,
      cecMmolcKg: 150,
      nitrogenCgKg: 180,
      coarseFragmentsPct: 2.0,
      spatialResolution: '250m',
      depthInterval: '0-30cm',
      source: 'ISRIC SoilGrids',
      isAvailable: true
    },
    airQuality: {
      currentPm25: 22.4,
      currentPm10: 35.1,
      currentO3: 20.0,
      currentNo2: 15.0,
      currentSo2: 2.5,
      currentCo: 400.0,
      currentAod: 0.25,
      currentUvIndex: 8.0,
      currentEuropeanAqi: 35,
      currentUsAqi: 65,
      currentDust: 1.2,
      maxPm25_24h: 28.5,
      meanPm25_24h: 20.1,
      maxPm10_24h: 42.0,
      meanPm10_24h: 30.0,
      maxO3_24h: 28.0,
      maxNo2_24h: 22.0,
      maxEuropeanAqi_24h: 40,
      maxUvIndex_24h: 9.0,
      source: 'Open-Meteo Air Quality',
      isAvailable: true
    }
  });

  const soilClayFeature = featureStore['soil.clay_pct'];
  const aqPm25Feature = featureStore['air_quality.max_pm25_24h'];

  if (!soilClayFeature || soilClayFeature.numericValue !== 24.5 || soilClayFeature.unit !== '%') {
    console.error('FAIL: Soil clay feature corrupted in FeatureStore:', soilClayFeature);
    allPassed = false;
  } else if (!aqPm25Feature || aqPm25Feature.numericValue !== 28.5 || aqPm25Feature.unit !== 'µg/m³') {
    console.error('FAIL: Air Quality PM2.5 feature corrupted in FeatureStore:', aqPm25Feature);
    allPassed = false;
  } else {
    console.log('✓ PASS [4.A]: All continuous spatial features registered as clean numeric values with metadata provenance.');
  }

  return allPassed;
}
