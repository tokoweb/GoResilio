import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import {
  TransportEvidenceAdapter,
  TransportAdapterInput
} from '../domain/services/TransportEvidenceAdapter';
import type {
  NormalizedTransportEvidence,
  NormalizedTransportComponent,
  NormalizedRouteEvidence
} from '../domain/types/transport.types';
import type { MapboxSpatialSummary } from '../infrastructure/external_apis/MapboxSpatialClient';
import type { SpatialProximityData } from '../infrastructure/external_apis/OverpassOsmClient';
import { MapboxSpatialClient } from '../infrastructure/external_apis/MapboxSpatialClient';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';

export function runTransportProviderNeutralNormalizationTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH PHASE 3: TRANSPORT PROVIDER-NEUTRAL NORMALIZATION TESTS');
  console.log('================================================================\n');

  let allPassed = true;

  const testCoords = new Coordinates(-6.2088, 106.8456);
  const hospitalCoords = new Coordinates(-6.2050, 106.8400);

  // ---------------------------------------------------------------------------
  // TEST A: Mapbox Success -> Mapbox Result Used
  // ---------------------------------------------------------------------------
  console.log('[TEST A] Mapbox Primary Success Resolution...');
  const mockMapboxSuccess: MapboxSpatialSummary = {
    hospital: {
      name: 'RSUD Tarakan',
      latitude: -6.2050,
      longitude: 106.8400,
      distanceMeters: 850,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 5000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(850, 5000, 'RSUD Tarakan', false),
      category: 'hospital'
    },
    transit: {
      name: 'Stasiun MRT Bundaran HI',
      latitude: -6.1950,
      longitude: 106.8230,
      distanceMeters: 350,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 3000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(350, 3000, 'Stasiun MRT Bundaran HI', false),
      category: 'transit'
    },
    fireStation: {
      name: 'Pos Damkar Gambir',
      latitude: -6.1750,
      longitude: 106.8300,
      distanceMeters: 1200,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 5000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(1200, 5000, 'Pos Damkar Gambir', false),
      category: 'fire_station'
    },
    nearestRoad: {
      nearestRoadName: 'Jl. M.H. Thamrin',
      distanceToNearestRoadMeters: 18,
      snappedLocation: new Coordinates(-6.1950, 106.8231),
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
      providerStatus: 'success_exact',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(18, 500, 'Jl. M.H. Thamrin', false)
    },
    route: {
      travelTimeRouteDistanceMeters: 1450,
      travelTimeMinutes: 4.2,
      estimatedTravelTimeMinutes: '5 menit',
      routingSource: 'Mapbox Directions API (driving profile)',
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
      providerStatus: 'success',
      durationSeconds: 252,
      origin: testCoords,
      destination: hospitalCoords
    },
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const normA = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxSuccess,
    osm: null,
    evaluatedAt: new Date().toISOString()
  });

  if (
    normA.healthcare.status !== 'success_exact' ||
    normA.healthcare.source !== 'mapbox' ||
    normA.healthcare.distanceMeters !== 850 ||
    normA.nearestRoad.source !== 'mapbox' ||
    normA.nearestRoad.distanceMeters !== 18
  ) {
    console.error('FAIL [TEST A]: Mapbox primary resolution mismatch:', normA);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST A]: Mapbox primary success cleanly produces normalized evidence with source=mapbox.');
  }

  // ---------------------------------------------------------------------------
  // TEST B: Mapbox Failure -> Overpass/OSRM Fallback Used
  // ---------------------------------------------------------------------------
  console.log('\n[TEST B] Mapbox Failure -> Overpass/OSRM Fallback Resolution...');
  const mockMapboxError: MapboxSpatialSummary = {
    hospital: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'error',
      searchRadiusMeters: 15000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 15000, null, true),
      category: 'hospital'
    },
    transit: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'error',
      searchRadiusMeters: 10000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, null, true),
      category: 'transit'
    },
    fireStation: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'error',
      searchRadiusMeters: 10000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, null, true),
      category: 'fire_station'
    },
    nearestRoad: null,
    route: null,
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'error'
  };

  const mockOsmFallback: SpatialProximityData = {
    distanceToNearestWaterwayMeters: 450,
    nearestWaterwayName: 'Kali Ciliwung',
    waterwayObservation: OverpassOsmClient.createBoundedObservation(450, 5000, 'Kali Ciliwung', false),
    distanceToRiverMeters: 450,
    nearestRiverName: 'Kali Ciliwung',
    greenFeatureRatioPct: 25,
    greenSpaceRatioPct: 25,
    distanceToNearestRoadMeters: 28,
    nearestRoadName: 'Jl. Veteran',
    nearestRoadObservation: OverpassOsmClient.createBoundedObservation(28, 500, 'Jl. Veteran', false),
    distanceToArterialMeters: 380,
    nearestArterialName: 'Jl. Medan Merdeka',
    arterialObservation: OverpassOsmClient.createBoundedObservation(380, 10000, 'Jl. Medan Merdeka', false),
    distanceToNearestTransitMeters: 750,
    nearestTransitName: 'Halte Gambir',
    transitObservation: OverpassOsmClient.createBoundedObservation(750, 10000, 'Halte Gambir', false),
    distanceToTransitHubMeters: 750,
    distanceToHospitalMeters: 2100,
    nearestHospitalName: 'RS Siloam',
    hospitalObservation: OverpassOsmClient.createBoundedObservation(2100, 15000, 'RS Siloam', false),
    distanceToHealthcareFacilityMeters: 2100,
    nearestHealthcareFacilityName: 'RS Siloam',
    distanceToClinicMeters: 600,
    nearestClinicName: 'Klinik Medika',
    distanceToPharmacyMeters: 300,
    nearestPharmacyName: 'Kimia Farma',
    distanceToFireStationMeters: 1800,
    nearestFireStationName: 'Pos Damkar Gambir',
    fireStationObservation: OverpassOsmClient.createBoundedObservation(1800, 10000, 'Pos Damkar Gambir', false),
    distanceToPoliceStationMeters: 1200,
    nearestPoliceStationName: 'Polsek Gambir',
    distanceToSchoolMeters: 400,
    nearestSchoolName: 'SD Gambir',
    travelTimeMinutes: 7.5,
    travelTimeDisplay: '8 Menit',
    estimatedTravelTimeMinutes: '8 Menit',
    travelTimeRouteDistanceMeters: 2600,
    routingSource: 'OSRM driving graph',
    provenance: {
      nearestRoad: 'osrm-snap',
      arterialRoad: 'osm-geom-segment',
      nearestTransit: 'osm-query',
      hospital: 'osm-query',
      healthcareFacility: 'osm-query',
      fireStation: 'osm-query',
      waterway: 'osm-geom-segment',
      greenSpace: 'osm-query',
      routing: 'osrm-live-route'
    }
  };

  const normB = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxError,
    osm: mockOsmFallback,
    evaluatedAt: new Date().toISOString()
  });

  if (
    normB.healthcare.status !== 'success_exact' ||
    normB.healthcare.source !== 'overpass' ||
    normB.healthcare.distanceMeters !== 2100 ||
    normB.nearestRoad.source !== 'osrm' ||
    normB.nearestRoad.distanceMeters !== 28 ||
    normB.route.source !== 'osrm' ||
    normB.route.durationMinutes !== 7.5
  ) {
    console.error('FAIL [TEST B]: Fallback resolution mismatch:', normB);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST B]: Mapbox failure triggers seamless fallback to Overpass & OSRM with correct source attribution.');
  }

  // ---------------------------------------------------------------------------
  // TEST C: Mapbox Success with No Result -> Valid no_result Semantics
  // ---------------------------------------------------------------------------
  console.log('\n[TEST C] Mapbox Success with No Result (Bounded)...');
  const mockMapboxNoResult: MapboxSpatialSummary = {
    hospital: {
      name: 'Tidak terdeteksi dalam radius 15 km',
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'success_no_result',
      searchRadiusMeters: 15000,
      boundedDisplay: '>15 km',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false),
      category: 'hospital'
    },
    transit: {
      name: 'Tidak terdeteksi dalam radius 10 km',
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'success_no_result',
      searchRadiusMeters: 10000,
      boundedDisplay: '>10 km',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10 km', false),
      category: 'transit'
    },
    fireStation: {
      name: 'Tidak terdeteksi dalam radius 10 km',
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'success_no_result',
      searchRadiusMeters: 10000,
      boundedDisplay: '>10 km',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10 km', false),
      category: 'fire_station'
    },
    nearestRoad: {
      nearestRoadName: 'Tidak terdeteksi dalam radius 500 m',
      distanceToNearestRoadMeters: null,
      snappedLocation: null,
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
      providerStatus: 'success_no_result',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 500, 'Tidak terdeteksi dalam radius 500 m', false)
    },
    route: null,
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const normC = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxNoResult,
    osm: null,
    evaluatedAt: new Date().toISOString()
  });

  if (
    normC.healthcare.status !== 'success_bounded' ||
    normC.healthcare.distanceMeters !== null ||
    normC.healthcare.relation !== 'greater_than' ||
    normC.healthcare.lowerBoundMeters !== 15000 ||
    normC.nearestRoad.status !== 'success_bounded' ||
    normC.nearestRoad.distanceMeters !== null ||
    normC.nearestRoad.lowerBoundMeters !== 500
  ) {
    console.error('FAIL [TEST C]: No-result bounded semantics mismatch:', normC);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST C]: Mapbox success_no_result correctly creates status=success_bounded with distanceMeters=null and lowerBoundMeters.');
  }

  // ---------------------------------------------------------------------------
  // TEST D: Mapbox Timeout -> Fallback Attempted
  // ---------------------------------------------------------------------------
  console.log('\n[TEST D] Mapbox Timeout -> Fallback Attempted...');
  const mockMapboxTimeout: MapboxSpatialSummary = {
    hospital: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'timeout',
      searchRadiusMeters: 15000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 15000, null, true),
      category: 'hospital'
    },
    transit: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'timeout',
      searchRadiusMeters: 10000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, null, true),
      category: 'transit'
    },
    fireStation: {
      name: null,
      latitude: null,
      longitude: null,
      distanceMeters: null,
      source: 'mapbox',
      providerStatus: 'timeout',
      searchRadiusMeters: 10000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, null, true),
      category: 'fire_station'
    },
    nearestRoad: null,
    route: null,
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'timeout'
  };

  const normD = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxTimeout,
    osm: mockOsmFallback,
    evaluatedAt: new Date().toISOString()
  });

  if (
    normD.healthcare.source !== 'overpass' ||
    normD.healthcare.distanceMeters !== 2100 ||
    normD.transit.source !== 'overpass' ||
    normD.transit.distanceMeters !== 750
  ) {
    console.error('FAIL [TEST D]: Mapbox timeout fallback failed:', normD);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST D]: Mapbox timeout successfully attempts and uses Overpass fallback.');
  }

  // ---------------------------------------------------------------------------
  // TEST E: Bounded Result (>10km / >15km) Preserved Without Distance Fabrication
  // ---------------------------------------------------------------------------
  console.log('\n[TEST E] Bounded Representation Invariants (never store distanceMeters = 15000)...');
  if (normC.healthcare.distanceMeters === 15000 || normC.transit.distanceMeters === 10000) {
    console.error('FAIL [TEST E]: Bounded result must NOT be stored as synthetic exact distance!');
    allPassed = false;
  } else if (normC.healthcare.lowerBoundMeters !== 15000 || normC.transit.lowerBoundMeters !== 10000) {
    console.error('FAIL [TEST E]: lowerBoundMeters missing on bounded component!');
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST E]: Bounded features preserve relation=greater_than, lowerBoundMeters, and distanceMeters=null.');
  }

  // ---------------------------------------------------------------------------
  // TEST F: Route Success -> Distance + Duration Verified
  // ---------------------------------------------------------------------------
  console.log('\n[TEST F] Route Success Representation...');
  if (
    normA.route.status !== 'success' ||
    normA.route.routeDistanceMeters !== 1450 ||
    normA.route.durationMinutes !== 4.2 ||
    normA.route.estimatedTravelTimeMinutes !== '5 menit'
  ) {
    console.error('FAIL [TEST F]: Route success mismatch:', normA.route);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST F]: Driving route successfully normalizes distance (1450m) and duration (4.2 min, "5 menit").');
  }

  // ---------------------------------------------------------------------------
  // TEST G: Route Failure -> Strict Null Durations (No Fabrication)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST G] Route Failure Anti-Fabrication...');
  const mockMapboxRouteNoRoute: MapboxSpatialSummary = {
    ...mockMapboxSuccess,
    route: {
      travelTimeRouteDistanceMeters: null,
      travelTimeMinutes: null,
      estimatedTravelTimeMinutes: 'Rute jalan tidak dapat diakses langsung',
      routingSource: 'Mapbox Directions API (no route found)',
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
      providerStatus: 'no_route',
      durationSeconds: null,
      origin: testCoords,
      destination: hospitalCoords
    }
  };

  const normG = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxRouteNoRoute,
    osm: null,
    evaluatedAt: new Date().toISOString()
  });

  if (
    normG.route.status !== 'no_route' ||
    normG.route.routeDistanceMeters !== null ||
    normG.route.durationMinutes !== null
  ) {
    console.error('FAIL [TEST G]: No route failure must maintain null distance and duration:', normG.route);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST G]: Route failure preserves strict null values for numeric distance and duration.');
  }

  // ---------------------------------------------------------------------------
  // TEST H & I: Cache Isolation Across Coordinates & Cache Reuse
  // ---------------------------------------------------------------------------
  console.log('\n[TEST H & I] Cache Isolation & Reuse...');
  const key1 = `mapbox_poi_hospital_${(-6.2088).toFixed(5)}_${(106.8456).toFixed(5)}`;
  const key2 = `mapbox_poi_hospital_${(-6.2089).toFixed(5)}_${(106.8456).toFixed(5)}`;

  LocalApiCache.set(key1, mockMapboxSuccess.hospital, 3600);

  const cachedKey1 = LocalApiCache.get<typeof mockMapboxSuccess.hospital>(key1);
  const cachedKey2 = LocalApiCache.get<typeof mockMapboxSuccess.hospital>(key2);

  if (!cachedKey1 || cachedKey1.name !== 'RSUD Tarakan') {
    console.error('FAIL [TEST I]: Cache lookup failed for identical coordinates.');
    allPassed = false;
  } else if (cachedKey2 !== null) {
    console.error('FAIL [TEST H]: Different coordinate leaked cached item across boundaries.');
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST H & I]: Sub-meter coordinate cache keys guarantee isolation and reuse without leakage.');
  }

  // ---------------------------------------------------------------------------
  // TEST J: Open Source First Precedence Over Secondary Provider
  // ---------------------------------------------------------------------------
  console.log('\n[TEST J] Open Source First Precedence & Immutability...');
  // Ensure that passing OSM primary takes precedence over secondary fallback provider
  const mixedInput = TransportEvidenceAdapter.normalize({
    mapbox: mockMapboxSuccess, // Contains RSUD Tarakan (850m)
    osm: mockOsmFallback,     // Contains RS Siloam (2100m)
    evaluatedAt: new Date().toISOString()
  });

  if (
    mixedInput.healthcare.name !== 'RS Siloam' ||
    mixedInput.healthcare.distanceMeters !== 2100 ||
    mixedInput.healthcare.source !== 'overpass' ||
    mixedInput.nearestRoad.source !== 'osrm' ||
    mixedInput.nearestRoad.distanceMeters !== 28
  ) {
    console.error('FAIL [TEST J]: Open Source First precedence failed:', mixedInput.healthcare);
    allPassed = false;
  } else {
    console.log('✓ PASS [TEST J]: Open Source First (OSRM/Overpass) correctly takes primary precedence over secondary provider.');
  }

  // ---------------------------------------------------------------------------
  // TEST K: Scoring Engine Agnosticism (Consumes Normalized Evidence Directly)
  // ---------------------------------------------------------------------------
  console.log('\n[TEST K] RiskScoringEngine Consumes Normalized Evidence Directly...');
  const rawInputsWithNormalized: RawPhysicalInputs = {
    elevationMeters: 15,
    max24hRainfallMm: 80,
    distanceToRiverMeters: 450,
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 32,
    historicalPeakTempC: 36,
    projectedTempRise2050C: 1.5,
    greenSpaceRatioPct: 25,
    distanceToNearestRoadMeters: null,
    distanceToArterialMeters: null,
    distanceToTransitHubMeters: null,
    distanceToHospitalMeters: null,
    distanceToFireStationMeters: null,
    transportEvidence: normA // Passes normalized evidence directly
  };

  const assessment = RiskScoringEngine.calculate(
    testCoords,
    'Jakarta Pusat Site',
    'Indonesia',
    'Residential',
    'Home Buyer',
    rawInputsWithNormalized
  );

  if (
    assessment.transport.distanceToNearestRoadMeters !== 18 ||
    assessment.transport.distanceToHospitalMeters !== 850 ||
    assessment.transport.distanceToTransitHubMeters !== 350 ||
    assessment.transport.score === null
  ) {
    console.error('FAIL [TEST K]: RiskScoringEngine did not properly compute score from normalized evidence:', assessment.transport);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST K]: RiskScoringEngine successfully computed transport score (${assessment.transport.score}/100) from normalized evidence.`);
  }

  return allPassed;
}
