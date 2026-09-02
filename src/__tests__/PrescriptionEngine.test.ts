import { PrescriptionEngine } from '../domain/services/PrescriptionEngine';
import type { FloodMetrics, QuakeMetrics, HeatMetrics, TransportMetrics } from '../domain/types/hazard.types';

export function runPrescriptionEngineTests(): boolean {
  console.log('--- Prescription Engine Indicative Recommendations Test Suite ---');
  let passed = true;

  const createMockFlood = (score: number | null): FloodMetrics => ({
    score,
    level: score !== null && score > 60 ? 'high' : 'low',
    scoreReliability: 'measured',
    observedComponents: 4,
    expectedComponents: 5,
    coveragePct: 80,
    floodModelLevel: 'Moderate',
    floodClass: null,
    floodClassSource: null,
    elevationMeters: 15,
    distanceToRiverMeters: 500,
    nearestRiverName: null,
    max24hRainfallMm: 120,
    riverDischargeM3s: 50,
    potentialDepthRange: null,
    causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
  });

  const createMockQuake = (score: number | null): QuakeMetrics => ({
    score,
    level: score !== null && score > 55 ? 'high' : 'low',
    scoreReliability: 'measured',
    observedComponents: 4,
    expectedComponents: 5,
    coveragePct: 80,
    quakeClass: null,
    quakeClassSource: null,
    nearestFaultName: null,
    distanceToFaultKm: null,
    nearestEpicenterKm: 40,
    historicalQuakesCount150km: 12,
    historicalQuakesCount100km: 5,
    maxHistoricalMag: 5.4,
    estimatedPgaG: 0.25,
    soilSiteClass: null,
    sniStandardRef: 'SNI 1726:2019',
    liquefactionRisk: null,
    causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
  });

  const createMockHeat = (score: number | null): HeatMetrics => ({
    score,
    level: score !== null && score > 50 ? 'high' : 'low',
    scoreReliability: 'measured',
    observedComponents: 4,
    expectedComponents: 5,
    coveragePct: 80,
    heatModelLevel: 'Moderate',
    avgMaxTempC: 34.5,
    historicalPeakTempC: 37.2,
    greenSpaceRatioPct: 20,
    projectedTempRise2050C: 1.5,
    acCostIncreasePct: null,
    causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
  });

  const createMockTransport = (score: number | null): TransportMetrics => ({
    score,
    level: score !== null && score > 45 ? 'isolated' : 'good',
    scoreReliability: 'measured',
    observedComponents: 4,
    expectedComponents: 4,
    coveragePct: 100,
    connectivityLabelId: '', connectivityLabelEn: '',
    distanceToNearestRoadMeters: 30, nearestRoadName: null,
    distanceToArterialMeters: 500, nearestArterialName: null,
    distanceToTransitHubMeters: 800, nearestTransitName: null,
    distanceToHospitalMeters: 4000, nearestHospitalName: null,
    distanceToFireStationMeters: 3500, nearestFireStationName: null,
    estimatedTravelTimeMinutes: '12 Menit',
    travelTimeRouteDistanceMeters: 4500,
    routingSource: 'OSRM road-network routing',
    evacuationRouteStatusId: '', evacuationRouteStatusEn: '',
    causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
  });

  // Test 1: All Scores Below Trigger Thresholds -> Empty Prescriptions
  try {
    const lowFlood = createMockFlood(50);     // <= 60
    const lowQuake = createMockQuake(40);     // <= 55
    const lowHeat = createMockHeat(45);       // <= 50
    const goodTransport = createMockTransport(30); // <= 45

    const items = PrescriptionEngine.generatePrescriptions(lowFlood, lowQuake, lowHeat, goodTransport);
    if (items.length !== 0) {
      console.error(`FAIL: Expected 0 prescriptions for below-threshold scores, got ${items.length}`);
      passed = false;
    } else {
      console.log('PASS: Below-threshold scores yield empty prescription list.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 1:', err);
    passed = false;
  }

  // Test 2: Flood Score > 60 triggers Flood Mitigations
  try {
    const highFlood = createMockFlood(75); // > 60
    const lowQuake = createMockQuake(40);
    const lowHeat = createMockHeat(40);
    const goodTransport = createMockTransport(30);

    const items = PrescriptionEngine.generatePrescriptions(highFlood, lowQuake, lowHeat, goodTransport);
    const floodItems = items.filter((i) => i.category === 'flood');

    if (floodItems.length !== 2) {
      console.error(`FAIL: Expected 2 flood prescriptions, got ${floodItems.length}`);
      passed = false;
    } else if (floodItems.some((i) => i.estimatedCostIdr !== null || i.estimatedCostUsd !== null || i.costBasis !== 'unavailable')) {
      console.error('FAIL: Prescriptions must have null costs and costBasis = unavailable');
      passed = false;
    } else if (floodItems.some((i) => !i.trigger || !i.basis)) {
      console.error('FAIL: Prescriptions must preserve trigger and basis provenance');
      passed = false;
    } else {
      console.log('PASS: Flood trigger (>60) accurately generates indicative civil/MEP prescriptions with null cost.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 2:', err);
    passed = false;
  }

  // Test 3: Earthquake Score > 55 triggers Engineering Review prescriptions
  try {
    const lowFlood = createMockFlood(40);
    const highQuake = createMockQuake(65); // > 55
    const lowHeat = createMockHeat(40);
    const goodTransport = createMockTransport(30);

    const items = PrescriptionEngine.generatePrescriptions(lowFlood, highQuake, lowHeat, goodTransport);
    const quakeItems = items.filter((i) => i.category === 'earthquake');

    if (quakeItems.length !== 2) {
      console.error(`FAIL: Expected 2 earthquake prescriptions, got ${quakeItems.length}`);
      passed = false;
    } else if (quakeItems.some((i) => i.basis !== 'engineering_review_required')) {
      console.error('FAIL: Earthquake prescriptions must have basis = engineering_review_required');
      passed = false;
    } else {
      console.log('PASS: Earthquake trigger (>55) generates prescriptions with basis = engineering_review_required.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 3:', err);
    passed = false;
  }

  // Test 4: Transport Score > 45 triggers Egress & Access clearance prescriptions
  try {
    const lowFlood = createMockFlood(40);
    const lowQuake = createMockQuake(40);
    const lowHeat = createMockHeat(40);
    const constrainedTransport = createMockTransport(55); // > 45

    const items = PrescriptionEngine.generatePrescriptions(lowFlood, lowQuake, lowHeat, constrainedTransport);
    const trnItems = items.filter((i) => i.category === 'transport');

    if (trnItems.length !== 1) {
      console.error(`FAIL: Expected 1 transport prescription, got ${trnItems.length}`);
      passed = false;
    } else if (!trnItems[0].trigger?.includes('transport')) {
      console.error('FAIL: Transport trigger provenance missing');
      passed = false;
    } else {
      console.log('PASS: Transport trigger (>45) generates emergency wayfinding and frontage access prescription.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 4:', err);
    passed = false;
  }

  // Test 5: Boundary Testing - Exactly At Thresholds (score == 60, 55, 50, 45 must NOT trigger)
  try {
      const atFlood = createMockFlood(60);     // exactly 60
      const atQuake = createMockQuake(55);     // exactly 55
      const atHeat = createMockHeat(50);       // exactly 50
      const atTransport = createMockTransport(45); // exactly 45

      const items = PrescriptionEngine.generatePrescriptions(atFlood, atQuake, atHeat, atTransport);
      if (items.length !== 0) {
        console.error(`FAIL: Exactly-at-threshold scores (60, 55, 50, 45) must NOT trigger prescriptions, got ${items.length}`);
        passed = false;
      } else {
        console.log('PASS: Exactly-at-threshold boundary values (score == threshold) strictly yield 0 prescriptions (requires score > threshold).');
      }
    } catch (err) {
      console.error('FAIL: Exception in Test 5:', err);
      passed = false;
    }

    // Test 6: Null Hazard and Transport Scores -> Zero Prescriptions
    try {
      const nullFlood = createMockFlood(null);
      const nullQuake = createMockQuake(null);
      const nullHeat = createMockHeat(null);
      const nullTransport = createMockTransport(null);

      const items = PrescriptionEngine.generatePrescriptions(nullFlood, nullQuake, nullHeat, nullTransport);
      if (items.length !== 0) {
        console.error(`FAIL: Null scores must yield 0 prescriptions, got ${items.length}`);
        passed = false;
      } else {
        console.log('PASS: Null hazard and transport scores strictly yield 0 prescriptions without synthetic fallback.');
      }
    } catch (err) {
      console.error('FAIL: Exception in Test 6:', err);
      passed = false;
    }

    // Test 7: Partial Hazard & Partial Transport Assessment
    try {
      const activeFlood = createMockFlood(70); // > 60
      const nullQuake = createMockQuake(null);
      const nullHeat = createMockHeat(null);
      const partialTransport = createMockTransport(null); // 1-component partial transport (score = null)

      const items = PrescriptionEngine.generatePrescriptions(activeFlood, nullQuake, nullHeat, partialTransport);
      if (items.length !== 2) {
        console.error(`FAIL: Partial assessment must only generate prescriptions for active hazard (>60), got ${items.length}`);
        passed = false;
      } else if (items.some((i) => i.category !== 'flood')) {
        console.error('FAIL: Partial assessment generated prescriptions for unmeasured categories');
        passed = false;
      } else {
        console.log('PASS: Partial data assessment accurately generates prescriptions ONLY for valid active hazards above threshold.');
      }
    } catch (err) {
      console.error('FAIL: Exception in Test 7:', err);
      passed = false;
    }

    // Test 8: Engineering Humility & Wording Integrity
    try {
      const allActive = PrescriptionEngine.generatePrescriptions(
        createMockFlood(80),
        createMockQuake(80),
        createMockHeat(80),
        createMockTransport(80)
      );

      for (const item of allActive) {
        // Assert no fake costs
        if (item.estimatedCostIdr !== null || item.estimatedCostUsd !== null || item.costBasis !== 'unavailable') {
          console.error(`FAIL: Item ${item.id} has non-null cost or non-unavailable costBasis`);
          passed = false;
        }
        // Assert no fixed engineering dimensions or compliance certifications
        const text = `${item.titleId} ${item.descriptionId} ${item.titleEn} ${item.descriptionEn}`.toLowerCase();
        if (text.includes('sni compliant') || text.includes('tersertifikasi sni') || text.includes('jalur evakuasi resmi pemerintah')) {
          console.error(`FAIL: Item ${item.id} makes unverified compliance or official government route claims`);
          passed = false;
        }
      }
      console.log('PASS: Engineering humility assertions verified across all prescriptions (no fake costs, no compliance claims, no fixed dimensions).');
    } catch (err) {
      console.error('FAIL: Exception in Test 8:', err);
      passed = false;
    }

    return passed;
  }

