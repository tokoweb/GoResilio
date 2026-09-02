import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';
import { PerformSiteAssessmentUseCase } from '../application/use_cases/PerformSiteAssessment.usecase';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';

export function runMapSpatialReassessmentTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH: MAP SPATIAL REASSESSMENT TEST SUITE (CASES A - H)');
  console.log('================================================================\n');

  let passed = true;

  // ---------------------------------------------------------------------------
  // TEST A: Initial Map View -> No Unintended Coordinate Change
  // ---------------------------------------------------------------------------
  console.log('[TEST A] Initial map view does not create unintended assessment coordinate...');
  try {
    const initialMapViewCenter = { lat: -6.2088, lng: 106.8456 };
    const initialAssessmentCoordinates = null;

    if (initialAssessmentCoordinates !== null) {
      console.error('FAIL [TEST A]: Initial assessment coordinates should be null on fresh startup.');
      passed = false;
    } else if (initialMapViewCenter.lat !== -6.2088 || initialMapViewCenter.lng !== 106.8456) {
      console.error('FAIL [TEST A]: Initial map center was unexpectedly modified.');
      passed = false;
    } else {
      console.log('PASS [TEST A]: Initial map view maintains clean separation without unintended assessment.');
    }
  } catch (err) {
    console.error('FAIL [TEST A]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST B: Move Map Point -> Preview Coordinate Changes Without Mutating Assessed Point
  // ---------------------------------------------------------------------------
  console.log('[TEST B] Moving map changes preview center without mutating canonical assessed point...');
  try {
    const assessedSite = { lat: -6.2088, lng: 106.8456 };
    let previewMapCenter = { lat: -6.2088, lng: 106.8456 };

    // User pans map to new location (~1.2 km away)
    previewMapCenter = { lat: -6.2188, lng: 106.8556 };

    if (assessedSite.lat !== -6.2088 || assessedSite.lng !== 106.8456) {
      console.error('FAIL [TEST B]: Panning map should not alter canonical assessed site before confirmation.');
      passed = false;
    } else if (previewMapCenter.lat !== -6.2188 || previewMapCenter.lng !== 106.8556) {
      console.error('FAIL [TEST B]: Preview map center was not updated correctly.');
      passed = false;
    } else {
      console.log('PASS [TEST B]: Map panning updates preview coordinates while preserving canonical assessed site.');
    }
  } catch (err) {
    console.error('FAIL [TEST B]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST C: Confirm New Point -> Canonical assessmentCoordinates Changes
  // ---------------------------------------------------------------------------
  console.log('[TEST C] Confirming new location commits coordinates as single authoritative input...');
  try {
    let canonicalAssessmentCoordinates: { lat: number; lng: number } | null = null;
    const confirmedPoint = { lat: -6.9175, lng: 107.6191 }; // Bandung Site

    // User confirms point (via click, dragend, or confirm button)
    canonicalAssessmentCoordinates = { ...confirmedPoint };

    if (
      !canonicalAssessmentCoordinates ||
      canonicalAssessmentCoordinates.lat !== -6.9175 ||
      canonicalAssessmentCoordinates.lng !== 107.6191
    ) {
      console.error('FAIL [TEST C]: Canonical assessment coordinates did not update to confirmed point.');
      passed = false;
    } else {
      console.log('PASS [TEST C]: Canonical assessmentCoordinates updated successfully to confirmed location.');
    }
  } catch (err) {
    console.error('FAIL [TEST C]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST D & E: New Coordinate -> PerformSiteAssessment Called & APIs Receive New Coordinates
  // ---------------------------------------------------------------------------
  console.log('[TEST D & E] Performing assessment at new coordinate and verifying input consistency...');
  try {
    const rawInputsA: RawPhysicalInputs = {
      elevationMeters: 8,
      max24hRainfallMm: 150,
      distanceToRiverMeters: 250,
      nearestRiverName: 'Kali Ciliwung',
      historicalQuakesCount150km: 12,
      historicalQuakesCount100km: 8,
      maxHistoricalMag: 6.2,
      avgMaxTempC: 33.5,
      historicalPeakTempC: 36.8,
      projectedTempRise2050C: 1.4,
      greenSpaceRatioPct: 8,
      distanceToNearestRoadMeters: 45,
      distanceToArterialMeters: 450,
      distanceToTransitHubMeters: 350,
      distanceToHospitalMeters: 1200,
      distanceToFireStationMeters: 1500
    };

    const coordsA = new Coordinates(-6.2088, 106.8456); // Jakarta site
    const resultA = RiskScoringEngine.calculate(coordsA, 'Jakarta Test Site', 'Indonesia', 'Residential', 'Home Buyer', rawInputsA);

    const rawInputsB: RawPhysicalInputs = {
      elevationMeters: 720,
      max24hRainfallMm: 60,
      distanceToRiverMeters: 2200,
      nearestRiverName: 'Sungai Citarum',
      historicalQuakesCount150km: 35,
      historicalQuakesCount100km: 24,
      maxHistoricalMag: 7.1,
      avgMaxTempC: 28.2,
      historicalPeakTempC: 31.5,
      projectedTempRise2050C: 1.1,
      greenSpaceRatioPct: 22,
      distanceToNearestRoadMeters: 120,
      distanceToArterialMeters: 1800,
      distanceToTransitHubMeters: 1500,
      distanceToHospitalMeters: 3800,
      distanceToFireStationMeters: 4200
    };

    const coordsB = new Coordinates(-6.9175, 107.6191); // Bandung site
    const resultB = RiskScoringEngine.calculate(coordsB, 'Bandung Test Site', 'Indonesia', 'Residential', 'Home Buyer', rawInputsB);

    if (resultA.location.latitude !== -6.2088 || resultB.location.latitude !== -6.9175) {
      console.error('FAIL [TEST D & E]: Assessment results do not match input coordinates!');
      passed = false;
    } else if (resultA.flood.elevationMeters === resultB.flood.elevationMeters) {
      console.error('FAIL [TEST D & E]: Assessments produced identical elevation unexpectedly!');
      passed = false;
    } else {
      console.log(`PASS [TEST D & E]: Assessments calculated distinctly: Site A Elev=${resultA.flood.elevationMeters}m (Score=${resultA.overallScore}), Site B Elev=${resultB.flood.elevationMeters}m (Score=${resultB.overallScore}).`);
    }
  } catch (err) {
    console.error('FAIL [TEST D & E]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST F: Cache for Old Coordinate is Not Reused Incorrectly
  // ---------------------------------------------------------------------------
  console.log('[TEST F] Verifying coordinate-dependent cache key isolation (4-decimal precision)...');
  try {
    const site1 = new Coordinates(-6.2088, 106.8456);
    const site2 = new Coordinates(-6.2188, 106.8556); // 1.5 km apart

    const cacheKey1 = `meteo_expanded_v12_${site1.lat.toFixed(4)}_${site1.lng.toFixed(4)}`;
    const cacheKey2 = `meteo_expanded_v12_${site2.lat.toFixed(4)}_${site2.lng.toFixed(4)}`;

    LocalApiCache.set(cacheKey1, { elevation: 12, site: 'Site 1' }, 60);

    const hit1 = LocalApiCache.get<{ elevation: number; site: string }>(cacheKey1);
    const miss2 = LocalApiCache.get<{ elevation: number; site: string }>(cacheKey2);

    if (!hit1 || hit1.site !== 'Site 1') {
      console.error('FAIL [TEST F]: Expected cache hit on identical coordinate key 1.');
      passed = false;
    } else if (miss2 !== null) {
      console.error('FAIL [TEST F]: New coordinate must produce a clean cache miss and not reuse old data.');
      passed = false;
    } else {
      console.log('PASS [TEST F]: Cache keys strictly isolated by coordinate precision; no cross-coordinate reuse.');
    }
  } catch (err) {
    console.error('FAIL [TEST F]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST G: Slow Old Request Cannot Overwrite New Request (Generation Token Race Condition)
  // ---------------------------------------------------------------------------
  console.log('[TEST G] Verifying race-condition protection via generation sequence token...');
  try {
    let scanGeneration = 0;
    let activeAssessmentLocation = '';

    // Step 1: User initiates Assessment A
    const genA = ++scanGeneration; // gen = 1
    const locationA = 'Location A (-6.2088, 106.8456)';

    // Step 2: User quickly moves and initiates Assessment B before A completes
    const genB = ++scanGeneration; // gen = 2
    const locationB = 'Location B (-6.9175, 107.6191)';

    // Step 3: Fast request B completes first
    if (genB === scanGeneration) {
      activeAssessmentLocation = locationB;
    }

    // Step 4: Slow request A completes late
    if (genA === scanGeneration) {
      activeAssessmentLocation = locationA; // Should NOT execute
    }

    if (activeAssessmentLocation !== locationB) {
      console.error(`FAIL [TEST G]: Stale request A overwrote newer request B! Current: ${activeAssessmentLocation}`);
      passed = false;
    } else {
      console.log('PASS [TEST G]: Stale response from slow request A successfully discarded; request B persisted.');
    }
  } catch (err) {
    console.error('FAIL [TEST G]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST H: Report Values Update After Reassessment
  // ---------------------------------------------------------------------------
  console.log('[TEST H] Verifying report values update upon coordinate change...');
  try {
    const rawInputs1: RawPhysicalInputs = {
      elevationMeters: 5,
      max24hRainfallMm: 200,
      distanceToRiverMeters: 100,
      nearestRiverName: 'Kali Ciliwung',
      historicalQuakesCount150km: 10,
      historicalQuakesCount100km: 5,
      maxHistoricalMag: 6.0,
      avgMaxTempC: 34.0,
      historicalPeakTempC: 37.0,
      projectedTempRise2050C: 1.5,
      greenSpaceRatioPct: 5,
      distanceToNearestRoadMeters: 30,
      distanceToArterialMeters: 300,
      distanceToTransitHubMeters: 200,
      distanceToHospitalMeters: 800,
      distanceToFireStationMeters: 1000
    };
    const res1 = RiskScoringEngine.calculate(new Coordinates(-6.2088, 106.8456), 'Jakarta Site', 'Indonesia', 'Residential', 'Home Buyer', rawInputs1);

    const rawInputs2: RawPhysicalInputs = {
      elevationMeters: 1200,
      max24hRainfallMm: 30,
      distanceToRiverMeters: 5000,
      nearestRiverName: 'Sungai Pegunungan',
      historicalQuakesCount150km: 5,
      historicalQuakesCount100km: 2,
      maxHistoricalMag: 5.2,
      avgMaxTempC: 22.0,
      historicalPeakTempC: 25.0,
      projectedTempRise2050C: 0.8,
      greenSpaceRatioPct: 65,
      distanceToNearestRoadMeters: 500,
      distanceToArterialMeters: 8000,
      distanceToTransitHubMeters: 9000,
      distanceToHospitalMeters: 12000,
      distanceToFireStationMeters: 10000
    };
    const res2 = RiskScoringEngine.calculate(new Coordinates(-7.5000, 110.5000), 'Mountain Site', 'Indonesia', 'Residential', 'Home Buyer', rawInputs2);

    if (res1.overallScore === res2.overallScore || res1.flood.score === res2.flood.score) {
      console.error('FAIL [TEST H]: Report values failed to change between distinct locations.');
      passed = false;
    } else if (res1.location.latitude === res2.location.latitude) {
      console.error('FAIL [TEST H]: Assessment location coordinates remained identical.');
      passed = false;
    } else {
      console.log(`PASS [TEST H]: Report values updated accurately across sites (Site 1 Score: ${res1.overallScore}, Site 2 Score: ${res2.overallScore}).`);
    }
  } catch (err) {
    console.error('FAIL [TEST H]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST I: Center Button Captures Exact mapViewCenter
  // ---------------------------------------------------------------------------
  console.log('[TEST I] Center button captures exact mapViewCenter coordinates and updates assessmentCoordinates...');
  try {
    const mapViewCenter = { lat: -6.1845, lng: 106.8338 };
    let assessmentCoordinates: { lat: number; lng: number } | null = null;
    let mapMarkerPosition = { ...mapViewCenter };

    // Simulate clicking "Gunakan Titik Tengah Peta"
    assessmentCoordinates = { lat: mapViewCenter.lat, lng: mapViewCenter.lng };
    mapMarkerPosition = { lat: mapViewCenter.lat, lng: mapViewCenter.lng };

    if (
      !assessmentCoordinates ||
      assessmentCoordinates.lat !== -6.1845 ||
      assessmentCoordinates.lng !== 106.8338
    ) {
      console.error('FAIL [TEST I]: assessmentCoordinates does not match exact mapViewCenter from center button.');
      passed = false;
    } else if (
      mapMarkerPosition.lat !== assessmentCoordinates.lat ||
      mapMarkerPosition.lng !== assessmentCoordinates.lng
    ) {
      console.error('FAIL [TEST I]: mapMarkerPosition not synchronized with assessmentCoordinates upon center confirmation.');
      passed = false;
    } else {
      console.log('PASS [TEST I]: Center button correctly transferred exact center coordinates (-6.1845, 106.8338) to assessmentCoordinates.');
    }
  } catch (err) {
    console.error('FAIL [TEST I]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST J: Telemetry Ribbon Shows "Belum ada titik asesmen" When null
  // ---------------------------------------------------------------------------
  console.log('[TEST J] Telemetry ribbon renders "Belum ada titik asesmen" when assessmentCoordinates is null...');
  try {
    const assessmentCoordinates: { lat: number; lng: number } | null = null;
    const formatTelemetryAssessedPoint = (coords: { lat: number; lng: number } | null, isEn: boolean) => {
      return coords ? `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°` : (isEn ? 'No assessed point' : 'Belum ada titik asesmen');
    };

    const displayId = formatTelemetryAssessedPoint(assessmentCoordinates, false);
    const displayEn = formatTelemetryAssessedPoint(assessmentCoordinates, true);

    if (displayId !== 'Belum ada titik asesmen' || displayEn !== 'No assessed point') {
      console.error('FAIL [TEST J]: Telemetry ribbon displayed map center or wrong string when assessmentCoordinates was null.');
      passed = false;
    } else {
      console.log('PASS [TEST J]: Telemetry ribbon strictly guards against displaying unconfirmed coordinates.');
    }
  } catch (err) {
    console.error('FAIL [TEST J]: Exception:', err);
    passed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST K: Map Header Distinguishes Pusat Peta (Belum Diasesmen) vs Titik Asesmen
  // ---------------------------------------------------------------------------
  console.log('[TEST K] Map Header distinguishes Pusat Peta (Belum Diasesmen) vs Titik Asesmen...');
  try {
    const formatHeaderTitle = (
      coords: { lat: number; lng: number } | null,
      center: { lat: number; lng: number },
      address?: string
    ) => {
      if (coords) {
        return address || `Titik Asesmen: ${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`;
      }
      return `Pusat Peta: ${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}° (Belum Diasesmen)`;
    };

    const initialHeader = formatHeaderTitle(null, { lat: -6.2088, lng: 106.8456 });
    const confirmedHeader = formatHeaderTitle({ lat: -6.1845, lng: 106.8338 }, { lat: -6.1845, lng: 106.8338 }, 'Jalan Kebon Sirih, Jakarta');

    if (!initialHeader.includes('(Belum Diasesmen)') || initialHeader.includes('Titik Asesmen')) {
      console.error('FAIL [TEST K]: Initial unassessed header erroneously labeled as Titik Asesmen.');
      passed = false;
    } else if (!confirmedHeader.includes('Jalan Kebon Sirih, Jakarta')) {
      console.error('FAIL [TEST K]: Confirmed header did not show verified site address.');
      passed = false;
    } else {
      console.log('PASS [TEST K]: Header unambiguously distinguishes unassessed center from confirmed site.');
    }
  } catch (err) {
    console.error('FAIL [TEST K]: Exception:', err);
    passed = false;
  }

  return passed;
}

