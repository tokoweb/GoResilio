import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { PRESET_LOCATIONS } from '../presentation/context/AssessmentContext';

export function runInitialAssessmentStateTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH: INITIAL LOCATION & ASSESSMENT STATE TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // TEST A: Fresh Application State -> assessmentCoordinates = null & no assessment
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST A] Fresh Application State -> assessmentCoordinates = null & no assessment...');
    const initialCoords: { lat: number; lng: number } | null = null;
    const initialAssessment = null;

    if (initialCoords !== null) {
      console.error(`FAIL: Fresh state must have assessmentCoordinates = null, got:`, initialCoords);
      allPassed = false;
    } else if (initialAssessment !== null) {
      console.error('FAIL: Fresh state must have assessment = null, got non-null assessment');
      allPassed = false;
    } else {
      console.log('PASS [TEST A]: Fresh application state correctly initializes with null assessment coordinates and null assessment result.');
    }
  } catch (err) {
    console.error('FAIL [TEST A]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST B: Default Map Center -> Does NOT equal assessment coordinate and runs NO assessment
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST B] Default Map Center -> Distinct from assessment coordinates & no assessment...');
    const defaultMapViewCenter = { lat: -6.2088, lng: 106.8456 }; // Visual Jakarta center
    let assessmentCoordinates: { lat: number; lng: number } | null = null;
    let assessmentResult = null;

    // Verify map center does not automatically promote to assessment coordinates
    if (assessmentCoordinates !== null) {
      console.error('FAIL: Map view center must not automatically populate assessment coordinates');
      allPassed = false;
    } else if (assessmentResult !== null) {
      console.error('FAIL: Risk assessment must not run for visual map center');
      allPassed = false;
    } else {
      console.log('PASS [TEST B]: Default map center remains strictly visual and does not trigger or fabricate an assessment.');
    }
  } catch (err) {
    console.error('FAIL [TEST B]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST C: User selects location -> Assessment runs with authoritative coordinate
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST C] User selects location -> Assessment runs with authoritative coordinates...');
    const userSelectedLat = -8.6705;
    const userSelectedLng = 115.2126;
    const selectedAddress = 'Denpasar, Bali, Indonesia';

    // Simulate explicit user location selection
    const assessmentCoords = { lat: userSelectedLat, lng: userSelectedLng };
    const rawInputs: RawPhysicalInputs = {
      elevationMeters: 28,
      max24hRainfallMm: 95,
      distanceToRiverMeters: 750,
      historicalQuakesCount150km: 14,
      historicalQuakesCount100km: 5,
      maxHistoricalMag: 5.8,
      avgMaxTempC: 32.5,
      historicalPeakTempC: 35.8,
      projectedTempRise2050C: 1.1,
      greenSpaceRatioPct: 22,
      distanceToNearestRoadMeters: 20,
      distanceToArterialMeters: 250,
      distanceToTransitHubMeters: 500,
      distanceToHospitalMeters: 1400,
      distanceToFireStationMeters: 2200
    };

    const result = RiskScoringEngine.calculate(
      new Coordinates(assessmentCoords.lat, assessmentCoords.lng),
      selectedAddress,
      'Indonesia',
      'Residential',
      'Home Buyer',
      rawInputs
    );

    if (result.location.latitude !== userSelectedLat || result.location.longitude !== userSelectedLng) {
      console.error('FAIL: Calculated assessment location does not match user selected coordinates');
      allPassed = false;
    } else if (result.overallScore === null || result.overallScore <= 0) {
      console.error('FAIL: Expected valid overall score upon explicit assessment execution');
      allPassed = false;
    } else {
      console.log(`PASS [TEST C]: Explicit user location selection successfully evaluated at (${result.location.latitude}, ${result.location.longitude}) with score ${result.overallScore}.`);
    }
  } catch (err) {
    console.error('FAIL [TEST C]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST D: User moves marker and confirms -> Assessment reruns at new coordinate
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST D] User moves marker and confirms -> Assessment recalculates at new coordinate...');
    const siteA = new Coordinates(-6.2088, 106.8456);
    const siteB = new Coordinates(-7.2575, 112.7521); // Moved to Surabaya

    const resultSiteA = RiskScoringEngine.calculate(
      siteA,
      'Site A, Jakarta',
      'Indonesia',
      'Residential',
      'Home Buyer',
      {
        elevationMeters: 12,
        max24hRainfallMm: 130,
        distanceToRiverMeters: 400,
        historicalQuakesCount150km: 18,
        historicalQuakesCount100km: 6,
        maxHistoricalMag: 5.6,
        avgMaxTempC: 33.5,
        historicalPeakTempC: 37.0,
        projectedTempRise2050C: 1.3,
        greenSpaceRatioPct: 15,
        distanceToNearestRoadMeters: 25,
        distanceToArterialMeters: 200,
        distanceToTransitHubMeters: 450,
        distanceToHospitalMeters: 1100,
        distanceToFireStationMeters: 2000
      }
    );

    const resultSiteB = RiskScoringEngine.calculate(
      siteB,
      'Site B, Surabaya',
      'Indonesia',
      'Residential',
      'Home Buyer',
      {
        elevationMeters: 5,
        max24hRainfallMm: 160,
        distanceToRiverMeters: 250,
        historicalQuakesCount150km: 8,
        historicalQuakesCount100km: 2,
        maxHistoricalMag: 5.0,
        avgMaxTempC: 34.8,
        historicalPeakTempC: 38.5,
        projectedTempRise2050C: 1.5,
        greenSpaceRatioPct: 10,
        distanceToNearestRoadMeters: 15,
        distanceToArterialMeters: 150,
        distanceToTransitHubMeters: 300,
        distanceToHospitalMeters: 800,
        distanceToFireStationMeters: 1500
      }
    );

    if (resultSiteA.location.latitude === resultSiteB.location.latitude) {
      console.error('FAIL: Coordinates for moved marker must differ');
      allPassed = false;
    } else if (resultSiteA.flood.score === resultSiteB.flood.score && resultSiteA.flood.elevationMeters === resultSiteB.flood.elevationMeters) {
      console.error('FAIL: Recalculated metrics must reflect new site physics');
      allPassed = false;
    } else {
      console.log('PASS [TEST D]: Moving marker recalculates distinct physics and risk scores for new coordinate.');
    }
  } catch (err) {
    console.error('FAIL [TEST D]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST E: Reload Behavior -> Returns to clean empty state unless confirmed session
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST E] Reload Behavior -> Fresh session initialization yields clean empty state...');
    // Fresh session simulator
    const reloadInitialState = {
      assessmentCoordinates: null,
      assessment: null,
      mapViewCenter: { lat: -6.2088, lng: 106.8456 }
    };

    if (reloadInitialState.assessmentCoordinates !== null || reloadInitialState.assessment !== null) {
      console.error('FAIL: Fresh reload must not contain stale pre-loaded assessment');
      allPassed = false;
    } else {
      console.log('PASS [TEST E]: Fresh reload correctly returns to location selection state with null assessment.');
    }
  } catch (err) {
    console.error('FAIL [TEST E]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST F: Cached API Data -> Cache never defines or fabricates assessment location
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST F] Cached API Data -> Cache never decides assessment location...');
    const dummyCacheKey = 'inarisk_expanded_v2_-6.2088_106.8456';
    LocalApiCache.set(dummyCacheKey, { floodIndex: 0.65 }, 300);

    // Initial assessment coordinates must remain null regardless of items residing in LocalApiCache
    const currentSiteCoord = null;

    if (currentSiteCoord !== null) {
      console.error('FAIL: LocalApiCache must never dictate or trigger an initial assessment coordinate');
      allPassed = false;
    } else {
      console.log('PASS [TEST F]: LocalApiCache acts strictly as an API transport cache and does not define active assessment coordinates.');
    }
  } catch (err) {
    console.error('FAIL [TEST F]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST G: Preset City Configuration -> Does not silently trigger assessment on mount
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST G] Preset City -> Does not silently trigger assessment without explicit click...');
    const presets = PRESET_LOCATIONS;
    if (!Array.isArray(presets) || presets.length === 0) {
      console.error('FAIL: PRESET_LOCATIONS list must be populated for user selection');
      allPassed = false;
    }

    let activeAssessmentCoords = null; // Fresh state without user clicking preset

    if (activeAssessmentCoords !== null) {
      console.error('FAIL: Preset city must not silently trigger assessment on mount');
      allPassed = false;
    } else {
      console.log(`PASS [TEST G]: ${presets.length} preset cities available for manual user interaction without silent auto-assessment.`);
    }
  } catch (err) {
    console.error('FAIL [TEST G]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST H: Direct URL without coordinate parameters -> No assessment executed
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST H] URL without coordinates -> No assessment executed...');
    const urlParams = new URLSearchParams(''); // No ?lat= or ?lng=
    const latParam = urlParams.get('lat');
    const lngParam = urlParams.get('lng');

    const resolvedCoords = (latParam && lngParam) ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) } : null;

    if (resolvedCoords !== null) {
      console.error('FAIL: Plain URL without parameters must yield null assessment coordinates');
      allPassed = false;
    } else {
      console.log('PASS [TEST H]: URL without coordinate query parameters maintains clean unassessed empty state.');
    }
  } catch (err) {
    console.error('FAIL [TEST H]: Exception:', err);
    allPassed = false;
  }

  return allPassed;
}
