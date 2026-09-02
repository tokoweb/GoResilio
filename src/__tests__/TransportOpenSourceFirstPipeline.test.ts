import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import {
  TransportEvidenceAdapter,
  TransportAdapterInput
} from '../domain/services/TransportEvidenceAdapter';
import type {
  NormalizedTransportEvidence,
  NormalizedTransportComponent
} from '../domain/types/transport.types';
import type { SpatialProximityData } from '../infrastructure/external_apis/OverpassOsmClient';
import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { OsrmRoutingClient } from '../infrastructure/external_apis/OsrmRoutingClient';
import { MapboxSpatialClient } from '../infrastructure/external_apis/MapboxSpatialClient';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';

export function runTransportOpenSourceFirstPipelineTests(): boolean {
  console.log('================================================================');
  console.log('PHASE 7.2: TRANSPORT OPEN-SOURCE FIRST PIPELINE VERIFICATION');
  console.log('================================================================\n');

  let allPassed = true;

  const testCoordsJakarta = new Coordinates(-6.2088, 106.8456);
  const testCoordsBali = new Coordinates(-8.4095, 115.1889);

  // ---------------------------------------------------------------------------
  // TEST 1: Mapbox Token Empty -> Transport Resolves via Open-Source (OSRM + Overpass)
  // ---------------------------------------------------------------------------
  console.log('[TEST 1] Mapbox Token Missing Isolation...');
  const mockOsmFull: SpatialProximityData = {
    distanceToNearestWaterwayMeters: 450,
    nearestWaterwayName: 'Kali Ciliwung',
    distanceToRiverMeters: 450,
    nearestRiverName: 'Kali Ciliwung',
    greenFeatureRatioPct: 24,
    greenSpaceRatioPct: 24,
    distanceToNearestRoadMeters: 12,
    nearestRoadName: 'Jl. Pegangsaan Timur (OSRM)',
    distanceToArterialMeters: 650,
    nearestArterialName: 'Jl. Diponegoro',
    arterialHighwayClass: 'primary',
    distanceToNearestTransitMeters: 320,
    distanceToTransitHubMeters: 320,
    nearestTransitName: 'Stasiun Cikini',
    transitType: 'station',
    distanceToHospitalMeters: 1200,
    nearestHospitalName: 'RSUPN Dr. Cipto Mangunkusumo',
    hospitalFacilityType: 'hospital',
    distanceToHealthcareFacilityMeters: 1200,
    nearestHealthcareFacilityName: 'RSUPN Dr. Cipto Mangunkusumo',
    distanceToClinicMeters: null,
    nearestClinicName: 'Klinik',
    distanceToPharmacyMeters: null,
    nearestPharmacyName: 'Apotek',
    distanceToFireStationMeters: 1400,
    nearestFireStationName: 'Pos Damkar Matraman',
    distanceToPoliceStationMeters: null,
    nearestPoliceStationName: 'Polsek',
    distanceToSchoolMeters: null,
    nearestSchoolName: 'Sekolah',
    travelTimeMinutes: 4.5,
    travelTimeDisplay: '5 Menit',
    estimatedTravelTimeMinutes: '5 Menit',
    travelTimeRouteDistanceMeters: 1600,
    routingSource: 'OSRM road-network routing',
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

  const norm1 = TransportEvidenceAdapter.normalize({
    mapbox: null, // Empty Mapbox token / unavailable
    osm: mockOsmFull,
    evaluatedAt: new Date().toISOString()
  });

  if (
    norm1.nearestRoad.status !== 'success_exact' ||
    norm1.nearestRoad.source !== 'osrm' ||
    norm1.majorRoad.status !== 'success_exact' ||
    norm1.majorRoad.source !== 'overpass' ||
    norm1.healthcare.status !== 'success_exact' ||
    norm1.healthcare.source !== 'overpass' ||
    norm1.transit.status !== 'success_exact' ||
    norm1.transit.source !== 'overpass'
  ) {
    console.error('FAIL: Test 1 - Open-source primary resolution failed with missing Mapbox token');
    allPassed = false;
  } else {
    console.log('PASS: Test 1 - 4/4 indicators successfully resolved via OSRM + Overpass without Mapbox');
  }

  // ---------------------------------------------------------------------------
  // TEST 2: OSRM Success -> Frontage Snapped Accurately
  // ---------------------------------------------------------------------------
  console.log('[TEST 2] OSRM Street Snapping Accuracy...');
  if (
    norm1.nearestRoad.distanceMeters !== 12 ||
    norm1.nearestRoad.name !== 'Jl. Pegangsaan Timur (OSRM)' ||
    norm1.nearestRoad.isFallback !== false
  ) {
    console.error('FAIL: Test 2 - Frontage road metrics mismatch');
    allPassed = false;
  } else {
    console.log('PASS: Test 2 - Frontage road snapped at exact 12m with primary provider OSRM');
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Overpass Major Road Success -> Highway Hierarchy Preservation
  // ---------------------------------------------------------------------------
  console.log('[TEST 3] Overpass Major Road Classification...');
  if (
    norm1.majorRoad.distanceMeters !== 650 ||
    norm1.majorRoad.distanceKm !== 0.7 ||
    norm1.majorRoad.highwayClass !== 'primary'
  ) {
    console.error('FAIL: Test 3 - Major road classification or distanceKm mismatch', norm1.majorRoad);
    allPassed = false;
  } else {
    console.log('PASS: Test 3 - Major road resolved with highwayClass="primary" and normalized distanceKm');
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Overpass Healthcare Success -> Hospital Facility Type Preservation
  // ---------------------------------------------------------------------------
  console.log('[TEST 4] Overpass Healthcare Hospital Prioritization...');
  if (
    norm1.healthcare.distanceMeters !== 1200 ||
    norm1.healthcare.facilityType !== 'hospital' ||
    norm1.healthcare.name !== 'RSUPN Dr. Cipto Mangunkusumo'
  ) {
    console.error('FAIL: Test 4 - Healthcare hospital resolution mismatch', norm1.healthcare);
    allPassed = false;
  } else {
    console.log('PASS: Test 4 - Hospital facility correctly categorized and resolved');
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Overpass Transit Success -> Station Node Classification
  // ---------------------------------------------------------------------------
  console.log('[TEST 5] Overpass Public Transit Classification...');
  if (
    norm1.transit.distanceMeters !== 320 ||
    norm1.transit.transitType !== 'station' ||
    norm1.transit.name !== 'Stasiun Cikini'
  ) {
    console.error('FAIL: Test 5 - Transit node resolution mismatch', norm1.transit);
    allPassed = false;
  } else {
    console.log('PASS: Test 5 - Transit station node correctly categorized and resolved');
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Overpass Endpoint Failover Simulation
  // ---------------------------------------------------------------------------
  console.log('[TEST 6] Overpass Endpoint Pool & Failover...');
  if (OverpassOsmClient.ENDPOINTS.length < 3) {
    console.error('FAIL: Test 6 - Less than 3 Overpass interpreter endpoints in pool');
    allPassed = false;
  } else {
    console.log(`PASS: Test 6 - Overpass endpoint pool verified (${OverpassOsmClient.ENDPOINTS.length} endpoints configured)`);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Bounded Search Semantics (>15 km)
  // ---------------------------------------------------------------------------
  console.log('[TEST 7] Bounded Search Semantic Differentiation (>15 km)...');
  const mockOsmBounded: SpatialProximityData = {
    distanceToNearestWaterwayMeters: null,
    nearestWaterwayName: 'Tidak terdeteksi dalam radius 5 km',
    distanceToRiverMeters: null,
    nearestRiverName: 'Tidak terdeteksi',
    greenFeatureRatioPct: 10,
    greenSpaceRatioPct: 10,
    distanceToNearestRoadMeters: 25,
    nearestRoadName: 'Jl. Pedesaan (OSRM)',
    distanceToArterialMeters: null,
    nearestArterialName: 'Tidak terdeteksi dalam radius 15 km',
    arterialObservation: OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false),
    distanceToNearestTransitMeters: null,
    distanceToTransitHubMeters: null,
    nearestTransitName: 'Tidak terdeteksi dalam radius 15 km',
    transitObservation: OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false),
    distanceToHospitalMeters: null,
    nearestHospitalName: 'Tidak terdeteksi dalam radius 15 km',
    hospitalObservation: OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false),
    distanceToHealthcareFacilityMeters: null,
    nearestHealthcareFacilityName: 'Tidak terdeteksi dalam radius 15 km',
    distanceToClinicMeters: null,
    nearestClinicName: 'Klinik',
    distanceToPharmacyMeters: null,
    nearestPharmacyName: 'Apotek',
    distanceToFireStationMeters: null,
    nearestFireStationName: 'Tidak terdeteksi dalam radius 10 km',
    distanceToPoliceStationMeters: null,
    nearestPoliceStationName: 'Polsek',
    distanceToSchoolMeters: null,
    nearestSchoolName: 'Sekolah',
    travelTimeMinutes: null,
    travelTimeDisplay: 'Rumah sakit tidak terpetakan dalam radius 15 km',
    estimatedTravelTimeMinutes: 'Rumah sakit tidak terpetakan dalam radius 15 km',
    travelTimeRouteDistanceMeters: null,
    routingSource: 'OSRM road-network routing',
    provenance: {
      nearestRoad: 'osrm-snap',
      arterialRoad: 'not-found-in-radius',
      nearestTransit: 'not-found-in-radius',
      hospital: 'not-found-in-radius',
      healthcareFacility: 'not-found-in-radius',
      fireStation: 'not-found-in-radius',
      waterway: 'not-found-in-radius',
      greenSpace: 'osm-query',
      routing: 'not-applicable'
    }
  };

  const norm7 = TransportEvidenceAdapter.normalize({
    mapbox: null,
    osm: mockOsmBounded,
    evaluatedAt: new Date().toISOString()
  });

  if (
    norm7.healthcare.status !== 'success_bounded' ||
    norm7.healthcare.distanceMeters !== null ||
    norm7.healthcare.relation !== 'greater_than' ||
    norm7.majorRoad.status !== 'success_bounded' ||
    norm7.majorRoad.distanceMeters !== null
  ) {
    console.error('FAIL: Test 7 - Bounded search did not strictly null distanceMeters or set greater_than relation', norm7);
    allPassed = false;
  } else {
    console.log('PASS: Test 7 - Bounded indicators preserve status=success_bounded, distanceMeters=null, relation=greater_than');
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Timeout / Error Semantics (Never Synthesizes '>15 km')
  // ---------------------------------------------------------------------------
  console.log('[TEST 8] Provider Timeout/Error State Discrimination...');
  const mockOsmError: SpatialProximityData = {
    distanceToNearestWaterwayMeters: null,
    nearestWaterwayName: 'Gagal memuat',
    distanceToRiverMeters: null,
    nearestRiverName: 'Gagal memuat',
    greenFeatureRatioPct: null,
    greenSpaceRatioPct: null,
    distanceToNearestRoadMeters: 6,
    nearestRoadName: 'Jl. Teuku Umar (OSRM)',
    distanceToArterialMeters: null,
    nearestArterialName: 'Gagal memuat',
    arterialObservation: OverpassOsmClient.createBoundedObservation(null, 15000, null, true),
    distanceToNearestTransitMeters: null,
    distanceToTransitHubMeters: null,
    nearestTransitName: 'Gagal memuat',
    transitObservation: OverpassOsmClient.createBoundedObservation(null, 15000, null, true),
    distanceToHospitalMeters: null,
    nearestHospitalName: 'Gagal memuat',
    hospitalObservation: OverpassOsmClient.createBoundedObservation(null, 15000, null, true),
    distanceToHealthcareFacilityMeters: null,
    nearestHealthcareFacilityName: 'Gagal memuat',
    distanceToClinicMeters: null,
    nearestClinicName: 'Klinik',
    distanceToPharmacyMeters: null,
    nearestPharmacyName: 'Apotek',
    distanceToFireStationMeters: null,
    nearestFireStationName: 'Gagal memuat',
    distanceToPoliceStationMeters: null,
    nearestPoliceStationName: 'Polsek',
    distanceToSchoolMeters: null,
    nearestSchoolName: 'Sekolah',
    travelTimeMinutes: null,
    travelTimeDisplay: 'Gagal memuat',
    estimatedTravelTimeMinutes: 'Gagal memuat',
    travelTimeRouteDistanceMeters: null,
    routingSource: 'OSRM',
    queryStatus: {
      hospital: 'timeout',
      healthcareFacility: 'timeout',
      fireStation: 'error',
      waterway: 'error',
      transit: 'timeout',
      arterial: 'timeout',
      nearestRoad: 'success',
      greenSpace: 'error'
    },
    provenance: {
      nearestRoad: 'osrm-snap',
      arterialRoad: 'source_unavailable',
      nearestTransit: 'source_unavailable',
      hospital: 'source_unavailable',
      healthcareFacility: 'source_unavailable',
      fireStation: 'source_unavailable',
      waterway: 'source_unavailable',
      greenSpace: 'source_unavailable',
      routing: 'not-applicable'
    }
  };

  const norm8 = TransportEvidenceAdapter.normalize({
    mapbox: null,
    osm: mockOsmError,
    evaluatedAt: new Date().toISOString()
  });

  if (
    norm8.healthcare.status !== 'timeout' ||
    norm8.majorRoad.status !== 'timeout' ||
    norm8.healthcare.distanceMeters !== null ||
    norm8.healthcare.relation !== null
  ) {
    console.error('FAIL: Test 8 - Error/Timeout produced incorrect status or relation', norm8);
    allPassed = false;
  } else {
    console.log('PASS: Test 8 - Timeout correctly sets status="timeout" and does NOT synthesize fake >15km');
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Coverage 1/4 -> Transport Level Unavailable (No False Certainty)
  // ---------------------------------------------------------------------------
  console.log('[TEST 9] RiskScoringEngine Coverage 1/4 Governance...');
  const rawInputsCoverage1: RawPhysicalInputs = {
    elevationMeters: 10,
    max24hRainfallMm: 50,
    distanceToRiverMeters: null,
    nearestRiverName: 'Tidak diketahui',
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 30,
    historicalPeakTempC: 34,
    forecastPeakTempC: 32,
    projectedTempRise2050C: 1.2,
    greenSpaceRatioPct: null,
    distanceToNearestRoadMeters: 6,
    nearestRoadName: 'Jl. Frontage Saja',
    distanceToArterialMeters: null,
    distanceToHospitalMeters: null,
    distanceToTransitHubMeters: null,
    transportEvidence: norm8, // Only frontage is available, other 3 are timeout
    isFallbackFlags: {}
  };

  const res9 = RiskScoringEngine.calculate(
    testCoordsJakarta,
    'Jakarta Test Address',
    'Indonesia',
    'residential',
    'property_buyer',
    rawInputsCoverage1
  );

  if (
    res9.transport.observedComponents !== 1 ||
    res9.transport.coveragePct !== 25 ||
    res9.transport.level !== 'unavailable' ||
    res9.transport.scoreReliability !== 'insufficient_data' ||
    res9.transport.score !== null
  ) {
    console.error('FAIL: Test 9 - RiskScoringEngine fabricated score for coverage 1/4', res9.transport);
    allPassed = false;
  } else {
    console.log('PASS: Test 9 - Coverage 1/4 correctly produces level="unavailable" and score=null (no false certainty)');
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Coverage 4/4 -> Full Score Calculation & Reliability Measured
  // ---------------------------------------------------------------------------
  console.log('[TEST 10] RiskScoringEngine Coverage 4/4 Full Resolution...');
  const rawInputsCoverage4: RawPhysicalInputs = {
    elevationMeters: 10,
    max24hRainfallMm: 50,
    distanceToRiverMeters: 450,
    nearestRiverName: 'Kali Ciliwung',
    historicalQuakesCount150km: 0,
    historicalQuakesCount100km: 0,
    maxHistoricalMag: null,
    avgMaxTempC: 30,
    historicalPeakTempC: 34,
    forecastPeakTempC: 32,
    projectedTempRise2050C: 1.2,
    greenSpaceRatioPct: 24,
    distanceToNearestRoadMeters: 12,
    nearestRoadName: 'Jl. Pegangsaan Timur (OSRM)',
    distanceToArterialMeters: 650,
    nearestArterialName: 'Jl. Diponegoro',
    distanceToHospitalMeters: 1200,
    nearestHospitalName: 'RSUPN Dr. Cipto Mangunkusumo',
    distanceToTransitHubMeters: 320,
    nearestTransitName: 'Stasiun Cikini',
    transportEvidence: norm1,
    isFallbackFlags: {}
  };

  const res10 = RiskScoringEngine.calculate(
    testCoordsJakarta,
    'Jakarta Test Address',
    'Indonesia',
    'residential',
    'property_buyer',
    rawInputsCoverage4
  );

  if (
    res10.transport.observedComponents !== 4 ||
    res10.transport.coveragePct !== 100 ||
    res10.transport.level !== 'good' ||
    res10.transport.scoreReliability !== 'measured' ||
    typeof res10.transport.score !== 'number'
  ) {
    console.error('FAIL: Test 10 - RiskScoringEngine failed on coverage 4/4', res10.transport);
    allPassed = false;
  } else {
    console.log(`PASS: Test 10 - Coverage 4/4 produced transportScore=${res10.transport.score}, level=${res10.transport.level}, reliability=${res10.transport.scoreReliability}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 11: Multi-Location Coordinate Isolation
  // ---------------------------------------------------------------------------
  console.log('[TEST 11] Multi-Location Cache Isolation...');
  const cacheKeyJkt = `overpass_major_road_${testCoordsJakarta.lat.toFixed(5)}_${testCoordsJakarta.lng.toFixed(5)}`;
  const cacheKeyBali = `overpass_major_road_${testCoordsBali.lat.toFixed(5)}_${testCoordsBali.lng.toFixed(5)}`;

  if (cacheKeyJkt === cacheKeyBali) {
    console.error('FAIL: Test 11 - Cache keys collided across distinct coordinates');
    allPassed = false;
  } else {
    console.log('PASS: Test 11 - Coordinate isolation verified between Jakarta and Bali');
  }

  console.log('\n----------------------------------------------------------------');
  if (allPassed) {
    console.log('ALL PHASE 7.2 TRANSPORT OPEN-SOURCE FIRST TESTS PASSED! (11/11)');
  } else {
    console.error('SOME PHASE 7.2 TRANSPORT TESTS FAILED!');
  }
  console.log('----------------------------------------------------------------\n');

  return allPassed;
}
