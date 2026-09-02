/**
 * GoTangguh Phase 4: Flood Data Coverage & Semantic Hardening Test Suite
 * 
 * Validates:
 * 1. Comprehensive Flood Source Matrix (Elevation, ERA5 Precipitation, OSM Waterway, GloFAS, BNPB Raw Index, ThinkHazard Regional)
 * 2. Exact vs Bounded vs Error Semantics (>5 km vs null on failure)
 * 3. Anti-Fabrication Invariants (zero fake river names, zero fake BNPB classes from arbitrary thresholds)
 * 4. Double-Counting Audit & Provenance Isolation
 * 5. Multi-Location Real-World Profiles (Urban, River-Adjacent, Inland, High-Elevation)
 */

import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import type { ThinkHazardReport } from '../infrastructure/external_apis/ThinkHazardClient';
import type { ClimateAndElevationData } from '../infrastructure/external_apis/OpenMeteoClient';
import type { InaRiskAssessmentData } from '../infrastructure/external_apis/InaRiskBnpbClient';

export function runFloodCoverageAndSemanticsTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH PHASE 4: FLOOD DATA COVERAGE & SEMANTIC HARDENING');
  console.log('================================================================\n');

  let allPassed = true;
  const testCoords = new Coordinates(-6.1754, 106.8272); // Jakarta Central

  // =========================================================================
  // TEST A: All Flood Inputs Available
  // =========================================================================
  console.log('[TEST A] All Flood Inputs Available...');
  const mockAllFloodInputs: RawPhysicalInputs = {
    elevationMeters: 8,
    max24hRainfallMm: 120,
    distanceToRiverMeters: 350,
    nearestRiverName: 'Sungai Ciliwung',
    riverDischargeM3s: 75.5,
    inariskFloodIndex: 0.68,
    inariskFloodClass: 'Teridentifikasi — kelas resmi tidak tersedia',
    thinkHazardReport: {
      divisionCode: '116',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High',
      earthquakeLevel: 'Low',
      extremeHeatLevel: 'Medium',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true
    } as ThinkHazardReport,
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 32,
    historicalPeakTempC: 36,
    projectedTempRise2050C: 1.5,
    greenSpaceRatioPct: 20,
    distanceToNearestRoadMeters: 25,
    distanceToArterialMeters: 450,
    distanceToTransitHubMeters: 500,
    distanceToHospitalMeters: 1200,
    distanceToFireStationMeters: 1800
  };

  const resA = RiskScoringEngine.calculate(testCoords, 'Jakarta Pusat Site', 'Indonesia', 'Residential', 'Home Buyer', mockAllFloodInputs);

  if (
    resA.flood.score === null ||
    resA.flood.scoreReliability !== 'partially_observed' ||
    resA.flood.observedComponents < 4 ||
    resA.flood.elevationMeters !== 8 ||
    resA.flood.distanceToRiverMeters !== 350 ||
    resA.flood.nearestRiverName !== 'Sungai Ciliwung' ||
    resA.flood.max24hRainfallMm !== 120 ||
    resA.flood.riverDischargeM3s !== 75.5 ||
    resA.flood.bnpbFloodHazardIndex !== 0.68
  ) {
    console.error('FAIL [TEST A]: Complete flood inputs failed verification:', resA.flood);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST A]: Complete flood evidence evaluated with partially_observed reliability (Score: ${resA.flood.score}/100, Observed: ${resA.flood.observedComponents}/${resA.flood.expectedComponents}).`);
  }

  // =========================================================================
  // TEST B: Only Elevation + Rainfall Available (Physical-Only Baseline)
  // =========================================================================
  console.log('\n[TEST B] Only Elevation + Rainfall Available...');
  const mockPhysicalOnly: RawPhysicalInputs = {
    elevationMeters: 25,
    max24hRainfallMm: 65,
    distanceToRiverMeters: null,
    nearestRiverName: null,
    riverDischargeM3s: null,
    inariskFloodIndex: null,
    inariskFloodClass: null,
    thinkHazardReport: null,
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 30,
    historicalPeakTempC: 34,
    projectedTempRise2050C: 1.2,
    greenSpaceRatioPct: 30,
    distanceToNearestRoadMeters: 50,
    distanceToArterialMeters: 800,
    distanceToTransitHubMeters: 1000,
    distanceToHospitalMeters: 2000,
    distanceToFireStationMeters: 2500
  };

  const resB = RiskScoringEngine.calculate(testCoords, 'Inland Site', 'Indonesia', 'Residential', 'Home Buyer', mockPhysicalOnly);

  if (
    resB.flood.score === null ||
    resB.flood.scoreReliability !== 'partially_observed' ||
    resB.flood.distanceToRiverMeters !== null ||
    resB.flood.floodClass !== null
  ) {
    console.error('FAIL [TEST B]: Physical-only flood inputs failed verification:', resB.flood);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST B]: Physical-only inputs correctly produce partially_observed score (${resB.flood.score}/100) without synthetic river or class fabrication.`);
  }

  // =========================================================================
  // TEST C: River Exact Result & Tag Semantic Naming
  // =========================================================================
  console.log('\n[TEST C] River Exact Result & Semantic Naming...');
  const parsedExactRiver = OverpassOsmClient.parseElements(testCoords, [
    {
      type: 'way',
      id: 101,
      tags: { waterway: 'river', name: 'Sungai Ciliwung' },
      geometry: [
        { lat: -6.1760, lon: 106.8270 },
        { lat: -6.1750, lon: 106.8275 }
      ]
    }
  ]);

  if (
    parsedExactRiver.data.distanceToNearestWaterwayMeters === null ||
    parsedExactRiver.data.distanceToNearestWaterwayMeters > 500 ||
    parsedExactRiver.data.nearestWaterwayName !== 'Sungai Ciliwung' ||
    parsedExactRiver.data.waterwayObservation?.state !== 'AVAILABLE_EXACT'
  ) {
    console.error('FAIL [TEST C]: Exact named river parsing failed:', parsedExactRiver.data);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST C]: Exact river accurately parsed: ${parsedExactRiver.data.nearestWaterwayName} at ${parsedExactRiver.data.distanceToNearestWaterwayMeters}m (State: ${parsedExactRiver.data.waterwayObservation?.state}).`);
  }

  // =========================================================================
  // TEST D: River No Result After Successful Search (>5 km Bounded)
  // =========================================================================
  console.log('\n[TEST D] River No Result After Successful Search (>5 km Bounded)...');
  const parsedNoWaterway = OverpassOsmClient.parseElements(testCoords, []);

  if (
    parsedNoWaterway.data.distanceToNearestWaterwayMeters !== null ||
    parsedNoWaterway.data.waterwayObservation?.state !== 'AVAILABLE_BOUNDED' ||
    parsedNoWaterway.data.waterwayObservation?.relation !== 'greater_than' ||
    parsedNoWaterway.data.waterwayObservation?.lowerBoundMeters !== 5000 ||
    parsedNoWaterway.data.waterwayObservation?.displayValue !== '>5 km'
  ) {
    console.error('FAIL [TEST D]: Bounded waterway parsing failed:', parsedNoWaterway.data);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST D]: Successful search with 0 waterways cleanly creates state=AVAILABLE_BOUNDED with displayValue=>5 km and distanceMeters=null.');
  }

  // =========================================================================
  // TEST E: River Timeout / Error Anti-Fabrication Guarantee
  // =========================================================================
  console.log('\n[TEST E] River Timeout / Error Anti-Fabrication Guarantee...');
  const boundedFailed = OverpassOsmClient.createBoundedObservation(
    null,
    5000,
    'Data sempadan air tidak dapat dimuat (Sumber OSM tidak merespon)',
    true // Provider failed
  );

  if (
    boundedFailed.state !== 'ERROR_OR_TIMEOUT' ||
    boundedFailed.displayValue !== null ||
    boundedFailed.relation !== null
  ) {
    console.error('FAIL [TEST E]: Provider failure did not produce clean ERROR_OR_TIMEOUT state:', boundedFailed);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST E]: Provider timeout/error strictly produces state=ERROR_OR_TIMEOUT and displayValue=null (Never fake ">5 km").');
  }

  // =========================================================================
  // TEST F: GloFAS Model Discharge Representation
  // =========================================================================
  console.log('\n[TEST F] GloFAS Model Discharge Representation...');
  const mockMeteoGlofas: Partial<ClimateAndElevationData> = {
    elevationMeters: 12,
    meanRiverDischargeM3s: 84.2,
    glofasDischargeMaxM3s: 110.5,
    maxDailyPrecipitationMm: 95
  };

  const { featureStore: storeGlofas } = FeatureAssembler.assemble({
    coords: testCoords,
    address: 'Jakarta Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    meteo: mockMeteoGlofas as ClimateAndElevationData
  });

  const featMeanDischarge = storeGlofas['hydrology_glofas_mean_discharge_m3s'];
  if (
    !featMeanDischarge ||
    featMeanDischarge.numericValue !== 84.2 ||
    featMeanDischarge.unit !== 'm³/s' ||
    featMeanDischarge.spatialResolution !== '~5km grid cell' ||
    !featMeanDischarge.sourceDataset?.includes('GloFAS')
  ) {
    console.error('FAIL [TEST F]: GloFAS feature store registration failed:', featMeanDischarge);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST F]: GloFAS model discharge correctly registered: ${featMeanDischarge.numericValue} ${featMeanDischarge.unit} (~5km grid cell resolution).`);
  }

  // =========================================================================
  // TEST G: GloFAS Timeout / NoData Handling
  // =========================================================================
  console.log('\n[TEST G] GloFAS Timeout / NoData Handling...');
  const mockMeteoGlofasNull: Partial<ClimateAndElevationData> = {
    elevationMeters: 12,
    meanRiverDischargeM3s: null,
    glofasDischargeMaxM3s: null
  };

  const { featureStore: storeGlofasNull } = FeatureAssembler.assemble({
    coords: testCoords,
    address: 'Jakarta Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    meteo: mockMeteoGlofasNull as ClimateAndElevationData
  });

  const featNullDischarge = storeGlofasNull['hydrology_glofas_mean_discharge_m3s'];
  if (!featNullDischarge || featNullDischarge.numericValue !== null || !featNullDischarge.missing) {
    console.error('FAIL [TEST G]: GloFAS null discharge handling failed:', featNullDischarge);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST G]: GloFAS failure/timeout strictly preserves numericValue=null and missing=true without fabricating 0 m³/s.');
  }

  // =========================================================================
  // TEST H & I: BNPB Raw Flood Index & Official Classification Invariants
  // =========================================================================
  console.log('\n[TEST H & I] BNPB Raw Flood Index & Official Classification Invariants...');
  const mockBnpbFlood: Partial<InaRiskAssessmentData> = {
    floodHazardIndex: 0.542,
    floodHazardClass: 'Teridentifikasi — kelas resmi tidak tersedia',
    isOfficialBnpbSource: true
  };

  const { featureStore: storeBnpb } = FeatureAssembler.assemble({
    coords: testCoords,
    address: 'Jakarta Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    inarisk: mockBnpbFlood as InaRiskAssessmentData
  });

  const featBnpbFlood = storeBnpb['flood_bnpb_hazard_index'];
  if (
    !featBnpbFlood ||
    featBnpbFlood.numericValue !== 0.542 ||
    featBnpbFlood.stringValue !== 'Teridentifikasi — kelas resmi tidak tersedia' ||
    featBnpbFlood.source !== 'BNPB'
  ) {
    console.error('FAIL [TEST H & I]: BNPB raw flood index registration failed:', featBnpbFlood);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST H & I]: BNPB raw raster value preserved (${featBnpbFlood.numericValue}) with unverified class string preserved without synthetic thresholding.`);
  }

  // =========================================================================
  // TEST J & K: ThinkHazard Regional vs National Fallback
  // =========================================================================
  console.log('\n[TEST J & K] ThinkHazard Regional vs National Fallback...');
  const reportRegional: ThinkHazardReport = {
    divisionCode: '116',
    countryName: 'Indonesia',
    granularity: 'adm2_district',
    matchMethod: 'adm2_catalog_district',
    strongAdministrativeMatch: true,
    floodLevel: 'High',
    earthquakeLevel: 'Low',
    extremeHeatLevel: 'Medium',
    tsunamiLevel: 'Very Low',
    isWorldBankSource: true
  };

  const reportNational: ThinkHazardReport = {
    divisionCode: 'IDN',
    countryName: 'Indonesia',
    granularity: 'adm0_national',
    matchMethod: 'adm0_national_baseline',
    strongAdministrativeMatch: false,
    floodLevel: 'Medium',
    earthquakeLevel: 'Low',
    extremeHeatLevel: 'Medium',
    tsunamiLevel: 'Low',
    isWorldBankSource: true
  };

  const mockRawRegional: RawPhysicalInputs = { ...mockPhysicalOnly, thinkHazardReport: reportRegional };
  const mockRawNational: RawPhysicalInputs = { ...mockPhysicalOnly, thinkHazardReport: reportNational };

  const resRegional = RiskScoringEngine.calculate(testCoords, 'Jakarta District', 'Indonesia', 'Residential', 'Home Buyer', mockRawRegional);
  const resNational = RiskScoringEngine.calculate(testCoords, 'Remote Site', 'Indonesia', 'Residential', 'Home Buyer', mockRawNational);

  const metricsRegional = ReportMetricRegistry.getMetricsForCategory('flood', resRegional, false);
  const metricsNational = ReportMetricRegistry.getMetricsForCategory('flood', resNational, false);

  const cardRegional = metricsRegional.find(m => m.id === 'flood_thinkhazard_class');
  const cardNational = metricsNational.find(m => m.id === 'flood_thinkhazard_class');

  if (
    !cardRegional ||
    !cardRegional.labelId.includes('Regional') ||
    cardRegional.value !== 'High' ||
    !cardNational ||
    !cardNational.labelId.includes('Nasional') ||
    cardNational.value !== 'Medium'
  ) {
    console.error('FAIL [TEST J & K]: ThinkHazard granularity labeling failed:', { cardRegional, cardNational });
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST J & K]: ThinkHazard district cleanly renders "Regional" while country baseline explicitly renders "Nasional".');
  }

  // =========================================================================
  // TEST L: Mixed Provider Success & Resilience (Partial Survival)
  // =========================================================================
  console.log('\n[TEST L] Mixed Provider Success & Resilience...');
  const mockMixed: RawPhysicalInputs = {
    elevationMeters: 14,
    max24hRainfallMm: 88,
    distanceToRiverMeters: null, // Overpass failed
    waterwayBounded: boundedFailed,
    riverDischargeM3s: null,     // GloFAS failed
    inariskFloodIndex: 0.45,     // BNPB succeeded
    inariskFloodClass: 'Teridentifikasi — kelas resmi tidak tersedia',
    thinkHazardReport: reportRegional,
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 31,
    historicalPeakTempC: 35,
    projectedTempRise2050C: 1.4,
    greenSpaceRatioPct: 22,
    distanceToNearestRoadMeters: 30,
    distanceToArterialMeters: 500,
    distanceToTransitHubMeters: 600,
    distanceToHospitalMeters: 1500,
    distanceToFireStationMeters: 2000
  };

  const resMixed = RiskScoringEngine.calculate(testCoords, 'Mixed Provider Site', 'Indonesia', 'Residential', 'Home Buyer', mockMixed);

  if (
    resMixed.flood.score === null ||
    resMixed.flood.elevationMeters !== 14 ||
    resMixed.flood.max24hRainfallMm !== 88 ||
    resMixed.flood.distanceToRiverMeters !== null ||
    resMixed.flood.bnpbFloodHazardIndex !== 0.45 ||
    resMixed.flood.scoreReliability !== 'partially_observed'
  ) {
    console.error('FAIL [TEST L]: Mixed provider resilience failed:', resMixed.flood);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST L]: Pipeline gracefully survived partial provider outages (Score: ${resMixed.flood.score}/100, Reliability: ${resMixed.flood.scoreReliability}).`);
  }

  // =========================================================================
  // TEST M: Sub-Meter Coordinate Precision & Cache Isolation
  // =========================================================================
  console.log('\n[TEST M] Sub-Meter Coordinate Precision & Cache Isolation...');
  const coordA = new Coordinates(-6.17541, 106.82721);
  const coordB = new Coordinates(-6.17559, 106.82739);

  const keyA = `osm_prox_v22_${coordA.lat.toFixed(5)}_${coordA.lng.toFixed(5)}`;
  const keyB = `osm_prox_v22_${coordB.lat.toFixed(5)}_${coordB.lng.toFixed(5)}`;

  if (keyA === keyB) {
    console.error('FAIL [TEST M]: Coordinate cache keys collided:', { keyA, keyB });
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST M]: 5-decimal coordinate precision creates distinct cache keys (${keyA} vs ${keyB}).`);
  }

  // =========================================================================
  // SECTION 2: Real-World Profile Realism Tests
  // =========================================================================
  console.log('\n[SECTION 2] Real-World Multi-Location Profile Realism...');

  // 1. Dense Urban (Jakarta Pusat)
  const urbanFloodInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    elevationMeters: 4,
    max24hRainfallMm: 145,
    distanceToRiverMeters: 180,
    nearestRiverName: 'Kali Ciliwung',
    riverDischargeM3s: 92.4
  };
  const resUrban = RiskScoringEngine.calculate(new Coordinates(-6.1754, 106.8272), 'Jakarta Urban', 'Indonesia', 'Residential', 'Home Buyer', urbanFloodInputs);

  // 2. River-Adjacent (Tampelas / Mahakam River Basin)
  const riverineFloodInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    elevationMeters: 18,
    max24hRainfallMm: 160,
    distanceToRiverMeters: 45,
    nearestRiverName: 'Sungai Katingan',
    riverDischargeM3s: 140.0,
    thinkHazardReport: {
      divisionCode: '1405',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High',
      earthquakeLevel: 'Very Low',
      extremeHeatLevel: 'High',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const resRiverine = RiskScoringEngine.calculate(new Coordinates(-2.0125, 113.2450), 'Tampelas Riverine', 'Indonesia', 'Residential', 'Home Buyer', riverineFloodInputs);

  // 3. Inland Plateau (Bandung Plateau)
  const inlandFloodInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    elevationMeters: 720,
    max24hRainfallMm: 55,
    distanceToRiverMeters: 2800,
    nearestRiverName: 'Sungai Citarum',
    riverDischargeM3s: 12.0,
    inariskFloodClass: 'Rendah',
    inariskFloodIndex: 0.15,
    thinkHazardReport: {
      ...reportRegional,
      floodLevel: 'Low'
    } as ThinkHazardReport
  };
  const resInland = RiskScoringEngine.calculate(new Coordinates(-6.9175, 107.6191), 'Bandung Inland', 'Indonesia', 'Residential', 'Home Buyer', inlandFloodInputs);

  // 4. High-Elevation (Dieng / Puncak)
  const highElevFloodInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    elevationMeters: 2050,
    max24hRainfallMm: 45,
    distanceToRiverMeters: null,
    waterwayBounded: OverpassOsmClient.createBoundedObservation(null, 5000, 'Tidak terdeteksi dalam radius 5.0 km', false),
    riverDischargeM3s: 2.5,
    inariskFloodClass: 'Rendah',
    inariskFloodIndex: 0.05,
    thinkHazardReport: {
      ...reportRegional,
      floodLevel: 'Very Low'
    } as ThinkHazardReport
  };
  const resHighElev = RiskScoringEngine.calculate(new Coordinates(-7.2050, 109.9100), 'Dieng High Elevation', 'Indonesia', 'Residential', 'Home Buyer', highElevFloodInputs);

  if (
    resUrban.flood.score === null || resUrban.flood.score < 65 ||
    resRiverine.flood.score === null || resRiverine.flood.score < 70 ||
    resInland.flood.score === null || resInland.flood.score > 60 ||
    resHighElev.flood.score === null || resHighElev.flood.score > 40
  ) {
    console.error('FAIL [SECTION 2]: Real-world profile scores failed expected domain hierarchy:', {
      urbanScore: resUrban.flood.score,
      riverineScore: resRiverine.flood.score,
      inlandScore: resInland.flood.score,
      highElevScore: resHighElev.flood.score
    });
    allPassed = false;
  } else {
    console.log(`✓ PASS [SECTION 2.A]: Jakarta Urban flood score = ${resUrban.flood.score}/100 (Elevation: 4m, River: 180m, Discharge: 92.4 m³/s).`);
    console.log(`✓ PASS [SECTION 2.B]: Tampelas Riverine flood score = ${resRiverine.flood.score}/100 (River: 45m from Sungai Katingan, Discharge: 140 m³/s).`);
    console.log(`✓ PASS [SECTION 2.C]: Bandung Inland flood score = ${resInland.flood.score}/100 (Elevation: 720m, River: 2.8 km).`);
    console.log(`✓ PASS [SECTION 2.D]: Dieng High Elevation flood score = ${resHighElev.flood.score}/100 (Elevation: 2050m, Waterway: >5 km).`);
  }

  // =========================================================================
  // SECTION 3: ReportMetricRegistry Complete Canonical Flood Cards Verification
  // =========================================================================
  console.log('\n[SECTION 3] ReportMetricRegistry Complete Canonical Flood Cards Verification...');
  const urbanReportMetrics = ReportMetricRegistry.getMetricsForCategory('flood', resUrban, false);
  const displayMetrics = ReportMetricRegistry.getDisplayMetrics('flood', resUrban, false);

  const cardIds = urbanReportMetrics.map(m => m.id);
  const expectedCards = [
    'flood_elevation',
    'flood_max_rainfall',
    'flood_waterway_distance',
    'flood_glofas_discharge',
    'flood_bnpb_index',
    'flood_bnpb_tier',
    'flood_thinkhazard_class',
    'flood_model_level'
  ];

  const hasAllExpected = expectedCards.every(id => cardIds.includes(id));
  if (!hasAllExpected || displayMetrics.length < 5) {
    console.error('FAIL [SECTION 3]: ReportMetricRegistry did not provide expected flood card set:', { cardIds, displayLength: displayMetrics.length });
    allPassed = false;
  } else {
    console.log(`✓ PASS [SECTION 3]: ReportMetricRegistry provided all ${urbanReportMetrics.length} canonical flood cards (${displayMetrics.length} active display cards).`);
  }

  // =========================================================================
  // SECTION 4: PHASE 8.4.1 FLOOD EVIDENCE SEMANTIC HARDENING VERIFICATION
  // =========================================================================
  console.log('\n[SECTION 4] Phase 8.4.1 Flood Evidence Semantic Hardening Verification...');
  
  // 4.A 5-point DEM -> slope & local relief valid
  const mockPhase84Inputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    slopeDegrees: 1.4,
    slopePercent: 2.4,
    slopeClassification: 'Datar (0–2°)',
    localReliefMeters: -0.8,
    localReliefType: 'Cekungan Lokal',
    flowAccumulationPotential: 'Tinggi (Zona Cekungan / Konvergensi Aliran)',
    rainfallPeriod: '2020-01-01 to 2024-12-31 (ERA5)',
    rainfallDataSource: 'Open-Meteo ERA5-Seamless',
    floodDepthMeters: null, // Strictly null (unmeasured in-situ)
    historicalFloodEventsCount: null,
    historicalFloodPeriod: null,
    nearestDrainageChannel: null,
    distanceToDrainageMeters: null
  };

  const res84 = RiskScoringEngine.calculate(testCoords, 'Jakarta Site Phase 8.4', 'Indonesia', 'Residential', 'Home Buyer', mockPhase84Inputs);
  const metrics84 = ReportMetricRegistry.getMetricsForCategory('flood', res84, false);

  const slopeMetric = metrics84.find(m => m.id === 'flood_slope');
  const reliefMetric = metrics84.find(m => m.id === 'flood_local_relief');
  const flowMetric = metrics84.find(m => m.id === 'flood_flow_accumulation');
  const depthMetric = metrics84.find(m => m.id === 'flood_inundation_depth');
  const rainMetric = metrics84.find(m => m.id === 'flood_max_rainfall');
  const drainMetric = metrics84.find(m => m.id === 'flood_drainage_channel');
  const glofasMetric = metrics84.find(m => m.id === 'flood_glofas_discharge');

  let s4Passed = true;

  // Test A: Slope valid & derived
  if (!slopeMetric || slopeMetric.value !== '1.4° (Datar (0–2°))' || slopeMetric.dataType !== 'derived') {
    console.error('FAIL [SECTION 4.A]: Slope metric not properly formatted or derived:', slopeMetric);
    s4Passed = false;
  }

  // Test B: Local relief valid & derived
  if (!reliefMetric || reliefMetric.value !== '-0.8 m (Cekungan Lokal)' || reliefMetric.dataType !== 'derived') {
    console.error('FAIL [SECTION 4.B]: Local relief metric not properly derived:', reliefMetric);
    s4Passed = false;
  }

  // Test C: flowAccumulationPotential -> derived heuristic label
  if (
    !flowMetric ||
    flowMetric.labelId !== 'Indikasi Konvergensi Limpasan Permukaan' ||
    flowMetric.dataType !== 'derived' ||
    !flowMetric.descriptionId.includes('Indikasi topografi konvergensi limpasan berdasarkan data DEM')
  ) {
    console.error('FAIL [SECTION 4.C]: Flow convergence indicator failed heuristic semantic verification:', flowMetric);
    s4Passed = false;
  }

  // Test D: GloFAS -> context only (no macro to micro score shortcut)
  const resGlofasHigh = RiskScoringEngine.calculate(testCoords, 'Site GloFAS High', 'Indonesia', 'Residential', 'Home Buyer', {
    ...mockPhase84Inputs,
    riverDischargeM3s: 250
  });
  const resGlofasLow = RiskScoringEngine.calculate(testCoords, 'Site GloFAS Low', 'Indonesia', 'Residential', 'Home Buyer', {
    ...mockPhase84Inputs,
    riverDischargeM3s: 5
  });

  if (resGlofasHigh.flood.score !== resGlofasLow.flood.score) {
    console.error('FAIL [SECTION 4.D]: Macro GloFAS discharge must NOT directly alter micro parcel score without 2D hydraulic model:', {
      scoreHigh: resGlofasHigh.flood.score,
      scoreLow: resGlofasLow.flood.score
    });
    s4Passed = false;
  }

  if (!glofasMetric || !glofasMetric.labelId.includes('Konteks DAS') || !glofasMetric.descriptionId.includes('tidak dimasukkan ke skor persil mikro')) {
    console.error('FAIL [SECTION 4.D.2]: GloFAS metric description must state it is macro context not in parcel score:', glofasMetric);
    s4Passed = false;
  }

  // Test E: null terrain data -> null
  const nullTerrainInputs: RawPhysicalInputs = {
    ...mockPhase84Inputs,
    slopeDegrees: null,
    slopePercent: null,
    slopeClassification: null,
    localReliefMeters: null,
    localReliefType: null,
    flowAccumulationPotential: null
  };
  const resNullTerrain = RiskScoringEngine.calculate(testCoords, 'Site Null Terrain', 'Indonesia', 'Residential', 'Home Buyer', nullTerrainInputs);
  const nullMetrics = ReportMetricRegistry.getMetricsForCategory('flood', resNullTerrain, false);
  const nullSlope = nullMetrics.find(m => m.id === 'flood_slope');
  const nullRelief = nullMetrics.find(m => m.id === 'flood_local_relief');
  const nullFlow = nullMetrics.find(m => m.id === 'flood_flow_accumulation');

  if (
    resNullTerrain.flood.slopeDegrees !== null ||
    resNullTerrain.flood.localReliefMeters !== null ||
    resNullTerrain.flood.flowAccumulationPotential !== null ||
    nullSlope?.value !== null ||
    nullRelief?.value !== null ||
    nullFlow?.value !== null
  ) {
    console.error('FAIL [SECTION 4.E]: Null terrain inputs must preserve null without fabrication:', {
      slope: resNullTerrain.flood.slopeDegrees,
      relief: resNullTerrain.flood.localReliefMeters,
      flow: resNullTerrain.flood.flowAccumulationPotential
    });
    s4Passed = false;
  }

  // Test F: No fabricated flood depth or drainage capacity
  if (!depthMetric || depthMetric.value !== 'Data sensor genangan in-situ belum tersedia' || depthMetric.dataType !== 'status') {
    console.error('FAIL [SECTION 4.F.1]: Unmeasured flood depth must be explicitly status (not fabricated):', depthMetric);
    s4Passed = false;
  }

  if (!rainMetric || !rainMetric.labelId.includes('2020–2024 / ERA5')) {
    console.error('FAIL [SECTION 4.F.2]: Rainfall metric label must explicitly state 2020–2024 / ERA5 period:', rainMetric);
    s4Passed = false;
  }

  if (!drainMetric || drainMetric.value !== 'Data saluran drainase mikro belum tersedia' || drainMetric.dataType !== 'status') {
    console.error('FAIL [SECTION 4.F.3]: Drainage metric must be explicit status when unmapped:', drainMetric);
    s4Passed = false;
  }

  if (res84.flood.causeId.includes('drainage capacity limited')) {
    console.error('FAIL [SECTION 4.F.4]: Cause narrative must NOT fabricate drainage capacity claims without evidence:', res84.flood.causeId);
    s4Passed = false;
  }

  // =========================================================================
  // SECTION 5: PHASE 8.5.2 FLOOD SCORING WEIGHT, SENSITIVITY & SCORE LEDGER HARDENING
  // =========================================================================
  console.log('\n[SECTION 5] Phase 8.5.2 Flood Scoring Weight, Sensitivity & Score Ledger Hardening...');
  let s5Passed = true;

  // 5.A Score Ledger Presence, Structure and Reliability Verification on 3 Real Locations
  // Location 1: Jakarta Urban (Official High -> Base 70 + Elev 6 + Water 10 + Rain 4 = 90)
  const loc1 = RiskScoringEngine.calculate(new Coordinates(-6.1754, 106.8272), 'Jakarta Urban', 'Indonesia', 'Residential', 'Home Buyer', urbanFloodInputs);
  const ledger1 = loc1.flood.scoreLedger;
  if (!ledger1 || ledger1.officialClassification !== 'High' || ledger1.internalBaseScore !== 70 || ledger1.finalScore !== 90 || ledger1.adjustments.length !== 3 || ledger1.reliability !== 'partially_observed') {
    console.error('FAIL [SECTION 5.A.1]: Jakarta Urban score ledger failed verification:', ledger1);
    s5Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 5.A.1]: Jakarta Urban Score Ledger verified: Official ${ledger1.officialClassification} (${ledger1.officialSource}) -> Internal Base ${ledger1.internalBaseScore} + ${ledger1.adjustments.map(a => `${a.name} (${a.delta > 0 ? `+${a.delta}` : a.delta})`).join(' + ')} = ${ledger1.finalScore}/100 [Reliability: ${ledger1.reliability}].`);
  }

  // Location 2: Tampelas Riverine (Official High -> Base 70 + Water 10 + Rain 8 = 88)
  const loc2 = RiskScoringEngine.calculate(new Coordinates(-2.0125, 113.2450), 'Tampelas Riverine', 'Indonesia', 'Residential', 'Home Buyer', riverineFloodInputs);
  const ledger2 = loc2.flood.scoreLedger;
  if (!ledger2 || ledger2.officialClassification !== 'High' || ledger2.internalBaseScore !== 70 || ledger2.finalScore !== 88 || ledger2.adjustments.length !== 2 || ledger2.reliability !== 'partially_observed') {
    console.error('FAIL [SECTION 5.A.2]: Tampelas Riverine score ledger failed verification:', ledger2);
    s5Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 5.A.2]: Tampelas Riverine Score Ledger verified: Official ${ledger2.officialClassification} (${ledger2.officialSource}) -> Internal Base ${ledger2.internalBaseScore} + ${ledger2.adjustments.map(a => `${a.name} (${a.delta > 0 ? `+${a.delta}` : a.delta})`).join(' + ')} = ${ledger2.finalScore}/100 [Reliability: ${ledger2.reliability}].`);
  }

  // Location 3: Bandung Inland (Official Rendah -> Base 20 - Elev 4 = 16)
  const loc3 = RiskScoringEngine.calculate(new Coordinates(-6.9175, 107.6191), 'Bandung Inland', 'Indonesia', 'Residential', 'Home Buyer', inlandFloodInputs);
  const ledger3 = loc3.flood.scoreLedger;
  if (!ledger3 || ledger3.officialClassification !== 'Rendah' || ledger3.internalBaseScore !== 20 || ledger3.finalScore !== 16 || ledger3.adjustments.length !== 1 || ledger3.reliability !== 'partially_observed') {
    console.error('FAIL [SECTION 5.A.3]: Bandung Inland score ledger failed verification:', ledger3);
    s5Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 5.A.3]: Bandung Inland Score Ledger verified: Official ${ledger3.officialClassification} (${ledger3.officialSource}) -> Internal Base ${ledger3.internalBaseScore} + ${ledger3.adjustments.map(a => `${a.name} (${a.delta > 0 ? `+${a.delta}` : a.delta})`).join(' + ')} = ${ledger3.finalScore}/100 [Reliability: ${ledger3.reliability}].`);
  }

  // 5.B Monotonicity / Sensitivity Validation (Note: This is sensitivity validation, not empirical model calibration)
  // With same BNPB baseline (Medium / Base 45):
  // Case MonoA: High exposure (Elevation 4m, River 100m, Rain 160mm) -> 45 + 6 + 10 + 8 = 69
  // Case MonoB: Low exposure (Elevation 20m, River 2000m, Rain 70mm) -> 45 + 0 + 0 + 0 = 45
  const resMonoA = RiskScoringEngine.calculate(testCoords, 'Synthetic Mono A', 'Indonesia', 'Residential', 'Home Buyer', {
    ...mockPhase84Inputs,
    inariskFloodClass: 'Sedang',
    elevationMeters: 4,
    distanceToRiverMeters: 100,
    max24hRainfallMm: 160
  });
  const resMonoB = RiskScoringEngine.calculate(testCoords, 'Synthetic Mono B', 'Indonesia', 'Residential', 'Home Buyer', {
    ...mockPhase84Inputs,
    inariskFloodClass: 'Sedang',
    elevationMeters: 20,
    distanceToRiverMeters: 2000,
    max24hRainfallMm: 70
  });

  if (resMonoA.flood.score === null || resMonoB.flood.score === null || resMonoA.flood.score <= resMonoB.flood.score) {
    console.error('FAIL [SECTION 5.B]: Synthetic sensitivity monotonicity test failed:', {
      scoreMonoA: resMonoA.flood.score,
      scoreMonoB: resMonoB.flood.score
    });
    s5Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 5.B]: Sensitivity monotonicity verified (Score A: ${resMonoA.flood.score}/100 > Score B: ${resMonoB.flood.score}/100) [Note: Sensitivity validation, not empirical calibration].`);
  }

  // 5.C Null & Fallback Combinations
  // 1. BNPB available + ThinkHazard missing
  const bnpbOnlyInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    inariskFloodClass: 'Tinggi',
    thinkHazardReport: null
  };
  const resBnpbOnly = RiskScoringEngine.calculate(testCoords, 'BNPB Only Site', 'Indonesia', 'Residential', 'Home Buyer', bnpbOnlyInputs);
  if (resBnpbOnly.flood.scoreLedger?.baseSource !== 'BNPB inaRISK Official Classification' || resBnpbOnly.flood.scoreLedger.baseScore !== 70) {
    console.error('FAIL [SECTION 5.C.1]: BNPB Only fallback failed:', resBnpbOnly.flood.scoreLedger);
    s5Passed = false;
  }

  // 2. BNPB missing + ThinkHazard available
  const thinkHazardOnlyInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    inariskFloodClass: null,
    thinkHazardReport: {
      divisionCode: '3171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'Medium',
      earthquakeLevel: 'Low',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const resThinkHazardOnly = RiskScoringEngine.calculate(testCoords, 'ThinkHazard Only Site', 'Indonesia', 'Residential', 'Home Buyer', thinkHazardOnlyInputs);
  if (resThinkHazardOnly.flood.scoreLedger?.baseSource !== 'ThinkHazard Regional Baseline' || resThinkHazardOnly.flood.scoreLedger.baseScore !== 45) {
    console.error('FAIL [SECTION 5.C.2]: ThinkHazard Only fallback failed:', resThinkHazardOnly.flood.scoreLedger);
    s5Passed = false;
  }

  // 3. Rainfall missing -> no rainfall adjustment added, score valid
  const noRainInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    max24hRainfallMm: null
  };
  const resNoRain = RiskScoringEngine.calculate(testCoords, 'No Rain Site', 'Indonesia', 'Residential', 'Home Buyer', noRainInputs);
  const rainAdj = resNoRain.flood.scoreLedger?.adjustments.find(a => a.name.includes('Rain'));
  if (rainAdj || resNoRain.flood.score === null) {
    console.error('FAIL [SECTION 5.C.3]: Missing rainfall must omit rainfall adjustment without error:', resNoRain.flood.scoreLedger);
    s5Passed = false;
  }

  // 4. Waterway bounded (>5km) -> distance adjustment = 0
  const boundedWaterInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    distanceToRiverMeters: null,
    waterwayBounded: OverpassOsmClient.createBoundedObservation(null, 5000, 'Tidak terdeteksi dalam radius 5.0 km', false)
  };
  const resBoundedWater = RiskScoringEngine.calculate(testCoords, 'Bounded Waterway Site', 'Indonesia', 'Residential', 'Home Buyer', boundedWaterInputs);
  const waterAdj = resBoundedWater.flood.scoreLedger?.adjustments.find(a => a.name.includes('Waterway'));
  if (waterAdj) {
    console.error('FAIL [SECTION 5.C.4]: Bounded waterway (>5km) must not add waterway proximity penalty:', resBoundedWater.flood.scoreLedger);
    s5Passed = false;
  }

  // 5. No Double-Counting Invariant: When BNPB and ThinkHazard are BOTH present, ThinkHazard is NOT added additively
  const bothAvailableInputs: RawPhysicalInputs = {
    ...mockAllFloodInputs,
    inariskFloodClass: 'Sedang', // Base 45
    thinkHazardReport: {
      divisionCode: '3171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High', // Would be Base 70 if taken
      earthquakeLevel: 'Low',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const resBoth = RiskScoringEngine.calculate(testCoords, 'Both Sources Available', 'Indonesia', 'Residential', 'Home Buyer', bothAvailableInputs);
  if (resBoth.flood.scoreLedger?.baseSource !== 'BNPB inaRISK Official Classification' || resBoth.flood.scoreLedger.baseScore !== 45) {
    console.error('FAIL [SECTION 5.C.5]: Authority hierarchy violated: BNPB must take precedence as primary national source without ThinkHazard double-count:', resBoth.flood.scoreLedger);
    s5Passed = false;
  }

  if (s5Passed) {
    console.log(`✓ PASS [SECTION 5]: Phase 8.5.1 Flood scoring weight, calibration, score ledger, and monotonicity verified across all test cases.`);
  } else {
    allPassed = false;
  }

  return allPassed;
}

if (typeof require !== 'undefined' && require.main === module) {
  const success = runFloodCoverageAndSemanticsTests();
  process.exit(success ? 0 : 1);
}
