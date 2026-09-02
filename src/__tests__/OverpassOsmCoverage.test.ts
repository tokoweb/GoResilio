import { OverpassOsmClient } from '../infrastructure/external_apis/OverpassOsmClient';
import { Coordinates } from '../domain/value_objects/Coordinates.vo';

export function runOverpassOsmCoverageTests(): boolean {
  console.log('--- OverpassOsm Coverage & Spatial Discovery Test Suite ---');
  let passed = true;

  const testCoords = new Coordinates(-6.2088, 106.8456); // Jakarta Pusat

  // Test 1: Feature parsing within first radius (Waterway within 2.5km)
  try {
    const mockElementsFirstRadius = [
      {
        type: 'way',
        id: 101,
        tags: { waterway: 'canal', name: 'Kali Ciliwung' },
        geometry: [
          { lat: -6.2090, lon: 106.8450 },
          { lat: -6.2095, lon: 106.8460 }
        ]
      },
      {
        type: 'node',
        id: 201,
        lat: -6.2120,
        lon: 106.8480,
        tags: { amenity: 'hospital', name: 'RSUD Pasar Minggu' }
      }
    ];

    // Call private parseElements via reflection/casting for unit test
    const parsed = (OverpassOsmClient as any).parseElements(testCoords, mockElementsFirstRadius);
    if (!parsed || parsed.data.distanceToNearestWaterwayMeters === null || parsed.data.distanceToNearestWaterwayMeters > 2500) {
      console.error('FAIL: Waterway within first radius not correctly parsed');
      passed = false;
    } else if (parsed.data.nearestWaterwayName !== 'Kali Ciliwung') {
      console.error(`FAIL: Expected 'Kali Ciliwung', got '${parsed.data.nearestWaterwayName}'`);
      passed = false;
    } else {
      console.log('PASS: Waterway within first radius correctly parsed with exact name.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 1:', err);
    passed = false;
  }

  // Test 2: Feature found only in extended radius (e.g. Hospital at 12km)
  try {
    const mockElementsExtended = [
      {
        type: 'node',
        id: 202,
        lat: -6.1088, // ~11km north
        lon: 106.8456,
        tags: { amenity: 'hospital', name: 'RSUD Koja' }
      }
    ];

    const parsed = (OverpassOsmClient as any).parseElements(testCoords, mockElementsExtended);
    if (!parsed || parsed.data.distanceToHospitalMeters === null || parsed.data.distanceToHospitalMeters < 10000 || parsed.data.distanceToHospitalMeters > 15000) {
      console.error(`FAIL: Extended radius hospital (10-15km) parsing failed. Distance: ${parsed?.data?.distanceToHospitalMeters}`);
      passed = false;
    } else if (parsed.data.nearestHospitalName !== 'RSUD Koja') {
      console.error(`FAIL: Expected 'RSUD Koja', got '${parsed.data.nearestHospitalName}'`);
      passed = false;
    } else {
      console.log('PASS: Hospital in extended radius (10-15km) correctly resolved.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 2:', err);
    passed = false;
  }

  // Test 3: Genuine No-Data (No features in radius)
  try {
    const emptyElements: any[] = [];
    const parsed = (OverpassOsmClient as any).parseElements(testCoords, emptyElements);

    if (parsed.data.distanceToNearestWaterwayMeters !== null) {
      console.error('FAIL: Waterway distance should be null when empty');
      passed = false;
    } else if (parsed.data.distanceToHospitalMeters !== null) {
      console.error('FAIL: Hospital distance should be null when empty');
      passed = false;
    } else if (!parsed.data.nearestWaterwayName.includes('Tidak terdeteksi dalam radius 5.0 km')) {
      console.error(`FAIL: Expected 'Tidak terdeteksi...', got '${parsed.data.nearestWaterwayName}'`);
      passed = false;
    } else {
      console.log('PASS: Genuine no-data preserves strict null distance and clear radius indicator.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 3:', err);
    passed = false;
  }

  // Test 4: Unnamed feature (No synthetic names like "Gang Akses" or "Jalan Utama")
  try {
    const unnamedElements = [
      {
        type: 'way',
        id: 301,
        tags: { waterway: 'drain' }, // No name tag
        geometry: [
          { lat: -6.2089, lon: 106.8455 },
          { lat: -6.2091, lon: 106.8457 }
        ]
      },
      {
        type: 'way',
        id: 302,
        tags: { highway: 'primary' }, // No name tag
        geometry: [
          { lat: -6.2090, lon: 106.8460 },
          { lat: -6.2092, lon: 106.8462 }
        ]
      }
    ];

    const parsed = (OverpassOsmClient as any).parseElements(testCoords, unnamedElements);
    if (parsed.data.nearestWaterwayName.includes('Gang Akses') || parsed.data.nearestWaterwayName.includes('Jalan Utama')) {
      console.error('FAIL: Inaccurate synthetic name found in unnamed waterway');
      passed = false;
    } else if (parsed.data.nearestArterialName.includes('Gang Akses') || parsed.data.nearestArterialName.includes('Jalan Utama')) {
      console.error('FAIL: Inaccurate synthetic name found in unnamed arterial');
      passed = false;
    } else {
      console.log('PASS: Unnamed features do not invent synthetic names.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 4:', err);
    passed = false;
  }

  // Test 5: OSM Green-feature ratio calculation
  try {
    const mixedElements = [
      { type: 'way', id: 401, center: { lat: -6.2088, lon: 106.8456 }, tags: { leisure: 'park', name: 'Taman Suropati' } },
      { type: 'way', id: 402, center: { lat: -6.2088, lon: 106.8456 }, tags: { landuse: 'residential' } },
      { type: 'way', id: 403, center: { lat: -6.2088, lon: 106.8456 }, tags: { landuse: 'commercial' } },
      { type: 'way', id: 404, center: { lat: -6.2088, lon: 106.8456 }, tags: { landuse: 'industrial' } }
    ];

    const parsed = (OverpassOsmClient as any).parseElements(testCoords, mixedElements);
    // 1 green out of 4 total land-cover features = 25%
    if (parsed.data.greenFeatureRatioPct === null || parsed.data.greenFeatureRatioPct !== 25) {
      console.error(`FAIL: Expected 25% green feature ratio, got ${parsed.data.greenFeatureRatioPct}%`);
      passed = false;
    } else {
      console.log('PASS: OSM green-feature count ratio accurately computed (25%).');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 5:', err);
    passed = false;
  }

  return passed;
}
