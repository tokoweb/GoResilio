import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import type { SoilGridsData, AirQualityData, WorldPopData, NasaFirmsData } from '../domain/types/hazard.types';

export function runFeatureStoreIntegrityTests() {
  console.log('=== TEST SUITE: FeatureStoreIntegrity ===');

  const coords = new Coordinates(-2.5934, 113.3421); // Tampelas, Central Kalimantan
  const evaluatedAt = new Date().toISOString();

  const mockSoil: SoilGridsData = {
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
  };

  const mockAq: AirQualityData = {
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
    periodStart: evaluatedAt,
    periodEnd: evaluatedAt,
    source: 'Open-Meteo Air Quality',
    endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    isAvailable: true
  };

  const mockPop: WorldPopData = {
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
  };

  const mockFirms: NasaFirmsData = {
    activeHotspots24h: 1,
    activeHotspots7d: 3,
    activeHotspots30d: 8,
    nearestHotspotKm: 14.2,
    maxFrpMw: 24.5,
    meanFrpMw: 16.2,
    latestDetectionTime: evaluatedAt,
    satelliteSensor: 'VIIRS',
    searchRadiusKm: 50,
    source: 'NASA FIRMS',
    endpoint: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
    isAvailable: true
  };

  const { features, featureStore } = FeatureAssembler.assemble({
    coords,
    address: 'Tampelas, Kamipang, Katingan, Kalimantan Tengah',
    country: 'Indonesia',
    evaluatedAt,
    soil: mockSoil,
    airQuality: mockAq,
    population: mockPop,
    firms: mockFirms
  });

  // Test 1: Feature Keys Presence
  const requiredKeys = [
    'soil.phh2o',
    'soil.clay_pct',
    'soil.sand_pct',
    'soil.silt_pct',
    'soil.bulk_density',
    'soil.organic_carbon',
    'soil.cec',
    'soil.nitrogen',
    'soil.coarse_fragments',
    'air_quality.pm25',
    'air_quality.pm10',
    'air_quality.max_pm25_24h',
    'air_quality.mean_pm25_24h',
    'air_quality.max_aqi_24h',
    'exposure.population_1km',
    'exposure.population_density_1km',
    'exposure.population_5km',
    'exposure.population_density_5km',
    'fire.active_hotspots_24h',
    'fire.active_hotspots_7d',
    'fire.active_hotspots_30d',
    'fire.nearest_hotspot_km',
    'fire.max_frp',
    'fire.mean_frp'
  ];

  let missingCount = 0;
  for (const k of requiredKeys) {
    if (!featureStore[k]) {
      console.error(`✗ Missing canonical key in featureStore: ${k}`);
      missingCount++;
    }
  }

  if (missingCount === 0) {
    console.log(`✓ PASS: All ${requiredKeys.length} canonical feature keys registered in FeatureStore`);
  } else {
    console.error(`✗ FAIL: ${missingCount} keys missing`);
  }

  // Test 2: Pure Numeric Values
  const clayFeature = featureStore['soil.clay_pct'];
  const pm25MaxFeature = featureStore['air_quality.max_pm25_24h'];
  const pop1kmFeature = featureStore['exposure.population_1km'];
  const fireDistFeature = featureStore['fire.nearest_hotspot_km'];

  if (
    typeof clayFeature?.numericValue === 'number' &&
    typeof pm25MaxFeature?.numericValue === 'number' &&
    typeof pop1kmFeature?.numericValue === 'number' &&
    typeof fireDistFeature?.numericValue === 'number'
  ) {
    console.log('✓ PASS: All continuous features stored as pure numeric types');
  } else {
    console.error('✗ FAIL: Non-numeric values in numeric feature slots');
  }

  // Test 3: Provenance Preservation
  if (
    clayFeature.source === 'ISRIC SoilGrids' &&
    clayFeature.depthInterval === '0-30cm' &&
    pm25MaxFeature.isDerived === true &&
    pop1kmFeature.bufferRadiusMeters === 1000 &&
    fireDistFeature.isDerived === true
  ) {
    console.log('✓ PASS: Provenance, depth intervals, buffer radius, and derived flags preserved');
  } else {
    console.error('✗ FAIL: Provenance metadata missing');
  }

  console.log('=== FeatureStoreIntegrity Tests Completed ===\n');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runFeatureStoreIntegrityTests();
}
