import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { NasaFirmsClient } from '../infrastructure/external_apis/NasaFirmsClient';

export function runNasaFirmsClientTests() {
  console.log('=== TEST SUITE: NasaFirmsClient ===');

  const siteCoords = new Coordinates(-2.5934, 113.3421); // Tampelas, Central Kalimantan

  // Sample NASA FIRMS CSV response format:
  // latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
  const sampleCsv = `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
-2.6100,113.3600,345.2,0.4,0.4,2026-08-30,0630,N,VIIRS,nominal,2.0NRT,298.5,14.8,D
-2.5500,113.3100,332.1,0.5,0.4,2026-08-28,0715,N,VIIRS,nominal,2.0NRT,295.2,8.4,D
-1.2000,115.4000,360.5,0.4,0.4,2026-08-29,0630,N,VIIRS,nominal,2.0NRT,301.0,45.2,D`;

  // Test 1: CSV parsing and distance filtering (50 km radius)
  const detections50km = NasaFirmsClient.parseCsvDetections(sampleCsv, siteCoords, 50);

  if (detections50km.length === 2) {
    console.log(`✓ PASS: FIRMS 50km radius filter correctly selected 2 detections (filtered out distant detection)`);
  } else {
    console.error(`✗ FAIL: FIRMS radius filtering failed (${detections50km.length} vs expected 2)`);
  }

  // Test 2: Geodesic Distance Calculation
  const nearest = detections50km.reduce((prev, curr) => (prev.distanceKm < curr.distanceKm ? prev : curr));
  if (nearest.distanceKm < 10) {
    console.log(`✓ PASS: Nearest hotspot distance calculated (${nearest.distanceKm} km from site)`);
  } else {
    console.error('✗ FAIL: Geodesic distance calculation error');
  }

  // Test 3: FRP Metrics
  const frpValues = detections50km.map((d) => d.frp);
  const maxFrp = Math.max(...frpValues);
  const meanFrp = Number((frpValues.reduce((a, b) => a + b, 0) / frpValues.length).toFixed(1));

  if (maxFrp === 14.8) {
    console.log(`✓ PASS: Maximum FRP verified (${maxFrp} MW)`);
  } else {
    console.error('✗ FAIL: Max FRP mismatch');
  }

  if (meanFrp === 11.6) {
    console.log(`✓ PASS: Mean FRP verified (${meanFrp} MW)`);
  } else {
    console.error(`✗ FAIL: Mean FRP mismatch (${meanFrp} vs 11.6)`);
  }

  // Test 4: GeoJSON parser
  const sampleGeoJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [113.35, -2.60] },
        properties: { frp: 18.5, acq_date: '2026-08-30', acq_time: '0430', satellite: 'VIIRS' }
      }
    ]
  };

  const geoJsonDetections = NasaFirmsClient.parseGeoJsonDetections(sampleGeoJson, siteCoords, 50);
  if (geoJsonDetections.length === 1 && geoJsonDetections[0].frp === 18.5) {
    console.log('✓ PASS: FIRMS GeoJSON parser verified');
  } else {
    console.error('✗ FAIL: FIRMS GeoJSON parser failed');
  }

  console.log('=== NasaFirmsClient Tests Completed ===\n');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runNasaFirmsClientTests();
}
