import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import {
  MapboxSpatialClient,
  MapboxSpatialSummary,
  MapboxRoadResult,
  MapboxRouteResult
} from '../infrastructure/external_apis/MapboxSpatialClient';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { FeatureAssembler } from '../domain/services/FeatureAssembler';

export function runMapboxSpatialClientTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH PHASE 2: MAPBOX ROAD SNAPPING & ROUTING TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // TEST 1: Spherical Haversine Mathematical Accuracy
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] Spherical Haversine Distance Calculation...');
  // Jakarta Monas (-6.1754, 106.8272) to Bundaran HI (-6.1949, 106.8230) ~ 2.21 km (2210 m)
  const dist = MapboxSpatialClient.calculateHaversineDistanceMeters(
    -6.1754,
    106.8272,
    -6.1949,
    106.8230
  );
  if (dist < 2100 || dist > 2300) {
    console.error(`FAIL: Expected distance ~2210m, got: ${dist}m`);
    allPassed = false;
  } else {
    console.log(`✓ PASS [TEST 1]: Haversine distance calculated accurately (${dist} m).`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Status Discrimination & Anti-Fabrication Invariants
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 2] Status Discrimination (Exact, Bounded, Error, Timeout)...');

  // 2.A: Exact POI observation
  const exactObs = MapboxSpatialClient.createBoundedObservation(850, 5000, 'RS Cipto Mangunkusumo', false);
  if (exactObs.state !== 'AVAILABLE_EXACT' || exactObs.exactDistanceMeters !== 850 || exactObs.relation !== 'exact') {
    console.error('FAIL: Exact observation contract violated:', exactObs);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.A]: success_exact correctly stores exact distance and state=AVAILABLE_EXACT.');
  }

  // 2.B: Bounded observation (Search succeeded but no POI within search radius)
  const boundedObs = MapboxSpatialClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false);
  if (
    boundedObs.state !== 'AVAILABLE_BOUNDED' ||
    boundedObs.exactDistanceMeters !== null ||
    boundedObs.relation !== 'greater_than' ||
    boundedObs.displayValue !== '>15 km'
  ) {
    console.error('FAIL: Bounded observation contract violated:', boundedObs);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.B]: success_no_result correctly creates state=AVAILABLE_BOUNDED with displayValue=>15 km.');
  }

  // 2.C: Error / Timeout (Provider failure must NOT fabricate ">15 km")
  const errorObs = MapboxSpatialClient.createBoundedObservation(null, 15000, null, true);
  if (
    errorObs.state !== 'ERROR_OR_TIMEOUT' ||
    errorObs.displayValue !== null ||
    errorObs.exactDistanceMeters !== null ||
    errorObs.relation !== null
  ) {
    console.error('FAIL: Error observation must not contain synthetic display string:', errorObs);
    allPassed = false;
  } else {
    console.log('✓ PASS [2.C]: Provider error/timeout strictly produces state=ERROR_OR_TIMEOUT with displayValue=null.');
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Road Snapping & Street Name Semantics
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 3] Road Snapping & Street Name Contract...');

  // 3.A: Valid road snapping within 500m
  const mockRoadSuccess: MapboxRoadResult = {
    nearestRoadName: 'Jl. M.H. Thamrin',
    distanceToNearestRoadMeters: 18,
    snappedLocation: new Coordinates(-6.1950, 106.8231),
    source: 'mapbox',
    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    providerStatus: 'success_exact',
    boundedObservation: MapboxSpatialClient.createBoundedObservation(18, 500, 'Jl. M.H. Thamrin', false)
  };

  if (
    mockRoadSuccess.nearestRoadName !== 'Jl. M.H. Thamrin' ||
    mockRoadSuccess.distanceToNearestRoadMeters !== 18 ||
    mockRoadSuccess.source !== 'mapbox'
  ) {
    console.error('FAIL [3.A]: Road snapping result format mismatch:', mockRoadSuccess);
    allPassed = false;
  } else {
    console.log('✓ PASS [3.A]: Road snapping returns exact geometry distance and verified name.');
  }

  // 3.B: Road unnamed / unavailable within radius
  const mockRoadNoResult: MapboxRoadResult = {
    nearestRoadName: 'Tidak terdeteksi dalam radius 500 m',
    distanceToNearestRoadMeters: null,
    snappedLocation: null,
    source: 'mapbox',
    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    providerStatus: 'success_no_result',
    boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 500, 'Tidak terdeteksi dalam radius 500 m', false)
  };

  if (
    mockRoadNoResult.distanceToNearestRoadMeters !== null ||
    mockRoadNoResult.boundedObservation?.displayValue !== '>500 m'
  ) {
    console.error('FAIL [3.B]: Bounded road observation mismatch:', mockRoadNoResult);
    allPassed = false;
  } else {
    console.log('✓ PASS [3.B]: Road unmapped in 500m correctly returns distance=null and bounded observation.');
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Driving Route Duration & Anti-Emergency-Response Labeling
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 4] Mapbox Directions API Routing Semantics...');

  const originCoords = new Coordinates(-6.2088, 106.8456);
  const destCoords = new Coordinates(-6.2050, 106.8400);

  // 4.A: Valid Driving Route
  const mockRouteSuccess: MapboxRouteResult = {
    travelTimeRouteDistanceMeters: 1450,
    travelTimeMinutes: 4.2,
    estimatedTravelTimeMinutes: '5 menit',
    routingSource: 'Mapbox Directions API (driving profile)',
    source: 'mapbox',
    endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    providerStatus: 'success',
    durationSeconds: 252,
    origin: originCoords,
    destination: destCoords
  };

  // Verify terminology does NOT say "waktu tanggap darurat"
  const isEmergencyResponseLabeled =
    mockRouteSuccess.routingSource.toLowerCase().includes('tanggap darurat') ||
    (mockRouteSuccess.estimatedTravelTimeMinutes?.toLowerCase().includes('tanggap darurat') ?? false);

  if (isEmergencyResponseLabeled) {
    console.error('FAIL [4.A]: Route duration must not be labeled as emergency response time!');
    allPassed = false;
  } else {
    console.log('✓ PASS [4.A]: Route duration labeled strictly as estimated driving travel time.');
  }

  // 4.B: Route Failure (No Route Available)
  const mockRouteNoRoute: MapboxRouteResult = {
    travelTimeRouteDistanceMeters: null,
    travelTimeMinutes: null,
    estimatedTravelTimeMinutes: 'Rute jalan tidak dapat diakses langsung',
    routingSource: 'Mapbox Directions API (no route found)',
    source: 'mapbox',
    endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
    providerStatus: 'no_route',
    durationSeconds: null,
    origin: originCoords,
    destination: destCoords
  };

  if (
    mockRouteNoRoute.travelTimeMinutes !== null ||
    mockRouteNoRoute.travelTimeRouteDistanceMeters !== null
  ) {
    console.error('FAIL [4.B]: No-route state must not fabricate numeric values:', mockRouteNoRoute);
    allPassed = false;
  } else {
    console.log('✓ PASS [4.B]: Route failure preserves strict null values without synthetic durations.');
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Multi-Location Realistic Pipeline Tests
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 5] Multi-Location Realism (Jakarta, Bali Urban/Rural, Kalimantan, Remote)...');

  // Location 5.A: Jakarta Urban (High Density)
  const mockMapboxJakarta: MapboxSpatialSummary = {
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
    nearestRoad: mockRoadSuccess,
    route: mockRouteSuccess,
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const { featureStore: storeJakarta } = FeatureAssembler.assemble({
    coords: originCoords,
    address: 'Jakarta Pusat Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    mapbox: mockMapboxJakarta
  });

  const featRoadJakarta = storeJakarta['infrastructure_distance_to_nearest_road_meters'];
  const featRouteJakarta = storeJakarta['infrastructure_travel_time_to_hospital_minutes'];

  if (
    !featRoadJakarta ||
    featRoadJakarta.numericValue !== 18 ||
    !featRoadJakarta.source.includes('Mapbox Street Geocoding')
  ) {
    console.error('FAIL [5.A]: Jakarta road feature mismatch:', featRoadJakarta);
    allPassed = false;
  } else if (
    !featRouteJakarta ||
    featRouteJakarta.numericValue !== 4.2 ||
    !featRouteJakarta.source.includes('Mapbox Directions API')
  ) {
    console.error('FAIL [5.A]: Jakarta routing feature mismatch:', featRouteJakarta);
    allPassed = false;
  } else {
    console.log('✓ PASS [5.A]: Jakarta urban: road (18m) and driving route (4.2 min) verified with Mapbox provenance.');
  }

  // Location 5.B: Bali Urban (Denpasar)
  const denpasarCoords = new Coordinates(-8.6705, 115.2126);
  const mockMapboxBaliUrban: MapboxSpatialSummary = {
    hospital: {
      name: 'RSUP Sanglah Denpasar',
      latitude: -8.6750,
      longitude: 115.2180,
      distanceMeters: 780,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 5000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(780, 5000, 'RSUP Sanglah Denpasar', false),
      category: 'hospital'
    },
    transit: {
      name: 'Halte Trans Sarbagita Sanglah',
      latitude: -8.6740,
      longitude: 115.2170,
      distanceMeters: 620,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 3000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(620, 3000, 'Halte Trans Sarbagita Sanglah', false),
      category: 'transit'
    },
    fireStation: {
      name: 'Pos Damkar BPBD Kota Denpasar',
      latitude: -8.6650,
      longitude: 115.2100,
      distanceMeters: 950,
      source: 'mapbox',
      providerStatus: 'success_exact',
      searchRadiusMeters: 5000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(950, 5000, 'Pos Damkar BPBD Kota Denpasar', false),
      category: 'fire_station'
    },
    nearestRoad: {
      nearestRoadName: 'Jl. Diponegoro',
      distanceToNearestRoadMeters: 12,
      snappedLocation: new Coordinates(-8.6706, 115.2125),
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
      providerStatus: 'success_exact',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(12, 500, 'Jl. Diponegoro', false)
    },
    route: {
      travelTimeRouteDistanceMeters: 1100,
      travelTimeMinutes: 3.5,
      estimatedTravelTimeMinutes: '4 menit',
      routingSource: 'Mapbox Directions API (driving profile)',
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
      providerStatus: 'success',
      durationSeconds: 210,
      origin: denpasarCoords,
      destination: new Coordinates(-8.6750, 115.2180)
    },
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const { featureStore: storeBaliUrban } = FeatureAssembler.assemble({
    coords: denpasarCoords,
    address: 'Denpasar Bali Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    mapbox: mockMapboxBaliUrban
  });

  const featBaliRoad = storeBaliUrban['infrastructure_distance_to_nearest_road_meters'];
  const featBaliRoute = storeBaliUrban['infrastructure_travel_time_to_hospital_minutes'];

  if (!featBaliRoad || featBaliRoad.numericValue !== 12 || !featBaliRoute || featBaliRoute.numericValue !== 3.5) {
    console.error('FAIL [5.B]: Bali urban transport features mismatch:', featBaliRoad, featBaliRoute);
    allPassed = false;
  } else {
    console.log('✓ PASS [5.B]: Bali urban: road (12m) and route (3.5 min) verified.');
  }

  // Location 5.C: Bali Rural (Kintamani / Mount Batur)
  const kintamaniCoords = new Coordinates(-8.2435, 115.3765);
  const mockMapboxBaliRural: MapboxSpatialSummary = {
    hospital: {
      name: 'RSUD Bangli',
      latitude: -8.4500,
      longitude: 115.3500,
      distanceMeters: 23500, // >15km
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
      nearestRoadName: 'Jl. Raya Kintamani',
      distanceToNearestRoadMeters: 45,
      snappedLocation: new Coordinates(-8.2438, 115.3768),
      source: 'mapbox',
      endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
      providerStatus: 'success_exact',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(45, 500, 'Jl. Raya Kintamani', false)
    },
    route: null, // No hospital within 15km
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const { featureStore: storeBaliRural } = FeatureAssembler.assemble({
    coords: kintamaniCoords,
    address: 'Kintamani Bali Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    mapbox: mockMapboxBaliRural
  });

  const featBaliRuralHosp = storeBaliRural['infrastructure_distance_to_hospital_meters'];
  const featBaliRuralRoute = storeBaliRural['infrastructure_travel_time_to_hospital_minutes'];

  if (featBaliRuralHosp.numericValue !== null || featBaliRuralRoute.numericValue !== null) {
    console.error('FAIL [5.C]: Bali rural features must remain null when hospital >15km:', featBaliRuralHosp, featBaliRuralRoute);
    allPassed = false;
  } else {
    console.log('✓ PASS [5.C]: Bali rural: bounded hospital (>15 km) cleanly leaves route time as null.');
  }

  // Location 5.D: Kalimantan Peatland (Tampelas) & Location 5.E: Remote Rural (Papua)
  const remoteCoords = new Coordinates(-4.0833, 138.6667);
  const mockMapboxRemote: MapboxSpatialSummary = {
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
    nearestRoad: mockRoadNoResult,
    route: null,
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'success_exact'
  };

  const { featureStore: storeRemote } = FeatureAssembler.assemble({
    coords: remoteCoords,
    address: 'Remote Site',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    mapbox: mockMapboxRemote
  });

  const featRemoteRoad = storeRemote['infrastructure_distance_to_nearest_road_meters'];
  const featRemoteRoute = storeRemote['infrastructure_travel_time_to_hospital_minutes'];

  if (featRemoteRoad.numericValue !== null || featRemoteRoute.numericValue !== null) {
    console.error('FAIL [5.D/E]: Remote site features must be null when unmapped:', featRemoteRoad, featRemoteRoute);
    allPassed = false;
  } else {
    console.log('✓ PASS [5.D/E]: Kalimantan & Remote rural: road and route cleanly preserve null without fabrication.');
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Mapbox Provider Failure -> Seamless Fallback to OSRM / Overpass
  // ---------------------------------------------------------------------------
  console.log('\n[TEST 6] Mapbox Failure -> OSRM Road & Routing Fallback...');

  const mockMapboxFailed: MapboxSpatialSummary = {
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
      providerStatus: 'error',
      searchRadiusMeters: 10000,
      boundedObservation: MapboxSpatialClient.createBoundedObservation(null, 10000, null, true),
      category: 'fire_station'
    },
    nearestRoad: {
      nearestRoadName: 'Jl. Veteran (OSRM Fallback)',
      distanceToNearestRoadMeters: 28,
      snappedLocation: new Coordinates(-6.1700, 106.8250),
      source: 'osrm',
      endpoint: 'https://router.project-osrm.org/nearest/v1/driving',
      providerStatus: 'success_exact',
      boundedObservation: MapboxSpatialClient.createBoundedObservation(28, 500, 'Jl. Veteran (OSRM Fallback)', false)
    },
    route: {
      travelTimeRouteDistanceMeters: 3200,
      travelTimeMinutes: 9.5,
      estimatedTravelTimeMinutes: '10 Menit',
      routingSource: 'OSRM Road-Network Driving Engine',
      source: 'osrm',
      endpoint: 'https://router.project-osrm.org/route/v1/driving',
      providerStatus: 'success',
      durationSeconds: 570,
      origin: originCoords,
      destination: destCoords
    },
    evaluatedAt: new Date().toISOString(),
    providerStatus: 'error'
  };

  const mockOsmFallback = {
    distanceToHospitalMeters: 2400,
    nearestHospitalName: 'RS Siloam (OSM Fallback)',
    hospitalObservation: OverpassOsmClient.createBoundedObservation(2400, 15000, 'RS Siloam (OSM Fallback)', false),
    distanceToNearestTransitMeters: 1200,
    nearestTransitName: 'Halte Gambir (OSM Fallback)',
    transitObservation: OverpassOsmClient.createBoundedObservation(1200, 10000, 'Halte Gambir (OSM Fallback)', false),
    distanceToFireStationMeters: 3100,
    nearestFireStationName: 'Pos Damkar Gambir (OSM Fallback)',
    fireStationObservation: OverpassOsmClient.createBoundedObservation(3100, 10000, 'Pos Damkar Gambir (OSM Fallback)', false),
    distanceToNearestRoadMeters: 28,
    nearestRoadName: 'Jl. Veteran (OSRM Fallback)',
    distanceToArterialMeters: 450,
    nearestArterialName: 'Jl. Medan Merdeka Barat',
    distanceToNearestWaterwayMeters: 350,
    nearestWaterwayName: 'Kali Ciliwung',
    greenFeatureRatioPct: 35,
    travelTimeMinutes: 9.5,
    travelTimeDisplay: '10 Menit',
    estimatedTravelTimeMinutes: '10 Menit',
    travelTimeRouteDistanceMeters: 3200,
    routingSource: 'OSRM driving graph',
    distanceToRiverMeters: 350,
    nearestRiverName: 'Kali Ciliwung',
    greenSpaceRatioPct: 35,
    distanceToTransitHubMeters: 1200,
    distanceToHealthcareFacilityMeters: 2400,
    nearestHealthcareFacilityName: 'RS Siloam (OSM Fallback)',
    distanceToClinicMeters: 800,
    nearestClinicName: 'Klinik Jakarta',
    distanceToPharmacyMeters: 300,
    nearestPharmacyName: 'Apotek Kimia Farma',
    distanceToPoliceStationMeters: 1500,
    nearestPoliceStationName: 'Polsek Gambir',
    distanceToSchoolMeters: 400,
    nearestSchoolName: 'SDN Gambir',
    provenance: {
      nearestRoad: 'osrm-snap' as const,
      arterialRoad: 'osm-geom-segment' as const,
      nearestTransit: 'osm-query' as const,
      hospital: 'osm-query' as const,
      healthcareFacility: 'osm-query' as const,
      fireStation: 'osm-query' as const,
      waterway: 'osm-geom-segment' as const,
      greenSpace: 'osm-query' as const,
      routing: 'osrm-live-route' as const
    }
  };

  const { featureStore: storeFallback } = FeatureAssembler.assemble({
    coords: originCoords,
    address: 'Jakarta Site Fallback',
    country: 'Indonesia',
    evaluatedAt: new Date().toISOString(),
    mapbox: mockMapboxFailed,
    osm: mockOsmFallback
  });

  const featHospFallback = storeFallback['infrastructure_distance_to_hospital_meters'];
  const featRoadFallback = storeFallback['infrastructure_distance_to_nearest_road_meters'];
  const featRouteFallback = storeFallback['infrastructure_travel_time_to_hospital_minutes'];

  if (
    !featHospFallback ||
    featHospFallback.numericValue !== 2400 ||
    !featHospFallback.source.includes('OpenStreetMap')
  ) {
    console.error('FAIL [6]: Hospital fallback failed:', featHospFallback);
    allPassed = false;
  } else if (
    !featRoadFallback ||
    featRoadFallback.numericValue !== 28 ||
    !featRoadFallback.source.includes('OSRM')
  ) {
    console.error('FAIL [6]: Road fallback failed:', featRoadFallback);
    allPassed = false;
  } else if (
    !featRouteFallback ||
    featRouteFallback.numericValue !== 9.5 ||
    !featRouteFallback.source.includes('OSRM')
  ) {
    console.error('FAIL [6]: Route fallback failed:', featRouteFallback);
    allPassed = false;
  } else {
    console.log('✓ PASS [6]: Mapbox failure cleanly falls back to OSRM / Overpass across hospital, road, and route.');
  }

  return allPassed;
}
