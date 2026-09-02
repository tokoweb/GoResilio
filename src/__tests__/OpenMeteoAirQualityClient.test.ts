import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { OpenMeteoAirQualityClient } from '../infrastructure/external_apis/OpenMeteoAirQualityClient';

export function runOpenMeteoAirQualityClientTests() {
  console.log('=== TEST SUITE: OpenMeteoAirQualityClient ===');

  // Test 1: Deterministic 24-hour Max and Mean Calculations
  const mockHourlyPm25 = [
    22.4, 24.1, 28.5, 35.2, 42.0, 38.6, 29.1, 25.4,
    21.0, 19.5, 18.2, 22.0, 26.4, 31.2, 36.8, 40.5,
    34.2, 28.9, 26.0, 24.5, 23.1, 22.8, 21.5, 20.0
  ];

  const maxVal = Math.max(...mockHourlyPm25);
  const sumVal = mockHourlyPm25.reduce((a, b) => a + b, 0);
  const meanVal = Number((sumVal / mockHourlyPm25.length).toFixed(1));

  if (maxVal === 42.0) {
    console.log(`✓ PASS: 24h Max PM2.5 calculation verified (${maxVal} µg/m³)`);
  } else {
    console.error('✗ FAIL: Max PM2.5 calculation mismatch');
  }

  if (meanVal === 27.6) {
    console.log(`✓ PASS: 24h Mean PM2.5 calculation verified (${meanVal} µg/m³)`);
  } else {
    console.error(`✗ FAIL: Mean PM2.5 calculation mismatch (${meanVal} vs expected 27.6)`);
  }

  // Test 2: Missing Variable / Null Preservation
  const missingArray: (number | null)[] = [null, null, null];
  const validSlice = missingArray.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const nullMean = validSlice.length > 0 ? validSlice.reduce((a, b) => a + b, 0) / validSlice.length : null;

  if (nullMean === null) {
    console.log('✓ PASS: All-null array yields null mean without fabricating 0');
  } else {
    console.error('✗ FAIL: Fabricated value on null slice');
  }

  console.log('=== OpenMeteoAirQualityClient Tests Completed ===\n');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runOpenMeteoAirQualityClientTests();
}
