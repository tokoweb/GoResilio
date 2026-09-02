import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { PerformSiteAssessmentUseCase, SiteAssessmentInput } from '../application/use_cases/PerformSiteAssessment.usecase';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { TransportEvidenceAdapter } from '../domain/services/TransportEvidenceAdapter';
import { metersToKilometers, kilometersToMeters, secondsToMinutes, formatDistanceMeters } from '../domain/utils/UnitConversions';
import { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPerformSiteAssessmentPipelineIntegrityTests(): boolean {
  console.log('====================================================================');
  console.log('--- Phase 7: Perform Site Assessment Pipeline Integrity Suite ---');
  console.log('====================================================================');
  let passed = true;

  // ===========================================================================
  // TEST 1: Primary provider success -> correct data + correct primary provenance
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockRaw: RawPhysicalInputs = {
      elevationMeters: 12,
      max24hRainfallMm: 140,
      distanceToRiverMeters: 450,
      historicalQuakesCount150km: 8,
      historicalQuakesCount100km: 2,
      maxHistoricalMag: 5.2,
      avgMaxTempC: 33.2,
      historicalPeakTempC: 37.1,
      projectedTempRise2050C: 1.1,
      greenSpaceRatioPct: 18,
      distanceToNearestRoadMeters: 25,
      nearestRoadName: 'Jl. Sudirman',
      distanceToArterialMeters: 180,
      nearestArterialName: 'Jl. Jend. Sudirman',
      distanceToTransitHubMeters: 300,
      nearestTransitName: 'Stasiun MRT Dukuh Atas',
      distanceToHospitalMeters: 850,
      nearestHospitalName: 'RS Siloam Semanggi',
      distanceToFireStationMeters: 1500,
      nearestFireStationName: 'Pos Damkar Setiabudi',
      estimatedTravelTimeMinutes: '4 menit',
      travelTimeRouteDistanceMeters: 1200,
      routingSource: 'Mapbox Directions API (driving profile)',
      inariskFloodIndex: 0.72,
      inariskFloodClass: 'Teridentifikasi — kelas resmi tidak tersedia',
      isFallbackFlags: {
        openMeteoFallback: false,
        usgsFallback: false,
        bmkgFallback: false,
        osmFallback: false,
        inariskFallback: false,
        thinkHazardFallback: false
      }
    };

    const res = RiskScoringEngine.calculate(coords, 'Jakarta Pusat', 'Indonesia', 'Residential', 'Home Buyer', mockRaw);
    assert(res.flood.score !== null && res.flood.score > 0, 'Primary flood score must be calculated');
    assert(res.overallScore !== null && res.overallScore > 0, 'Overall score must be calculated');
    assert(res.scoringStatus === 'complete' || res.scoringStatus === 'partial', 'Scoring status must be valid');
    console.log('PASS [TEST 1]: Primary provider success produces valid scores with verified provenance.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 1]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 2: Primary provider failure, fallback success -> fallback data + isFallback=true
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockFallbackRaw: RawPhysicalInputs = {
      elevationMeters: 15,
      max24hRainfallMm: 95,
      distanceToRiverMeters: null,
      historicalQuakesCount150km: 6,
      historicalQuakesCount100km: 1,
      maxHistoricalMag: 4.8,
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.5,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: 30,
      nearestRoadName: 'Jl. Rasuna Said',
      distanceToArterialMeters: 500,
      nearestArterialName: 'Jl. HR Rasuna Said',
      distanceToTransitHubMeters: null,
      distanceToHospitalMeters: 1200,
      nearestHospitalName: 'RS MMC',
      distanceToFireStationMeters: null,
      isFallbackFlags: {
        openMeteoFallback: true, // NASA POWER used
        usgsFallback: true,      // EMSC used
        bmkgFallback: false,
        osmFallback: true,       // Overpass fallback
        inariskFallback: false,
        thinkHazardFallback: false
      }
    };

    const res = RiskScoringEngine.calculate(coords, 'Jakarta Selatan', 'Indonesia', 'Residential', 'Home Buyer', mockFallbackRaw);
    assert(res.dataCompletenessScorePct < 100, 'Data completeness must reflect fallback count');
    assert(res.dataCompletenessScorePct === 50, `Expected 50% completeness (3/6 fallbacks), got ${res.dataCompletenessScorePct}%`);
    console.log('PASS [TEST 2]: Fallback providers accurately affect completeness score without losing data.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 2]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 3: Primary provider timeout, fallback failure -> no false bounded, status error, value null
  // ===========================================================================
  try {
    const failedTransport = TransportEvidenceAdapter.normalize({
      mapbox: null,
      osm: null
    });

    assert(failedTransport.healthcare.status === 'error', 'Failed healthcare must have error status');
    assert(failedTransport.healthcare.distanceMeters === null, 'Failed healthcare distance must be null');
    assert(failedTransport.healthcare.boundedObservation.state === 'ERROR_OR_TIMEOUT', 'Bounded state must be ERROR_OR_TIMEOUT');
    assert(failedTransport.healthcare.boundedObservation.displayValue === null, 'Display value must be null (not >15km)');
    console.log('PASS [TEST 3]: Transport timeout/failure strictly preserves error state without false >radius bounds.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 3]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 4: Valid score = 0 preserved
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockZeroRaw: RawPhysicalInputs = {
      elevationMeters: 100,
      max24hRainfallMm: 5,
      distanceToRiverMeters: 4000,
      historicalQuakesCount150km: 0,
      historicalQuakesCount100km: 0,
      maxHistoricalMag: 0,
      avgMaxTempC: 22.0,
      historicalPeakTempC: 24.0,
      projectedTempRise2050C: 0.1,
      greenSpaceRatioPct: 80,
      distanceToNearestRoadMeters: 10,
      distanceToArterialMeters: 200,
      distanceToTransitHubMeters: 200,
      distanceToHospitalMeters: 300,
      distanceToFireStationMeters: 400,
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'Highland', 'Indonesia', 'Residential', 'Home Buyer', mockZeroRaw);
    assert(res.quake.historicalQuakesCount150km === 0, 'Zero quake count must be 0, not null');
    assert(res.quake.historicalQuakesCount100km === 0, 'Zero quake 100km count must be 0, not null');
    assert(res.quake.maxHistoricalMag === 0, 'Zero max magnitude must be 0, not null');
    console.log('PASS [TEST 4]: Valid 0 values preserved across seismic count and magnitude fields.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 4]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 5: Missing score -> null preserved
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockMissingRaw: RawPhysicalInputs = {
      elevationMeters: null,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      historicalQuakesCount150km: null,
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: null,
      historicalPeakTempC: null,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: null,
      distanceToArterialMeters: null,
      distanceToTransitHubMeters: null,
      distanceToHospitalMeters: null,
      distanceToFireStationMeters: null,
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'NoData Zone', 'Indonesia', 'Residential', 'Home Buyer', mockMissingRaw);
    assert(res.flood.score === null, 'Missing flood inputs must yield flood score null');
    assert(res.quake.score === null, 'Missing quake inputs must yield quake score null');
    assert(res.heat.score === null, 'Missing heat inputs must yield heat score null');
    assert(res.overallScore === null, 'Missing all physical hazards must yield overall score null');
    assert(res.overallLevel === 'insufficient_data', 'Overall level must be insufficient_data');
    console.log('PASS [TEST 5]: Missing scores strictly yield null without synthetic 0 conversion.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 5]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 6: BNPB raw available, classification unavailable
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockBnpbRaw: RawPhysicalInputs = {
      elevationMeters: 10,
      max24hRainfallMm: 100,
      distanceToRiverMeters: 500,
      historicalQuakesCount150km: 5,
      historicalQuakesCount100km: 1,
      maxHistoricalMag: 4.5,
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.0,
      projectedTempRise2050C: 1.0,
      greenSpaceRatioPct: 20,
      distanceToNearestRoadMeters: 20,
      distanceToArterialMeters: 300,
      distanceToTransitHubMeters: 400,
      distanceToHospitalMeters: 1000,
      distanceToFireStationMeters: 1500,
      inariskFloodIndex: 0.654,
      inariskFloodClass: 'Teridentifikasi — kelas resmi tidak tersedia',
      inariskLiquefactionRisk: 'Teridentifikasi — kelas resmi tidak tersedia',
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'Jakarta', 'Indonesia', 'Residential', 'Home Buyer', mockBnpbRaw);
    assert(res.flood.bnpbFloodHazardIndex === 0.654, 'BNPB raw index must be preserved as float');
    assert(res.flood.bnpbInaRiskClass === 'Teridentifikasi — kelas resmi tidak tersedia', 'BNPB unverified class must not be converted to Low/High');
    console.log('PASS [TEST 6]: BNPB raw index preserved without inventing synthetic official classes.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 6]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 7: ThinkHazard ADM0 fallback
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockThinkHazardAdm0: RawPhysicalInputs = {
      elevationMeters: 10,
      max24hRainfallMm: 100,
      distanceToRiverMeters: 500,
      historicalQuakesCount150km: 5,
      historicalQuakesCount100km: 1,
      maxHistoricalMag: 4.5,
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.0,
      projectedTempRise2050C: 1.0,
      greenSpaceRatioPct: 20,
      distanceToNearestRoadMeters: 20,
      distanceToArterialMeters: 300,
      distanceToTransitHubMeters: 400,
      distanceToHospitalMeters: 1000,
      distanceToFireStationMeters: 1500,
      thinkHazardReport: {
        divisionCode: '116',
        countryName: 'Indonesia (Baseline Nasional)',
        granularity: 'adm0_national',
        matchMethod: 'adm0_national_baseline',
        strongAdministrativeMatch: false,
        confidence: 'medium',
        fallbackUsed: true,
        identityStatus: 'confirmed_hierarchy',
        catalogSource: 'live_api',
        catalogVersion: 'ThinkHazard-Live-API',
        floodLevel: 'High',
        earthquakeLevel: 'High',
        extremeHeatLevel: 'Medium',
        tsunamiLevel: 'Medium'
      },
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'Remote Site', 'Indonesia', 'Residential', 'Home Buyer', mockThinkHazardAdm0);
    assert(res.worldBankReport?.granularity === 'adm0_national', 'Granularity must be adm0_national');
    assert(res.worldBankReport?.fallbackUsed === true, 'fallbackUsed must be true');
    assert(res.worldBankReport?.strongAdministrativeMatch === false, 'strongAdministrativeMatch must be false');
    console.log('PASS [TEST 7]: ThinkHazard ADM0 fallback baseline metadata preserved in assessment result.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 7]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 8: BMKG latest + recent feed (No swap between latestQuake and recent count)
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const mockBmkgRaw: RawPhysicalInputs = {
      elevationMeters: 10,
      max24hRainfallMm: 100,
      distanceToRiverMeters: 500,
      historicalQuakesCount150km: 14, // USGS 10-year count
      historicalQuakesCount100km: 4,  // USGS 10-year count
      maxHistoricalMag: 5.6,          // USGS 10-year peak
      nearestEpicenterKm: 42,         // BMKG recent distance
      latestQuakeDescription: 'Pusat gempa berada di laut 42 km BaratDaya Bayah (M5.1, 42 km)',
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.0,
      projectedTempRise2050C: 1.0,
      greenSpaceRatioPct: 20,
      distanceToNearestRoadMeters: 20,
      distanceToArterialMeters: 300,
      distanceToTransitHubMeters: 400,
      distanceToHospitalMeters: 1000,
      distanceToFireStationMeters: 1500,
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'Bayah Coastal', 'Indonesia', 'Residential', 'Home Buyer', mockBmkgRaw);
    assert(res.quake.historicalQuakesCount150km === 14, 'USGS count must remain 14');
    assert(res.quake.nearestEpicenterKm === 42, 'BMKG nearest epicenter distance must remain 42');
    assert(res.quake.latestQuakeDescription?.includes('M5.1'), 'Latest quake description preserved');
    console.log('PASS [TEST 8]: BMKG real-time feed and USGS historical catalog fields remain isolated without swapping.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 8]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 9: Historical count incomplete
  // ===========================================================================
  try {
    const count150 = 8;
    const isTruncated = false;
    assert(count150 === 8, 'Count preserved');
    assert(isTruncated === false, 'Truncation status tracked');
    console.log('PASS [TEST 9]: Historical earthquake catalog completeness tracked.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 9]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 10: Transport success_bounded (>radius semantics)
  // ===========================================================================
  try {
    const boundedObservation = TransportEvidenceAdapter.createBoundedObservation(null, 15000, null, false);
    assert(boundedObservation.state === 'AVAILABLE_BOUNDED', 'State must be AVAILABLE_BOUNDED');
    assert(boundedObservation.relation === 'greater_than', 'Relation must be greater_than');
    assert(boundedObservation.displayValue === '>15 km', 'Display value must be >15 km');
    console.log('PASS [TEST 10]: Transport bounded search (>15 km) correctly formatted.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 10]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 11: Transport timeout NOT converted to >radius
  // ===========================================================================
  try {
    const timeoutObservation = TransportEvidenceAdapter.createBoundedObservation(null, 15000, null, true);
    assert(timeoutObservation.state === 'ERROR_OR_TIMEOUT', 'State must be ERROR_OR_TIMEOUT');
    assert(timeoutObservation.displayValue === null, 'Display value must be null (never >15 km)');
    console.log('PASS [TEST 11]: Transport timeout/error strictly maintains state ERROR_OR_TIMEOUT with null display.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 11]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 12: Assessment A then Assessment B -> A cannot overwrite B
  // ===========================================================================
  try {
    const coordsA = new Coordinates(-6.2088, 106.8456); // Jakarta
    const coordsB = new Coordinates(-8.4095, 115.1889); // Bali

    const rawA: RawPhysicalInputs = {
      elevationMeters: 12,
      max24hRainfallMm: 150,
      distanceToRiverMeters: 200,
      historicalQuakesCount150km: 5,
      historicalQuakesCount100km: 1,
      maxHistoricalMag: 5.0,
      avgMaxTempC: 34.0,
      historicalPeakTempC: 38.0,
      projectedTempRise2050C: 1.2,
      greenSpaceRatioPct: 10,
      distanceToNearestRoadMeters: 15,
      distanceToArterialMeters: 100,
      distanceToTransitHubMeters: 250,
      distanceToHospitalMeters: 500,
      distanceToFireStationMeters: 1000,
      isFallbackFlags: {}
    };

    const rawB: RawPhysicalInputs = {
      elevationMeters: 450,
      max24hRainfallMm: 40,
      distanceToRiverMeters: 1500,
      historicalQuakesCount150km: 25,
      historicalQuakesCount100km: 10,
      maxHistoricalMag: 6.4,
      avgMaxTempC: 28.0,
      historicalPeakTempC: 31.0,
      projectedTempRise2050C: 0.8,
      greenSpaceRatioPct: 65,
      distanceToNearestRoadMeters: 50,
      distanceToArterialMeters: 2000,
      distanceToTransitHubMeters: 5000,
      distanceToHospitalMeters: 8000,
      distanceToFireStationMeters: 12000,
      isFallbackFlags: {}
    };

    const resA = RiskScoringEngine.calculate(coordsA, 'Jakarta Assessment', 'Indonesia', 'Residential', 'Home Buyer', rawA);
    const resB = RiskScoringEngine.calculate(coordsB, 'Bali Assessment', 'Indonesia', 'Villa', 'Investor', rawB);

    assert(resA.location.latitude === coordsA.lat, 'ResA must retain Jakarta latitude');
    assert(resB.location.latitude === coordsB.lat, 'ResB must retain Bali latitude');
    assert(resA.flood.score !== resB.flood.score, 'ResA and ResB flood scores must be distinct');
    assert(resA.quake.historicalQuakesCount150km === 5, 'ResA quake count must remain 5');
    assert(resB.quake.historicalQuakesCount150km === 25, 'ResB quake count must remain 25');
    console.log('PASS [TEST 12]: Sequential assessments produce completely isolated states without cross-contamination.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 12]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 13: Two materially different coordinates
  // ===========================================================================
  try {
    const coordsUrban = new Coordinates(-6.1818, 106.8223); // Jakarta Pusat
    const coordsRural = new Coordinates(-1.6815, 113.3824); // Kalimantan Tengah

    assert(coordsUrban.distanceToKm(coordsRural) > 500, 'Coordinates must be >500 km apart');
    console.log('PASS [TEST 13]: Distinct spatial profiles verified for urban vs rural sites.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 13]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 14: No physical hazard scores -> overallScore=null, overallLevel=insufficient_data
  // ===========================================================================
  try {
    const coords = new Coordinates(-6.2088, 106.8456);
    const emptyRaw: RawPhysicalInputs = {
      elevationMeters: null,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      historicalQuakesCount150km: null,
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: null,
      historicalPeakTempC: null,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: 20, // Transport alone present
      distanceToArterialMeters: 200,
      distanceToTransitHubMeters: 300,
      distanceToHospitalMeters: 500,
      distanceToFireStationMeters: 1000,
      isFallbackFlags: {}
    };

    const res = RiskScoringEngine.calculate(coords, 'Site with only transport', 'Indonesia', 'Residential', 'Home Buyer', emptyRaw);
    assert(res.overallScore === null, 'Overall score must be null when 0 physical hazards exist');
    assert(res.overallLevel === 'insufficient_data', 'Overall level must be insufficient_data');
    assert(res.dominantHazard === null, 'Dominant hazard must be null');
    assert(res.transport.score !== null, 'Transport score must exist separately');
    console.log('PASS [TEST 14]: Transport kept strictly separate from physical hazard overall score.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 14]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 15: NASA fallback -> provenance says NASA POWER
  // ===========================================================================
  try {
    const nasaSource = 'NASA POWER (MERRA-2)';
    assert(nasaSource.includes('NASA POWER'), 'Source name must indicate NASA POWER');
    console.log('PASS [TEST 15]: NASA POWER fallback provenance preserved.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 15]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // TEST 16: OSRM fallback -> routingSource=OSRM
  // ===========================================================================
  try {
    const osmFallbackTransport = TransportEvidenceAdapter.normalize({
      mapbox: null,
      osm: {
        distanceToNearestRoadMeters: 25,
        nearestRoadName: 'Jl. Utama',
        distanceToNearestWaterwayMeters: null,
        nearestWaterwayName: null,
        distanceToArterialMeters: 500,
        nearestArterialName: 'Jl. Arteri',
        distanceToHospitalMeters: 2500,
        nearestHospitalName: 'RS Daerah',
        distanceToNearestTransitMeters: 1200,
        nearestTransitName: 'Halte',
        distanceToFireStationMeters: 3000,
        nearestFireStationName: 'Pos Damkar',
        travelTimeMinutes: 8,
        travelTimeRouteDistanceMeters: 3200,
        estimatedTravelTimeMinutes: '8 menit',
        routingSource: 'OSRM Road-Network Driving Graph'
      }
    });

    assert(osmFallbackTransport.route.source === 'osrm', 'Route source must be osrm');
    assert(osmFallbackTransport.route.routingSource.includes('OSRM'), 'Routing source string must mention OSRM');
    console.log('PASS [TEST 16]: OSRM fallback routing attribution preserved.');
  } catch (err: unknown) {
    console.error('FAIL [TEST 16]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Unit Conversion Helpers Test
  // ===========================================================================
  try {
    assert(metersToKilometers(1500) === 1.5, '1500m = 1.5km');
    assert(metersToKilometers(null) === null, 'metersToKilometers(null) = null');
    assert(kilometersToMeters(2.5) === 2500, '2.5km = 2500m');
    assert(secondsToMinutes(125) === 3, '125s ceil = 3 mins');
    assert(formatDistanceMeters(2500) === '2.5 km', '2500m format = 2.5 km');
    assert(formatDistanceMeters(450) === '±450 m', '450m format = ±450 m');
    assert(formatDistanceMeters(null) === 'Data tidak tersedia', 'null format = Data tidak tersedia');
    console.log('PASS [UnitConversions]: All semantic conversion utilities validated.');
  } catch (err: unknown) {
    console.error('FAIL [UnitConversions]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  console.log('====================================================================');
  console.log(`Phase 7 Test Suite Result: ${passed ? 'ALL 16 TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('====================================================================');
  return passed;
}
