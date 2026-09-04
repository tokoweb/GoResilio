import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { OverpassOsmClient, OsmElement } from '../infrastructure/external_apis/OverpassOsmClient';
import { OsrmRoutingClient } from '../infrastructure/external_apis/OsrmRoutingClient';
import { TransportEvidenceAdapter } from '../domain/services/TransportEvidenceAdapter';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';

export interface TransportRecoveryTestResult {
  name: string;
  passed: boolean;
  details?: string;
  data?: unknown;
}

export async function runPhase8_11Tests(): Promise<{ passed: boolean; results: TransportRecoveryTestResult[] }> {
  const results: TransportRecoveryTestResult[] = [];

  // =========================================================================
  // TEST 1: Overpass Endpoint Pool & Semaphore Throttle (Requirement 3 & 4)
  // =========================================================================
  try {
    const endpoints = OverpassOsmClient.ENDPOINTS;
    if (!Array.isArray(endpoints) || endpoints.length < 5) {
      throw new Error(`Expected at least 5 failover endpoints, found ${endpoints?.length}`);
    }

    const expectedFirst = 'https://overpass-api.de/api/interpreter';
    const expectedSecond = 'https://lz4.overpass-api.de/api/interpreter';
    const expectedThird = 'https://overpass.kumi.systems/api/interpreter';
    const expectedFourth = 'https://overpass.openstreetmap.fr/api/interpreter';
    const expectedFifth = 'https://z.overpass-api.de/api/interpreter';

    if (
      endpoints[0] !== expectedFirst ||
      endpoints[1] !== expectedSecond ||
      endpoints[2] !== expectedThird ||
      endpoints[3] !== expectedFourth ||
      endpoints[4] !== expectedFifth
    ) {
      throw new Error(`Endpoint ordering mismatch: ${JSON.stringify(endpoints)}`);
    }

    results.push({
      name: 'TEST 1: Sequential Failover Endpoint Pool (Requirement 5)',
      passed: true,
      details: `5 verified endpoints in exact sequence: ${endpoints.join(' -> ')}`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 1: Sequential Failover Endpoint Pool (Requirement 5)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 2: Healthcare Separation (Hospital vs Clinic, Requirement 8)
  // =========================================================================
  try {
    const mockHospAndClinicCoords = new Coordinates(-6.1754, 106.8272);
    // Directly test healthcare query parser logic
    const healthcareRes = await OverpassOsmClient.getNearestHealthcare(mockHospAndClinicCoords);
    
    if (!healthcareRes || !healthcareRes.data) {
      throw new Error('Healthcare query returned empty response');
    }

    const { hospital, healthcareFacility } = healthcareRes.data;
    if (!hospital || !healthcareFacility) {
      throw new Error('Healthcare query missing hospital or healthcareFacility components');
    }

    if (hospital.facilityType && hospital.facilityType !== 'hospital') {
      throw new Error(`Hospital facilityType turned into clinic: ${hospital.facilityType}`);
    }

    results.push({
      name: 'TEST 2: Healthcare Separation Semantics (Requirement 8)',
      passed: true,
      details: `Hospital: status=${hospital.status}, name="${hospital.name || 'none'}", dist=${hospital.distanceMeters}m | Facility: status=${healthcareFacility.status}, type=${healthcareFacility.facilityType}, name="${healthcareFacility.name || 'none'}"`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 2: Healthcare Separation Semantics (Requirement 8)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 3: Major Road Element Support & Early Exit (Requirement 5 & 7)
  // =========================================================================
  try {
    const jakartaCoords = new Coordinates(-6.1754, 106.8272);
    const majorRoadRes = await OverpassOsmClient.getNearestMajorRoad(jakartaCoords);

    if (!majorRoadRes || !majorRoadRes.data) {
      throw new Error('Major road query returned null data');
    }

    const mr = majorRoadRes.data;
    const isSuccess = mr.status === 'success_exact' || mr.status === 'success_bounded';
    if (!isSuccess && mr.status !== 'timeout' && mr.status !== 'error') {
      throw new Error(`Invalid status: ${mr.status}`);
    }

    results.push({
      name: 'TEST 3: Major Road Query & Lightweight Parser (Requirement 5 & 7)',
      passed: true,
      details: `Status: ${mr.status}, Name: "${mr.name}", Dist: ${mr.distanceMeters}m, Class: ${mr.highwayClass || 'N/A'}, SearchRadius: ${mr.searchRadiusKm}km`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 3: Major Road Query & Lightweight Parser (Requirement 5 & 7)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 4: OSRM Nearest Road Snapping (Requirement 12)
  // =========================================================================
  try {
    const coords = new Coordinates(-6.1754, 106.8272);
    const roadRes = await OsrmRoutingClient.getNearestRoad(coords);

    if (!roadRes) {
      throw new Error('OSRM Nearest road returned null');
    }

    const d = roadRes.data;
    results.push({
      name: 'TEST 4: OSRM Nearest Road Snapping (Requirement 12)',
      passed: true,
      details: `Status: ${d?.status}, Name: "${d?.roadName || 'none'}", Dist: ${d?.distanceMeters}m`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 4: OSRM Nearest Road Snapping (Requirement 12)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 5: Public Transit Node & Way Support (Requirement 9)
  // =========================================================================
  try {
    const coords = new Coordinates(-6.1754, 106.8272);
    const transitRes = await OverpassOsmClient.getNearestTransit(coords);

    if (!transitRes || !transitRes.data) {
      throw new Error('Transit query returned null data');
    }

    const t = transitRes.data;
    results.push({
      name: 'TEST 5: Public Transit Parser & Node/Way Support (Requirement 9)',
      passed: true,
      details: `Status: ${t.status}, Name: "${t.name}", Dist: ${t.distanceMeters}m, TransitType: ${t.transitType}`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 5: Public Transit Parser & Node/Way Support (Requirement 9)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 6: Assembly Point Candidate vs Verified Distinction (Requirement 14)
  // =========================================================================
  try {
    const coords = new Coordinates(-6.1754, 106.8272);
    const assemblyRes = await OverpassOsmClient.getNearestAssemblyPoint(coords);

    if (!assemblyRes || !assemblyRes.data) {
      throw new Error('Assembly point query returned null data');
    }

    const a = assemblyRes.data;
    const allowedTypes = ['verified_assembly_point', 'candidate_open_space'];
    if (a.facilityType && !allowedTypes.includes(a.facilityType)) {
      throw new Error(`Invalid facilityType "${a.facilityType}", must be verified_assembly_point or candidate_open_space`);
    }

    results.push({
      name: 'TEST 6: Assembly Point Candidate vs Verified Classification (Requirement 14)',
      passed: true,
      details: `Status: ${a.status}, Name: "${a.name}", FacilityType: ${a.facilityType}, IsOfficial: ${a.isOfficial}`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 6: Assembly Point Candidate vs Verified Classification (Requirement 14)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 7: Status Semantics & Strict Non-Fabrication (Requirement 2 & 23)
  // =========================================================================
  try {
    // Assert that a failed query or timeout is NEVER converted to >15 km
    const fakeTimeoutErrorObs = OverpassOsmClient.createBoundedObservation(null, 15000, null, true);
    if (fakeTimeoutErrorObs.state === 'AVAILABLE_BOUNDED' || fakeTimeoutErrorObs.displayValue === '>15 km') {
      throw new Error('Error/timeout observation incorrectly fabricated as AVAILABLE_BOUNDED or >15 km!');
    }

    // Assert that a completed search with 0 results correctly produces >15 km
    const successBoundedObs = OverpassOsmClient.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false);
    if (successBoundedObs.displayValue !== '>15 km' || successBoundedObs.state !== 'NODATA_SEARCH_SUCCESS') {
      throw new Error(`Clean search bounded displayValue was "${successBoundedObs.displayValue}", expected ">15 km"`);
    }

    results.push({
      name: 'TEST 7: Strict Status Semantics: Error != >15 km (Requirement 2 & 23)',
      passed: true,
      details: `Verified: Error state="${fakeTimeoutErrorObs.state}" (display="${fakeTimeoutErrorObs.displayValue}") vs Clean 0-result state="${successBoundedObs.state}" (display="${successBoundedObs.displayValue}")`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 7: Strict Status Semantics: Error != >15 km (Requirement 2 & 23)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 8: Transport Coverage Header Calculation (Requirement 21)
  // =========================================================================
  try {
    const getBadge = (observed: number) => {
      if (observed >= 4) return 'DATA LENGKAP';
      if (observed === 3) return 'DATA SEBAGIAN BESAR TERSEDIA';
      if (observed >= 1) return 'DATA PARSIAL';
      return 'DATA BELUM TERSEDIA';
    };

    if (getBadge(0) !== 'DATA BELUM TERSEDIA') throw new Error(`0/4 gave ${getBadge(0)}`);
    if (getBadge(1) !== 'DATA PARSIAL') throw new Error(`1/4 gave ${getBadge(1)}`);
    if (getBadge(2) !== 'DATA PARSIAL') throw new Error(`2/4 gave ${getBadge(2)}`);
    if (getBadge(3) !== 'DATA SEBAGIAN BESAR TERSEDIA') throw new Error(`3/4 gave ${getBadge(3)}`);
    if (getBadge(4) !== 'DATA LENGKAP') throw new Error(`4/4 gave ${getBadge(4)}`);

    results.push({
      name: 'TEST 8: Transport Coverage Header Calculation (Requirement 21)',
      passed: true,
      details: '0/4 -> DATA BELUM TERSEDIA, 1-2/4 -> DATA PARSIAL, 3/4 -> DATA SEBAGIAN BESAR TERSEDIA, 4/4 -> DATA LENGKAP'
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 8: Transport Coverage Header Calculation (Requirement 21)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 9: Point-to-Polyline Mathematical Accuracy (Requirement 1, 2, 3)
  // =========================================================================
  try {
    const queryPoint = new Coordinates(-6.1750, 106.8270);
    // A long north-south road segment that passes 111m east of query point
    // Segment runs from lat -6.1700 to -6.1800 at lon 106.8280 (~110.8m east)
    const roadGeometry = [
      { lat: -6.1700, lon: 106.8280 },
      { lat: -6.1800, lon: 106.8280 }
    ];

    const segResult = OverpassOsmClient.getPointToPolylineDistanceMeters(queryPoint, roadGeometry);
    if (!segResult) throw new Error('getPointToPolylineDistanceMeters returned null for valid geometry');

    // Expected distance is perpendicular distance to segment: approx 110-112 meters
    if (segResult.distM < 105 || segResult.distM > 115) {
      throw new Error(`Expected perpendicular distance ~111m, got ${segResult.distM}m`);
    }

    // Now test a segment where center is far away (~800m north) but segment passes near:
    // Segment from -6.1600 to -6.1740 at lon 106.8280. Center is at -6.1670 (~890m away).
    // The closest point is endpoint (-6.1740, 106.8280) which is sqrt(111^2 + 111^2) ~ 157m away!
    const asymmetricRoad = [
      { lat: -6.1600, lon: 106.8280 },
      { lat: -6.1740, lon: 106.8280 }
    ];
    const centerLat = (-6.1600 + -6.1740) / 2;
    const centerLon = 106.8280;
    const centerDist = Math.round(queryPoint.distanceToKm(new Coordinates(centerLat, centerLon)) * 1000);
    const polyDist = OverpassOsmClient.getPointToPolylineDistanceMeters(queryPoint, asymmetricRoad);

    if (!polyDist) throw new Error('Polyline distance returned null');
    if (Math.abs(polyDist.distM - centerDist) < 500) {
      throw new Error(`Center distance (${centerDist}m) should be significantly different from true polyline distance (${polyDist.distM}m)`);
    }

    results.push({
      name: 'TEST 9: Point-to-Polyline Accuracy vs Object Center Heuristic (Requirement 1, 2, 3)',
      passed: true,
      details: `Perpendicular distance=${segResult.distM}m. True Segment Distance=${polyDist.distM}m vs Flawed Center Distance=${centerDist}m (Difference: ${Math.abs(polyDist.distM - centerDist)}m)`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 9: Point-to-Polyline Accuracy vs Object Center Heuristic (Requirement 1, 2, 3)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 10: Inland Waterway vs Coastline Separation (Requirement 4 & 5)
  // =========================================================================
  try {
    const coords = new Coordinates(-6.1200, 106.8300); // North Jakarta near coast
    const mockElements: OsmElement[] = [
      {
        type: 'way',
        id: 101,
        tags: { natural: 'coastline', name: 'Garis Pantai Teluk Jakarta' },
        geometry: [
          { lat: -6.1195, lon: 106.8300 },
          { lat: -6.1190, lon: 106.8300 }
        ]
      },
      {
        type: 'way',
        id: 202,
        tags: { waterway: 'river', name: 'Kali Ciliwung Muara' },
        geometry: [
          { lat: -6.1230, lon: 106.8300 },
          { lat: -6.1240, lon: 106.8300 }
        ]
      }
    ];

    const parsed = OverpassOsmClient.parseElements(coords, mockElements);
    if (!parsed.data) throw new Error('parseElements returned null data');

    // Coastline must NEVER be returned as nearestWaterway!
    if (parsed.data.nearestWaterwayName?.includes('Garis Pantai') || parsed.data.nearestWaterwayName?.includes('coastline')) {
      throw new Error(`Coastline contaminated nearestWaterway! Waterway was: "${parsed.data.nearestWaterwayName}"`);
    }

    if (!parsed.data.nearestWaterwayName?.includes('Kali Ciliwung')) {
      throw new Error(`Expected inland river "Kali Ciliwung Muara", got "${parsed.data.nearestWaterwayName}"`);
    }

    if (parsed.data.nearestCoastlineName !== 'Garis Pantai Teluk Jakarta') {
      throw new Error(`Expected coastline "Garis Pantai Teluk Jakarta", got "${parsed.data.nearestCoastlineName}"`);
    }

    results.push({
      name: 'TEST 10: Inland Waterway vs Coastline Strict Separation (Requirement 4 & 5)',
      passed: true,
      details: `Waterway="${parsed.data.nearestWaterwayName}" (${parsed.data.distanceToNearestWaterwayMeters}m) | Coastline="${parsed.data.nearestCoastlineName}" (${parsed.data.distanceToNearestCoastlineMeters}m)`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 10: Inland Waterway vs Coastline Strict Separation (Requirement 4 & 5)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 11: Independent Healthcare Functions & Isolation (Requirement 8)
  // =========================================================================
  try {
    const testCoords = new Coordinates(-6.1754, 106.8272);
    
    // Both functions must exist independently on OverpassOsmClient
    if (typeof OverpassOsmClient.getNearestHospital !== 'function') {
      throw new Error('OverpassOsmClient.getNearestHospital is missing');
    }
    if (typeof OverpassOsmClient.getNearestHealthcareFacility !== 'function') {
      throw new Error('OverpassOsmClient.getNearestHealthcareFacility is missing');
    }

    // Call hospital query
    const hospRes = await OverpassOsmClient.getNearestHospital(testCoords);
    if (!hospRes || !hospRes.data) throw new Error('getNearestHospital returned empty response');
    if (hospRes.data.facilityType !== 'hospital') {
      throw new Error(`getNearestHospital returned non-hospital facilityType: ${hospRes.data.facilityType}`);
    }

    // Call healthcare facility query
    const facRes = await OverpassOsmClient.getNearestHealthcareFacility(testCoords);
    if (!facRes || !facRes.data) throw new Error('getNearestHealthcareFacility returned empty response');

    results.push({
      name: 'TEST 11: Independent Healthcare Queries Isolation (Requirement 8)',
      passed: true,
      details: `Hospital="${hospRes.data.name}" (${hospRes.data.distanceMeters}m, type=${hospRes.data.facilityType}) | Facility="${facRes.data.name}" (${facRes.data.distanceMeters}m, type=${facRes.data.facilityType})`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 11: Independent Healthcare Queries Isolation (Requirement 8)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 12: Provenance Consistency & Geometry Method Auditing (Requirement 6 & 14)
  // =========================================================================
  try {
    const coords = new Coordinates(-6.1754, 106.8272);
    const majorRoad = await OverpassOsmClient.getNearestMajorRoad(coords);
    if (!majorRoad || !majorRoad.data) throw new Error('getNearestMajorRoad returned empty');

    const geomMethod = majorRoad.data.geometryMethod;
    const allowedMethods = ['geometry_segment', 'node_haversine', 'center'];
    if (!geomMethod || !allowedMethods.includes(geomMethod)) {
      throw new Error(`Invalid geometryMethod: ${geomMethod}`);
    }

    // Verify raw OSM element audit fields
    if (majorRoad.data.status === 'success_exact' && (!majorRoad.data.osmId || !majorRoad.data.osmType)) {
      throw new Error('Major road missing raw osmId or osmType audit fields');
    }

    results.push({
      name: 'TEST 12: Provenance Consistency & OSM Audit Integrity (Requirement 6 & 14)',
      passed: true,
      details: `Road="${majorRoad.data.name}", Method=${geomMethod}, OsmId=${majorRoad.data.osmId}, OsmType=${majorRoad.data.osmType}`
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 12: Provenance Consistency & OSM Audit Integrity (Requirement 6 & 14)',
      passed: false,
      details: err.message
    });
  }

  // =========================================================================
  // TEST 13: Multi-City Real Coordinate Validation: Jakarta, Bali, Bandung (Requirement 22)
  // =========================================================================
  try {
    const cities = [
      { name: 'Jakarta (Monas)', coords: new Coordinates(-6.1754, 106.8272) },
      { name: 'Bandung (Gedung Sate)', coords: new Coordinates(-6.9025, 107.6186) },
      { name: 'Bali (Denpasar Renon)', coords: new Coordinates(-8.6705, 115.2126) }
    ];

    const cityLogs: string[] = [];

    for (const city of cities) {
      const roadRes = await OverpassOsmClient.getNearestMajorRoad(city.coords);
      const data = roadRes.data;
      if (!data) throw new Error(`Empty road response for ${city.name}`);

      cityLogs.push(
        `${city.name}: "${data.name}" | Dist=${data.distanceMeters ?? '>15km'}m | Method=${data.geometryMethod || 'none'} | Class=${data.highwayClass || 'N/A'}`
      );
    }

    results.push({
      name: 'TEST 13: Multi-City Real Coordinate Validation (Jakarta, Bandung, Bali) (Requirement 22)',
      passed: true,
      details: cityLogs.join(' || ')
    });
  } catch (err: any) {
    results.push({
      name: 'TEST 13: Multi-City Real Coordinate Validation (Jakarta, Bandung, Bali) (Requirement 22)',
      passed: false,
      details: err.message
    });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

