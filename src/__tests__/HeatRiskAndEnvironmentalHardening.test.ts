import { RiskScoringEngine, RawPhysicalInputs } from '../domain/services/RiskScoringEngine';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import type {
  MultiHazardAssessmentResult,
  AirQualityData,
  WorldPopData,
  NasaFirmsData,
  ThinkHazardReportSummary
} from '../domain/types/hazard.types';
import type { NormalizedTransportEvidence } from '../domain/types/transport.types';

function createMockTransportEvidence(): NormalizedTransportEvidence {
  return {
    nearestRoad: {
      distanceMeters: 25,
      name: 'Jl. Percobaan No. 1',
      provider: 'Mapbox',
      source: 'mapbox',
      status: 'success_exact',
      confidence: 'high'
    },
    majorRoad: {
      distanceMeters: 450,
      name: 'Jl. Raya Utama',
      provider: 'OSM Arterials',
      source: 'osm',
      status: 'success_exact',
      confidence: 'high'
    },
    healthcare: {
      distanceMeters: 1200,
      name: 'RSUD Kota',
      provider: 'Mapbox POI',
      source: 'mapbox',
      status: 'success_exact',
      confidence: 'high'
    },
    fireStation: {
      distanceMeters: 2500,
      name: 'Pos Pemadam Sektor A',
      provider: 'OSM POI',
      source: 'osm',
      status: 'success_exact',
      confidence: 'medium'
    },
    transit: {
      distanceMeters: 600,
      name: 'Stasiun Kota',
      provider: 'OSM Transit',
      source: 'osm',
      status: 'success_exact',
      confidence: 'high'
    },
    route: {
      durationMinutes: 4.5,
      estimatedTravelTimeMinutes: '4.5 menit',
      routeDistanceMeters: 1350,
      provider: 'Mapbox Driving Directions',
      source: 'mapbox',
      routingSource: 'Mapbox Driving API',
      status: 'success',
      confidence: 'high'
    },
    overallReliability: 'measured',
    activeProvider: 'mapbox_primary_with_osm_fallback',
    evaluatedAt: new Date().toISOString()
  };
}

export function runHeatRiskAndEnvironmentalHardeningTests(): boolean {
  console.log('================================================================');
  console.log('PHASE 5: HEAT RISK & ENVIRONMENTAL DATA HARDENING TEST SUITE');
  console.log('================================================================\n');

  let passed = true;

  const assert = (condition: boolean, testName: string, details?: string) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      passed = false;
    }
  };

  const defaultTransport = createMockTransportEvidence();

  // ---------------------------------------------------------------------------
  // Test Case A: Full Heat Data Available (All 6 core components + context)
  // ---------------------------------------------------------------------------
  console.log('--- Test Case A: Full Heat Data Available ---');
  {
    const fullInputs: RawPhysicalInputs = {
      elevationMeters: 15,
      max24hRainfallMm: 45,
      distanceToRiverMeters: 1500,
      nearestRiverName: 'Sungai Ciliwung',
      historicalQuakesCount150km: 2,
      maxHistoricalMag: 4.5,
      forecastPeakTempC: 34.8,
      avgMaxTempC: 32.5,
      historicalPeakTempC: 37.2,
      projectedTempRise2050C: 1.4,
      greenSpaceRatioPct: 22,
      distanceToNearestRoadMeters: defaultTransport.nearestRoad.distanceMeters,
      nearestRoadName: defaultTransport.nearestRoad.name,
      distanceToArterialMeters: defaultTransport.majorRoad.distanceMeters,
      nearestArterialName: defaultTransport.majorRoad.name,
      distanceToTransitHubMeters: defaultTransport.transit.distanceMeters,
      nearestTransitName: defaultTransport.transit.name,
      distanceToHospitalMeters: defaultTransport.healthcare.distanceMeters,
      nearestHospitalName: defaultTransport.healthcare.name,
      distanceToFireStationMeters: defaultTransport.fireStation.distanceMeters,
      nearestFireStationName: defaultTransport.fireStation.name,
      estimatedTravelTimeMinutes: defaultTransport.route.estimatedTravelTimeMinutes,
      travelTimeRouteDistanceMeters: defaultTransport.route.routeDistanceMeters,
      routingSource: defaultTransport.route.routingSource,
      transportEvidence: defaultTransport,
      thinkHazardReport: {
        extremeHeatLevel: 'High',
        earthquakeLevel: 'Low',
        granularity: 'adm2_district',
        strongAdministrativeMatch: true
      }
    };

    const result = RiskScoringEngine.calculate(fullInputs, 'Indonesia');
    assert(result.heat.score !== null, 'Heat score is calculated when full inputs available');
    assert(result.heat.scoreReliability === 'measured', 'Score reliability is measured with full evidence');
    assert(result.heat.observedComponents === 6, 'All 6 heat components observed');
    assert(result.heat.forecastPeakTempC === 34.8, 'forecastPeakTempC preserved exactly');
    assert(result.heat.historicalPeakTempC === 37.2, 'historicalPeakTempC preserved exactly');
    assert(result.heat.projectedTempRise2050C === 1.4, 'projectedTempRise2050C preserved exactly');
    assert(result.heat.thinkHazardExtremeHeatLevel === 'High', 'thinkHazardExtremeHeatLevel preserved');
    assert(result.heat.acCostIncreasePct === null, 'acCostIncreasePct is strictly null (no synthetic fabrication)');
    assert(result.heat.causeId.includes('ThinkHazard') && result.heat.causeId.includes('Observasi fisik'), 'Causal ID separates source indicator and physical observations');
  }

  // ---------------------------------------------------------------------------
  // Test Case B: Forecast Temperature Only
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case B: Forecast Temperature Only ---');
  {
    const forecastOnlyInputs: RawPhysicalInputs = {
      elevationMeters: 50,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: 35.2,
      avgMaxTempC: null,
      historicalPeakTempC: null,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: 50,
      nearestRoadName: 'Jl. Lokal',
      transportEvidence: defaultTransport
    };

    const result = RiskScoringEngine.calculate(forecastOnlyInputs, 'Indonesia');
    assert(result.heat.score !== null, 'Heat score calculated with forecast temperature alone');
    assert(result.heat.scoreReliability === 'partially_observed', 'Reliability is partially_observed for forecast-only data');
    assert(result.heat.forecastPeakTempC === 35.2, 'Forecast peak temperature preserved');
    assert(result.heat.historicalPeakTempC === null, 'Historical peak remains null without fabrication');
    assert(result.heat.projectedTempRise2050C === null, 'Climate projection remains null without fabrication');
  }

  // ---------------------------------------------------------------------------
  // Test Case C: Historical Fallback Semantics (NASA POWER 2023 Fallback)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case C: Historical Fallback Semantics (NASA POWER) ---');
  {
    const nasaFallbackInputs: RawPhysicalInputs = {
      elevationMeters: 200,
      max24hRainfallMm: 60,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: null,
      avgMaxTempC: 31.4, // NASA POWER annual mean daily maximum
      historicalPeakTempC: 36.5, // NASA POWER 2023 calendar year peak daily maximum
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: 100,
      nearestRoadName: 'Jl. Utama',
      transportEvidence: defaultTransport
    };

    const result = RiskScoringEngine.calculate(nasaFallbackInputs, 'Indonesia');
    assert(result.heat.score !== null, 'Heat score calculated with NASA POWER historical fallback');
    assert(result.heat.historicalPeakTempC === 36.5, 'NASA POWER 2023 calendar peak preserved');
    assert(result.heat.avgMaxTempC === 31.4, 'NASA POWER annual mean preserved in avgMaxTempC');
    assert(result.heat.forecastPeakTempC === null, 'NASA POWER annual mean is NOT mapped into forecast peak');
  }

  // ---------------------------------------------------------------------------
  // Test Case D: Climate Projection Semantics
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case D: Climate Projection Semantics ---');
  {
    const projectionInputs: RawPhysicalInputs = {
      elevationMeters: 100,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: 31.0,
      avgMaxTempC: null,
      historicalPeakTempC: 34.0,
      projectedTempRise2050C: 1.8,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: 100,
      nearestRoadName: 'Jl. Lingkungan',
      transportEvidence: defaultTransport
    };

    const result = RiskScoringEngine.calculate(projectionInputs, 'Indonesia');
    assert(result.heat.projectedTempRise2050C === 1.8, '2050 climate delta tracked as +1.8°C');
    assert(result.heat.climateProjectionModel === 'MRI-AGCM3-2-S (CMIP6)', 'Climate projection model correctly attributed');
    assert(result.heat.causeId.includes('proyeksi kenaikan +1.8°C'), 'Causal text accurately attributes CMIP6 model delta');
  }

  // ---------------------------------------------------------------------------
  // Test Case E: ThinkHazard Indicator Only
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case E: ThinkHazard Indicator Only ---');
  {
    const thinkHazardOnlyInputs: RawPhysicalInputs = {
      elevationMeters: null,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: null,
      avgMaxTempC: null,
      historicalPeakTempC: null,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: null,
      nearestRoadName: null,
      transportEvidence: defaultTransport,
      thinkHazardReport: {
        extremeHeatLevel: 'High',
        earthquakeLevel: 'No Data',
        granularity: 'adm2_district',
        strongAdministrativeMatch: true
      }
    };

    const result = RiskScoringEngine.calculate(thinkHazardOnlyInputs, 'Indonesia');
    assert(result.heat.score !== null, 'Heat score calculated with ThinkHazard regional tier');
    assert(result.heat.scoreReliability === 'imputed_model_baseline', 'Reliability is imputed_model_baseline for ThinkHazard alone');
    assert(result.heat.thinkHazardExtremeHeatLevel === 'High', 'ThinkHazard extreme heat level High preserved');
    assert(result.heat.causeId.includes('Indikator panas ekstrem ThinkHazard: High'), 'Causal text explicitly identifies ThinkHazard indicator');
  }

  // ---------------------------------------------------------------------------
  // Test Case F: Green Data Unavailable (No False 0% Green Penalty)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case F: Green Data Unavailable ---');
  {
    const noGreenInputs: RawPhysicalInputs = {
      elevationMeters: 20,
      max24hRainfallMm: 30,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: 33.0,
      avgMaxTempC: 31.0,
      historicalPeakTempC: 35.0,
      projectedTempRise2050C: 1.2,
      greenSpaceRatioPct: null, // OSM green data unavailable
      distanceToNearestRoadMeters: 50,
      nearestRoadName: 'Jl. Utama',
      transportEvidence: defaultTransport
    };

    const result = RiskScoringEngine.calculate(noGreenInputs, 'Indonesia');
    assert(result.heat.greenSpaceRatioPct === null, 'greenSpaceRatioPct remains null when unavailable');
    assert(!result.heat.causeId.includes('rasio fitur hijau OSM 0%'), 'Does not fabricate 0% green space ratio');
    assert(result.heat.score !== null, 'Score successfully calculated without green proxy');
  }

  // ---------------------------------------------------------------------------
  // Test Case G, H, I: Contextual Separation (AQ, Population, FIRMS)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Cases G, H, I: Environmental & Exposure Context Separation ---');
  {
    const mockAirQuality: AirQualityData = {
      currentPm25: 48.5,
      currentPm10: 72.0,
      currentO3: 35.0,
      currentNo2: 24.0,
      currentSo2: 5.0,
      currentCo: 420.0,
      currentAod: 0.45,
      currentUvIndex: 8.5,
      currentEuropeanAqi: 65,
      currentUsAqi: 120,
      maxPm25_24h: 56.2,
      meanPm25_24h: 42.1,
      maxPm10_24h: 85.0,
      meanPm10_24h: 68.0,
      maxO3_24h: 45.0,
      meanO3_24h: 30.0,
      maxNo2_24h: 32.0,
      meanNo2_24h: 20.0,
      maxAqi_24h: 70,
      meanAqi_24h: 55,
      maxUvIndex_24h: 9.2,
      meanUvIndex_24h: 4.8,
      sourceValidTime: '2026-09-01T12:00:00Z',
      periodStart: '2026-09-01T00:00:00Z',
      periodEnd: '2026-09-01T23:00:00Z',
      spatialResolution: '~11km grid cell',
      model: 'CAMS European Air Quality',
      isAvailable: true,
      endpoint: 'https://air-quality-api.open-meteo.com/v1/air-quality'
    };

    const mockWorldPop: WorldPopData = {
      population1km: 18450,
      population5km: 245000,
      popDensityPerSqKm1km: 5873,
      popDensityPerSqKm5km: 3120,
      isAvailable: true,
      endpoint: 'https://api.worldpop.org/v1/services/stats',
      spatialResolution: '100m raster buffer',
      year: 2020
    };

    const mockFirms: NasaFirmsData = {
      activeHotspots24h: 3,
      activeHotspots7d: 12,
      activeHotspots30d: 28,
      nearestHotspotKm: 14.5,
      nearestHotspotFrp: 24.8,
      meanFrp24h: 18.2,
      maxFrp24h: 32.5,
      detections: [],
      isAvailable: true,
      endpoint: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      spatialResolution: '375m VIIRS sensor'
    };

    const assessmentWithContext: MultiHazardAssessmentResult = {
      overallScore: 65,
      overallLevel: 'moderate',
      flood: {
        score: 40,
        level: 'low',
        scoreReliability: 'measured',
        observedComponents: 4,
        expectedComponents: 5,
        coveragePct: 80,
        elevationMeters: 25,
        max24hRainfallMm: 45,
        distanceToRiverMeters: 1200,
        nearestRiverName: 'Sungai Ciliwung',
        waterwayBounded: {
          relation: 'exact',
          state: 'AVAILABLE_EXACT',
          exactDistanceMeters: 1200,
          displayValue: '1200 m',
          featureName: 'Sungai Ciliwung'
        },
        causeId: 'Kondisi hidrologi terkontrol.',
        causeEn: 'Hydrological conditions controlled.',
        impactId: 'Risiko banjir rendah.',
        impactEn: 'Low flood risk.',
        recomId: 'Pertahankan saluran drainase.',
        recomEn: 'Maintain drainage channels.'
      },
      seismic: {
        score: 45,
        level: 'low',
        scoreReliability: 'measured',
        observedComponents: 4,
        expectedComponents: 5,
        coveragePct: 80,
        historicalQuakesCount150km: 3,
        historicalQuakesCount100km: 1,
        maxHistoricalMag: 5.1,
        pgaMcegG: 0.25,
        estimatedPgaG: 0.25,
        soilSiteClass: null,
        sniStandardRef: 'SNI 1726:2019',
        liquefactionRisk: null,
        causeId: 'Aktivitas seismik moderat.',
        causeEn: 'Moderate seismic activity.',
        impactId: 'Potensi guncangan sedang.',
        impactEn: 'Moderate ground motion.',
        recomId: 'Detail sambungan standar.',
        recomEn: 'Standard detailing.'
      },
      heat: {
        score: 55,
        level: 'moderate',
        scoreReliability: 'measured',
        observedComponents: 6,
        expectedComponents: 6,
        coveragePct: 100,
        heatModelLevel: 'Moderate',
        forecastPeakTempC: 34.5,
        avgMaxTempC: 32.0,
        historicalPeakTempC: 37.0,
        historicalPeriod: '2020-01-01 to 2024-12-31',
        historicalDataSource: 'ERA5-Seamless (Open-Meteo)',
        thinkHazardExtremeHeatLevel: 'High',
        greenSpaceRatioPct: 25,
        projectedTempRise2050C: 1.4,
        climateProjectionModel: 'MRI-AGCM3-2-S (CMIP6)',
        acCostIncreasePct: null,
        causeId: 'Beban termal moderat.',
        causeEn: 'Moderate thermal load.',
        impactId: 'Penurunan kenyamanan termal.',
        impactEn: 'Thermal comfort reduction.',
        recomId: 'Aplikasi peneduh.',
        recomEn: 'Implement shading.'
      },
      transport: {
        score: 80,
        level: 'good',
        scoreReliability: 'measured',
        observedComponents: 6,
        expectedComponents: 6,
        coveragePct: 100,
        connectivityLabelId: 'Aksesibilitas Baik',
        connectivityLabelEn: 'Good Accessibility',
        distanceToNearestRoadMeters: 25,
        nearestRoadName: 'Jl. Percobaan',
        distanceToArterialMeters: 450,
        nearestArterialName: 'Jl. Utama',
        distanceToTransitHubMeters: 600,
        nearestTransitName: 'Stasiun Kota',
        distanceToHospitalMeters: 1200,
        nearestHospitalName: 'RSUD Kota',
        distanceToFireStationMeters: 2500,
        nearestFireStationName: 'Pos Damkar',
        estimatedTravelTimeMinutes: '4.5 menit',
        travelTimeRouteDistanceMeters: 1350,
        routingSource: 'Mapbox Driving API',
        evacuationRouteStatusId: 'Rute evakuasi lancar',
        evacuationRouteStatusEn: 'Evacuation route clear'
      },
      landslide: { score: 10, level: 'low', causeId: 'Datar', causeEn: 'Flat', impactId: 'Rendah', impactEn: 'Low', recomId: 'Standar', recomEn: 'Standard' },
      tsunami: { score: 0, level: 'low', causeId: 'Pedalaman', causeEn: 'Inland', impactId: 'Nol', impactEn: 'None', recomId: 'Standar', recomEn: 'Standard' },
      wildfire: mockFirms,
      airQuality: mockAirQuality,
      population: mockWorldPop,
      worldBankReport: {
        extremeHeatLevel: 'High',
        earthquakeLevel: 'Low',
        granularity: 'adm2_district',
        strongAdministrativeMatch: true
      },
      evaluatedAt: '2026-09-01T12:00:00Z',
      address: 'Jl. Percobaan No. 1, Jakarta',
      coordinates: new Coordinates(-6.2088, 106.8456)
    };

    const allMetrics = ReportMetricRegistry.getMetricsForCategory('heat', assessmentWithContext, false);
    assert(allMetrics.length === 11, `Heat report presents exactly 11 cards (6 core + 5 environmental context), got ${allMetrics.length}`);

    const cardIds = allMetrics.map((m) => m.id);
    assert(cardIds.includes('heat_forecast_temp'), 'Contains forecast peak temp card');
    assert(cardIds.includes('heat_historical_peak'), 'Contains historical peak temp card');
    assert(cardIds.includes('heat_projected_rise_2050'), 'Contains climate projection 2050 card');
    assert(cardIds.includes('heat_thinkhazard_class'), 'Contains ThinkHazard extreme heat card');
    assert(cardIds.includes('heat_green_space_density'), 'Contains OSM green-feature ratio card');
    assert(cardIds.includes('heat_model_level'), 'Contains GoTangguh model tier card');
    assert(cardIds.includes('heat_air_quality_pm25'), 'Contains PM2.5 air quality context card');
    assert(cardIds.includes('heat_air_quality_aqi'), 'Contains AQI air quality context card');
    assert(cardIds.includes('heat_uv_index'), 'Contains UV Index context card');
    assert(cardIds.includes('heat_population_1km'), 'Contains WorldPop 1km population context card');
    assert(cardIds.includes('heat_firms_hotspots'), 'Contains NASA FIRMS thermal hotspot context card');

    const greenCard = allMetrics.find((m) => m.id === 'heat_green_space_density');
    assert(greenCard?.labelId.includes('Rasio Fitur Hijau OSM'), 'Green card explicitly labeled "Rasio Fitur Hijau OSM"');

    // Phase 8.7: Primary simplified cards count <= 5
    const primaryMetrics = ReportMetricRegistry.getPrimaryMetrics('heat', assessmentWithContext, false);
    assert(primaryMetrics.length <= 5, `Primary heat cards must be <= 5, got ${primaryMetrics.length}`);

    const firmsCard = allMetrics.find((m) => m.id === 'heat_firms_hotspots');
    assert(firmsCard?.labelId.includes('Aktivitas Termal Satelit'), 'FIRMS card explicitly labeled "Aktivitas Termal Satelit"');

    const popCard = allMetrics.find((m) => m.id === 'heat_population_1km');
    assert(popCard?.labelId.includes('Perkiraan Populasi'), 'WorldPop card explicitly labeled "Perkiraan Populasi"');
  }

  // ---------------------------------------------------------------------------
  // Test Case J: Mixed Provider Failure Handling
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case J: Mixed Provider Failure Handling ---');
  {
    const mixedInputs: RawPhysicalInputs = {
      elevationMeters: 50,
      max24hRainfallMm: null, // ERA5 failed
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: 33.5, // Forecast succeeded
      avgMaxTempC: null,
      historicalPeakTempC: null, // Historical failed
      projectedTempRise2050C: null, // Climate projection failed
      greenSpaceRatioPct: 15, // OSM succeeded
      distanceToNearestRoadMeters: 40,
      nearestRoadName: 'Jl. Mawar',
      transportEvidence: defaultTransport,
      thinkHazardReport: null // ThinkHazard failed
    };

    const result = RiskScoringEngine.calculate(mixedInputs, 'Indonesia');
    assert(result.heat.score !== null, 'Heat score successfully calculated under mixed provider failure');
    assert(result.heat.scoreReliability === 'partially_observed', 'Reliability is partially_observed');
    assert(result.heat.observedComponents === 2, 'Observed 2 available components (forecast + green)');
  }

  // ---------------------------------------------------------------------------
  // Test Case K: All Heat Providers Unavailable (Zero Certainty)
  // ---------------------------------------------------------------------------
  console.log('\n--- Test Case K: All Heat Providers Unavailable ---');
  {
    const noHeatInputs: RawPhysicalInputs = {
      elevationMeters: null,
      max24hRainfallMm: null,
      distanceToRiverMeters: null,
      nearestRiverName: null,
      historicalQuakesCount150km: null,
      maxHistoricalMag: null,
      forecastPeakTempC: null,
      avgMaxTempC: null,
      historicalPeakTempC: null,
      projectedTempRise2050C: null,
      greenSpaceRatioPct: null,
      distanceToNearestRoadMeters: null,
      nearestRoadName: null,
      transportEvidence: defaultTransport,
      thinkHazardReport: null
    };

    const result = RiskScoringEngine.calculate(noHeatInputs, 'Indonesia');
    assert(result.heat.score === null, 'Heat score is strictly null when zero heat evidence exists');
    assert(result.heat.level === 'insufficient_data', 'Heat level is insufficient_data');
    assert(result.heat.scoreReliability === 'insufficient_data', 'Heat reliability is insufficient_data');
    assert(result.heat.causeId.includes('Data parameter suhu dan iklim tidak cukup'), 'Clear insufficient data message produced');
  }

  // ---------------------------------------------------------------------------
  // Real-World Spatial Coordinate Realism Test
  // ---------------------------------------------------------------------------
  console.log('\n--- Real-World Spatial Profiles (Jakarta vs Dieng) ---');
  {
    // Profile 1: Jakarta Coastal Urban (Hot tropical plain)
    const jakartaInputs: RawPhysicalInputs = {
      elevationMeters: 4,
      max24hRainfallMm: 110,
      distanceToRiverMeters: 200,
      nearestRiverName: 'Kali Ciliwung',
      historicalQuakesCount150km: 2,
      maxHistoricalMag: 4.8,
      forecastPeakTempC: 35.5,
      avgMaxTempC: 33.2,
      historicalPeakTempC: 38.0,
      projectedTempRise2050C: 1.5,
      greenSpaceRatioPct: 8, // Low green space
      distanceToNearestRoadMeters: 15,
      nearestRoadName: 'Jl. Kebon Sirih',
      transportEvidence: defaultTransport,
      thinkHazardReport: {
        extremeHeatLevel: 'High',
        earthquakeLevel: 'Low',
        granularity: 'adm2_district',
        strongAdministrativeMatch: true
      }
    };
    const jakartaResult = RiskScoringEngine.calculate(jakartaInputs, 'Indonesia');
    assert(jakartaResult.heat.score !== null && jakartaResult.heat.score >= 70, `Jakarta heat score is High/Severe (Got: ${jakartaResult.heat.score})`);

    // Profile 2: Dieng Plateau High-Elevation (Cold Highland)
    const diengInputs: RawPhysicalInputs = {
      elevationMeters: 2050,
      max24hRainfallMm: 80,
      distanceToRiverMeters: 3000,
      nearestRiverName: 'Sempadan Alami',
      historicalQuakesCount150km: 15,
      maxHistoricalMag: 5.2,
      forecastPeakTempC: 18.5,
      avgMaxTempC: 16.0,
      historicalPeakTempC: 22.0,
      projectedTempRise2050C: 0.8,
      greenSpaceRatioPct: 75, // Rich high vegetation
      distanceToNearestRoadMeters: 100,
      nearestRoadName: 'Jl. Dataran Tinggi',
      transportEvidence: defaultTransport,
      thinkHazardReport: {
        extremeHeatLevel: 'Low',
        earthquakeLevel: 'Medium',
        granularity: 'adm2_district',
        strongAdministrativeMatch: true
      }
    };
    const diengResult = RiskScoringEngine.calculate(diengInputs, 'Indonesia');
    assert(diengResult.heat.score !== null && diengResult.heat.score <= 35, `Dieng heat score is Low (Got: ${diengResult.heat.score})`);
  }

  console.log('\n================================================================');
  if (passed) {
    console.log('ALL PHASE 5 HEAT RISK & ENVIRONMENTAL HARDENING TESTS PASSED!');
  } else {
    console.error('SOME PHASE 5 TESTS FAILED.');
  }
  console.log('================================================================\n');

  return passed;
}
