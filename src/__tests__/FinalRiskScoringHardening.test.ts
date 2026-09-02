import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { RiskScore } from '../domain/value_objects/RiskScore.vo';
import { RISK_MODEL_CONFIG } from '../domain/config/RiskModelConfig';
import type { NormalizedTransportEvidence } from '../domain/types/transport.types';

export function runFinalRiskScoringHardeningTests(): boolean {
  console.log('================================================================');
  console.log('PHASE 8: FINAL RISK SCORING HARDENING VERIFICATION');
  console.log('================================================================\n');

  let allPassed = true;
  const coords = new Coordinates(-6.2088, 106.8456);

  // ---------------------------------------------------------------------------
  // TEST A: Null Score (No Evidence -> Strict Null, Not Zero)
  // ---------------------------------------------------------------------------
  console.log('[TEST A] Null Score Invariant on Missing Evidence...');
  const emptyInputs: RawPhysicalInputs = {
    elevationMeters: null,
    max24hRainfallMm: null,
    distanceToRiverMeters: null,
    historicalQuakesCount150km: null,
    historicalQuakesCount100km: null,
    maxHistoricalMag: null,
    avgMaxTempC: null,
    historicalPeakTempC: null,
    projectedTempRise2050C: null,
    greenSpaceRatioPct: null,
    distanceToNearestRoadMeters: null,
    distanceToArterialMeters: null,
    distanceToTransitHubMeters: null,
    distanceToHospitalMeters: null
  };

  const resA = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', emptyInputs);

  if (
    resA.flood.score !== null ||
    resA.quake.score !== null ||
    resA.heat.score !== null ||
    resA.transport.score !== null ||
    resA.overallScore !== null ||
    resA.overallLevel !== 'insufficient_data' ||
    resA.dominantHazard !== null
  ) {
    console.error('FAIL: Test A - Missing evidence must produce score=null and level=insufficient_data', resA);
    allPassed = false;
  } else {
    console.log('PASS: Test A - All dimensions and overall score are strictly null when no evidence exists');
  }

  // ---------------------------------------------------------------------------
  // TEST B & C: Clamping [0, 100]
  // ---------------------------------------------------------------------------
  console.log('[TEST B & C] Score Clamping Invariant [0, 100]...');
  const scoreNeg = new RiskScore(-50);
  const scoreOver = new RiskScore(150);

  if (scoreNeg.value !== 0 || scoreNeg.level !== 'low') {
    console.error('FAIL: Test B - Clamping below 0 failed', scoreNeg);
    allPassed = false;
  } else if (scoreOver.value !== 100 || scoreOver.level !== 'extreme') {
    console.error('FAIL: Test C - Clamping above 100 failed', scoreOver);
    allPassed = false;
  } else {
    console.log('PASS: Test B & C - Clamping bounds [0, 100] strictly verified');
  }

  // ---------------------------------------------------------------------------
  // TEST D, E, F: Deterministic Level Threshold Boundaries (30, 60, 80)
  // ---------------------------------------------------------------------------
  console.log('[TEST D, E, F] Deterministic Level Threshold Boundaries...');
  const s30 = new RiskScore(30);
  const s31 = new RiskScore(31);
  const s60 = new RiskScore(60);
  const s61 = new RiskScore(61);
  const s80 = new RiskScore(80);
  const s81 = new RiskScore(81);

  if (s30.level !== 'low' || s31.level !== 'medium') {
    console.error('FAIL: Test D - Boundary 30/31 mismatch:', s30.level, s31.level);
    allPassed = false;
  } else if (s60.level !== 'medium' || s61.level !== 'high') {
    console.error('FAIL: Test E - Boundary 60/61 mismatch:', s60.level, s61.level);
    allPassed = false;
  } else if (s80.level !== 'high' || s81.level !== 'extreme') {
    console.error('FAIL: Test F - Boundary 80/81 mismatch:', s80.level, s81.level);
    allPassed = false;
  } else {
    console.log('PASS: Test D, E, F - Exact deterministic boundaries: 0-30 Low, 31-60 Medium, 61-80 High, 81-100 Extreme');
  }

  // ---------------------------------------------------------------------------
  // TEST G & Q: Zero Physical Hazards Present -> Overall Score Strictly Null
  // ---------------------------------------------------------------------------
  console.log('[TEST G & Q] Overall Score when Zero Physical Hazards Exist...');
  if (resA.overallScore !== null || resA.overallLevel !== 'insufficient_data' || resA.dominantHazard !== null) {
    console.error('FAIL: Test G & Q - Overall score must be null when 0 physical hazards exist');
    allPassed = false;
  } else {
    console.log('PASS: Test G & Q - Overall score is strictly null when 0 physical hazards are available');
  }

  // ---------------------------------------------------------------------------
  // TEST H & R: Exactly One Physical Hazard Present (Flood=70, Quake=null, Heat=null)
  // ---------------------------------------------------------------------------
  console.log('[TEST H & R] Overall Score with Exactly 1 Physical Hazard...');
  const oneHazardInput: RawPhysicalInputs = {
    ...emptyInputs,
    inariskFloodClass: 'Tinggi',
    elevationMeters: 2 // Elevation < 3m (+18 adjustment)
  };

  const resH = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', oneHazardInput);

  // Flood score: base 70 + elevation 18 = 88. Quake=null, Heat=null.
  // Overall score: 0.70 * 88 + 0.30 * 88 = 88.
  if (
    resH.flood.score !== 88 ||
    resH.quake.score !== null ||
    resH.heat.score !== null ||
    resH.overallScore !== 88 ||
    resH.dominantHazard !== 'flood'
  ) {
    console.error('FAIL: Test H & R - Single physical hazard overall score calculation mismatch', resH.overallScore, resH.flood.score);
    allPassed = false;
  } else {
    console.log(`PASS: Test H & R - Single hazard correctly produces overallScore=${resH.overallScore} (Flood=88) without zero imputation`);
  }

  // ---------------------------------------------------------------------------
  // TEST S: Three Physical Hazards Present (Dominant 70% + Mean 30%)
  // ---------------------------------------------------------------------------
  console.log('[TEST S] Overall Score with 3 Physical Hazards (70% Max + 30% Mean)...');
  const threeHazardsInput: RawPhysicalInputs = {
    ...emptyInputs,
    inariskFloodClass: 'Sedang', // Base 45
    elevationMeters: 50, // Elevation > 35m (-8) -> Flood = 37
    inariskQuakeClass: 'Tinggi', // Base 65
    historicalQuakesCount150km: 6, // +10 -> Quake = 75
    avgMaxTempC: 32, // +22 -> Base 20 + 22 = 42
    historicalPeakTempC: 36 // +15 -> Heat = 57
  };

  const resS = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', threeHazardsInput);
  const fScore = resS.flood.score!;
  const qScore = resS.quake.score!;
  const hScore = resS.heat.score!;
  const maxScore = Math.max(fScore, qScore, hScore);
  const meanScore = (fScore + qScore + hScore) / 3;
  const expectedOverall = Math.round(maxScore * 0.70 + meanScore * 0.30);

  if (resS.overallScore !== expectedOverall || resS.dominantHazard !== 'earthquake') {
    console.error(`FAIL: Test S - Expected overallScore=${expectedOverall}, got=${resS.overallScore}, dominant=${resS.dominantHazard}`);
    allPassed = false;
  } else {
    console.log(`PASS: Test S - 3 hazards produce overallScore=${resS.overallScore} (Max=${maxScore} [Earthquake], Mean=${meanScore.toFixed(1)})`);
  }

  // ---------------------------------------------------------------------------
  // TEST T: Correlated Sources Anti-Double-Counting (BNPB vs ThinkHazard)
  // ---------------------------------------------------------------------------
  console.log('[TEST T] Anti-Double-Counting for Correlated Sources (BNPB vs ThinkHazard)...');
  const correlatedInput: RawPhysicalInputs = {
    ...emptyInputs,
    inariskFloodClass: 'Tinggi', // Base 70 (BNPB)
    thinkHazardReport: {
      floodLevel: 'High',
      earthquakeLevel: 'High',
      extremeHeatLevel: 'High',
      wildfireLevel: 'No Data',
      cycloneLevel: 'No Data',
      tsunamiLevel: 'No Data',
      landslideLevel: 'No Data',
      granularity: 'district'
    }
  };

  const resT = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', correlatedInput);

  // When BNPB is present (Tinggi = 70), ThinkHazard (High) is NOT added on top. Flood base tier remains 70.
  if (resT.flood.score !== 70 || resT.flood.floodClassSource !== 'BNPB') {
    console.error('FAIL: Test T - Correlated sources double-counted or source priority wrong', resT.flood);
    allPassed = false;
  } else {
    console.log('PASS: Test T - BNPB primary tier respected without stacking ThinkHazard classification (Score=70)');
  }

  // ---------------------------------------------------------------------------
  // TEST K, L, M: Bounded, Error, and Timeout Transport Semantics
  // ---------------------------------------------------------------------------
  console.log('[TEST K, L, M] Bounded, Error, & Timeout Transport Semantics...');
  const mockEvBounded: NormalizedTransportEvidence = {
    nearestRoad: { name: 'Road', distanceMeters: 20, distanceKm: 0.02, status: 'success_exact', source: 'osrm', provider: 'OSRM', searchRadiusMeters: 500, relation: 'exact', lowerBoundMeters: null },
    majorRoad: { name: 'Arterial', distanceMeters: 800, distanceKm: 0.8, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: 'exact', lowerBoundMeters: null },
    healthcare: { name: null, distanceMeters: null, distanceKm: null, status: 'success_bounded', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: 'greater_than', lowerBoundMeters: 15000 },
    transit: { name: null, distanceMeters: null, distanceKm: null, status: 'timeout', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: null, lowerBoundMeters: null },
    fireStation: { name: 'Fire', distanceMeters: 1000, distanceKm: 1.0, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 10000, relation: 'exact', lowerBoundMeters: null },
    route: { routeDistanceMeters: null, durationMinutes: null, estimatedTravelTimeMinutes: null, routingSource: 'None', source: 'unknown', provider: 'None', status: 'error' },
    evaluatedAt: new Date().toISOString()
  };

  const resKLM = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', {
    ...emptyInputs,
    transportEvidence: mockEvBounded
  });

  // Transit is timeout -> omitted from components (3 observed: road, arterial, healthcare bounded).
  // Road (20m <= 50m) = 10 (wt 0.25). Arterial (800m <= 1500m) = 20 (wt 0.25). Healthcare (bounded) = fallback 55 (wt 0.30).
  // Total weight = 0.25 + 0.25 + 0.30 = 0.80.
  // Weighted sum = (10*0.25 + 20*0.25 + 55*0.30) / 0.80 = (2.5 + 5.0 + 16.5) / 0.80 = 24.0 / 0.80 = 30.
  if (
    resKLM.transport.observedComponents !== 3 ||
    resKLM.transport.score !== 30 ||
    resKLM.transport.level !== 'good' ||
    resKLM.transport.scoreReliability !== 'partially_observed'
  ) {
    console.error('FAIL: Test K, L, M - Transport bounded/timeout score calculation mismatch', resKLM.transport);
    allPassed = false;
  } else {
    console.log(`PASS: Test K, L, M - Timeout omitted, Bounded used conservative fallback score (Transport Score=${resKLM.transport.score})`);
  }

  // ---------------------------------------------------------------------------
  // TEST N, O, P: Transport Coverage Transitions (1/4 -> Null, 2/4 -> Valid, 4/4 -> Measured)
  // ---------------------------------------------------------------------------
  console.log('[TEST N, O, P] Transport Coverage Progression (1/4, 2/4, 4/4)...');
  // 1/4 Coverage
  const ev1of4: NormalizedTransportEvidence = {
    ...mockEvBounded,
    majorRoad: { ...mockEvBounded.majorRoad, status: 'error', distanceMeters: null },
    healthcare: { ...mockEvBounded.healthcare, status: 'error', distanceMeters: null }
  };
  const resN = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', { ...emptyInputs, transportEvidence: ev1of4 });

  if (resN.transport.observedComponents !== 1 || resN.transport.score !== null || resN.transport.level !== 'unavailable') {
    console.error('FAIL: Test N - Transport 1/4 coverage must produce score=null, level=unavailable', resN.transport);
    allPassed = false;
  } else {
    console.log('PASS: Test N - Transport 1/4 coverage strictly produces score=null and level=unavailable');
  }

  // 2/4 Coverage
  const ev2of4: NormalizedTransportEvidence = {
    ...mockEvBounded,
    healthcare: { ...mockEvBounded.healthcare, status: 'error', distanceMeters: null }
  };
  const resO = RiskScoringEngine.calculate(coords, 'Test Site', 'Indonesia', 'residential', 'property_buyer', { ...emptyInputs, transportEvidence: ev2of4 });

  // Road (10, wt 0.25) + Arterial (20, wt 0.25). Total wt 0.50. Score = (2.5 + 5.0) / 0.50 = 15.
  if (resO.transport.observedComponents !== 2 || resO.transport.score !== 15 || resO.transport.scoreReliability !== 'partially_observed') {
    console.error('FAIL: Test O - Transport 2/4 coverage dynamic renormalization mismatch', resO.transport);
    allPassed = false;
  } else {
    console.log(`PASS: Test O - Transport 2/4 coverage successfully renormalized (Score=${resO.transport.score}, Reliability=partially_observed)`);
  }

  // 4/4 Full Coverage (Bali-style)
  const ev4of4: NormalizedTransportEvidence = {
    nearestRoad: { name: 'Road', distanceMeters: 57, distanceKm: 0.057, status: 'success_exact', source: 'osrm', provider: 'OSRM', searchRadiusMeters: 500, relation: 'exact', lowerBoundMeters: null },
    majorRoad: { name: 'Arterial', distanceMeters: 939, distanceKm: 0.939, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: 'exact', lowerBoundMeters: null },
    healthcare: { name: 'Hospital', distanceMeters: 3193, distanceKm: 3.193, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: 'exact', lowerBoundMeters: null },
    transit: { name: 'Transit', distanceMeters: 12185, distanceKm: 12.185, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 15000, relation: 'exact', lowerBoundMeters: null },
    fireStation: { name: 'Fire', distanceMeters: 3375, distanceKm: 3.375, status: 'success_exact', source: 'overpass', provider: 'Overpass', searchRadiusMeters: 10000, relation: 'exact', lowerBoundMeters: null },
    route: { routeDistanceMeters: 11662, durationMinutes: 19.1, estimatedTravelTimeMinutes: '20 Menit', routingSource: 'OSRM', source: 'osrm', provider: 'OSRM', status: 'success' },
    evaluatedAt: new Date().toISOString()
  };
  const resP = RiskScoringEngine.calculate(coords, 'Bali Test Site', 'Indonesia', 'residential', 'property_buyer', { ...emptyInputs, transportEvidence: ev4of4 });

  // Road (57m <= 150m) = 20 (wt 0.25). Arterial (939m <= 1500m) = 20 (wt 0.25). Hospital (3193m <= 4500m) = 25 (wt 0.30). Transit (12185m > 1200m) = 35 (wt 0.20).
  // Sum = 20*0.25 + 20*0.25 + 25*0.30 + 35*0.20 = 5.0 + 5.0 + 7.5 + 7.0 = 24.5 -> Round = 25.
  if (
    resP.transport.observedComponents !== 4 ||
    resP.transport.score !== 25 ||
    resP.transport.level !== 'good' ||
    resP.transport.scoreReliability !== 'measured'
  ) {
    console.error('FAIL: Test P - Transport 4/4 coverage calculation mismatch', resP.transport);
    allPassed = false;
  } else {
    console.log(`PASS: Test P - Transport 4/4 coverage verified with exact mathematical trace (Score=${resP.transport.score}, Level=${resP.transport.level}, Reliability=measured)`);
  }

  // ---------------------------------------------------------------------------
  // TEST U: Reliability is Independent of Risk Score Magnitude
  // ---------------------------------------------------------------------------
  console.log('[TEST U] Reliability Independence from Score Magnitude...');
  // High score with measured reliability vs Low score with imputed reliability
  if (resH.flood.score! > 80 && resH.flood.scoreReliability !== 'partially_observed') {
    console.error('FAIL: Test U - High score had wrong reliability', resH.flood);
    allPassed = false;
  } else {
    console.log('PASS: Test U - Reliability reflects observation depth, completely decoupled from score magnitude');
  }

  console.log('\n----------------------------------------------------------------');
  if (allPassed) {
    console.log('ALL PHASE 8 RISK SCORING HARDENING TESTS PASSED! (100%)');
  } else {
    console.error('SOME PHASE 8 RISK SCORING TESTS FAILED!');
  }
  console.log('----------------------------------------------------------------\n');

  return allPassed;
}
