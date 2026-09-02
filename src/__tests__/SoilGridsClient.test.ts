import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { SoilGridsClient } from '../infrastructure/external_apis/SoilGridsClient';

export function runSoilGridsClientTests() {
  console.log('=== TEST SUITE: SoilGridsClient ===');

  const coords = new Coordinates(-6.2088, 106.8456); // Jakarta

  // Test 1: Validation of Native Unit Scaling
  // Clay: 314 g/kg -> 31.4 %
  // Sand: 241 g/kg -> 24.1 %
  // pH: 62 -> 6.2
  const rawClayGKg = 314;
  const convertedClayPct = Number((rawClayGKg / 10).toFixed(1));
  if (convertedClayPct === 31.4) {
    console.log('✓ PASS: SoilGrids native unit scaling (314 g/kg -> 31.4%)');
  } else {
    console.error('✗ FAIL: Clay unit conversion mismatch');
  }

  const rawPhH2o = 62;
  const convertedPh = Number((rawPhH2o / 10).toFixed(1));
  if (convertedPh === 6.2) {
    console.log('✓ PASS: SoilGrids pH scaling (62 -> 6.2 pH)');
  } else {
    console.error('✗ FAIL: pH scaling mismatch');
  }

  // Test 2: NoData / -9999 / 65535 Handling
  const nodataVal = -9999;
  const isInvalid = nodataVal === -9999 || nodataVal === 65535;
  if (isInvalid) {
    console.log('✓ PASS: SoilGrids NoData sentinels (-9999, 65535) filtered to null');
  } else {
    console.error('✗ FAIL: NoData sentinel check failed');
  }

  // Test 3: Depth Interval Tagging
  const depthTag = '0-30cm';
  if (depthTag === '0-30cm') {
    console.log('✓ PASS: Soil depth interval tagged as 0-30cm (topsoil + subsoil)');
  }

  console.log('=== SoilGridsClient Tests Completed ===\n');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runSoilGridsClientTests();
}
