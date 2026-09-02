/**
 * SeismicCoverageAndSemantics.test.ts
 *
 * Phase 8.6 Comprehensive Seismic Evidence, Scoring Calibration & Ledger Audit
 * Validates:
 * 1. Complete earthquake input identification and provenance tracking
 * 2. BNPB official class vs ThinkHazard fallback hierarchy (zero additive double-counting)
 * 3. Direct verified PGA spectral ground motion modifier (no synthetic PGA fabrication)
 * 4. Consolidated 10-year historical seismicity modifier (no frequency + magnitude double-counting)
 * 5. Soil site class strict null preservation without borehole / Vs30 geotechnical measurements
 * 6. Liquefaction susceptibility geotechnical modifier
 * 7. Complete EarthquakeScoreLedger generation (officialBase, internalBase, adjustments, raw, cap, floor, final, reliability)
 * 8. Root cause trace of previous runtime EXTREME case
 * 9. Real locations evaluation: Jakarta, Bali, Bandung, Tampelas
 * 10. Monotonicity sensitivity validation and null/fallback safety
 */

import { Coordinates } from '../domain/value_objects/Coordinates';
import { RawPhysicalInputs, RiskScoringEngine } from '../domain/services/RiskScoringEngine';
import { ThinkHazardReport } from '../domain/types/hazard.types';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';

export function runSeismicCoverageAndSemanticsTests(): boolean {
  console.log('\n================================================================');
  console.log('RUNNING PHASE 8.6: SEISMIC EVIDENCE & SCORING AUDIT TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  const testCoords = new Coordinates(-6.2088, 106.8456);

  // Base mock inputs for earthquake evaluation
  const baseMockInputs: RawPhysicalInputs = {
    elevationMeters: 10,
    slopeDegrees: null,
    slopePercent: null,
    slopeClassification: null,
    localReliefMeters: null,
    localReliefType: null,
    flowAccumulationPotential: null,
    distanceToRiverMeters: 500,
    nearestRiverName: 'Kali Ciliwung',
    max24hRainfallMm: 80,
    rainfallPeriod: '2020-01-01 to 2024-12-31 (ERA5)',
    rainfallDataSource: 'Open-Meteo ERA5-Seamless',
    historicalQuakesCount150km: 25,
    historicalQuakesCount100km: 12,
    maxHistoricalMag: 6.8,
    recentM5PlusWithin350kmCount: 2,
    recentMaxMagnitude: 5.4,
    nearestEpicenterKm: 85.0,
    latestQuakeDescription: 'M 5.4 - 85 km SW of Jakarta',
    pgaMcegG: 0.28,
    pgaMcerS1: 0.15,
    pgaMcerSs: 0.35,
    inariskQuakeClass: 'Tinggi',
    inariskQuakeIndex: 0.72,
    inariskLiquefactionRisk: 'Sedang',
    nearestFaultName: 'Sesar Baribis (Segmen Jakarta)',
    distanceToFaultKm: 18.5,
    thinkHazardReport: {
      divisionCode: '3171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };

  // =========================================================================
  // SECTION 1: Earthquake Input Matrix & Provenance Verification
  // =========================================================================
  console.log('[SECTION 1] Earthquake Input Matrix & Provenance Verification...');
  const res1 = RiskScoringEngine.calculate(testCoords, 'Jakarta Site', 'Indonesia', 'Residential', 'Home Buyer', baseMockInputs);
  const q1 = res1.quake;

  let s1Passed = true;
  if (
    q1.score === null ||
    q1.quakeClass !== 'Tinggi' ||
    q1.quakeClassSource !== 'BNPB' ||
    q1.pgaMcegG !== 0.28 ||
    q1.pgaSourceLayer !== 'BNPB PGA_MCEG_100 ImageServer (100yr MCEG)' ||
    q1.bnpbQuakeHazardIndex !== 0.72 ||
    q1.historicalQuakesCount150km !== 25 ||
    q1.maxHistoricalMag !== 6.8 ||
    q1.nearestFaultName !== 'Sesar Baribis (Segmen Jakarta)' ||
    q1.distanceToFaultKm !== 18.5 ||
    q1.soilSiteClass !== null || // Strictly null: requires geotechnical borehole / Vs30
    q1.scoreReliability !== 'partially_observed'
  ) {
    console.error('FAIL [SECTION 1]: Earthquake input matrix and provenance mismatch:', q1);
    s1Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 1]: All earthquake inputs, continuous raster index (${q1.bnpbQuakeHazardIndex}), direct verified PGA (${q1.pgaMcegG}g), fault proximity (${q1.nearestFaultName}: ${q1.distanceToFaultKm}km), and reliability (${q1.scoreReliability}) verified.`);
  }
  if (!s1Passed) allPassed = false;

  // =========================================================================
  // SECTION 2: BNPB vs ThinkHazard Hierarchy & No Double-Counting
  // =========================================================================
  console.log('\n[SECTION 2] BNPB vs ThinkHazard Hierarchy & Non-Additive Verification...');
  let s2Passed = true;

  // 2.A When BNPB is available, BNPB sets the Base Score, ThinkHazard is not additive
  const ledger1 = q1.scoreLedger;
  if (!ledger1 || ledger1.officialSource !== 'BNPB inaRISK' || ledger1.internalBaseScore !== 65) {
    console.error('FAIL [SECTION 2.A]: BNPB priority failed in ledger:', ledger1);
    s2Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 2.A]: Official BNPB takes precedence: Base ${ledger1.internalBaseScore}/100 (${ledger1.officialSource}: ${ledger1.officialClassification}).`);
  }

  // 2.B When BNPB is null, ThinkHazard serves as Regional Fallback Prior
  const thinkHazardOnlyInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: null,
    inariskQuakeIndex: null,
    thinkHazardReport: {
      divisionCode: '5171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'Low',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const res2B = RiskScoringEngine.calculate(testCoords, 'ThinkHazard Only Site', 'Indonesia', 'Residential', 'Home Buyer', thinkHazardOnlyInputs);
  const ledger2B = res2B.quake.scoreLedger;
  if (!ledger2B || ledger2B.officialSource !== 'World Bank ThinkHazard!' || ledger2B.internalBaseScore !== 40) {
    console.error('FAIL [SECTION 2.B]: ThinkHazard fallback baseline failed in ledger:', ledger2B);
    s2Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 2.B]: ThinkHazard fallback active when BNPB is null: Base ${ledger2B.internalBaseScore}/100 (${ledger2B.officialSource}: ${ledger2B.officialClassification}).`);
  }
  if (!s2Passed) allPassed = false;

  // =========================================================================
  // SECTION 3: Direct PGA Verification & No Synthetic Fabrication
  // =========================================================================
  console.log('\n[SECTION 3] Direct PGA Verification & No Synthetic Fabrication...');
  let s3Passed = true;

  // 3.A High PGA (>= 0.40g) adds +8 modifier
  const highPgaInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    pgaMcegG: 0.45
  };
  const res3A = RiskScoringEngine.calculate(testCoords, 'High PGA Site', 'Indonesia', 'Residential', 'Home Buyer', highPgaInputs);
  const pgaAdj3A = res3A.quake.scoreLedger?.adjustments.find(a => a.name.includes('PGA'));
  if (!pgaAdj3A || pgaAdj3A.delta !== 8) {
    console.error('FAIL [SECTION 3.A]: High PGA adjustment failed:', pgaAdj3A);
    s3Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 3.A]: High PGA (0.45g >= 0.40g) verified with +${pgaAdj3A.delta} modifier.`);
  }

  // 3.B Null PGA: no synthetic PGA fabricated, delta = 0, omitted from adjustments
  const nullPgaInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    pgaMcegG: null
  };
  const res3B = RiskScoringEngine.calculate(testCoords, 'Null PGA Site', 'Indonesia', 'Residential', 'Home Buyer', nullPgaInputs);
  const pgaAdj3B = res3B.quake.scoreLedger?.adjustments.find(a => a.name.includes('PGA'));
  if (pgaAdj3B || res3B.quake.estimatedPgaG !== null) {
    console.error('FAIL [SECTION 3.B]: Unmeasured PGA must remain strictly null without synthetic fabrication:', {
      pgaAdj: pgaAdj3B,
      estimatedPgaG: res3B.quake.estimatedPgaG
    });
    s3Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 3.B]: Null PGA correctly preserved as null with zero synthetic fabrication.`);
  }
  if (!s3Passed) allPassed = false;

  // =========================================================================
  // SECTION 4: Consolidated Historical Seismicity (No Frequency+Magnitude Stacking)
  // =========================================================================
  console.log('\n[SECTION 4] Consolidated Historical Seismicity Modifier...');
  let s4Passed = true;

  // 4.A Active cluster (203 events, Mmax 7.2) -> Single consolidated adjustment +6
  const activeClusterInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    historicalQuakesCount150km: 203,
    maxHistoricalMag: 7.2
  };
  const res4A = RiskScoringEngine.calculate(testCoords, 'Active Cluster Site', 'Indonesia', 'Residential', 'Home Buyer', activeClusterInputs);
  const histAdjs = res4A.quake.scoreLedger?.adjustments.filter(a => a.name.includes('Historical Seismicity'));
  if (!histAdjs || histAdjs.length !== 1 || histAdjs[0].delta !== 6) {
    console.error('FAIL [SECTION 4.A]: Consolidated historical seismicity modifier failed:', histAdjs);
    s4Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 4.A]: Active seismicity cluster (203 events, M7.2) received single consolidated +${histAdjs[0].delta} modifier (avoiding +18 and +15 stacking).`);
  }
  if (!s4Passed) allPassed = false;

  // =========================================================================
  // SECTION 5: Previous Runtime EXTREME Case Mathematical Trace & Ledger
  // =========================================================================
  console.log('\n[SECTION 5] Previous Runtime EXTREME Case Trace & Ledger Audit...');
  let s5Passed = true;

  // Runtime Case: BNPB Tinggi, PGA 0.43g, 203 Historical Quakes, Liquefaction Tinggi
  const runtimeExtremeInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: 'Tinggi',
    pgaMcegG: 0.43,
    historicalQuakesCount150km: 203,
    maxHistoricalMag: 7.2,
    inariskLiquefactionRisk: 'Tinggi',
    thinkHazardReport: {
      divisionCode: '3171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };

  const res5 = RiskScoringEngine.calculate(testCoords, 'Audited Seismic Site', 'Indonesia', 'Residential', 'Home Buyer', runtimeExtremeInputs);
  const ledger5 = res5.quake.scoreLedger;

  // Audited Expected Score: Base 65 + PGA 8 + Hist 6 + Liq 6 = 85/100
  if (!ledger5 || ledger5.internalBaseScore !== 65 || ledger5.finalScore !== 85 || ledger5.adjustments.length !== 3) {
    console.error('FAIL [SECTION 5]: Audited score ledger mismatch for extreme case:', ledger5);
    s5Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 5]: Audited Score Ledger for high-seismic case: Base ${ledger5.internalBaseScore} (BNPB Tinggi) + ${ledger5.adjustments.map(a => `${a.name} (+${a.delta})`).join(' + ')} = ${ledger5.finalScore}/100.`);
    console.log(`  [TRACE EXPLANATION]: Previous uncalibrated logic added Base 65 + Count 18 + Mag 15 + Liq 12 = 110 -> 100.`);
    console.log(`  [AUDITED LOGIC]: Audited conservative rules yield calibrated score 85/100 with zero overflow and explicit ledger provenance.`);
  }
  if (!s5Passed) allPassed = false;

  // =========================================================================
  // SECTION 6: Real Locations Evaluation
  // =========================================================================
  console.log('\n[SECTION 6] Real Locations Evaluation (Jakarta, Bali, Bandung, Tampelas)...');
  let s6Passed = true;

  // Location 1: Jakarta Urban (BNPB Tinggi, PGA 0.28g, History 18, Liq Sedang) -> 65 + 4 + 6 + 3 = 78/100
  const jakartaInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: 'Tinggi',
    pgaMcegG: 0.28,
    historicalQuakesCount150km: 18,
    maxHistoricalMag: 6.2,
    inariskLiquefactionRisk: 'Sedang'
  };
  const resJakarta = RiskScoringEngine.calculate(new Coordinates(-6.1754, 106.8272), 'Jakarta Urban', 'Indonesia', 'Residential', 'Home Buyer', jakartaInputs);
  if (resJakarta.quake.score !== 78) {
    console.error(`FAIL [SECTION 6.1]: Jakarta score expected 78, got ${resJakarta.quake.score}`);
    s6Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 6.1]: Jakarta Urban Seismic Score = ${resJakarta.quake.score}/100 (${resJakarta.quake.level}).`);
  }

  // Location 2: Bali / Denpasar (ThinkHazard Medium, PGA 0.32g, History 45, Liq Sedang) -> 40 + 4 + 6 + 3 = 53/100
  const baliInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: null, // Regional fallback
    pgaMcegG: 0.32,
    historicalQuakesCount150km: 45,
    maxHistoricalMag: 6.5,
    inariskLiquefactionRisk: 'Sedang',
    thinkHazardReport: {
      divisionCode: '5171',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'Low',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const resBali = RiskScoringEngine.calculate(new Coordinates(-8.6705, 115.2126), 'Denpasar Bali', 'Indonesia', 'Residential', 'Home Buyer', baliInputs);
  if (resBali.quake.score !== 53) {
    console.error(`FAIL [SECTION 6.2]: Bali score expected 53, got ${resBali.quake.score}`);
    s6Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 6.2]: Denpasar Bali Seismic Score = ${resBali.quake.score}/100 (${resBali.quake.level}).`);
  }

  // Location 3: Bandung Plateau (BNPB Tinggi, PGA 0.43g, History 62, Liq Sedang) -> 65 + 8 + 6 + 3 = 82/100
  const bandungInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: 'Tinggi',
    pgaMcegG: 0.43,
    historicalQuakesCount150km: 62,
    maxHistoricalMag: 6.9,
    inariskLiquefactionRisk: 'Sedang'
  };
  const resBandung = RiskScoringEngine.calculate(new Coordinates(-6.9175, 107.6191), 'Bandung Plateau', 'Indonesia', 'Residential', 'Home Buyer', bandungInputs);
  if (resBandung.quake.score !== 82) {
    console.error(`FAIL [SECTION 6.3]: Bandung score expected 82, got ${resBandung.quake.score}`);
    s6Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 6.3]: Bandung Plateau Seismic Score = ${resBandung.quake.score}/100 (${resBandung.quake.level}).`);
  }

  // Location 4: Tampelas Kalimantan (ThinkHazard Low, PGA 0.024g, History 0, Liq Rendah) -> 15 + 0 + 0 + 0 = 15/100
  const tampelasInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: null,
    pgaMcegG: 0.024,
    historicalQuakesCount150km: 0,
    maxHistoricalMag: null,
    inariskLiquefactionRisk: 'Rendah',
    thinkHazardReport: {
      divisionCode: '6206',
      countryName: 'Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      floodLevel: 'High',
      earthquakeLevel: 'Low',
      extremeHeatLevel: 'Low',
      tsunamiLevel: 'Very Low',
      isWorldBankSource: true
    } as ThinkHazardReport
  };
  const resTampelas = RiskScoringEngine.calculate(new Coordinates(-2.0125, 113.2450), 'Tampelas Kalimantan', 'Indonesia', 'Residential', 'Home Buyer', tampelasInputs);
  if (resTampelas.quake.score !== 15) {
    console.error(`FAIL [SECTION 6.4]: Tampelas score expected 15, got ${resTampelas.quake.score}`);
    s6Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 6.4]: Tampelas Kalimantan Stable Shield Seismic Score = ${resTampelas.quake.score}/100 (${resTampelas.quake.level}).`);
  }
  if (!s6Passed) allPassed = false;

  // =========================================================================
  // SECTION 7: Monotonicity Sensitivity Validation & Null Handling
  // =========================================================================
  console.log('\n[SECTION 7] Monotonicity Sensitivity Validation & Null Handling...');
  let s7Passed = true;

  // 7.A Sensitivity: Case B (Higher PGA, active catalog) > Case A (Lower PGA, quiet catalog)
  const resMonoA = RiskScoringEngine.calculate(testCoords, 'Seismic Mono A', 'Indonesia', 'Residential', 'Home Buyer', {
    ...baseMockInputs,
    inariskQuakeClass: 'Sedang',
    pgaMcegG: 0.15,
    historicalQuakesCount150km: 2,
    maxHistoricalMag: 4.2
  });
  const resMonoB = RiskScoringEngine.calculate(testCoords, 'Seismic Mono B', 'Indonesia', 'Residential', 'Home Buyer', {
    ...baseMockInputs,
    inariskQuakeClass: 'Sedang',
    pgaMcegG: 0.42,
    historicalQuakesCount150km: 30,
    maxHistoricalMag: 6.8
  });

  if (resMonoA.quake.score === null || resMonoB.quake.score === null || resMonoA.quake.score >= resMonoB.quake.score) {
    console.error('FAIL [SECTION 7.A]: Seismic sensitivity monotonicity failed:', {
      scoreMonoA: resMonoA.quake.score,
      scoreMonoB: resMonoB.quake.score
    });
    s7Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 7.A]: Seismic sensitivity monotonicity verified: Score(A: ${resMonoA.quake.score}/100) < Score(B: ${resMonoB.quake.score}/100) [Note: Sensitivity validation, not empirical calibration].`);
  }

  // 7.B All Seismic Evidence Null -> Score null, level 'insufficient_data'
  const allNullInputs: RawPhysicalInputs = {
    ...baseMockInputs,
    inariskQuakeClass: null,
    inariskQuakeIndex: null,
    thinkHazardReport: null,
    historicalQuakesCount150km: null,
    maxHistoricalMag: null,
    pgaMcegG: null,
    inariskLiquefactionRisk: null
  };
  const resNull = RiskScoringEngine.calculate(testCoords, 'All Null Site', 'Indonesia', 'Residential', 'Home Buyer', allNullInputs);
  if (resNull.quake.score !== null || resNull.quake.level !== 'insufficient_data') {
    console.error('FAIL [SECTION 7.B]: Complete null earthquake inputs must yield null score and insufficient_data level:', resNull.quake);
    s7Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 7.B]: Complete null earthquake evidence correctly yields score = null, level = 'insufficient_data'.`);
  }
  if (!s7Passed) allPassed = false;

  // =========================================================================
  // SECTION 8: Report Metric Registry Earthquake Cards Verification
  // =========================================================================
  console.log('\n[SECTION 8] ReportMetricRegistry Earthquake Cards Verification...');
  const displayMetrics = ReportMetricRegistry.getDisplayMetrics('earthquake', resJakarta, false);
  const modelCard = displayMetrics.find(m => m.id === 'seismic_model_score');
  const pgaCard = displayMetrics.find(m => m.id === 'seismic_pga');

  let s8Passed = true;
  if (!modelCard || !pgaCard || !modelCard.value?.includes('78/100')) {
    console.error('FAIL [SECTION 8]: ReportMetricRegistry earthquake cards mismatch:', { modelCard, pgaCard });
    s8Passed = false;
  } else {
    console.log(`✓ PASS [SECTION 8]: ReportMetricRegistry earthquake cards verified: ${modelCard.labelId} = ${modelCard.value}, PGA = ${pgaCard.value} (${pgaCard.source}).`);
  }
  if (!s8Passed) allPassed = false;

  if (allPassed) {
    console.log('\n================================================================');
    console.log('✓ ALL PHASE 8.6 SEISMIC EVIDENCE & SCORING AUDIT TESTS PASSED!');
    console.log('================================================================\n');
  }

  return allPassed;
}

if (typeof require !== 'undefined' && require.main === module) {
  const success = runSeismicCoverageAndSemanticsTests();
  process.exit(success ? 0 : 1);
}
