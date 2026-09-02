import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

export function runSpatialDistanceSemanticsTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH: SPATIAL DISTANCE SEMANTICS TEST SUITE');
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
  // 1. FOUR SPATIAL STATES
  // ---------------------------------------------------------------------------
  console.log('[TEST 1.1] AVAILABLE_EXACT: Hospital found at 850m...');
  try {
    const obs = OverpassOsmClient.createBoundedObservation(850, 15000, 'RS Siloam', false);
    if (obs.state !== 'AVAILABLE_EXACT') {
      console.error(`FAIL: Expected state 'AVAILABLE_EXACT', got: ${obs.state}`);
      allPassed = false;
    } else if (obs.exactDistanceMeters !== 850) {
      console.error(`FAIL: Expected exactDistanceMeters 850, got: ${obs.exactDistanceMeters}`);
      allPassed = false;
    } else if (obs.relation !== 'exact') {
      console.error(`FAIL: Expected relation 'exact', got: ${obs.relation}`);
      allPassed = false;
    } else if (!obs.displayValue?.includes('850')) {
      console.error(`FAIL: Expected displayValue to contain '850', got: ${obs.displayValue}`);
      allPassed = false;
    } else {
      console.log('PASS [TEST 1.1]: AVAILABLE_EXACT correctly captures exact distance (850m) and relation=exact.');
    }
  } catch (err) {
    console.error('FAIL [TEST 1.1]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 1.2] AVAILABLE_BOUNDED / NODATA_SEARCH_SUCCESS: No hospital within 15km search radius...');
  try {
    const obs = OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15.0 km', false);
    if (obs.state !== 'AVAILABLE_BOUNDED') {
      console.error(`FAIL: Expected state 'AVAILABLE_BOUNDED', got: ${obs.state}`);
      allPassed = false;
    } else if (obs.exactDistanceMeters !== null) {
      console.error(`FAIL: Expected exactDistanceMeters null for bounded, got: ${obs.exactDistanceMeters}`);
      allPassed = false;
    } else if (obs.relation !== 'greater_than') {
      console.error(`FAIL: Expected relation 'greater_than', got: ${obs.relation}`);
      allPassed = false;
    } else if (obs.lowerBoundMeters !== 15000) {
      console.error(`FAIL: Expected lowerBoundMeters 15000, got: ${obs.lowerBoundMeters}`);
      allPassed = false;
    } else if (obs.displayValue !== '>15 km') {
      console.error(`FAIL: Expected displayValue '>15 km', got: ${obs.displayValue}`);
      allPassed = false;
    } else {
      console.log('PASS [TEST 1.2]: AVAILABLE_BOUNDED correctly stores lowerBoundMeters=15000, relation=greater_than, displayValue=>15 km.');
    }
  } catch (err) {
    console.error('FAIL [TEST 1.2]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 1.3] ERROR_OR_TIMEOUT: Provider failure must NOT display ">5 km" or ">15 km"...');
  try {
    const obs = OverpassOsmClient.createBoundedObservation(null, 15000, 'Data rumah sakit tidak dapat dimuat (Sumber OSM tidak merespon)', true);
    if (obs.state !== 'ERROR_OR_TIMEOUT') {
      console.error(`FAIL: Expected state 'ERROR_OR_TIMEOUT', got: ${obs.state}`);
      allPassed = false;
    } else if (obs.displayValue !== null) {
      console.error(`FAIL: Expected displayValue to be null for provider failure, got: ${obs.displayValue}`);
      allPassed = false;
    } else if (obs.lowerBoundMeters !== null) {
      console.error(`FAIL: Expected lowerBoundMeters null for provider failure, got: ${obs.lowerBoundMeters}`);
      allPassed = false;
    } else {
      console.log('PASS [TEST 1.3]: ERROR_OR_TIMEOUT strictly preserves error state and avoids fabricating bounded values.');
    }
  } catch (err) {
    console.error('FAIL [TEST 1.3]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 2. SCORING WITH BOUNDED DISTANCES (RURAL SITE / TAMPELAS EXAMPLE)
  // ---------------------------------------------------------------------------
  console.log('[TEST 2.1] Rural Site with Bounded Distances (Road: 1265m, Arterial: >10km, Hospital: >15km, Transit: >10km)...');
  try {
    const inputs = createEmptyInputs();
    inputs.distanceToNearestRoadMeters = 1265;
    inputs.nearestRoadName = 'Jalan Poros Desa';

    inputs.arterialBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
    inputs.hospitalBounded = OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15.0 km', false);
    inputs.transitBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
    inputs.fireStationBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);

    const res = RiskScoringEngine.calculate(testCoords, 'Rural Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.transport.score === null) {
      console.error('FAIL: Expected transport score to be calculated for full bounded observations');
      allPassed = false;
    } else if (res.transport.observedComponents !== 4 || res.transport.coveragePct !== 100) {
      console.error(`FAIL: Expected 4 observed components (100% coverage), got: ${res.transport.observedComponents} (${res.transport.coveragePct}%)`);
      allPassed = false;
    } else if (res.transport.score !== 46) {
      // 35*0.25 + 55*0.25 + 55*0.30 + 35*0.20 = 8.75 + 13.75 + 16.5 + 7 = 46
      console.error(`FAIL: Expected transport score 46, got: ${res.transport.score}`);
      allPassed = false;
    } else if (res.transport.level !== 'moderate') {
      console.error(`FAIL: Expected transport level 'moderate' for score 46, got: ${res.transport.level}`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 2.1]: Bounded observations successfully evaluated: score=${res.transport.score}, components=${res.transport.observedComponents}/4, coverage=${res.transport.coveragePct}%.`);
    }
  } catch (err) {
    console.error('FAIL [TEST 2.1]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 3. FLOOD WATERWAY ABSENCE (REAL PHYSICAL EVIDENCE)
  // ---------------------------------------------------------------------------
  console.log('[TEST 3.1] Flood Waterway Bounded (>5km) counts as valid physical observation...');
  try {
    const inputs = createEmptyInputs();
    inputs.elevationMeters = 25;
    inputs.max24hRainfallMm = 120;
    inputs.waterwayBounded = OverpassOsmClient.createBoundedObservation(null, 5000, 'Tidak terdeteksi dalam radius 5.0 km', false);

    const res = RiskScoringEngine.calculate(testCoords, 'Flood Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);

    if (res.flood.score === null) {
      console.error('FAIL: Expected flood score for valid physical inputs with bounded waterway');
      allPassed = false;
    } else if (res.flood.observedComponents !== 3 || res.flood.coveragePct !== 60) {
      // 3 physical inputs (elevation, rainfall, bounded waterway) = 3/5 components (60%)
      console.error(`FAIL: Expected 3 observed components (60% coverage), got: ${res.flood.observedComponents} (${res.flood.coveragePct}%)`);
      allPassed = false;
    } else if (!res.flood.causeId.includes('>5 km')) {
      console.error(`FAIL: Expected flood cause to mention '>5 km', got: ${res.flood.causeId}`);
      allPassed = false;
    } else {
      console.log(`PASS [TEST 3.1]: Waterway >5km correctly counted as observed physical component (coverage=${res.flood.coveragePct}%, score=${res.flood.score}).`);
    }
  } catch (err) {
    console.error('FAIL [TEST 3.1]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 4. REPORT METRICS DISPLAY FORMATTING
  // ---------------------------------------------------------------------------
  console.log('[TEST 4.1] ReportMetricRegistry formatting: Bounded metrics display ">15 km" with status "available"...');
  try {
    const inputs = createEmptyInputs();
    inputs.distanceToNearestRoadMeters = 1265;
    inputs.arterialBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
    inputs.hospitalBounded = OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15.0 km', false);
    inputs.transitBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
    inputs.fireStationBounded = OverpassOsmClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10.0 km', false);
    inputs.waterwayBounded = OverpassOsmClient.createBoundedObservation(null, 5000, 'Tidak terdeteksi dalam radius 5.0 km', false);

    const res = RiskScoringEngine.calculate(testCoords, 'Report Metric Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);
    const transportMetrics = ReportMetricRegistry.getMetricsForCategory('transport', res, false);
    const floodMetrics = ReportMetricRegistry.getMetricsForCategory('flood', res, false);

    const hospMetric = transportMetrics.find(m => m.id === 'transport_healthcare_facility');
    const arterialMetric = transportMetrics.find(m => m.id === 'transport_arterial_corridor');
    const transitMetric = transportMetrics.find(m => m.id === 'transport_transit_hub');
    const riverMetric = floodMetrics.find(m => m.id === 'flood_waterway_distance');

    if (!hospMetric || hospMetric.value !== '>15 km' || (hospMetric.status !== 'available' && hospMetric.status !== 'bounded')) {
      console.error(`FAIL: Expected hospital metric value '>15 km' with status 'available' or 'bounded', got:`, hospMetric);
      allPassed = false;
    } else if (!arterialMetric || arterialMetric.value !== '>10 km' || (arterialMetric.status !== 'available' && arterialMetric.status !== 'bounded')) {
      console.error(`FAIL: Expected arterial metric value '>10 km' with status 'available' or 'bounded', got:`, arterialMetric);
      allPassed = false;
    } else if (!transitMetric || transitMetric.value !== '>10 km' || (transitMetric.status !== 'available' && transitMetric.status !== 'bounded')) {
      console.error(`FAIL: Expected transit metric value '>10 km' with status 'available' or 'bounded', got:`, transitMetric);
      allPassed = false;
    } else if (!riverMetric || riverMetric.value !== '>5 km' || (riverMetric.status !== 'available' && riverMetric.status !== 'bounded')) {
      console.error(`FAIL: Expected river metric value '>5 km' with status 'available' or 'bounded', got:`, riverMetric);
      allPassed = false;
    } else {
      console.log('PASS [TEST 4.1]: ReportMetricRegistry correctly displays ">15 km", ">10 km", ">5 km" as status="available" or "bounded".');
    }
  } catch (err) {
    console.error('FAIL [TEST 4.1]: Exception:', err);
    allPassed = false;
  }

  console.log('[TEST 4.2] ReportMetricRegistry formatting: Provider error displays status "nodata" or "error" (never ">15 km")...');
  try {
    const inputs = createEmptyInputs();
    inputs.hospitalBounded = OverpassOsmClient.createBoundedObservation(null, 15000, 'Data rumah sakit tidak dapat dimuat (Sumber OSM tidak merespon)', true);

    const res = RiskScoringEngine.calculate(testCoords, 'Error Test Site', 'Indonesia', 'Residential', 'Home Buyer', inputs);
    const transportMetrics = ReportMetricRegistry.getMetricsForCategory('transport', res, false);
    const hospMetric = transportMetrics.find(m => m.id === 'transport_healthcare_facility');

    if (!hospMetric || hospMetric.value !== null || (hospMetric.status !== 'nodata' && hospMetric.status !== 'error')) {
      console.error(`FAIL: Expected hospital error metric value null with status 'nodata' or 'error', got:`, hospMetric);
      allPassed = false;
    } else {
      console.log('PASS [TEST 4.2]: Provider failure correctly sets status="nodata" / "error" and value=null without fabricating bounded strings.');
    }
  } catch (err) {
    console.error('FAIL [TEST 4.2]: Exception:', err);
    allPassed = false;
  }

  return allPassed;
}
