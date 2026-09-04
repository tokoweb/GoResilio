import type { MultiHazardAssessmentResult, PropertyType, UserPersona, AssessmentDepth } from '../../domain/types/hazard.types';
import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { RiskScoringEngine } from '../../domain/services/RiskScoringEngine';
import type { RawPhysicalInputs } from '../../domain/services/RiskScoringEngine';
import { FeatureAssembler } from '../../domain/services/FeatureAssembler';
import { OpenMeteoClient } from '../../infrastructure/external_apis/OpenMeteoClient';
import { UsgsEarthquakeClient } from '../../infrastructure/external_apis/UsgsEarthquakeClient';
import { BmkgEarthquakeClient, BmkgSeismicSummary } from '../../infrastructure/external_apis/BmkgEarthquakeClient';
import { OverpassOsmClient } from '../../infrastructure/external_apis/OverpassOsmClient';
import { MapboxSpatialClient } from '../../infrastructure/external_apis/MapboxSpatialClient';
import { TransportEvidenceAdapter } from '../../domain/services/TransportEvidenceAdapter';
import { NominatimClient } from '../../infrastructure/external_apis/NominatimClient';
import { InaRiskBnpbClient, InaRiskAssessmentData } from '../../infrastructure/external_apis/InaRiskBnpbClient';
import { ThinkHazardClient } from '../../infrastructure/external_apis/ThinkHazardClient';
import { SoilGridsClient } from '../../infrastructure/external_apis/SoilGridsClient';
import { OpenMeteoAirQualityClient } from '../../infrastructure/external_apis/OpenMeteoAirQualityClient';
import { WorldPopClient } from '../../infrastructure/external_apis/WorldPopClient';
import { NasaFirmsClient } from '../../infrastructure/external_apis/NasaFirmsClient';
import type { ApiResult } from '../../domain/types/api.types';

export interface SiteAssessmentInput {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  propertyType: PropertyType;
  userPersona: UserPersona;
  country?: string;
  requestId?: string;
  depth?: AssessmentDepth;
}


export class PerformSiteAssessmentUseCase {
  public static async execute(input: SiteAssessmentInput): Promise<MultiHazardAssessmentResult> {
    // 0. Strict Canonical Coordinate Validation (Latitude in [-90, 90], Longitude in [-180, 180])
    if (
      !Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new Error(
        `Invalid canonical assessment coordinates: lat=${input.latitude}, lng=${input.longitude}. Latitude must be finite and within [-90, 90] and Longitude within [-180, 180].`
      );
    }

    const coords = new Coordinates(input.latitude, input.longitude);
    const evaluatedAt = new Date().toISOString();
    const assessmentId = input.requestId || `asm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1. Resolve real administrative boundaries & address (API: OpenStreetMap Nominatim/Photon)
    const adminLoc = await NominatimClient.getAdministrativeLocation(coords);
    let address = input.formattedAddress || adminLoc?.rawDisplayName;
    if (!address) {
      address = await NominatimClient.reverseGeocode(coords);
    }

    // Dynamic country discovery from real geocoding (no silent fallback to Indonesia)
    const country = input.country || adminLoc?.country || (adminLoc?.countryCode === 'PH' ? 'Philippines' : adminLoc?.countryCode === 'ID' ? 'Indonesia' : 'Unknown');

    // Safe wrapper guaranteeing partial provider failure never rejects unrelated providers
    const safeExec = async <T>(
      fn: () => Promise<ApiResult<T>>,
      fallbackSourceName: string,
      defaultReason: string
    ): Promise<ApiResult<T>> => {
      try {
        return await fn();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : defaultReason;
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: errorMsg,
          sourceName: fallbackSourceName,
          status: 'error'
        };
      }
    };

    const isMapboxEnabled = process.env.MAPBOX_ENABLED !== 'false' && Boolean(process.env.MAPBOX_ACCESS_TOKEN);

    const depth: AssessmentDepth = input.depth === 'deep' ? 'deep' : 'screening';
    const isDeep = depth === 'deep';

    // 2. Parallel Ingestion from 100% Real Live External APIs with isolated fault handling
    const [
      meteoRes,
      seismicRes,
      bmkgRes,
      mapboxRes,
      osmRes,
      inariskRes,
      thinkHazardRes,
      soilRes,
      airQualityRes,
      worldPopRes,
      firmsRes
    ] = await Promise.all([
      safeExec(() => OpenMeteoClient.fetchMetrics(coords, { depth }), 'Open-Meteo Weather & Climate API', 'Open-Meteo service unreachable'),
      safeExec(() => UsgsEarthquakeClient.fetchSeismicHistory(coords), 'USGS Earthquake Hazards Program', 'USGS/EMSC catalog unreachable'),
      country === 'Indonesia'
        ? safeExec(() => BmkgEarthquakeClient.fetchLatestEarthquakes(coords), 'BMKG Indonesia', 'BMKG real-time feed unreachable')
        : Promise.resolve<ApiResult<BmkgSeismicSummary>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'high',
            reason: 'BMKG feed is only applicable within Indonesia',
            sourceName: 'BMKG Indonesia',
            status: 'not_applicable'
          }),
      isMapboxEnabled
        ? safeExec(() => MapboxSpatialClient.fetchProximitySummary(coords), 'Mapbox Spatial POI Discovery', 'Mapbox Search API unreachable')
        : Promise.resolve<ApiResult<any>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'low',
            reason: 'Mapbox spatial query disabled by configuration (MAPBOX_ENABLED=false or missing token)',
            sourceName: 'Mapbox Spatial POI Discovery',
            status: 'not_applicable'
          }),
      safeExec(() => OverpassOsmClient.fetchProximityMetrics(coords, { depth }), 'OpenStreetMap Overpass API', 'OSM Overpass query failed'),
      country === 'Indonesia'
        ? safeExec(() => InaRiskBnpbClient.fetchSiteHazards(coords, { depth }), 'BNPB inaRISK GIS Server', 'BNPB inaRISK server unreachable')
        : Promise.resolve<ApiResult<InaRiskAssessmentData>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'high',
            reason: 'InaRISK is only applicable within Indonesia',
            sourceName: 'BNPB inaRISK GIS Server',
            status: 'not_applicable'
          }),
      safeExec(() => ThinkHazardClient.fetchSiteReport(coords), 'World Bank / GFDRR ThinkHazard!', 'ThinkHazard API unreachable'),
      isDeep
        ? safeExec(() => SoilGridsClient.fetchSoilMetrics(coords), 'ISRIC SoilGrids 2.0', 'SoilGrids API unreachable')
        : Promise.resolve<ApiResult<any>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'high',
            reason: 'Omitted in screening mode — available in deep assessment',
            sourceName: 'ISRIC SoilGrids',
            status: 'not_applicable'
          }),
      safeExec(() => OpenMeteoAirQualityClient.fetchAirQualityMetrics(coords), 'Open-Meteo Air Quality & CAMS', 'Air Quality API unreachable'),
      isDeep
        ? safeExec(() => WorldPopClient.fetchPopulationExposure(coords), 'WorldPop Global High Resolution Population', 'WorldPop API unreachable')
        : Promise.resolve<ApiResult<any>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'high',
            reason: 'Omitted in screening mode — available in deep assessment',
            sourceName: 'WorldPop',
            status: 'not_applicable'
          }),
      isDeep
        ? safeExec(() => NasaFirmsClient.fetchRecentHotspots(coords), 'NASA FIRMS', 'NASA FIRMS API unreachable')
        : Promise.resolve<ApiResult<any>>({
            data: null,
            isFallback: false,
            confidenceLevel: 'high',
            reason: 'Omitted in screening mode — available in deep assessment',
            sourceName: 'NASA FIRMS',
            status: 'not_applicable'
          })
    ]);


    // 3. Extract verified data from live APIs
    const meteo = meteoRes.data;
    const seismic = seismicRes.data;
    const bmkg = bmkgRes.data;
    const mapbox = mapboxRes.data;
    const osm = osmRes.data;
    const inarisk = inariskRes.data;
    const thinkHazard = thinkHazardRes.data;
    const soil = soilRes.data;
    const airQuality = airQualityRes.data;
    const population = worldPopRes.data;
    const firms = firmsRes.data;

    // 3. Provider-Neutral Normalization (Mapbox Primary -> Overpass Fallback)
    const transportEvidence = TransportEvidenceAdapter.normalize({
      mapbox,
      osm,
      evaluatedAt
    });

    // 4. Assemble Canonical ML-Ready Spatial Feature Records with complete provenance
    const featureSet = FeatureAssembler.assemble({
      coords,
      address,
      country,
      evaluatedAt,
      inarisk,
      seismic,
      bmkg,
      meteo,
      osm,
      mapbox,
      transportEvidence,
      thinkHazard,
      soil,
      airQuality,
      population,
      firms
    });

    const rawInputs: RawPhysicalInputs = {
      elevationMeters: meteo?.elevationMeters ?? null,
      slopeDegrees: meteo?.slopeDegrees ?? null,
      slopePercent: meteo?.slopePercent ?? null,
      slopeClassification: meteo?.slopeClassification ?? null,
      localReliefMeters: meteo?.localReliefMeters ?? null,
      localReliefType: meteo?.localReliefType ?? null,
      flowAccumulationPotential: meteo?.flowAccumulationPotential ?? null,
      max24hRainfallMm: meteo?.maxDailyPrecipitationMm ?? meteo?.max24hRainfallMm ?? null,
      rainfallPeriod: meteo?.audit?.historicalPrecipitation?.period ?? '2020-01-01 to 2024-12-31 (ERA5)',
      rainfallDataSource: meteo?.audit?.historicalPrecipitation?.provider === 'NASA POWER' ? 'NASA POWER (MERRA-2)' : 'Open-Meteo ERA5-Seamless',
      historicalPeriod: meteo?.audit?.historicalTemperature?.period ?? (meteoRes.isFallback ? '2023 (Calendar Year)' : '2020-01-01 to 2024-12-31'),
      historicalDataSource: meteo?.audit?.historicalTemperature?.provider === 'NASA POWER' ? 'NASA POWER (MERRA-2)' : 'ERA5-Seamless (Open-Meteo)',
      coordinates: coords,
      latitude: coords.lat,
      longitude: coords.lng,
      floodDepthMeters: null,
      historicalFloodEventsCount: null,
      historicalFloodPeriod: null,
      nearestDrainageChannel: null,
      distanceToDrainageMeters: null,
      distanceToRiverMeters: osm?.distanceToNearestWaterwayMeters ?? osm?.distanceToRiverMeters ?? null,
      nearestRiverName: osm?.nearestWaterwayName ?? osm?.nearestRiverName ?? 'Data sungai / saluran air tidak teridentifikasi',
      waterwayBounded: osm?.waterwayObservation,
      historicalQuakesCount150km: seismic?.quakesCount150km ?? null,
      historicalQuakesCount100km: seismic?.quakesCount100km ?? null,
      maxHistoricalMag: seismic?.maxMagnitude ?? null, 
      nearestEpicenterKm: bmkg?.nearestRecentQuakeKm ?? (bmkg?.latestQuake?.distanceToSiteKm ?? null),
      latestQuakeDescription: bmkg?.latestQuake
        ? `${bmkg.latestQuake.wilayah} (${bmkg.latestQuake.magnitude !== null ? `M${bmkg.latestQuake.magnitude}` : 'Magnitudo tidak tersedia'}, ${bmkg.latestQuake.distanceToSiteKm} km)`
        : undefined,
      avgMaxTempC: meteo?.avgMaxTempC ?? null,
      historicalPeakTempC: meteo?.historicalPeakTempC ?? null,
      forecastPeakTempC: meteo?.forecastPeakTempC ?? null,
      projectedTempRise2050C: (meteo?.projectedMeanTempChange2046_2049C ?? meteo?.projectedMeanTempChange2046_2050C ?? meteo?.projectedTempChange2050C ?? meteo?.projectedTempRise2050C) ?? null,
      greenSpaceRatioPct: osm?.greenFeatureRatioPct ?? osm?.greenSpaceRatioPct ?? null,
      distanceToNearestRoadMeters: transportEvidence.nearestRoad.distanceMeters,
      nearestRoadName: transportEvidence.nearestRoad.name,
      roadBounded: transportEvidence.nearestRoad.boundedObservation,
      distanceToArterialMeters: transportEvidence.majorRoad.distanceMeters,
      nearestArterialName: transportEvidence.majorRoad.name,
      arterialBounded: transportEvidence.majorRoad.boundedObservation,
      distanceToTransitHubMeters: transportEvidence.transit.distanceMeters,
      nearestTransitName: transportEvidence.transit.name,
      transitBounded: transportEvidence.transit.boundedObservation,
      distanceToHospitalMeters: transportEvidence.healthcare.distanceMeters,
      nearestHospitalName: transportEvidence.healthcare.name,
      hospitalBounded: transportEvidence.healthcare.boundedObservation,
      distanceToFireStationMeters: transportEvidence.fireStation.distanceMeters,
      nearestFireStationName: transportEvidence.fireStation.name,
      fireStationBounded: transportEvidence.fireStation.boundedObservation,
      estimatedTravelTimeMinutes: transportEvidence.route.estimatedTravelTimeMinutes,
      travelTimeRouteDistanceMeters: transportEvidence.route.routeDistanceMeters,
      routingSource: transportEvidence.route.routingSource,
      transportEvidence: transportEvidence,
      riverDischargeM3s: meteo?.meanRiverDischargeM3s ?? meteo?.riverDischargeM3s ?? null,
      inariskFloodIndex: inarisk?.floodHazardIndex ?? null,
      inariskFloodClass: inarisk?.floodHazardClass ?? null,
      inariskQuakeIndex: inarisk?.quakeHazardIndex ?? null,
      inariskQuakeClass: inarisk?.quakeHazardClass ?? null,
      inariskLiquefactionRisk: inarisk?.liquefactionHazardClass ?? inarisk?.liquefactionRisk ?? null,
      pgaMcegG: inarisk?.pgaMcegG ?? null,
      pgaMcerS1: inarisk?.pgaMcerS1 ?? null,
      pgaMcerSs: inarisk?.pgaMcerSs ?? null,
      landslideHazardIndex: inarisk?.landslideHazardIndex ?? null,
      extremeWeatherHazardIndex: inarisk?.extremeWeatherHazardIndex ?? null,
      droughtHazardIndex: inarisk?.droughtHazardIndex ?? null,
      wildfireHazardIndex: inarisk?.wildfireHazardIndex ?? null,
      tsunamiHazardIndex: inarisk?.tsunamiHazardIndex ?? null,
      soil,
      airQuality,
      populationExposure: population,
      wildfireActivity: firms,
      features: featureSet.features,
      featureStore: featureSet.featureStore,
      thinkHazardReport: thinkHazard,
      isFallbackFlags: {
        openMeteoFallback: meteoRes.isFallback,
        usgsFallback: seismicRes.isFallback,
        bmkgFallback: bmkgRes.isFallback,
        osmFallback: osmRes.isFallback,
        inariskFallback: inariskRes.isFallback,
        thinkHazardFallback: thinkHazardRes.isFallback,
        soilGridsFallback: soilRes.isFallback,
        airQualityFallback: airQualityRes.isFallback,
        worldPopFallback: worldPopRes.isFallback,
        firmsFallback: firmsRes.isFallback
      }
    };

    // 5. Calculate Multi-Hazard Assessment in Domain Layer
    const assessmentResult = RiskScoringEngine.calculate(
      coords,
      address,
      country,
      input.propertyType,
      input.userPersona,
      rawInputs
    );

    if (assessmentResult.modelMetadata) {
      assessmentResult.modelMetadata.assessmentDepth = depth;
    }

    return assessmentResult;
  }
}


