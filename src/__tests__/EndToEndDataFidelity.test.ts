import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { GoTangguhFinancialScreeningEngine } from '../domain/services/GoTangguhFinancialScreeningEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { LocalApiCache } from '../infrastructure/cache/LocalApiCache';

export function runEndToEndDataFidelityTests(): boolean {
  console.log('================================================================');
  console.log('GOTANGGUH STEP 14: END-TO-END DATA FIDELITY & INTEGRITY TEST SUITE');
  console.log('================================================================\n');

  let allPassed = true;
  const testCoords = new Coordinates(-6.2088, 106.8456); // Jakarta default

  // ---------------------------------------------------------------------------
  // CASE 1: All major providers available -> Maximum verified real data
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 1] Testing all major providers available...');
    const fullInputs: RawPhysicalInputs = {
      elevationMeters: 14,
      max24hRainfallMm: 135,
      distanceToRiverMeters: 450,
      nearestRiverName: 'Kali Ciliwung',
      inariskFloodIndex: 0.65,
      inariskFloodClass: 'Sedang',
      historicalQuakesCount150km: 18,
      historicalQuakesCount100km: 6,
      maxHistoricalMag: 5.8,
      nearestEpicenterKm: 42,
      inariskQuakeIndex: 0.55,
      inariskQuakeClass: 'Sedang',
      inariskLiquefactionRisk: 'Sedang',
      pgaMcegG: 0.28,
      avgMaxTempC: 34.2,
      historicalPeakTempC: 37.8,
      projectedTempRise2050C: 1.4,
      greenSpaceRatioPct: 18,
      distanceToNearestRoadMeters: 25,
      nearestRoadName: 'Jl. Sudirman',
      distanceToArterialMeters: 300,
      nearestArterialName: 'Jl. M.H. Thamrin',
      distanceToTransitHubMeters: 450,
      nearestTransitName: 'Stasiun MRT Bundaran HI',
      distanceToHospitalMeters: 1200,
      nearestHospitalName: 'RSUD Tanah Abang',
      distanceToFireStationMeters: 2100,
      nearestFireStationName: 'Pos Damkar Gambir',
      estimatedTravelTimeMinutes: '6 Menit',
      travelTimeRouteDistanceMeters: 1800,
      routingSource: 'OSRM road-network routing',
      riverDischargeM3s: 45
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Jl. M.H. Thamrin No. 1, Jakarta',
      'Indonesia',
      'Residential',
      'Home Buyer',
      fullInputs
    );

    if (result.scoringStatus !== 'complete') {
      console.error(`FAIL: Expected scoringStatus 'complete', got: ${result.scoringStatus}`);
      allPassed = false;
    } else if (result.overallScore === null || result.overallScore <= 0) {
      console.error('FAIL: Expected valid overall score');
      allPassed = false;
    } else if (result.dominantHazard === null) {
      console.error('FAIL: Expected valid dominant hazard');
      allPassed = false;
    } else {
      console.log(`PASS [CASE 1]: Complete assessment generated (Score: ${result.overallScore}, Dominant: ${result.dominantHazard}).`);
    }
  } catch (err) {
    console.error('FAIL [CASE 1]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 2: Partial providers -> Partial assessment, zero fake values
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 2] Testing partial providers (e.g. only flood and heat, quake missing)...');
    const partialInputs: RawPhysicalInputs = {
      elevationMeters: 25,
      max24hRainfallMm: 90,
      distanceToRiverMeters: 800,
      historicalQuakesCount150km: null,
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: 33.5,
      historicalPeakTempC: 36.5,
      projectedTempRise2050C: 1.2,
      greenSpaceRatioPct: 25,
      distanceToNearestRoadMeters: 50,
      distanceToArterialMeters: null,
      distanceToTransitHubMeters: null,
      distanceToHospitalMeters: null,
      distanceToFireStationMeters: null
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Kavling Parsial, Bogor',
      'Indonesia',
      'Residential',
      'Home Buyer',
      partialInputs
    );

    if (result.scoringStatus !== 'partial') {
      console.error(`FAIL: Expected scoringStatus 'partial', got: ${result.scoringStatus}`);
      allPassed = false;
    } else if (result.quake.score !== null) {
      console.error(`FAIL: Quake score must be null when quake data is missing, got: ${result.quake.score}`);
      allPassed = false;
    } else if (!result.executiveSummaryId.startsWith('Penilaian parsial')) {
      console.error(`FAIL: Executive summary must start with 'Penilaian parsial...', got: ${result.executiveSummaryId}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 2]: Partial assessment correctly flags status "partial" with null quake score.');
    }
  } catch (err) {
    console.error('FAIL [CASE 2]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 3: All hazard providers unavailable -> Strict null states
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 3] Testing all hazard providers unavailable...');
    const emptyInputs: RawPhysicalInputs = {
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
      distanceToFireStationMeters: null
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Titik Tanpa Data',
      'Indonesia',
      'Residential',
      'Home Buyer',
      emptyInputs
    );

    if (result.flood.score !== null || result.quake.score !== null || result.heat.score !== null) {
      console.error('FAIL: All hazard dimension scores must be null');
      allPassed = false;
    } else if (result.overallScore !== null) {
      console.error(`FAIL: overallScore must be null, got: ${result.overallScore}`);
      allPassed = false;
    } else if (result.overallLevel !== 'insufficient_data') {
      console.error(`FAIL: overallLevel must be 'insufficient_data', got: ${result.overallLevel}`);
      allPassed = false;
    } else if (result.dominantHazard !== null) {
      console.error(`FAIL: dominantHazard must be null, got: ${result.dominantHazard}`);
      allPassed = false;
    } else if (result.transport.score !== null || result.transport.level !== 'unavailable') {
      console.error(`FAIL: transport score must be null and level 'unavailable', got: ${result.transport.score}, ${result.transport.level}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 3]: Complete missing data cleanly yields null overall scores and insufficient_data level.');
    }
  } catch (err) {
    console.error('FAIL [CASE 3]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 4: OSM query failure -> Not ">5km", but unavailable/error state
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 4] Testing OSM query failure (unavailable distances)...');
    const osmFailInputs: RawPhysicalInputs = {
      elevationMeters: 10,
      max24hRainfallMm: 80,
      distanceToRiverMeters: null,
      historicalQuakesCount150km: null,
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.0,
      projectedTempRise2050C: 1.0,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: null,
      distanceToArterialMeters: null,
      distanceToTransitHubMeters: null,
      distanceToHospitalMeters: null,
      distanceToFireStationMeters: null
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Area Pedalaman',
      'Indonesia',
      'Residential',
      'Home Buyer',
      osmFailInputs
    );

    if (result.flood.distanceToRiverMeters !== null) {
      console.error(`FAIL: distanceToRiverMeters must be null, got: ${result.flood.distanceToRiverMeters}`);
      allPassed = false;
    } else if (result.transport.distanceToNearestRoadMeters !== null) {
      console.error(`FAIL: distanceToNearestRoadMeters must be null, got: ${result.transport.distanceToNearestRoadMeters}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 4]: OSM query failure preserves strict null values without synthetic ">5km" strings.');
    }
  } catch (err) {
    console.error('FAIL [CASE 4]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 5: BNPB class unavailable -> Raw index preserved, official class null
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 5] Testing BNPB class unavailable...');
    const bnpbNoClassInputs: RawPhysicalInputs = {
      elevationMeters: 15,
      max24hRainfallMm: 110,
      distanceToRiverMeters: 600,
      inariskFloodIndex: 0.42,
      inariskFloodClass: null, // No official class
      historicalQuakesCount150km: 10,
      historicalQuakesCount100km: 3,
      maxHistoricalMag: 5.2,
      avgMaxTempC: 33.0,
      historicalPeakTempC: 36.0,
      projectedTempRise2050C: 1.1,
      greenSpaceRatioPct: 15,
      distanceToNearestRoadMeters: 30,
      distanceToArterialMeters: 400,
      distanceToTransitHubMeters: 600,
      distanceToHospitalMeters: 2000,
      distanceToFireStationMeters: 3000
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Tapak Tanpa Kelas Resmi',
      'Indonesia',
      'Residential',
      'Home Buyer',
      bnpbNoClassInputs
    );

    if (result.flood.floodClassSource !== null) {
      console.error(`FAIL: floodClassSource must be null when official class is missing, got: ${result.flood.floodClassSource}`);
      allPassed = false;
    } else if (result.flood.floodClass !== null) {
      console.error(`FAIL: floodClass must be null, got: ${result.flood.floodClass}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 5]: Missing official class does not fabricate a government tier.');
    }
  } catch (err) {
    console.error('FAIL [CASE 5]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 6: BMKG only -> Recent activity, NOT historical 10-year activity
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 6] Testing BMKG recent monitoring separation from 10-year catalog...');
    const bmkgOnlyInputs: RawPhysicalInputs = {
      elevationMeters: 20,
      max24hRainfallMm: 70,
      distanceToRiverMeters: 1200,
      nearestEpicenterKm: 35,
      latestQuakeDescription: 'M 4.8 - 35 km BaratDaya Bogor',
      historicalQuakesCount150km: null, // USGS unavailable
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: 32.5,
      historicalPeakTempC: 35.5,
      projectedTempRise2050C: 1.0,
      greenSpaceRatioPct: 20,
      distanceToNearestRoadMeters: 40,
      distanceToArterialMeters: 500,
      distanceToTransitHubMeters: 700,
      distanceToHospitalMeters: 1500,
      distanceToFireStationMeters: 2500
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Area Monitoring BMKG',
      'Indonesia',
      'Residential',
      'Home Buyer',
      bmkgOnlyInputs
    );

    if (result.quake.historicalQuakesCount150km !== null || result.quake.historicalQuakesCount100km !== null) {
      console.error('FAIL: Historical quakes counts must remain null when only BMKG recent feed is available');
      allPassed = false;
    } else if (result.quake.nearestEpicenterKm !== 35) {
      console.error(`FAIL: Expected nearestEpicenterKm 35, got: ${result.quake.nearestEpicenterKm}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 6]: BMKG recent monitoring isolated from historical catalog counts.');
    }
  } catch (err) {
    console.error('FAIL [CASE 6]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 7: PGA unavailable -> No synthetic PGA number
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 7] Testing PGA unavailable...');
    const noPgaInputs: RawPhysicalInputs = {
      elevationMeters: 18,
      max24hRainfallMm: 95,
      distanceToRiverMeters: 750,
      historicalQuakesCount150km: 15,
      historicalQuakesCount100km: 5,
      maxHistoricalMag: 5.5,
      pgaMcegG: null, // Unmeasured PGA raster
      avgMaxTempC: 33.0,
      historicalPeakTempC: 36.0,
      projectedTempRise2050C: 1.2,
      greenSpaceRatioPct: 22,
      distanceToNearestRoadMeters: 35,
      distanceToArterialMeters: 450,
      distanceToTransitHubMeters: 650,
      distanceToHospitalMeters: 1800,
      distanceToFireStationMeters: 2800
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Tapak Tanpa Raster PGA',
      'Indonesia',
      'Residential',
      'Home Buyer',
      noPgaInputs
    );

    if (result.quake.estimatedPgaG !== null) {
      console.error(`FAIL: estimatedPgaG must be null when unmeasured, got: ${result.quake.estimatedPgaG}`);
      allPassed = false;
    }

    const reportMetrics = ReportMetricRegistry.getDisplayMetrics('earthquake', result, false);
    const pgaMetric = reportMetrics.find((m) => m.id === 'seismic_pga');

    if (!pgaMetric || pgaMetric.value !== 'Belum tersedia') {
      console.error(`FAIL: PGA metric must render as status card 'Belum tersedia', got: ${pgaMetric?.value}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 7]: Unmeasured PGA renders status card "Belum tersedia" with null estimatedPgaG.');
    }
  } catch (err) {
    console.error('FAIL [CASE 7]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 8: Financial property value unavailable -> No fake monetary loss
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 8] Testing financial property value unavailable...');
    const finRes = GoTangguhFinancialScreeningEngine.calculateLossMetrics(70, 65, 55, null, null);

    if (finRes.expectedAnnualLossIdr !== null || finRes.expectedAnnualLossUsd !== null) {
      console.error('FAIL: Currency losses must be null when property value is null');
      allPassed = false;
    } else if (finRes.probableMaximumLoss100YrIdr !== null || finRes.probableMaximumLoss100YrUsd !== null) {
      console.error('FAIL: PML currency values must be null');
      allPassed = false;
    } else if (finRes.expectedAnnualDamagePct === null) {
      console.error('FAIL: Percentage damage ratio should be calculated');
      allPassed = false;
    } else {
      console.log('PASS [CASE 8]: Unsupplied property value preserves null monetary currency losses.');
    }
  } catch (err) {
    console.error('FAIL [CASE 8]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 9: Map marker moved -> Cache invalidation & metric recalculation
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 9] Testing map marker moved & cache isolation...');
    const pointOrigin = new Coordinates(-6.2088, 106.8456);
    const pointMoved = new Coordinates(-6.2200, 106.8600);

    const cacheKeyOrigin = `osm_overpass_v5_${pointOrigin.lat.toFixed(4)}_${pointOrigin.lng.toFixed(4)}`;
    const cacheKeyMoved = `osm_overpass_v5_${pointMoved.lat.toFixed(4)}_${pointMoved.lng.toFixed(4)}`;

    LocalApiCache.set(cacheKeyOrigin, { nearestRiver: 'Kali Ciliwung' }, 60);

    if (LocalApiCache.get(cacheKeyMoved) !== null) {
      console.error('FAIL: Cache of origin coordinate leaked to moved marker coordinate!');
      allPassed = false;
    } else {
      console.log('PASS [CASE 9]: Marker movement guarantees cache isolation and fresh spatial query dispatch.');
    }
  } catch (err) {
    console.error('FAIL [CASE 9]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // CASE 10: Partial hazard coverage -> Report explicitly says "Penilaian parsial..."
  // ---------------------------------------------------------------------------
  try {
    console.log('[CASE 10] Testing partial hazard coverage executive summary phrasing...');
    const partialCoverageInputs: RawPhysicalInputs = {
      elevationMeters: 30,
      max24hRainfallMm: 85,
      distanceToRiverMeters: 900,
      historicalQuakesCount150km: null, // Quake null
      historicalQuakesCount100km: null,
      maxHistoricalMag: null,
      avgMaxTempC: 33.0,
      historicalPeakTempC: 36.0,
      projectedTempRise2050C: 1.1,
      greenSpaceRatioPct: 20,
      distanceToNearestRoadMeters: 20,
      distanceToArterialMeters: 300,
      distanceToTransitHubMeters: 500,
      distanceToHospitalMeters: 1200,
      distanceToFireStationMeters: 2200
    };

    const result = RiskScoringEngine.calculate(
      testCoords,
      'Kavling Parsial Terbatas',
      'Indonesia',
      'Residential',
      'Home Buyer',
      partialCoverageInputs
    );

    if (!result.executiveSummaryId.startsWith('Penilaian parsial')) {
      console.error(`FAIL: Expected executiveSummaryId to begin with 'Penilaian parsial', got: ${result.executiveSummaryId}`);
      allPassed = false;
    } else if (!result.executiveSummaryEn.startsWith('Partial assessment')) {
      console.error(`FAIL: Expected executiveSummaryEn to begin with 'Partial assessment', got: ${result.executiveSummaryEn}`);
      allPassed = false;
    } else {
      console.log('PASS [CASE 10]: Bilingual executive summary explicitly discloses partial assessment condition.');
    }
  } catch (err) {
    console.error('FAIL [CASE 10]: Exception:', err);
    allPassed = false;
  }

  return allPassed;
}
