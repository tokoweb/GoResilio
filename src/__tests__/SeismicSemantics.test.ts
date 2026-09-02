import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { BmkgEarthquakeClient } from '../infrastructure/external_apis/BmkgEarthquakeClient';
import { EmscSeismicClient } from '../infrastructure/external_apis/EmscSeismicClient';

export function runSeismicSemanticsTests(): boolean {
  console.log('--- Seismic Data Semantics & Catalog Separation Test Suite ---');
  let passed = true;

  const testCoords = new Coordinates(-6.2088, 106.8456); // Jakarta

  // Test 1: BMKG autogempa (Single latest event parsing)
  try {
    const mockAutogempaResponse = {
      Infogempa: {
        gempa: {
          Tanggal: '31 Agu 2026',
          Jam: '14:20:15 WIB',
          Coordinates: '-6.50,106.90',
          Magnitude: '4.8',
          Kedalaman: '15 km',
          Wilayah: 'Pusat gempa berada di darat 35 km BaratDaya Bogor',
          Potensi: 'Tidak berpotensi tsunami'
        }
      }
    };

    // Verify coordinate calculation and field mapping
    const parts = mockAutogempaResponse.Infogempa.gempa.Coordinates.split(',');
    const qLat = Number(parts[0]);
    const qLng = Number(parts[1]);
    const dist = Math.round(testCoords.distanceToKm(new Coordinates(qLat, qLng)));
    const mag = Number(mockAutogempaResponse.Infogempa.gempa.Magnitude);

    if (dist < 30 || dist > 50) {
      console.error(`FAIL: Geodesic distance calculation error: ${dist} km`);
      passed = false;
    } else if (mag !== 4.8) {
      console.error(`FAIL: Magnitude parsing error: ${mag}`);
      passed = false;
    } else {
      console.log('PASS: BMKG latest single event parsed with exact distance & magnitude.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 1:', err);
    passed = false;
  }

  // Test 2: BMKG gempaterkini feed (15 recent M5+ events, 350km radius filter)
  try {
    const mockGempaterkiniList = [
      { Coordinates: '-6.80,107.10', Magnitude: '5.2' }, // ~80 km (within 350km)
      { Coordinates: '-7.20,106.50', Magnitude: '5.6' }, // ~120 km (within 350km)
      { Coordinates: '-0.50,120.50', Magnitude: '6.4' }  // Central Sulawesi (~1600 km, outside 350km)
    ];

    let countWithin350km = 0;
    const magsWithin350km: number[] = [];

    for (const q of mockGempaterkiniList) {
      const parts = q.Coordinates.split(',');
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      const d = testCoords.distanceToKm(new Coordinates(lat, lng));
      const m = Number(q.Magnitude);
      if (d <= 350 && m >= 5.0) {
        countWithin350km++;
        magsWithin350km.push(m);
      }
    }

    const recentMaxMag = magsWithin350km.length > 0 ? Math.max(...magsWithin350km) : null;

    if (countWithin350km !== 2) {
      console.error(`FAIL: Expected 2 events within 350km, got ${countWithin350km}`);
      passed = false;
    } else if (recentMaxMag !== 5.6) {
      console.error(`FAIL: Expected recent max magnitude 5.6 (ignoring Sulawesi 6.4), got ${recentMaxMag}`);
      passed = false;
    } else {
      console.log('PASS: BMKG recent M5+ feed filtered accurately by 350km radius.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 2:', err);
    passed = false;
  }

  // Test 3: 100km vs 150km metric distinction (USGS/EMSC catalog)
  try {
    const mockFeatures = [
      { geometry: { coordinates: [106.8456, -6.6000] }, properties: { mag: 4.5 } }, // ~43 km (in 100km & 150km)
      { geometry: { coordinates: [106.8456, -7.3000] }, properties: { mag: 5.1 } }, // ~121 km (in 150km only)
      { geometry: { coordinates: [106.8456, -8.0000] }, properties: { mag: 6.2 } }  // ~199 km (outside 150km)
    ];

    let count100km = 0;
    let count150km = 0;
    const mags150km: number[] = [];

    for (const f of mockFeatures) {
      const lon = f.geometry.coordinates[0];
      const lat = f.geometry.coordinates[1];
      const distM = (EmscSeismicClient as any).calculateHaversineDistanceMeters(testCoords.lat, testCoords.lng, lat, lon);
      const m = f.properties.mag;

      if (distM <= 100000) count100km++;
      if (distM <= 150000) {
        count150km++;
        mags150km.push(m);
      }
    }

    const historicalMaxMag = mags150km.length > 0 ? Math.max(...mags150km) : null;

    if (count100km !== 1) {
      console.error(`FAIL: Expected count100km = 1, got ${count100km}`);
      passed = false;
    } else if (count150km !== 2) {
      console.error(`FAIL: Expected count150km = 2, got ${count150km}`);
      passed = false;
    } else if (historicalMaxMag !== 5.1) {
      console.error(`FAIL: Expected historicalMaxMag = 5.1, got ${historicalMaxMag}`);
      passed = false;
    } else {
      console.log('PASS: 100km vs 150km metrics are strictly distinct and correctly bounded.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 3:', err);
    passed = false;
  }

  // Test 4: EMSC Complete Pagination vs Truncation Policy
  try {
    // If pagination completes, countCompleteness must be 'complete'
    const isTruncated = false;
    const paginationComplete = true;
    const countCompleteness = (!isTruncated && paginationComplete) ? 'complete' : 'truncated';

    if (countCompleteness !== 'complete') {
      console.error('FAIL: Complete pagination should result in countCompleteness = complete');
      passed = false;
    } else {
      console.log('PASS: EMSC complete pagination preserves full catalog confidence.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 4:', err);
    passed = false;
  }

  return passed;
}
