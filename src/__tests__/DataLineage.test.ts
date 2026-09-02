import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';

export function runDataLineageTests(): boolean {
  console.log('=== TEST SUITE: DataLineage & Semantic Isolation ===');

  const coords = new Coordinates(-2.5934, 113.3421); // Tampelas, Central Kalimantan
  const evaluatedAt = new Date().toISOString();

  // Test 1: Raw value survives unchanged
  const rawPga = 0.024;
  const rawClay = 28.5;
  const { featureStore } = FeatureAssembler.assemble({
    coords,
    address: 'Tampelas, Kamipang, Katingan, Kalimantan Tengah',
    country: 'Indonesia',
    evaluatedAt,
    inarisk: { pgaMcegG: rawPga },
    soil: {
      phH2o: 5.2,
      phH2oRaw: 52,
      clayPercent: rawClay,
      sandPercent: 45.0,
      siltPercent: 26.5,
      bulkDensityCgCm3: 130,
      organicCarbonDgKg: 210,
      cecMmolcKg: 160,
      nitrogenCgKg: 180,
      coarseFragmentsPct: 0.5,
      spatialResolution: '250m',
      depthInterval: '0-30cm',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0',
      endpoint: 'https://rest.isric.org',
      isAvailable: true
    }
  });

  if (featureStore['seismic_bnpb_pga_mceg_g']?.numericValue === rawPga &&
      featureStore['soil.clay_pct']?.numericValue === rawClay) {
    console.log('✓ PASS: Raw physical values survive through FeatureAssembler without distortion');
  } else {
    console.error('✗ FAIL: Raw value distorted in FeatureStore');
    return false;
  }

  // Test 2: Null remains strictly null
  const nullInputs: RawPhysicalInputs = {
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
  };

  const emptyAssessment = RiskScoringEngine.calculate(
    coords,
    'Unknown Location',
    'Indonesia',
    'Residential',
    'Home Buyer',
    nullInputs
  );

  if (
    emptyAssessment.flood.score === null &&
    emptyAssessment.quake.score === null &&
    emptyAssessment.heat.score === null &&
    emptyAssessment.quake.soilSiteClass === null &&
    emptyAssessment.flood.potentialDepthRange === null &&
    emptyAssessment.heat.acCostIncreasePct === null
  ) {
    console.log('✓ PASS: Null physical inputs strictly yield null metrics without synthetic defaults');
  } else {
    console.error('✗ FAIL: Synthetic values fabricated on null inputs');
    return false;
  }

  // Test 3: Wrong-source fallback cannot populate a field (BMKG != USGS 10-year historical maximum)
  const bmkgOnlyInputs: RawPhysicalInputs = {
    ...nullInputs,
    maxHistoricalMag: null, // Historical catalog is null
    nearestEpicenterKm: 42.5 // Recent BMKG feed event
  };

  const bmkgAssessment = RiskScoringEngine.calculate(
    coords,
    'Tampelas',
    'Indonesia',
    'Residential',
    'Home Buyer',
    bmkgOnlyInputs
  );

  if (bmkgAssessment.quake.maxHistoricalMag === null) {
    console.log('✓ PASS: BMKG recent feed does not silently populate historical 10-year catalog maximum');
  } else {
    console.error('✗ FAIL: BMKG feed cross-polluted historical catalog field');
    return false;
  }

  // Test 4: Historical and recent metrics cannot cross-populate
  const meteoInputs: RawPhysicalInputs = {
    ...nullInputs,
    avgMaxTempC: null,
    forecastPeakTempC: 36.5,
    historicalPeakTempC: 38.2
  };

  const meteoAssessment = RiskScoringEngine.calculate(
    coords,
    'Tampelas',
    'Indonesia',
    'Residential',
    'Home Buyer',
    meteoInputs
  );

  if (meteoAssessment.heat.avgMaxTempC === null && meteoAssessment.heat.historicalPeakTempC === 38.2) {
    console.log('✓ PASS: Forecast peak temp is not silently renamed into average temperature');
  } else {
    console.error('✗ FAIL: Temperature metrics cross-polluted');
    return false;
  }

  // Test 5: 100 km cannot become 150 km in ReportMetricRegistry
  const partialQuakeResult = {
    ...emptyAssessment,
    quake: {
      ...emptyAssessment.quake,
      historicalQuakesCount150km: null,
      historicalQuakesCount100km: 5
    }
  };

  const metrics = ReportMetricRegistry.getMetricsForHazard('earthquake', partialQuakeResult, 'id');
  const metric150 = metrics.find(m => m.id === 'seismic_historical_quakes_150km');
  const metric100 = metrics.find(m => m.id === 'seismic_historical_quakes_100km');

  if (metric150?.value === null && metric100?.value === '5') {
    console.log('✓ PASS: 100km earthquake count never substitutes for 150km count');
  } else {
    console.error('✗ FAIL: 100km count cross-substituted into 150km metric');
    return false;
  }

  // Test 6: Model score cannot become physical measurement
  if (
    typeof emptyAssessment.overallScore !== 'string' &&
    emptyAssessment.flood.potentialDepthRange === null &&
    emptyAssessment.quake.estimatedPgaG === null
  ) {
    console.log('✓ PASS: Model scores and physical measurements maintain strict separation');
  } else {
    console.error('✗ FAIL: Model score masqueraded as physical measurement');
    return false;
  }

  console.log('=== DataLineage Tests Completed Successfully ===\n');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runDataLineageTests();
}
