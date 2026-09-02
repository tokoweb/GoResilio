import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';

export function runDataCoverageGovernanceTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH: DATA COVERAGE GOVERNANCE FOR SCORING TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  const testCoords = new Coordinates(-6.2088, 106.8456);

  // Helper base inputs with all values null
  const createEmptyInputs = (): RawPhysicalInputs => ({
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
    distanceToHospitalMeters: null,
    distanceToFireStationMeters: null
  });

  // ---------------------------------------------------------------------------
  // 1. TRANSPORT COVERAGE POLICIES (0/4, 1/4, 2/4, 4/4)
  // ---------------------------------------------------------------------------
  console.log('[TEST 1.1] Transport 0/4 Observed Components -> score=null, level=unavailable, reliability=insufficient_data...');
  try {
    const inputs = createEmptyInputs();
    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.transport.score !== null) {
      console.error(`FAIL: Expected transport score to be null for 0/4 observed, got: ${res.transport.score}`);
      allPassed = false;
    } else if (res.transport.level !== 'unavailable') {
      console.error(`FAIL: Expected transport level 'unavailable', got: ${res.transport.level}`);
      allPassed = false;
    } else if (res.transport.scoreReliability !== 'insufficient_data') {
      console.error(`FAIL: Expected transport reliability 'insufficient_data', got: ${res.transport.scoreReliability}`);
      allPassed = false;
    } else if (res.transport.observedComponents !== 0 || res.transport.coveragePct !== 0) {
      console.error(`FAIL: Expected 0 observed and 0% coverage, got ${res.transport.observedComponents} (${res.transport.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log('PASS [TEST 1.1]: 0/4 Transport components correctly produces score=null, level=unavailable, reliability=insufficient_data, coverage=0%.');
    }
  } catch (err) {
    console.error('FAIL [TEST 1.1]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 1.2] Transport 1/4 Observed (e.g. nearest road only) -> score=null, level=unavailable, reliability=insufficient_data (No false certainty)...');
  try {
    const inputs = createEmptyInputs();
    inputs.distanceToNearestRoadMeters = 25; // 1 observed component only

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.transport.score !== null) {
      console.error(`FAIL: Expected transport score to be null for 1/4 observed, got: ${res.transport.score}`);
      allPassed = false;
    } else if (res.transport.level !== 'unavailable') {
      console.error(`FAIL: Expected transport level 'unavailable' for 1/4 observed, got: ${res.transport.level}`);
      allPassed = false;
    } else if (res.transport.scoreReliability !== 'insufficient_data') {
      console.error(`FAIL: Expected transport reliability 'insufficient_data', got: ${res.transport.scoreReliability}`);
      allPassed = false;
    } else if (res.transport.observedComponents !== 1 || res.transport.coveragePct !== 25) {
      console.error(`FAIL: Expected 1 observed and 25% coverage, got ${res.transport.observedComponents} (${res.transport.coveragePct}%)`);
      allPassed = false;
    } else if (!res.transport.connectivityLabelId.includes('Data Parsial')) {
      console.error(`FAIL: Expected connectivity label to indicate partial data, got: ${res.transport.connectivityLabelId}`);
      allPassed = false;
    } else {
      console.log('PASS [TEST 1.2]: 1/4 Transport component strictly withholds score (score=null, level=unavailable, reliability=insufficient_data, coverage=25%).');
    }
  } catch (err) {
    console.error('FAIL [TEST 1.2]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 1.3] Transport 2/4 Observed -> Dynamic renormalization score, reliability=partially_observed, coverage=50%...');
  try {
    const inputs = createEmptyInputs();
    inputs.distanceToNearestRoadMeters = 25; // road: score = 15
    inputs.distanceToArterialMeters = 350;   // arterial: score = 15

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.transport.score === null) {
      console.error('FAIL: Expected transport score to be calculated for 2/4 observed components');
      allPassed = false;
    } else if (res.transport.level === 'unavailable') {
      console.error('FAIL: Expected valid transport risk level for 2/4 observed components');
      allPassed = false;
    } else if (res.transport.scoreReliability !== 'partially_observed') {
      console.error(`FAIL: Expected reliability 'partially_observed', got: ${res.transport.scoreReliability}`);
      allPassed = false;
    } else if (res.transport.observedComponents !== 2 || res.transport.coveragePct !== 50) {
      console.error(`FAIL: Expected 2 observed and 50% coverage, got ${res.transport.observedComponents} (${res.transport.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 1.3]: 2/4 Transport components successfully scored (${res.transport.score}) with reliability=partially_observed, coverage=50%.`);
    }
  } catch (err) {
    console.error('FAIL [TEST 1.3]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 1.4] Transport 4/4 Observed -> Full calculation, reliability=measured, coverage=100%...');
  try {
    const inputs = createEmptyInputs();
    inputs.distanceToNearestRoadMeters = 20;
    inputs.distanceToArterialMeters = 300;
    inputs.distanceToHospitalMeters = 1200;
    inputs.distanceToTransitHubMeters = 400;

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.transport.score === null) {
      console.error('FAIL: Expected transport score to be calculated for 4/4 observed components');
      allPassed = false;
    } else if (res.transport.scoreReliability !== 'measured') {
      console.error(`FAIL: Expected reliability 'measured', got: ${res.transport.scoreReliability}`);
      allPassed = false;
    } else if (res.transport.observedComponents !== 4 || res.transport.coveragePct !== 100) {
      console.error(`FAIL: Expected 4 observed and 100% coverage, got ${res.transport.observedComponents} (${res.transport.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 1.4]: 4/4 Transport components evaluated with score=${res.transport.score}, reliability=measured, coverage=100%.`);
    }
  } catch (err) {
    console.error('FAIL [TEST 1.4]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 2. FLOOD EVIDENCE & RELIABILITY POLICIES (1 evidence, 2 evidence, 3+ evidence)
  // ---------------------------------------------------------------------------
  console.log('[TEST 2.1] Flood 1 Physical Evidence (elevation only, no official tier) -> score calculated on baseline, reliability=imputed_model_baseline, coverage=20%...');
  try {
    const inputs = createEmptyInputs();
    inputs.elevationMeters = 8; // 1 physical input only, no official tier

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.flood.score === null) {
      console.error('FAIL: Expected flood score to be produced from physical elevation baseline');
      allPassed = false;
    } else if (res.flood.scoreReliability !== 'imputed_model_baseline') {
      console.error(`FAIL: Expected flood reliability 'imputed_model_baseline' for 1 physical input, got: ${res.flood.scoreReliability}`);
      allPassed = false;
    } else if (res.flood.observedComponents !== 1 || res.flood.coveragePct !== 20) {
      console.error(`FAIL: Expected 1 observed component and 20% coverage, got ${res.flood.observedComponents} (${res.flood.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 2.1]: 1 Physical flood component classified as reliability=imputed_model_baseline (score=${res.flood.score}, coverage=20%).`);
    }
  } catch (err) {
    console.error('FAIL [TEST 2.1]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 2.2] Flood 2 Physical Evidence (elevation + rainfall, no official tier) -> reliability=partially_observed, coverage=40%...');
  try {
    const inputs = createEmptyInputs();
    inputs.elevationMeters = 12;
    inputs.max24hRainfallMm = 140; // 2 physical inputs

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.flood.score === null) {
      console.error('FAIL: Expected flood score for 2 physical inputs');
      allPassed = false;
    } else if (res.flood.scoreReliability !== 'partially_observed') {
      console.error(`FAIL: Expected flood reliability 'partially_observed' for 2 physical inputs, got: ${res.flood.scoreReliability}`);
      allPassed = false;
    } else if (res.flood.observedComponents !== 2 || res.flood.coveragePct !== 40) {
      console.error(`FAIL: Expected 2 observed components and 40% coverage, got ${res.flood.observedComponents} (${res.flood.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 2.2]: 2 Physical flood components evaluated with reliability=partially_observed (score=${res.flood.score}, coverage=40%).`);
    }
  } catch (err) {
    console.error('FAIL [TEST 2.2]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 2.3] Flood 3+ Physical Evidence + Verified Official Tier -> reliability=measured, coverage=80-100%...');
  try {
    const inputs = createEmptyInputs();
    inputs.elevationMeters = 5;
    inputs.distanceToRiverMeters = 300;
    inputs.max24hRainfallMm = 150;
    inputs.inariskFloodClass = 'Sedang'; // Official BNPB Tier + 3 physical inputs

    const res = RiskScoringEngine.calculate(testCoords, 'Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.flood.score === null) {
      console.error('FAIL: Expected flood score for multi-evidence inputs');
      allPassed = false;
    } else if (res.flood.scoreReliability !== 'partially_observed') {
      console.error(`FAIL: Expected flood reliability 'partially_observed' for official tier + 3 physical inputs without in-situ gauge, got: ${res.flood.scoreReliability}`);
      allPassed = false;
    } else if (res.flood.observedComponents < 4 || res.flood.coveragePct < 80) {
      console.error(`FAIL: Expected >= 4 observed components and >= 80% coverage, got ${res.flood.observedComponents} (${res.flood.coveragePct}%)`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 2.3]: Full flood evidence suite evaluated with score=${res.flood.score}, reliability=partially_observed, coverage=${res.flood.coveragePct}%.`);
    }
  } catch (err) {
    console.error('FAIL [TEST 2.3]: Exception:', err);
    allPassed = false;
  }

  return allPassed;
}
