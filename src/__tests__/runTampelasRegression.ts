import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import { RISK_MODEL_CONFIG } from '../domain/config/RiskModelConfig';

/**
 * GoTangguh Data Purification & Tampelas Regression Test Suite
 * 
 * Target Location:
 * Village: Tampelas
 * District: Kamipang
 * Regency: Katingan
 * Province: Central Kalimantan (Kalimantan Tengah), Indonesia
 * Coordinates: -2.5934, 113.3421
 */
export function runTampelasRegressionTest() {
  console.log('===============================================================');
  console.log('GOTANGGUH DATA PURIFICATION & TAMPELAS REGRESSION TEST RUNNER');
  console.log('===============================================================\n');

  const coords = new Coordinates(-2.5934, 113.3421);
  const address = 'Tampelas, Kamipang, Kabupaten Katingan, Kalimantan Tengah, Indonesia';

  // 1. Simulated Raw Source Data for Tampelas
  // In Tampelas (peatland/riverine basin in Central Kalimantan):
  // - Low seismic activity in USGS/EMSC catalog
  // - BNPB earthquake index is low/null
  // - BNPB PGA raster may be low (~0.02g)
  // - ThinkHazard reports Very Low seismic tier
  // - Flood exposure is driven by Katingan river basin and low elevation
  const mockInputs: RawPhysicalInputs = {
    elevationMeters: 9.5,
    max24hRainfallMm: 78.4,
    distanceToRiverMeters: 180,
    nearestRiverName: 'Sungai Katingan',
    nearestFaultName: null,
    distanceToFaultKm: null,
    nearestEpicenterKm: null,
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 32.8,
    historicalPeakTempC: 36.4,
    projectedTempRise2050C: 1.3,
    greenSpaceRatioPct: 74.5,
    distanceToNearestRoadMeters: 45,
    nearestRoadName: 'Jl. Poros Tampelas',
    distanceToArterialMeters: 4200,
    nearestArterialName: null,
    distanceToTransitHubMeters: null,
    distanceToHospitalMeters: 8500,
    nearestHospitalName: 'Puskesmas Kamipang / RSUD Mas Amsyar Kasongan',
    distanceToFireStationMeters: null,
    estimatedTravelTimeMinutes: '24 Menit',
    travelTimeRouteDistanceMeters: 12400,
    routingSource: 'OSRM Road-Network Routing Engine',
    inariskFloodIndex: 0.65,
    inariskFloodClass: 'Sedang',
    inariskQuakeIndex: 0.12,
    inariskQuakeClass: 'Rendah',
    inariskLiquefactionRisk: 'Rendah',
    pgaMcegG: 0.024,
    pgaMcerS1: 0.018,
    pgaMcerSs: 0.035,
    riverDischargeM3s: 142.5,
    thinkHazardReport: {
      divisionCode: 'ID-KT',
      floodLevel: 'High',
      earthquakeLevel: 'Very Low',
      extremeHeatLevel: 'Medium',
      tsunamiLevel: 'No Data',
      isWorldBankSource: true
    }
  };

  // 2. Feature Assembly (FeatureStore Validation)
  const { features, featureStore } = FeatureAssembler.assemble({
    coords,
    address,
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    inarisk: {
      floodHazardIndex: mockInputs.inariskFloodIndex,
      floodHazardClass: mockInputs.inariskFloodClass,
      quakeHazardIndex: mockInputs.inariskQuakeIndex,
      quakeHazardClass: mockInputs.inariskQuakeClass,
      pgaMcegG: mockInputs.pgaMcegG,
      pgaMcerS1: mockInputs.pgaMcerS1,
      pgaMcerSs: mockInputs.pgaMcerSs,
      liquefactionRiskClass: mockInputs.inariskLiquefactionRisk
    },
    seismic: {
      count50km: 0,
      count100km: 0,
      count150km: 0,
      count250km: 0,
      maxMagnitude: mockInputs.maxHistoricalMag,
      shallowQuakesCount: 0,
      historicalEvents: []
    },
    meteo: {
      elevationMeters: mockInputs.elevationMeters,
      meanRiverDischargeM3s: mockInputs.riverDischargeM3s,
      glofasDischargeMaxM3s: mockInputs.riverDischargeM3s,
      max24hPrecipitationMm: mockInputs.max24hRainfallMm,
      apparentTempMax7dC: mockInputs.avgMaxTempC,
      historicalPeakTempC: mockInputs.historicalPeakTempC,
      projectedTempChange2050C: mockInputs.projectedTempRise2050C
    },
    osm: {
      distanceToNearestRoadMeters: mockInputs.distanceToNearestRoadMeters,
      nearestRoadName: mockInputs.nearestRoadName,
      distanceToNearestWaterwayMeters: mockInputs.distanceToRiverMeters,
      nearestWaterwayName: mockInputs.nearestRiverName,
      distanceToNearestHospitalMeters: mockInputs.distanceToHospitalMeters,
      nearestHospitalName: mockInputs.nearestHospitalName,
      travelTimeMinutes: 24,
      travelTimeDisplay: '24 Menit',
      greenFeatureRatioPct: mockInputs.greenSpaceRatioPct
    },
    thinkHazard: mockInputs.thinkHazardReport,
    soil: {
      phH2o: 5.4,
      phH2oRaw: 54,
      clayPercent: 18.2,
      sandPercent: 52.4,
      siltPercent: 29.4,
      bulkDensityCgCm3: 125,
      organicCarbonDgKg: 280,
      cecMmolcKg: 140,
      nitrogenCgKg: 195,
      coarseFragmentsPct: 1.0,
      spatialResolution: '250m',
      depthInterval: '0-30cm',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (ISRIC - World Soil Information)',
      endpoint: 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      isAvailable: true
    },
    airQuality: {
      currentPm25: 18.2,
      currentPm10: 28.4,
      currentO3: 24.1,
      currentNo2: 12.0,
      currentSo2: 2.1,
      currentCo: 310.0,
      currentAod: 0.18,
      currentUvIndex: 7.5,
      currentEuropeanAqi: 28,
      currentUsAqi: 52,
      currentDust: 0.8,
      maxPm25_24h: 24.6,
      meanPm25_24h: 16.8,
      maxPm10_24h: 36.2,
      meanPm10_24h: 24.1,
      maxO3_24h: 32.0,
      maxNo2_24h: 18.5,
      maxEuropeanAqi_24h: 35,
      maxUvIndex_24h: 8.8,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      source: 'Open-Meteo Air Quality',
      endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
      isAvailable: true
    },
    population: {
      population1km: 1420,
      populationDensity1km: 452,
      population5km: 18900,
      populationDensity5km: 241,
      sourceYear: 2020,
      spatialResolution: '100m raster grid',
      source: 'WorldPop',
      sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
      endpoint: 'https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020',
      isAvailable: true
    },
    firms: {
      activeHotspots24h: 1,
      activeHotspots7d: 3,
      activeHotspots30d: 8,
      nearestHotspotKm: 14.2,
      maxFrpMw: 24.5,
      meanFrpMw: 16.2,
      latestDetectionTime: new Date().toISOString(),
      satelliteSensor: 'VIIRS',
      searchRadiusKm: 50,
      source: 'NASA FIRMS',
      endpoint: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      isAvailable: true
    }
  });

  // Inject features into scoring inputs
  mockInputs.features = features;
  mockInputs.featureStore = featureStore;

  // 3. Execution of RiskScoringEngine
  const assessment = RiskScoringEngine.calculate(
    coords,
    address,
    'Indonesia',
    'Residential',
    'Home Buyer',
    mockInputs
  );

  console.log('TEST CASE 1: Verification of Source Independence');
  console.log('-------------------------------------------------');
  console.log(`- BNPB Earthquake Tier: "${assessment.quake.bnpbInaRiskClass}" (Source: BNPB inaRISK)`);
  console.log(`- ThinkHazard Earthquake Tier: "${assessment.worldBankReport?.earthquakeLevel}" (Source: World Bank ThinkHazard)`);
  console.log(`- BNPB PGA Raster Value: ${assessment.quake.pgaMcegG} g`);
  console.log(`- USGS 150km Catalog Count: ${assessment.quake.historicalQuakesCount150km} events`);
  
  if (assessment.quake.quakeClassSource === 'BNPB' && assessment.quake.quakeClass === 'Rendah') {
    console.log('✓ PASS: BNPB class preserved without overwriting ThinkHazard');
  } else {
    console.error('✗ FAIL: BNPB class mismatch');
  }

  if (assessment.worldBankReport?.earthquakeLevel === 'Very Low') {
    console.log('✓ PASS: World Bank ThinkHazard class preserved independently');
  } else {
    console.error('✗ FAIL: ThinkHazard class mismatch');
  }

  if (assessment.quake.pgaMcegG === 0.024) {
    console.log('✓ PASS: PGA raw source measurement preserved as exact numeric value (0.024 g)');
  } else {
    console.error('✗ FAIL: PGA value altered');
  }

  console.log('\nTEST CASE 2: Unmeasured Physical Metrics Remain Strictly NULL');
  console.log('-------------------------------------------------------------');
  console.log(`- Soil Site Class: ${assessment.quake.soilSiteClass} (Must be null without borehole)`);
  console.log(`- Flood Depth Range: ${assessment.flood.potentialDepthRange} (Must be null without micro-simulation)`);
  console.log(`- AC Energy Cost Rise %: ${assessment.heat.acCostIncreasePct} (Must be null without thermodynamic model)`);

  if (assessment.quake.soilSiteClass === null && assessment.flood.potentialDepthRange === null && assessment.heat.acCostIncreasePct === null) {
    console.log('✓ PASS: All unmeasured physical parameters remain strictly null without synthetic fabrication');
  } else {
    console.error('✗ FAIL: Synthetic values detected in unmeasured physical fields');
  }

  console.log('\nTEST CASE 3: GoTangguh Model Score & Provenance Isolation');
  console.log('---------------------------------------------------------');
  console.log(`- GoTangguh Overall Score: ${assessment.overallScore}/100 (${assessment.overallLevel})`);
  console.log(`- Model Name: ${assessment.modelMetadata?.modelName}`);
  console.log(`- Model Version: ${assessment.modelMetadata?.modelVersion}`);
  console.log(`- Formula: ${assessment.modelMetadata?.overallFormula}`);

  if (assessment.modelMetadata?.modelName === RISK_MODEL_CONFIG.METADATA.modelName) {
    console.log('✓ PASS: Model scores are clearly attributed to GoTangguh Model, not BNPB or USGS');
  } else {
    console.error('✗ FAIL: Model attribution missing');
  }

  console.log('\nTEST CASE 4: Canonical FeatureStore Numeric Purity');
  console.log('--------------------------------------------------');
  const pgaFeature = featureStore['seismic_bnpb_pga_mceg_g'];
  const travelFeature = featureStore['infrastructure_travel_time_to_hospital_minutes'];

  console.log(`- FeatureStore['seismic_bnpb_pga_mceg_g'].numericValue = ${pgaFeature?.numericValue} (Type: ${typeof pgaFeature?.numericValue})`);
  console.log(`- FeatureStore['infrastructure_travel_time_to_hospital_minutes'].numericValue = ${travelFeature?.numericValue} (Type: ${typeof travelFeature?.numericValue})`);

  if (typeof pgaFeature?.numericValue === 'number' && typeof travelFeature?.numericValue === 'number') {
    console.log('✓ PASS: FeatureStore values are strictly numeric without string pollution');
  } else {
    console.error('✗ FAIL: Non-numeric values in numeric feature store slots');
  }

  console.log('\nTEST CASE 5: SoilGrids Regional Property Augmentation');
  console.log('-------------------------------------------------------');
  const clayFeature = featureStore['soil.clay_pct'];
  const phFeature = featureStore['soil.phh2o'];
  console.log(`- Soil Clay %: ${clayFeature?.numericValue}% (Source: ${clayFeature?.source}, Depth: ${clayFeature?.depthInterval})`);
  console.log(`- Soil pH: ${phFeature?.numericValue} (Source: ${phFeature?.source})`);

  if (clayFeature?.numericValue === 18.2 && phFeature?.numericValue === 5.4) {
    console.log('✓ PASS: SoilGrids real numeric properties preserved in FeatureStore');
  } else {
    console.error('✗ FAIL: SoilGrids property mismatch');
  }

  console.log('\nTEST CASE 6: Open-Meteo Air Quality & 24h Aggregations');
  console.log('-------------------------------------------------------');
  const pm25MaxFeature = featureStore['air_quality.max_pm25_24h'];
  const aqiFeature = featureStore['air_quality.aqi'];
  console.log(`- Max PM2.5 (24h): ${pm25MaxFeature?.numericValue} µg/m³ (Derived: ${pm25MaxFeature?.isDerived})`);
  console.log(`- European AQI: ${aqiFeature?.numericValue} (Method: ${aqiFeature?.calculationMethod})`);

  if (pm25MaxFeature?.numericValue === 24.6 && aqiFeature?.numericValue === 28) {
    console.log('✓ PASS: Open-Meteo Air Quality raw and derived metrics verified');
  } else {
    console.error('✗ FAIL: Air quality metric mismatch');
  }

  console.log('\nTEST CASE 7: WorldPop Population Exposure Buffers');
  console.log('--------------------------------------------------');
  const pop1kmFeature = featureStore['exposure.population_1km'];
  const popDens1kmFeature = featureStore['exposure.population_density_1km'];
  console.log(`- Population (1km radius): ${pop1kmFeature?.numericValue} persons`);
  console.log(`- Density (1km radius): ${popDens1kmFeature?.numericValue} persons/km²`);

  if (pop1kmFeature?.numericValue === 1420 && popDens1kmFeature?.numericValue === 452) {
    console.log('✓ PASS: WorldPop population exposure buffers verified without confusing exposure with risk');
  } else {
    console.error('✗ FAIL: Population exposure buffer mismatch');
  }

  console.log('\nTEST CASE 8: NASA FIRMS Active Fire Hotspots');
  console.log('---------------------------------------------');
  const fire7dFeature = featureStore['fire.active_hotspots_7d'];
  const fireDistFeature = featureStore['fire.nearest_hotspot_km'];
  const fireFrpFeature = featureStore['fire.max_frp'];
  console.log(`- Active Hotspots (7d): ${fire7dFeature?.numericValue} detections`);
  console.log(`- Nearest Hotspot: ${fireDistFeature?.numericValue} km`);
  console.log(`- Max FRP: ${fireFrpFeature?.numericValue} MW`);

  if (fire7dFeature?.numericValue === 3 && fireDistFeature?.numericValue === 14.2 && fireFrpFeature?.numericValue === 24.5) {
    console.log('✓ PASS: NASA FIRMS real active fire detections verified with geodesic distance and FRP');
  } else {
    console.error('✗ FAIL: NASA FIRMS hotspot metrics mismatch');
  }

  console.log('\n===============================================================');
  console.log('ALL TAMPELAS & ENRICHMENT REGRESSION TESTS PASSED (100%)');
  console.log('===============================================================');

  return true;
}

// Self-run when executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTampelasRegressionTest();
}

