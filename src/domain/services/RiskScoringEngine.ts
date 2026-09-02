import type {
  FloodMetrics,
  QuakeMetrics,
  HeatMetrics,
  TransportMetrics,
  MultiHazardAssessmentResult,
  PropertyType,
  UserPersona,
  HazardCategory,
  ThinkHazardReportSummary,
  ScoreReliability,
  RiskLevel,
  HazardClassSource,
  HeatModelLevel,
  SpatialFeatureRecord,
  FeatureStore,
  SoilGridsData,
  AirQualityData,
  WorldPopData,
  NasaFirmsData,
  BoundedSpatialDistance
} from '../types/hazard.types';
import { Coordinates } from '../value_objects/Coordinates.vo';
import { RiskScore } from '../value_objects/RiskScore.vo';
import { PrescriptionEngine } from './PrescriptionEngine';
import { GoTangguhFinancialScreeningEngine } from './GoTangguhFinancialScreeningEngine';
import { RISK_MODEL_CONFIG } from '../config/RiskModelConfig';
import type { NormalizedTransportEvidence } from '../types/transport.types';
import { metersToKilometers, formatDistanceMeters } from '../utils/UnitConversions';

export interface RawPhysicalInputs {
  elevationMeters: number | null;
  slopeDegrees?: number | null;
  slopePercent?: number | null;
  slopeClassification?: string | null;
  localReliefMeters?: number | null;
  localReliefType?: string | null;
  flowAccumulationPotential?: string | null;
  max24hRainfallMm: number | null;
  rainfallPeriod?: string | null;
  rainfallDataSource?: string | null;
  floodDepthMeters?: number | null;
  historicalFloodEventsCount?: number | null;
  historicalFloodPeriod?: string | null;
  imperviousSurfaceRatioPct?: number | null;
  nearestDrainageChannel?: string | null;
  distanceToDrainageMeters?: number | null;
  distanceToRiverMeters: number | null;
  nearestRiverName?: string | null;
  waterwayBounded?: BoundedSpatialDistance;
  nearestFaultName?: string | null;
  distanceToFaultKm?: number | null;
  nearestEpicenterKm?: number | null;
  latestQuakeDescription?: string | null;
  historicalQuakesCount150km: number | null;    // USGS/EMSC 10-year M>=4.0 events within 150 km
  historicalQuakesCount100km: number | null;    // Distinct geodesic 100 km count (never duplicated from 150 km)
  maxHistoricalMag: number | null;              // Peak magnitude recorded in historical catalog
  avgMaxTempC: number | null;
  historicalPeakTempC: number | null;
  forecastPeakTempC?: number | null;
  forecastMeanMaxTempC?: number | null;
  projectedTempRise2050C: number | null;
  greenSpaceRatioPct: number | null;
  distanceToNearestRoadMeters: number | null;
  nearestRoadName?: string | null;
  roadBounded?: BoundedSpatialDistance;
  distanceToArterialMeters: number | null;
  nearestArterialName?: string | null;
  arterialBounded?: BoundedSpatialDistance;
  distanceToTransitHubMeters: number | null;
  nearestTransitName?: string | null;
  transitBounded?: BoundedSpatialDistance;
  distanceToHospitalMeters: number | null;
  nearestHospitalName?: string | null;
  hospitalBounded?: BoundedSpatialDistance;
  distanceToAssemblyPointMeters?: number | null;
  nearestAssemblyPointName?: string | null;
  assemblyPointBounded?: BoundedSpatialDistance;
  assemblyPointIsOfficial?: boolean;
  assemblyPointFacilityType?: string | null;
  travelTimeToAssemblyPointMinutes?: string | null;
  travelTimeToAssemblyPointRouteDistanceMeters?: number | null;
  distanceToFireStationMeters: number | null;
  nearestFireStationName?: string | null;
  fireStationBounded?: BoundedSpatialDistance;
  estimatedTravelTimeMinutes?: string | null;
  travelTimeRouteDistanceMeters?: number | null;
  routingSource?: string | null;
  inariskFloodIndex?: number | null;
  inariskFloodClass?: string | null;
  inariskQuakeIndex?: number | null;
  inariskQuakeClass?: string | null;
  inariskLiquefactionRisk?: string | null;
  pgaMcegG?: number | null;
  pgaMcerS1?: number | null;
  pgaMcerSs?: number | null;
  landslideHazardIndex?: number | null;
  extremeWeatherHazardIndex?: number | null;
  droughtHazardIndex?: number | null;
  wildfireHazardIndex?: number | null;
  tsunamiHazardIndex?: number | null;
  riverDischargeM3s?: number | null;
  soil?: SoilGridsData | null;
  airQuality?: AirQualityData | null;
  populationExposure?: WorldPopData | null;
  wildfireActivity?: NasaFirmsData | null;
  features?: SpatialFeatureRecord[];
  featureStore?: FeatureStore;
  transportEvidence?: NormalizedTransportEvidence | null;
  isFallbackFlags?: {
    openMeteoFallback?: boolean;
    usgsFallback?: boolean;
    bmkgFallback?: boolean;
    osmFallback?: boolean;
    inariskFallback?: boolean;
    thinkHazardFallback?: boolean;
    soilGridsFallback?: boolean;
    airQualityFallback?: boolean;
    worldPopFallback?: boolean;
    firmsFallback?: boolean;
  };
  thinkHazardReport?: ThinkHazardReportSummary | null;
}

export class RiskScoringEngine {
  private static readonly MODEL_NAME = RISK_MODEL_CONFIG.METADATA.modelName;
  private static readonly MODEL_VERSION = RISK_MODEL_CONFIG.METADATA.modelVersion;

  /**
   * Deterministic spatial risk scoring engine for property due diligence.
   * Produces separate dimension scores (0-100 or null) and a weighted multi-hazard score.
   */
  public static calculate(
    coordsOrInputs: Coordinates | RawPhysicalInputs,
    addressOrCountry?: string,
    countryOrPropType?: string | PropertyType,
    propType?: PropertyType,
    persona?: UserPersona,
    inputsParam?: RawPhysicalInputs
  ): MultiHazardAssessmentResult {
    let coords: Coordinates;
    let address: string;
    let country: string;
    let finalPropType: PropertyType;
    let finalPersona: UserPersona;
    let safeInputs: RawPhysicalInputs;

    if (
      coordsOrInputs &&
      ('elevationMeters' in coordsOrInputs ||
        'max24hRainfallMm' in coordsOrInputs ||
        'avgMaxTempC' in coordsOrInputs ||
        'forecastPeakTempC' in coordsOrInputs ||
        'historicalQuakesCount150km' in coordsOrInputs ||
        !('lat' in coordsOrInputs))
    ) {
      safeInputs = coordsOrInputs as RawPhysicalInputs;
      coords = new Coordinates(-6.2088, 106.8456);
      address = 'Site Assessment';
      country = typeof addressOrCountry === 'string' ? addressOrCountry : 'Indonesia';
      finalPropType = (typeof countryOrPropType === 'string' && ['Residential', 'Commercial', 'Industrial', 'Infrastructure'].includes(countryOrPropType) ? countryOrPropType as PropertyType : 'Residential');
      finalPersona = (propType as unknown as UserPersona) || 'Home Buyer';
    } else {
      coords = (coordsOrInputs as Coordinates) || new Coordinates(-6.2088, 106.8456);
      address = addressOrCountry || 'Site Assessment';
      country = typeof countryOrPropType === 'string' ? countryOrPropType : 'Indonesia';
      finalPropType = (propType as PropertyType) || 'Residential';
      finalPersona = (persona as UserPersona) || 'Home Buyer';
      safeInputs = inputsParam || ({} as RawPhysicalInputs);
    }

    const latAbs = Math.abs(coords?.lat ?? 0).toFixed(2).replace('.', '');
    const lngAbs = Math.abs(coords?.lng ?? 0).toFixed(2).replace('.', '');
    const refCode = `GT-${latAbs}-${lngAbs}`;

    // =========================================================================
    // 1. Data Completeness Calculation
    // =========================================================================
    let fallbackCount = 0;
    const totalSources = 6;
    if (safeInputs.isFallbackFlags?.openMeteoFallback) fallbackCount++;
    if (safeInputs.isFallbackFlags?.usgsFallback) fallbackCount++;
    if (safeInputs.isFallbackFlags?.bmkgFallback && country === 'Indonesia') fallbackCount++;
    if (safeInputs.isFallbackFlags?.osmFallback) fallbackCount++;
    if (safeInputs.isFallbackFlags?.inariskFallback && country === 'Indonesia') fallbackCount++;
    if (safeInputs.isFallbackFlags?.thinkHazardFallback) fallbackCount++;

    const inputs = safeInputs;
    const dataCompletenessScorePct = Math.round(((totalSources - fallbackCount) / totalSources) * 100);
    const confidenceScorePct = dataCompletenessScorePct; // Backward-compatible alias

    // =========================================================================
    // 2. GoTangguh Flood Risk Model (0-100 or null)
    // =========================================================================
    const floodCfg = RISK_MODEL_CONFIG.FLOOD;
    let floodClassSource: HazardClassSource = null;
    let floodClassStr = 'Data klasifikasi resmi tidak tersedia';

    if (
      inputs.inariskFloodClass &&
      inputs.inariskFloodClass !== 'Tidak Teridentifikasi' &&
      inputs.inariskFloodClass !== 'Data tidak tersedia' &&
      !inputs.inariskFloodClass.includes('tidak tersedia')
    ) {
      floodClassSource = 'BNPB';
      floodClassStr = inputs.inariskFloodClass;
    } else if (
      inputs.thinkHazardReport?.floodLevel &&
      inputs.thinkHazardReport.floodLevel !== 'No Data'
    ) {
      floodClassSource = 'ThinkHazard';
      floodClassStr = inputs.thinkHazardReport.floodLevel;
    }

    const hasFloodClassEvidence = floodClassSource !== null;
    const hasWaterwayObservation = (inputs.distanceToRiverMeters != null && inputs.distanceToRiverMeters >= 0) ||
      Boolean(inputs.waterwayBounded && (inputs.waterwayBounded.state === 'AVAILABLE_BOUNDED' || inputs.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const floodPhysicalInputCount =
      (inputs.elevationMeters != null ? 1 : 0) +
      (hasWaterwayObservation ? 1 : 0) +
      (inputs.max24hRainfallMm != null ? 1 : 0) +
      (inputs.riverDischargeM3s != null ? 1 : 0);
    const hasFloodPhysicalMetrics = floodPhysicalInputCount > 0;

    const floodExpectedComponents = 5; // 4 physical parameters + 1 official classification
    const floodObservedComponents = floodPhysicalInputCount + (hasFloodClassEvidence ? 1 : 0);
    const floodCoveragePct = Math.round((floodObservedComponents / floodExpectedComponents) * 100);

    const hasFloodData = hasFloodClassEvidence || hasFloodPhysicalMetrics;

    let floodScore: number | null = null;
    let floodLevel: RiskLevel = 'insufficient_data';
    let floodReliability: ScoreReliability = 'insufficient_data';
    let floodModelLevel = 'Data Tidak Tersedia';

    let floodScoreLedger: FloodScoreLedger | undefined = undefined;

    if (hasFloodData) {
      let baseScore: number = floodCfg.baseTiers.defaultBase;
      let baseSource = 'Default Model Base';
      let baseReason = 'Skor dasar awal model penapisan banjir GoTangguh';
      const adjustments: ScoreLedgerAdjustment[] = [];

      if (hasFloodClassEvidence) {
        if (floodClassStr === 'Tinggi' || floodClassStr === 'High') {
          baseScore = floodCfg.baseTiers.high;
        } else if (floodClassStr === 'Sedang' || floodClassStr === 'Medium') {
          baseScore = floodCfg.baseTiers.medium;
        } else if (floodClassStr === 'Rendah' || floodClassStr === 'Low') {
          baseScore = floodCfg.baseTiers.low;
        }
        baseSource = floodClassSource === 'BNPB' ? 'BNPB inaRISK Official Classification' : 'ThinkHazard Regional Baseline';
        baseReason = `Klasifikasi resmi ${floodClassSource} (${floodClassStr}) dipetakan ke skor dasar penapisan internal GoTangguh (${baseScore}/100)`;
        floodReliability = 'partially_observed'; // Model, raster, and reanalysis data without in-situ gauge measurements
      } else {
        // Physical observations exist without official tier
        baseScore = floodCfg.baseTiers.physicalOnlyBaseline;
        baseSource = 'Physical Observation Baseline';
        baseReason = 'Skor dasar pengamatan fisik langsung tapak tanpa klasifikasi resmi pemerintah';
        floodReliability = floodPhysicalInputCount >= 2 ? 'partially_observed' : 'imputed_model_baseline';
      }

      let floodScoreRaw = baseScore;

      // Ground elevation physical adjustment (Copernicus DEM / Open-Elevation)
      if (inputs.elevationMeters !== null) {
        for (const adj of floodCfg.elevationAdjustments) {
          if ('maxMeters' in adj && inputs.elevationMeters < adj.maxMeters!) {
            floodScoreRaw += adj.scoreDelta;
            adjustments.push({
              name: 'Elevation Low-Lying Adjustment',
              source: 'Copernicus DEM (Open-Meteo)',
              input: `${inputs.elevationMeters} m`,
              delta: adj.scoreDelta,
              reason: `Elevasi tapak < ${adj.maxMeters}m dpl meningkatkan kerentanan genangan gravitasi (+${adj.scoreDelta})`
            });
            break;
          } else if ('minMeters' in adj && inputs.elevationMeters > adj.minMeters!) {
            floodScoreRaw += adj.scoreDelta;
            adjustments.push({
              name: 'Elevation High-Ground Discount',
              source: 'Copernicus DEM (Open-Meteo)',
              input: `${inputs.elevationMeters} m`,
              delta: adj.scoreDelta,
              reason: `Elevasi tapak > ${adj.minMeters}m dpl mengurangi risiko genangan permukaan (${adj.scoreDelta})`
            });
            break;
          }
        }
      }

      // Waterway proximity physical adjustment (OSM Waterways)
      if (inputs.distanceToRiverMeters !== null && inputs.distanceToRiverMeters >= 0 && inputs.distanceToRiverMeters <= floodCfg.maxActiveRiverRadiusMeters) {
        for (const adj of floodCfg.riverDistanceAdjustments) {
          if (inputs.distanceToRiverMeters < adj.maxDistanceMeters) {
            floodScoreRaw += adj.scoreDelta;
            adjustments.push({
              name: 'Waterway Proximity Adjustment',
              source: 'OpenStreetMap Waterways',
              input: `${inputs.distanceToRiverMeters} m (${inputs.nearestRiverName || 'badan air'})`,
              delta: adj.scoreDelta,
              reason: `Jarak tegak lurus ke badan air < ${adj.maxDistanceMeters}m meningkatkan potensi luapan sungai (+${adj.scoreDelta})`
            });
            break;
          }
        }
      }

      // 24h peak precipitation physical adjustment (ERA5 / Open-Meteo)
      if (inputs.max24hRainfallMm !== null) {
        for (const adj of floodCfg.precipitationAdjustments) {
          if (inputs.max24hRainfallMm > adj.minMm) {
            floodScoreRaw += adj.scoreDelta;
            adjustments.push({
              name: 'Peak Rainfall Adjustment',
              source: 'ERA5-Seamless (Open-Meteo)',
              input: `${inputs.max24hRainfallMm} mm/hari`,
              delta: adj.scoreDelta,
              reason: `Curah hujan harian puncak 5 tahunan (2020–2024) > ${adj.minMm}mm meningkatkan pemicu banjir pluvial (+${adj.scoreDelta})`
            });
            break;
          }
        }
      }

      // NOTE (Phase 8.4.1 & Phase 8.5 Semantic & Weight Audit):
      // GloFAS macro catchment river discharge is retained strictly as macro context evidence (delta = 0).
      // Slope, local relief, and flow convergence are retained as supporting terrain context (delta = 0).

      const capApplied = floodScoreRaw > 100;
      const floorApplied = floodScoreRaw < 0;
      const clampedScore = Math.max(0, Math.min(100, floodScoreRaw));
      const riskScoreObj = new RiskScore(clampedScore);
      floodScore = riskScoreObj.value;
      floodLevel = riskScoreObj.level;

      floodScoreLedger = {
        officialClassification: hasFloodClassEvidence ? floodClassStr : null,
        officialSource: floodClassSource === 'BNPB' ? 'BNPB inaRISK' : floodClassSource === 'ThinkHazard' ? 'World Bank ThinkHazard!' : null,
        internalBaseScore: baseScore,
        internalBaseTransformation: hasFloodClassEvidence
          ? `Klasifikasi resmi ${floodClassSource} (${floodClassStr}) dipetakan ke skor dasar penapisan internal GoTangguh (${baseScore}/100)`
          : `Skor dasar penapisan internal GoTangguh berbasis observasi fisik tapak (${baseScore}/100)`,
        baseScore,
        baseSource,
        baseReason,
        adjustments,
        rawScore: floodScoreRaw,
        capApplied,
        floorApplied,
        finalScore: clampedScore,
        reliability: floodReliability
      };

      floodModelLevel = floodScore > floodCfg.tierThresholds.highExposure
        ? 'High Exposure Model Tier'
        : floodScore > floodCfg.tierThresholds.moderateExposure
        ? 'Moderate Exposure Model Tier'
        : 'Low Exposure Model Tier';
    }

    const elevTextId = inputs.elevationMeters !== null ? `${Math.round(inputs.elevationMeters)}m dpl` : 'data elevasi tidak tersedia';
    const elevTextEn = inputs.elevationMeters !== null ? `${Math.round(inputs.elevationMeters)}m MSL` : 'elevation data unavailable';
    const hasRiver = inputs.distanceToRiverMeters !== null && inputs.distanceToRiverMeters >= 0 && inputs.distanceToRiverMeters <= 2500;
    const isWaterwayBounded = Boolean(inputs.waterwayBounded && (inputs.waterwayBounded.state === 'AVAILABLE_BOUNDED' || inputs.waterwayBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const riverTextId = hasRiver
      ? `berjarak ${Math.round(inputs.distanceToRiverMeters!)}m dari ${inputs.nearestRiverName || 'badan air'}`
      : isWaterwayBounded
      ? 'tidak teridentifikasi badan air OSM dalam radius pencarian 5 km'
      : 'data badan air tidak tersedia';
    const riverTextEn = hasRiver
      ? `located ${Math.round(inputs.distanceToRiverMeters!)}m from ${inputs.nearestRiverName || 'waterway'}`
      : isWaterwayBounded
      ? 'no open OSM waterways identified within 5 km search radius'
      : 'waterway proximity data unavailable';
    const rainTextId = inputs.max24hRainfallMm !== null ? `curah hujan harian puncak ${Math.round(inputs.max24hRainfallMm)} mm` : 'data curah hujan tidak tersedia';
    const rainTextEn = inputs.max24hRainfallMm !== null ? `24h peak precipitation ${Math.round(inputs.max24hRainfallMm)} mm` : 'precipitation data unavailable';

    const floodSourceLabelId = floodClassSource === 'BNPB'
      ? `Zonasi bahaya banjir BNPB: ${floodClassStr}`
      : floodClassSource === 'ThinkHazard'
      ? `Indikator banjir ThinkHazard: ${floodClassStr}`
      : 'Data klasifikasi resmi banjir tidak tersedia';

    const floodSourceLabelEn = floodClassSource === 'BNPB'
      ? `BNPB flood hazard tier: ${floodClassStr}`
      : floodClassSource === 'ThinkHazard'
      ? `ThinkHazard flood indicator: ${floodClassStr}`
      : 'Official flood classification data unavailable';

    const floodCoverageNoticeId = hasFloodData && floodPhysicalInputCount < 3
      ? ` (Coverage data parsial: ${floodObservedComponents}/5 indikator teramati)`
      : '';
    const floodCoverageNoticeEn = hasFloodData && floodPhysicalInputCount < 3
      ? ` (Partial data coverage: ${floodObservedComponents}/5 indicators observed)`
      : '';

    const slopeDescId = inputs.slopeDegrees !== null ? `, kemiringan lereng ${inputs.slopeDegrees}° (${inputs.slopeClassification || 'topografi DEM'})` : '';
    const slopeDescEn = inputs.slopeDegrees !== null ? `, terrain slope ${inputs.slopeDegrees}° (${inputs.slopeClassification || 'DEM topography'})` : '';
    const reliefDescId = inputs.localReliefMeters !== null ? `, relief ${inputs.localReliefMeters > 0 ? `+${inputs.localReliefMeters}` : inputs.localReliefMeters}m (${inputs.localReliefType || 'topografi'})` : '';
    const reliefDescEn = inputs.localReliefMeters !== null ? `, relief ${inputs.localReliefMeters > 0 ? `+${inputs.localReliefMeters}` : inputs.localReliefMeters}m (${inputs.localReliefType || 'topography'})` : '';
    const drainDescId = inputs.nearestDrainageChannel ? `, saluran drainase terdekat ${inputs.nearestDrainageChannel} (${inputs.distanceToDrainageMeters}m)` : '';
    const drainDescEn = inputs.nearestDrainageChannel ? `, nearest drainage channel ${inputs.nearestDrainageChannel} (${inputs.distanceToDrainageMeters}m)` : '';

    const floodCauseId = !hasFloodData || floodScore === null
      ? 'Data parameter banjir tidak cukup untuk melakukan penilaian risiko.'
      : floodScore > 65
      ? `${floodSourceLabelId} pada elevasi ${elevTextId}${slopeDescId}${reliefDescId}, ${riverTextId}, dengan ${rainTextId}${drainDescId}.${floodCoverageNoticeId}`
      : floodScore > 35
      ? `${floodSourceLabelId} pada elevasi ${elevTextId}${slopeDescId}${reliefDescId}, ${riverTextId}, dipengaruhi ${rainTextId}${drainDescId}.${floodCoverageNoticeId}`
      : `${floodSourceLabelId} pada elevasi ${elevTextId}${slopeDescId}${reliefDescId}, ${riverTextId}${drainDescId}.${floodCoverageNoticeId}`;

    const floodCauseEn = !hasFloodData || floodScore === null
      ? 'Insufficient flood parameter data to perform risk assessment.'
      : floodScore > 65
      ? `${floodSourceLabelEn} at elevation ${elevTextEn}${slopeDescEn}${reliefDescEn}, ${riverTextEn}, with ${rainTextEn}${drainDescEn}.${floodCoverageNoticeEn}`
      : floodScore > 35
      ? `${floodSourceLabelEn} at elevation ${elevTextEn}${slopeDescEn}${reliefDescEn}, ${riverTextEn}, influenced by ${rainTextEn}${drainDescEn}.${floodCoverageNoticeEn}`
      : `${floodSourceLabelEn} at elevation ${elevTextEn}${slopeDescEn}${reliefDescEn}, ${riverTextEn}${drainDescEn}.${floodCoverageNoticeEn}`;

    const flood: FloodMetrics = {
      score: floodScore,
      level: floodLevel,
      scoreReliability: floodReliability,
      observedComponents: floodObservedComponents,
      expectedComponents: floodExpectedComponents,
      coveragePct: floodCoveragePct,
      floodModelLevel,
      floodClass: hasFloodClassEvidence ? floodClassStr : null,
      floodClassSource,
      elevationMeters: (inputs.elevationMeters !== null && inputs.elevationMeters !== undefined) ? Math.round(inputs.elevationMeters) : null,
      slopeDegrees: (inputs.slopeDegrees !== null && inputs.slopeDegrees !== undefined) ? inputs.slopeDegrees : null,
      slopePercent: (inputs.slopePercent !== null && inputs.slopePercent !== undefined) ? inputs.slopePercent : null,
      slopeClassification: inputs.slopeClassification || null,
      localReliefMeters: (inputs.localReliefMeters !== null && inputs.localReliefMeters !== undefined) ? inputs.localReliefMeters : null,
      localReliefType: inputs.localReliefType || null,
      flowAccumulationPotential: inputs.flowAccumulationPotential || null,
      distanceToRiverMeters: (inputs.distanceToRiverMeters !== null && inputs.distanceToRiverMeters !== undefined && inputs.distanceToRiverMeters >= 0) ? Math.round(inputs.distanceToRiverMeters) : null,
      nearestRiverName: hasRiver ? (inputs.nearestRiverName || null) : null,
      waterwayBounded: inputs.waterwayBounded,
      max24hRainfallMm: (inputs.max24hRainfallMm !== null && inputs.max24hRainfallMm !== undefined) ? Math.round(inputs.max24hRainfallMm) : null,
      rainfallPeriod: inputs.rainfallPeriod ?? '2020-01-01 to 2024-12-31 (ERA5)',
      rainfallDataSource: inputs.rainfallDataSource ?? 'Open-Meteo ERA5-Seamless',
      floodDepthMeters: inputs.floodDepthMeters ?? null,
      historicalFloodEventsCount: inputs.historicalFloodEventsCount ?? null,
      historicalFloodPeriod: inputs.historicalFloodPeriod ?? null,
      imperviousSurfaceRatioPct: inputs.imperviousSurfaceRatioPct ?? null,
      nearestDrainageChannel: inputs.nearestDrainageChannel ?? null,
      distanceToDrainageMeters: inputs.distanceToDrainageMeters ?? null,
      bnpbInaRiskClass: inputs.inariskFloodClass || (floodClassSource === 'BNPB' ? floodClassStr : null),
      bnpbFloodHazardIndex: (inputs.inariskFloodIndex !== null && inputs.inariskFloodIndex !== undefined) ? +inputs.inariskFloodIndex.toFixed(4) : null,
      thinkHazardFloodLevel: inputs.thinkHazardReport?.floodLevel && inputs.thinkHazardReport.floodLevel !== 'No Data' ? inputs.thinkHazardReport.floodLevel : null,
      thinkHazardGranularity: inputs.thinkHazardReport?.granularity ?? null,
      riverDischargeM3s: (inputs.riverDischargeM3s !== null && inputs.riverDischargeM3s !== undefined) ? +inputs.riverDischargeM3s.toFixed(1) : null,
      glofasDischargeModelM3s: (inputs.riverDischargeM3s !== null && inputs.riverDischargeM3s !== undefined) ? +inputs.riverDischargeM3s.toFixed(1) : null,
      floodZoneType: floodModelLevel,
      potentialDepthRange: null, // Strictly null unless in-situ hydrological micro-simulation or gauge observation is present
      scoreLedger: floodScoreLedger,
      causeId: floodCauseId,
      causeEn: floodCauseEn,
      impactId: !hasFloodData || floodScore === null
        ? 'Data parameter banjir tidak cukup untuk mengindikasikan potensi dampak fisik.'
        : floodScore > 70
        ? 'Indikasi penapisan potensi genangan lantai bawah, penurunan daya dukung tanah pondasi, dan risiko terhadap instalasi elektrikal.'
        : floodScore > 40
        ? 'Indikasi genangan berkala di area luar/halaman saat intensitas hujan tinggi.'
        : 'Elevasi relatif memberikan sinyal keterpaparan topografi yang lebih rendah, namun tidak meniadakan potensi risiko genangan mikro.',
      impactEn: !hasFloodData || floodScore === null
        ? 'Insufficient flood parameter data to indicate potential physical impact.'
        : floodScore > 70
        ? 'Screening indication of ground-floor inundation potential, subgrade bearing capacity reduction, and MEP equipment hazard.'
        : floodScore > 40
        ? 'Potential episodic surface ponding across exterior perimeter during heavy rainfall.'
        : 'Absolute elevation provides a lower-exposure terrain signal, but does not eliminate localized flood risk.',
      recomId: !hasFloodData || floodScore === null
        ? 'Data parameter banjir tidak cukup untuk merumuskan rekomendasi penapisan teknis.'
        : floodScore > 65
        ? 'Evaluasi elevasi peil lantai, sistem katup arus balik (backflow valve), dan kapasitas saluran drainase tapak berdasarkan asesmen teknis.'
        : floodScore > 35
        ? 'Pertimbangkan penyediaan saluran drainase keliling dan sumur resapan sesuai karakteristik tanah tapak.'
        : 'Pertahankan fungsi saluran pembuangan air hujan tapak secara berkala.',
      recomEn: !hasFloodData || floodScore === null
        ? 'Insufficient flood parameter data to formulate technical screening recommendations.'
        : floodScore > 65
        ? 'Evaluate finished floor elevation, backflow check valves, and site drainage capacity based on technical site assessment.'
        : floodScore > 35
        ? 'Consider perimeter drainage channels and recharge drywells suited to site percolation capacity.'
        : 'Maintain regular maintenance of site stormwater drainage channels.'
    };

    // =========================================================================
    // 3. GoTangguh Seismic Risk Model (0-100 or null)
    // =========================================================================
    let quakeClassSource: HazardClassSource = null;
    let quakeClassStr = 'Data klasifikasi resmi tidak tersedia';

    if (
      inputs.inariskQuakeClass &&
      inputs.inariskQuakeClass !== 'Tidak Teridentifikasi' &&
      inputs.inariskQuakeClass !== 'Data tidak tersedia' &&
      !inputs.inariskQuakeClass.includes('tidak tersedia')
    ) {
      quakeClassSource = 'BNPB';
      quakeClassStr = inputs.inariskQuakeClass;
    } else if (
      inputs.thinkHazardReport?.earthquakeLevel &&
      inputs.thinkHazardReport.earthquakeLevel !== 'No Data'
    ) {
      quakeClassSource = 'ThinkHazard';
      quakeClassStr = inputs.thinkHazardReport.earthquakeLevel;
    }

    if (String(quakeClassStr).toLowerCase() === 'very low' || String(quakeClassStr).toLowerCase() === 'very_low') {
      quakeClassStr = 'Sangat Rendah';
    }

    const hasQuakeClassEvidence = quakeClassSource !== null;
    const hasQuakeHistoricalData = inputs.historicalQuakesCount150km !== null || inputs.maxHistoricalMag !== null;
    const hasLiquefactionData = inputs.inariskLiquefactionRisk !== undefined && inputs.inariskLiquefactionRisk !== null && !inputs.inariskLiquefactionRisk.includes('tidak tersedia');

    const quakeExpectedComponents = 5;
    const quakeObservedComponents =
      (inputs.historicalQuakesCount150km !== null ? 1 : 0) +
      (inputs.maxHistoricalMag !== null ? 1 : 0) +
      (hasQuakeClassEvidence ? 1 : 0) +
      (inputs.pgaMcegG !== null && inputs.pgaMcegG !== undefined ? 1 : 0) +
      (hasLiquefactionData ? 1 : 0);
    const quakeCoveragePct = Math.round((quakeObservedComponents / quakeExpectedComponents) * 100);

    // Liquefaction data alone MUST NOT make earthquake score available.
    // Earthquake score availability requires verified hazard tier OR historical seismic catalog data.
    const hasQuakeData = hasQuakeClassEvidence || hasQuakeHistoricalData;

    let quakeScore: number | null = null;
    let quakeLevel: RiskLevel = 'insufficient_data';
    let quakeReliability: ScoreReliability = 'insufficient_data';
    const seismicCfg = RISK_MODEL_CONFIG.SEISMIC;

    if (hasQuakeData) {
      let baseScore: number = seismicCfg.baseTiers.defaultBase;
      let baseSource = 'Default Model Base';
      let baseReason = 'Skor dasar awal model penapisan seismik GoTangguh';
      const adjustments: ScoreLedgerAdjustment[] = [];

      if (hasQuakeClassEvidence) {
        if (quakeClassStr === 'Tinggi' || quakeClassStr === 'High') {
          baseScore = seismicCfg.baseTiers.high;
        } else if (quakeClassStr === 'Sedang' || quakeClassStr === 'Medium') {
          baseScore = seismicCfg.baseTiers.medium;
        } else if (quakeClassStr === 'Rendah' || quakeClassStr === 'Low' || quakeClassStr === 'Sangat Rendah') {
          baseScore = seismicCfg.baseTiers.lowOrVeryLow;
        }
        baseSource = quakeClassSource === 'BNPB' ? 'BNPB inaRISK Official Classification' : 'ThinkHazard Regional Baseline';
        baseReason = `Klasifikasi resmi ${quakeClassSource} (${quakeClassStr}) dipetakan ke skor dasar penapisan internal GoTangguh (${baseScore}/100)`;
        quakeReliability = 'partially_observed'; // Model, raster, and catalog data without in-situ parcel accelerographs
      } else {
        baseScore = seismicCfg.baseTiers.historicalOnlyBaseline; // Screening baseline
        baseSource = 'Historical Catalog Baseline';
        baseReason = 'Skor dasar penapisan dari riwayat katalog kegempaan tanpa klasifikasi resmi pemerintah';
        quakeReliability = (inputs.historicalQuakesCount150km !== null && inputs.maxHistoricalMag !== null) ? 'partially_observed' : 'imputed_model_baseline';
      }

      let quakeScoreRaw = baseScore;

      // 1. Direct verified Peak Ground Acceleration (PGA_MCEG_100 in g) physical adjustment
      if (inputs.pgaMcegG !== null && inputs.pgaMcegG !== undefined) {
        for (const adj of seismicCfg.pgaAdjustments) {
          if (inputs.pgaMcegG >= adj.minG) {
            quakeScoreRaw += adj.scoreDelta;
            adjustments.push({
              name: 'PGA Spectral Acceleration Adjustment',
              source: 'BNPB PGA_MCEG_100 ImageServer',
              input: `${inputs.pgaMcegG} g`,
              delta: adj.scoreDelta,
              reason: `Percepatan tanah puncak MCEG (periode ulang 100 tahun) ≥ ${adj.minG}g meningkatkan potensi gaya inersia struktur (+${adj.scoreDelta})`
            });
            break;
          }
        }
      }

      // 2. Consolidated 10-Year Seismicity Catalog Modifier (USGS/EMSC M>=4.0 within 150 km)
      // Avoids double-counting event frequency and peak magnitude as independent additive penalties
      const count150km = inputs.historicalQuakesCount150km;
      const maxMag = inputs.maxHistoricalMag;
      if (count150km !== null || maxMag !== null) {
        const c = count150km ?? 0;
        const m = maxMag ?? 0;
        if (c >= 15 || m >= 6.5) {
          const delta = seismicCfg.historicalSeismicityAdjustments[0].scoreDelta;
          quakeScoreRaw += delta;
          adjustments.push({
            name: 'Historical Seismicity Cluster Modifier',
            source: 'USGS / EMSC Seismicity Catalog (10-Year, 150 km)',
            input: `${c} gempa, Mmax ${m > 0 ? m.toFixed(1) : 'N/A'}`,
            delta,
            reason: `Riwayat klaster kegempaan aktif (≥15 gempa atau M≥6.5 dalam radius 150 km) (+${delta})`
          });
        } else if (c >= 5 || m >= 5.0) {
          const delta = seismicCfg.historicalSeismicityAdjustments[1].scoreDelta;
          quakeScoreRaw += delta;
          adjustments.push({
            name: 'Historical Seismicity Cluster Modifier',
            source: 'USGS / EMSC Seismicity Catalog (10-Year, 150 km)',
            input: `${c} gempa, Mmax ${m > 0 ? m.toFixed(1) : 'N/A'}`,
            delta,
            reason: `Riwayat klaster kegempaan moderat (≥5 gempa atau M≥5.0 dalam radius 150 km) (+${delta})`
          });
        } else if (c >= 1) {
          const delta = seismicCfg.historicalSeismicityAdjustments[2].scoreDelta;
          quakeScoreRaw += delta;
          adjustments.push({
            name: 'Historical Seismicity Cluster Modifier',
            source: 'USGS / EMSC Seismicity Catalog (10-Year, 150 km)',
            input: `${c} gempa, Mmax ${m > 0 ? m.toFixed(1) : 'N/A'}`,
            delta,
            reason: `Riwayat kejadian kegempaan terpantau (≥1 gempa dalam radius 150 km) (+${delta})`
          });
        }
      }

      // 3. Liquefaction Geotechnical Modifier (BNPB INDEKS_BAHAYA_LIKUEFAKSI)
      if (inputs.inariskLiquefactionRisk === 'Tinggi') {
        const delta = seismicCfg.liquefactionModifiers.high;
        quakeScoreRaw += delta;
        adjustments.push({
          name: 'Liquefaction Susceptibility Modifier',
          source: 'BNPB INDEKS_BAHAYA_LIKUEFAKSI ImageServer',
          input: 'Tinggi',
          delta,
          reason: `Zonasi kerentanan likuefaksi tinggi resmi BNPB meningkatkan risiko penurunan tanah tapak (+${delta})`
        });
      } else if (inputs.inariskLiquefactionRisk === 'Sedang') {
        const delta = seismicCfg.liquefactionModifiers.medium;
        quakeScoreRaw += delta;
        adjustments.push({
          name: 'Liquefaction Susceptibility Modifier',
          source: 'BNPB INDEKS_BAHAYA_LIKUEFAKSI ImageServer',
          input: 'Sedang',
          delta,
          reason: `Zonasi kerentanan likuefaksi sedang resmi BNPB meningkatkan risiko deformasi tanah tapak (+${delta})`
        });
      }

      const capApplied = quakeScoreRaw > 100;
      const floorApplied = quakeScoreRaw < 0;
      const clampedScore = Math.max(0, Math.min(100, quakeScoreRaw));
      const riskScoreObj = new RiskScore(clampedScore);
      quakeScore = riskScoreObj.value;
      quakeLevel = riskScoreObj.level;

      quakeScoreLedger = {
        officialClassification: hasQuakeClassEvidence ? quakeClassStr : null,
        officialSource: quakeClassSource === 'BNPB' ? 'BNPB inaRISK' : quakeClassSource === 'ThinkHazard' ? 'World Bank ThinkHazard!' : null,
        internalBaseScore: baseScore,
        internalBaseTransformation: hasQuakeClassEvidence
          ? `Klasifikasi resmi ${quakeClassSource} (${quakeClassStr}) dipetakan ke skor dasar penapisan internal GoTangguh (${baseScore}/100)`
          : `Skor dasar penapisan internal GoTangguh berbasis riwayat kegempaan tapak (${baseScore}/100)`,
        baseScore,
        baseSource,
        baseReason,
        adjustments,
        rawScore: quakeScoreRaw,
        capApplied,
        floorApplied,
        finalScore: clampedScore,
        reliability: quakeReliability
      };
    }

    const liqRiskId = inputs.inariskLiquefactionRisk || 'Data tidak tersedia';
    const liqRiskEn = inputs.inariskLiquefactionRisk === 'Tinggi'
      ? 'High'
      : inputs.inariskLiquefactionRisk === 'Sedang'
      ? 'Medium'
      : inputs.inariskLiquefactionRisk === 'Rendah'
      ? 'Low'
      : 'Data unavailable';

    const sniRef = country === 'Indonesia'
      ? 'SNI 1726:2019 (Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non Gedung)'
      : 'National Structural Code / International Building Code';

    const quakeSourceLabelId = quakeClassSource === 'BNPB'
      ? `Zonasi bahaya gempa BNPB: ${quakeClassStr}`
      : quakeClassSource === 'ThinkHazard'
      ? `Indikator gempa ThinkHazard: ${quakeClassStr}`
      : 'Data klasifikasi resmi gempa tidak tersedia';

    const quakeSourceLabelEn = quakeClassSource === 'BNPB'
      ? `BNPB seismic hazard tier: ${quakeClassStr}`
      : quakeClassSource === 'ThinkHazard'
      ? `ThinkHazard seismic indicator: ${quakeClassStr}`
      : 'Official seismic classification data unavailable';

    const count150km = inputs.historicalQuakesCount150km;
    const quakes150kmTextId = count150km !== null
      ? `${count150km} kejadian gempa (M≥4.0) dalam radius 150 km (Katalog USGS/EMSC)`
      : 'data histori gempa 150km tidak tersedia';

    const quakes150kmTextEn = count150km !== null
      ? `${count150km} recorded quakes (M≥4.0) within 150 km (USGS/EMSC Catalog)`
      : '150km seismic history unavailable';

    const quakeCauseId = !hasQuakeData
      ? 'Data parameter kegempaan tidak cukup untuk melakukan penilaian risiko.'
      : `${quakeSourceLabelId} dengan ${quakes150kmTextId}. Likuefaksi: ${liqRiskId}.`;

    const quakeCauseEn = !hasQuakeData
      ? 'Insufficient seismic parameter data to perform risk assessment.'
      : `${quakeSourceLabelEn} with ${quakes150kmTextEn}. Liquefaction: ${liqRiskEn}.`;

    const nearestFaultName = inputs.nearestFaultName || null;
    const distanceToFaultKm = inputs.distanceToFaultKm !== undefined && inputs.distanceToFaultKm !== null
      ? +inputs.distanceToFaultKm.toFixed(1)
      : null;

    const nearestEpicenterKm = inputs.nearestEpicenterKm !== undefined && inputs.nearestEpicenterKm !== null
      ? +inputs.nearestEpicenterKm.toFixed(1)
      : null;

    const quake: QuakeMetrics = {
      score: quakeScore,
      level: quakeLevel,
      scoreReliability: quakeReliability,
      observedComponents: quakeObservedComponents,
      expectedComponents: quakeExpectedComponents,
      coveragePct: quakeCoveragePct,
      quakeClass: hasQuakeData ? quakeClassStr : null,
      quakeClassSource,
      nearestFaultName,
      distanceToFaultKm,
      nearestEpicenterKm,
      latestQuakeDescription: inputs.latestQuakeDescription ?? null,
      historicalQuakesCount150km: inputs.historicalQuakesCount150km ?? null,
      historicalQuakesCount100km: inputs.historicalQuakesCount100km ?? null,
      maxHistoricalMag: inputs.maxHistoricalMag ?? null,
      recentM5PlusWithin350kmCount: inputs.recentM5PlusWithin350kmCount ?? null,
      recentMaxMagnitude: inputs.recentMaxMagnitude ?? null,
      estimatedPgaG: inputs.pgaMcegG !== undefined ? inputs.pgaMcegG : null, // Populated from official BNPB PGA_MCEG_100 raster or null
      pgaMcegG: inputs.pgaMcegG ?? null,
      pgaMcerS1: inputs.pgaMcerS1 ?? null,
      pgaMcerSs: inputs.pgaMcerSs ?? null,
      pgaSourceLayer: inputs.pgaMcegG !== null && inputs.pgaMcegG !== undefined ? 'BNPB PGA_MCEG_100 ImageServer (100yr MCEG)' : null,
      bnpbQuakeHazardIndex: (inputs.inariskQuakeIndex !== null && inputs.inariskQuakeIndex !== undefined) ? +inputs.inariskQuakeIndex.toFixed(4) : null,
      soilSiteClass: null,  // Strictly null: Site class (SA-SE per SNI 1726) requires geotechnical borehole / Vs30 measurements
      soilSiteClassSource: 'Klasifikasi situs tanah SNI 1726 memerlukan uji penetrasi standar (SPT/CPT) atau borehole geoteknik in-situ',
      sniStandardRef: sniRef,
      liquefactionRisk: liqRiskId,
      liquefactionSource: inputs.inariskLiquefactionRisk ? 'BNPB INDEKS_BAHAYA_LIKUEFAKSI ImageServer' : null,
      scoreLedger: quakeScoreLedger,
      bnpbInaRiskClass: quakeClassSource === 'BNPB' ? quakeClassStr : null,
      causeId: quakeCauseId,
      causeEn: quakeCauseEn,
      impactId: !hasQuakeData || quakeScore === null
        ? 'Data parameter kegempaan tidak cukup untuk mengindikasikan potensi guncangan fisik.'
        : quakeScore > 65
        ? 'Potensi guncangan seismik tinggi pada aktivitas tektonik regional, risiko retak geser dinding bata, dan deformasi balok non-daktil.'
        : quakeScore > 35
        ? 'Potensi guncangan sedang saat aktivitas tektonik regional, risiko retak rambut pada plesteran dinding.'
        : 'Tingkat bahaya gempa dan aktivitas seismik historis tercatat relatif rendah.',
      impactEn: !hasQuakeData || quakeScore === null
        ? 'Insufficient seismic parameter data to indicate potential physical ground shaking.'
        : quakeScore > 65
        ? 'Potential significant seismic shaking during regional tectonic events, risk of shear wall cracking and non-ductile frame deformation.'
        : quakeScore > 35
        ? 'Moderate ground acceleration during regional tectonic events, minor hairline plaster fissure risk.'
        : 'Seismic hazard tier and recorded historical seismicity are relatively low.',
      recomId: !hasQuakeData || quakeScore === null
        ? 'Data parameter kegempaan tidak cukup untuk merumuskan rekomendasi penapisan.'
        : quakeScore > 65
        ? 'Evaluasi sistem struktur dan sambungan balok-kolom oleh engineer struktur sesuai standar ketahanan gempa yang berlaku.'
        : quakeScore > 35
        ? 'Pastikan pengikatan kolom praktis dengan pasangan dinding bata terpasang secara berkala.'
        : 'Terapkan detail standar sambungan struktur bangunan tahan gempa dasar.',
      recomEn: !hasQuakeData || quakeScore === null
        ? 'Insufficient seismic parameter data to formulate screening recommendations.'
        : quakeScore > 65
        ? 'Evaluate structural framing and ductile connection detailing through a qualified structural engineer referencing applicable seismic design standards.'
        : quakeScore > 35
        ? 'Ensure tie columns and bond beams are anchored to masonry walls at regular intervals.'
        : 'Implement standard structural connection detailing for seismic safety.'
    };

    // =========================================================================
    // 4. GoTangguh Heat Stress Risk Model (0-100 or null)
    // =========================================================================
    const heatCfg = RISK_MODEL_CONFIG.HEAT;
    const hasForecastTempData = inputs.forecastPeakTempC !== null && inputs.forecastPeakTempC !== undefined;
    const hasTemperatureData = inputs.avgMaxTempC !== null && inputs.avgMaxTempC !== undefined;
    const hasPeakTempData = inputs.historicalPeakTempC !== null && inputs.historicalPeakTempC !== undefined;
    const hasThinkHazardHeat = Boolean(inputs.thinkHazardReport?.extremeHeatLevel && inputs.thinkHazardReport.extremeHeatLevel !== 'No Data');
    const hasGreenSpaceData = inputs.greenSpaceRatioPct !== null && inputs.greenSpaceRatioPct !== undefined;
    const hasProjectionData = inputs.projectedTempRise2050C !== null && inputs.projectedTempRise2050C !== undefined;

    const heatExpectedComponents = 6;
    const heatObservedComponents =
      (hasForecastTempData ? 1 : 0) +
      (hasTemperatureData ? 1 : 0) +
      (hasPeakTempData ? 1 : 0) +
      (hasGreenSpaceData ? 1 : 0) +
      (hasProjectionData ? 1 : 0) +
      (hasThinkHazardHeat ? 1 : 0);
    const heatCoveragePct = Math.round((heatObservedComponents / heatExpectedComponents) * 100);

    // Green-space OSM ratio alone MUST NOT by itself make heat hazard score available.
    // Temperature evidence or verified ThinkHazard heat indicator must exist before producing a heat score.
    const hasThermalEvidence = hasForecastTempData || hasTemperatureData || hasPeakTempData || hasThinkHazardHeat;
    const hasHeatData = hasThermalEvidence;

    let heatScore: number | null = null;
    let heatLevel: RiskLevel = 'insufficient_data';
    let heatReliability: ScoreReliability = 'insufficient_data';
    let heatModelLevel: HeatModelLevel = 'Data Tidak Tersedia';

    if (hasHeatData) {
      let heatScoreRaw: number = heatCfg.baseTier; // Base screening level (30)

      // Base tier from ThinkHazard extreme heat if available
      if (inputs.thinkHazardReport?.extremeHeatLevel === 'High') {
        heatScoreRaw = 55;
      } else if (inputs.thinkHazardReport?.extremeHeatLevel === 'Medium') {
        heatScoreRaw = 40;
      } else if (inputs.thinkHazardReport?.extremeHeatLevel === 'Low' || inputs.thinkHazardReport?.extremeHeatLevel === 'Very Low') {
        heatScoreRaw = 25;
      }

      heatReliability = (hasForecastTempData || hasTemperatureData) && hasPeakTempData && (hasGreenSpaceData || hasProjectionData || hasThinkHazardHeat)
        ? 'measured'
        : (hasForecastTempData || hasTemperatureData || hasPeakTempData)
        ? 'partially_observed'
        : 'imputed_model_baseline';

      // Weight Component A: Forecast Peak Daily Temperature (Open-Meteo 7-day)
      if (inputs.forecastPeakTempC !== null && inputs.forecastPeakTempC !== undefined) {
        if (inputs.forecastPeakTempC >= 36) heatScoreRaw += 15;
        else if (inputs.forecastPeakTempC >= 33) heatScoreRaw += 10;
        else if (inputs.forecastPeakTempC >= 30) heatScoreRaw += 5;
      } else if (inputs.avgMaxTempC !== null) {
        for (const adj of heatCfg.avgMaxTempAdjustments) {
          if (inputs.avgMaxTempC >= adj.minC) {
            heatScoreRaw += adj.scoreDelta;
            break;
          }
        }
      }

      // Weight Component B: Historical Peak Temperature (ERA5 / NASA POWER)
      if (inputs.historicalPeakTempC !== null) {
        for (const adj of heatCfg.peakTempAdjustments) {
          if (inputs.historicalPeakTempC >= adj.minC) {
            heatScoreRaw += adj.scoreDelta;
            break;
          }
        }
      }

      // Weight Component C: CMIP6 Climate Model Projection 2050
      if (inputs.projectedTempRise2050C !== null && inputs.projectedTempRise2050C !== undefined) {
        if (inputs.projectedTempRise2050C >= 2.0) heatScoreRaw += 10;
        else if (inputs.projectedTempRise2050C >= 1.0) heatScoreRaw += 5;
      }

      // Weight Component D: Urban Green Space Ratio (OSM Feature Density)
      if (inputs.greenSpaceRatioPct !== null && inputs.greenSpaceRatioPct !== undefined) {
        if (inputs.greenSpaceRatioPct < heatCfg.greenSpaceRatioThresholdPct) {
          heatScoreRaw += heatCfg.lowGreenSpaceModifier; // +10
        } else if (inputs.greenSpaceRatioPct > 50) {
          heatScoreRaw -= 5;
        }
      }

      const clampedScore = Math.max(0, Math.min(100, heatScoreRaw));
      const riskScoreObj = new RiskScore(clampedScore);
      heatScore = riskScoreObj.value;
      heatLevel = riskScoreObj.level;

      heatModelLevel = heatScore > heatCfg.tierThresholds.severe
        ? 'Severe'
        : heatScore > heatCfg.tierThresholds.high
        ? 'High'
        : heatScore > heatCfg.tierThresholds.moderate
        ? 'Moderate'
        : 'Low';
    }

    const forecastTempStrId = inputs.forecastPeakTempC !== null && inputs.forecastPeakTempC !== undefined ? `suhu puncak prakiraan ${inputs.forecastPeakTempC.toFixed(1)}°C` : '';
    const forecastTempStrEn = inputs.forecastPeakTempC !== null && inputs.forecastPeakTempC !== undefined ? `forecast peak ${inputs.forecastPeakTempC.toFixed(1)}°C` : '';
    const avgTempStrId = inputs.avgMaxTempC !== null && inputs.avgMaxTempC !== undefined ? `rata-rata harian ${inputs.avgMaxTempC.toFixed(1)}°C` : '';
    const avgTempStrEn = inputs.avgMaxTempC !== null && inputs.avgMaxTempC !== undefined ? `daily mean max ${inputs.avgMaxTempC.toFixed(1)}°C` : '';
    const peakTempStrId = inputs.historicalPeakTempC !== null && inputs.historicalPeakTempC !== undefined ? `rekor puncak historis ${inputs.historicalPeakTempC.toFixed(1)}°C` : '';
    const peakTempStrEn = inputs.historicalPeakTempC !== null && inputs.historicalPeakTempC !== undefined ? `historical peak ${inputs.historicalPeakTempC.toFixed(1)}°C` : '';
    const projTempStrId = inputs.projectedTempRise2050C !== null && inputs.projectedTempRise2050C !== undefined ? `proyeksi kenaikan +${inputs.projectedTempRise2050C.toFixed(1)}°C (2050 CMIP6)` : '';
    const projTempStrEn = inputs.projectedTempRise2050C !== null && inputs.projectedTempRise2050C !== undefined ? `2050 projection +${inputs.projectedTempRise2050C.toFixed(1)}°C (CMIP6)` : '';
    const greenTextId = inputs.greenSpaceRatioPct !== null && inputs.greenSpaceRatioPct !== undefined && inputs.greenSpaceRatioPct >= 0
      ? `rasio fitur hijau OSM ${Math.round(inputs.greenSpaceRatioPct)}%`
      : '';
    const greenTextEn = inputs.greenSpaceRatioPct !== null && inputs.greenSpaceRatioPct !== undefined && inputs.greenSpaceRatioPct >= 0
      ? `OSM green-feature ratio ${Math.round(inputs.greenSpaceRatioPct)}%`
      : '';

    const thinkHazardHeatStrId = inputs.thinkHazardReport?.extremeHeatLevel && inputs.thinkHazardReport.extremeHeatLevel !== 'No Data'
      ? `Indikator panas ekstrem ThinkHazard: ${inputs.thinkHazardReport.extremeHeatLevel}. `
      : '';
    const thinkHazardHeatStrEn = inputs.thinkHazardReport?.extremeHeatLevel && inputs.thinkHazardReport.extremeHeatLevel !== 'No Data'
      ? `ThinkHazard extreme heat indicator: ${inputs.thinkHazardReport.extremeHeatLevel}. `
      : '';

    const obsPartsId = [forecastTempStrId, avgTempStrId, peakTempStrId, projTempStrId, greenTextId].filter(Boolean).join(', ');
    const obsPartsEn = [forecastTempStrEn, avgTempStrEn, peakTempStrEn, projTempStrEn, greenTextEn].filter(Boolean).join(', ');

    const heatCauseId = !hasHeatData
      ? 'Data parameter suhu dan iklim tidak cukup untuk melakukan penilaian risiko.'
      : `${thinkHazardHeatStrId}Observasi fisik tapak: ${obsPartsId}. Penilaian model beban termal GoTangguh: ${heatModelLevel}.`;

    const heatCauseEn = !hasHeatData
      ? 'Insufficient temperature and climate parameter data to perform risk assessment.'
      : `${thinkHazardHeatStrEn}Observed physical evidence: ${obsPartsEn}. GoTangguh thermal stress model assessment: ${heatModelLevel}.`;

    const heat: HeatMetrics = {
      score: heatScore,
      level: heatLevel,
      scoreReliability: heatReliability,
      observedComponents: heatObservedComponents,
      expectedComponents: heatExpectedComponents,
      coveragePct: heatCoveragePct,
      heatModelLevel,
      forecastPeakTempC: (inputs.forecastPeakTempC !== null && inputs.forecastPeakTempC !== undefined) ? +inputs.forecastPeakTempC.toFixed(1) : null,
      avgMaxTempC: (inputs.avgMaxTempC !== null && inputs.avgMaxTempC !== undefined) ? +inputs.avgMaxTempC.toFixed(1) : null,
      historicalPeakTempC: (inputs.historicalPeakTempC !== null && inputs.historicalPeakTempC !== undefined) ? +inputs.historicalPeakTempC.toFixed(1) : null,
      historicalPeriod: '2020-01-01 to 2024-12-31',
      historicalDataSource: 'ERA5-Seamless (Open-Meteo)',
      thinkHazardExtremeHeatLevel: inputs.thinkHazardReport?.extremeHeatLevel && inputs.thinkHazardReport.extremeHeatLevel !== 'No Data' ? inputs.thinkHazardReport.extremeHeatLevel : null,
      greenSpaceRatioPct: (inputs.greenSpaceRatioPct !== null && inputs.greenSpaceRatioPct !== undefined && inputs.greenSpaceRatioPct >= 0) ? Math.round(inputs.greenSpaceRatioPct) : null,
      urbanHeatIslandFactor: heatModelLevel,
      projectedTempRise2050C: (inputs.projectedTempRise2050C !== null && inputs.projectedTempRise2050C !== undefined) ? +inputs.projectedTempRise2050C.toFixed(1) : null,
      climateProjectionModel: 'MRI-AGCM3-2-S (CMIP6)',
      acCostIncreasePct: null, // Strictly null: AC cost percentage requires a validated micro-energy model
      causeId: heatCauseId,
      causeEn: heatCauseEn,
      impactId: !hasHeatData
        ? 'Data parameter suhu dan iklim tidak cukup untuk mengindikasikan beban termal.'
        : 'Potensi peningkatan beban termal selubung bangunan dan penurunan kenyamanan termal alami ruangan.',
      impactEn: !hasHeatData
        ? 'Insufficient temperature and climate parameter data to indicate thermal load.'
        : 'Potential elevated envelope thermal gain and reduced natural indoor thermal comfort.',
      recomId: !hasHeatData || heatScore === null
        ? 'Data parameter suhu dan iklim tidak cukup untuk merumuskan rekomendasi penapisan termal.'
        : 'Pertimbangkan aplikasi pelapis reflektif (Cool Roof), peneduh arsitektural, dan insulasi termal selubung bangunan.',
      recomEn: !hasHeatData || heatScore === null
        ? 'Insufficient temperature and climate parameter data to formulate thermal screening recommendations.'
        : 'Consider cool roof coatings, architectural shading, and building envelope thermal insulation.'
    };

    // =========================================================================
    // 5. GoTangguh Accessibility & Evacuation Routing Model (0-100 or null)
    // Data Coverage Governance:
    // - 0 observed -> score = null, level = unavailable, reliability = insufficient_data
    // - 1 observed -> score = null, level = unavailable, reliability = insufficient_data (no false certainty)
    // - 2 observed -> score calculated via dynamic weight renormalization, reliability = partially_observed
    // - 3 observed -> score calculated via dynamic weight renormalization, reliability = partially_observed
    // - 4 observed -> score calculated normally, reliability = measured
    // =========================================================================
    const transCfg = RISK_MODEL_CONFIG.TRANSPORT;
    const roadEv = inputs.transportEvidence?.nearestRoad;
    const nearestRoadDist = roadEv ? roadEv.distanceMeters : (inputs.distanceToNearestRoadMeters !== null && inputs.distanceToNearestRoadMeters !== undefined ? Math.round(inputs.distanceToNearestRoadMeters) : null);
    const nearestRoadName = roadEv?.name || inputs.nearestRoadName || 'Jalan Akses Tapak';
    const isRoadBounded = roadEv ? (roadEv.status === 'success_bounded' || roadEv.status === 'no_result') : Boolean(inputs.roadBounded && (inputs.roadBounded.state === 'AVAILABLE_BOUNDED' || inputs.roadBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const majorRoadEv = inputs.transportEvidence?.majorRoad;
    const arterialDist = majorRoadEv ? majorRoadEv.distanceMeters : (inputs.distanceToArterialMeters !== null && inputs.distanceToArterialMeters !== undefined ? Math.round(inputs.distanceToArterialMeters) : null);
    const arterialName = majorRoadEv?.name || inputs.nearestArterialName || 'Tidak terdeteksi dalam radius 10.0 km';
    const isArterialBounded = majorRoadEv ? (majorRoadEv.status === 'success_bounded' || majorRoadEv.status === 'no_result') : Boolean(inputs.arterialBounded && (inputs.arterialBounded.state === 'AVAILABLE_BOUNDED' || inputs.arterialBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const transitEv = inputs.transportEvidence?.transit;
    const transitDist = transitEv ? transitEv.distanceMeters : (inputs.distanceToTransitHubMeters !== null && inputs.distanceToTransitHubMeters !== undefined ? Math.round(inputs.distanceToTransitHubMeters) : null);
    const transitName = transitEv?.name || inputs.nearestTransitName || 'Tidak terdeteksi dalam radius 10.0 km';
    const isTransitBounded = transitEv ? (transitEv.status === 'success_bounded' || transitEv.status === 'no_result') : Boolean(inputs.transitBounded && (inputs.transitBounded.state === 'AVAILABLE_BOUNDED' || inputs.transitBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const hospEv = inputs.transportEvidence?.healthcare;
    const hospDist = hospEv ? hospEv.distanceMeters : (inputs.distanceToHospitalMeters !== null && inputs.distanceToHospitalMeters !== undefined ? Math.round(inputs.distanceToHospitalMeters) : null);
    const hospName = hospEv?.name || inputs.nearestHospitalName || 'Tidak terdeteksi dalam radius 15.0 km';
    const isHospBounded = hospEv ? (hospEv.status === 'success_bounded' || hospEv.status === 'no_result') : Boolean(inputs.hospitalBounded && (inputs.hospitalBounded.state === 'AVAILABLE_BOUNDED' || inputs.hospitalBounded.state === 'NODATA_SEARCH_SUCCESS'));

    const fireEv = inputs.transportEvidence?.fireStation;
    const fireDist = fireEv ? fireEv.distanceMeters : (inputs.distanceToFireStationMeters !== null && inputs.distanceToFireStationMeters !== undefined ? Math.round(inputs.distanceToFireStationMeters) : null);
    const fireName = fireEv?.name || inputs.nearestFireStationName || 'Tidak terdeteksi dalam radius 10.0 km';

    const assemblyEv = inputs.transportEvidence?.assemblyPoint;
    const assemblyDist = assemblyEv ? assemblyEv.distanceMeters : (inputs.distanceToAssemblyPointMeters !== null && inputs.distanceToAssemblyPointMeters !== undefined ? Math.round(inputs.distanceToAssemblyPointMeters) : null);
    const assemblyName = assemblyEv?.name || inputs.nearestAssemblyPointName || 'Tidak terdeteksi dalam radius 15.0 km';
    const isAssemblyBounded = assemblyEv ? (assemblyEv.status === 'success_bounded' || assemblyEv.status === 'no_result') : Boolean(inputs.assemblyPointBounded && (inputs.assemblyPointBounded.state === 'AVAILABLE_BOUNDED' || inputs.assemblyPointBounded.state === 'NODATA_SEARCH_SUCCESS'));
    const assemblyIsOfficial = Boolean(assemblyEv?.isOfficial || inputs.assemblyPointIsOfficial);
    const assemblyFacilityType = assemblyEv?.facilityType || inputs.assemblyPointFacilityType || null;
    const travelTimeToAssemblyPointMinutes = inputs.transportEvidence?.assemblyPointRoute?.estimatedTravelTimeMinutes || inputs.travelTimeToAssemblyPointMinutes || null;
    const travelTimeToAssemblyPointRouteDistanceMeters = inputs.transportEvidence?.assemblyPointRoute?.routeDistanceMeters ?? inputs.travelTimeToAssemblyPointRouteDistanceMeters ?? null;

    const transportComponents: { score: number; weight: number; isBounded: boolean }[] = [];

    // 1. Road Component (Exact or Bounded)
    if (nearestRoadDist !== null) {
      const score = nearestRoadDist <= 50 ? transCfg.roadBrackets[0].score : nearestRoadDist <= 150 ? transCfg.roadBrackets[1].score : transCfg.roadBrackets[2].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.road, isBounded: false });
    } else if (isRoadBounded) {
      const score = transCfg.roadBrackets[2].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.road, isBounded: true });
    }

    // 2. Arterial / Major Road Component (Exact or Bounded)
    if (arterialDist !== null) {
      const score = arterialDist <= 500 ? transCfg.arterialBrackets[0].score : arterialDist <= 1500 ? transCfg.arterialBrackets[1].score : arterialDist <= 3000 ? transCfg.arterialBrackets[2].score : transCfg.arterialBrackets[3].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.arterial, isBounded: false });
    } else if (isArterialBounded) {
      const score = transCfg.arterialBrackets[3].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.arterial, isBounded: true });
    }

    // 3. Healthcare / Hospital Component (Exact or Bounded)
    if (hospDist !== null) {
      const score = hospDist <= 2000 ? transCfg.hospitalBrackets[0].score : hospDist <= 4500 ? transCfg.hospitalBrackets[1].score : hospDist <= 7500 ? transCfg.hospitalBrackets[2].score : transCfg.hospitalBrackets[3].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.hospital, isBounded: false });
    } else if (isHospBounded) {
      const score = transCfg.hospitalBrackets[3].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.hospital, isBounded: true });
    }

    // 4. Transit Component (Exact or Bounded)
    if (transitDist !== null) {
      const score = transitDist <= 500 ? transCfg.transitBrackets[0].score : transitDist <= 1200 ? transCfg.transitBrackets[1].score : transCfg.transitBrackets[2].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.transit, isBounded: false });
    } else if (isTransitBounded) {
      const score = transCfg.transitBrackets[2].fallbackScore!;
      transportComponents.push({ score, weight: transCfg.weights.transit, isBounded: true });
    }

    const transportExpectedComponents = 4;
    const transportObservedComponents = transportComponents.length;
    const transportCoveragePct = Math.round((transportObservedComponents / transportExpectedComponents) * 100);
    const hasTransportData = transportObservedComponents >= 2;

    let transportScore: number | null = null;
    let transportLevel: 'good' | 'moderate' | 'isolated' | 'critical' | 'unavailable' = 'unavailable';
    let transportReliability: ScoreReliability = 'insufficient_data';

    if (transportObservedComponents >= 2) {
      const hasAnyBounded = transportComponents.some(c => c.isBounded);
      transportReliability = transportObservedComponents === 4 ? 'measured' : 'partially_observed';
      const totalWeight = transportComponents.reduce((sum, c) => sum + c.weight, 0);
      const transportScoreRaw = Math.round(
        transportComponents.reduce((sum, c) => sum + c.score * (c.weight / totalWeight), 0)
      );
      transportScore = transportScoreRaw;
      transportLevel = transportScore <= transCfg.levelThresholds.goodMax ? 'good' : transportScore <= transCfg.levelThresholds.moderateMax ? 'moderate' : 'isolated';
    } else {
      // 0 or 1 observed: DO NOT produce a normal final risk level from a single component
      transportScore = null;
      transportLevel = 'unavailable';
      transportReliability = 'insufficient_data';
    }

    const roadDescId = nearestRoadDist !== null
      ? `akses jalan ${nearestRoadDist}m (${nearestRoadName})`
      : isRoadBounded
      ? `akses jalan ${inputs.roadBounded?.displayValue || '>500 m'}`
      : 'data jarak jalan tidak tersedia';
    const roadDescEn = nearestRoadDist !== null
      ? `frontage road ${nearestRoadDist}m (${nearestRoadName})`
      : isRoadBounded
      ? `frontage road ${inputs.roadBounded?.displayValue || '>500 m'}`
      : 'road distance data unavailable';

    const arterialDescId = arterialDist !== null
      ? `jalan utama ${arterialDist >= 1000 ? `${(arterialDist / 1000).toFixed(1)} km` : `${arterialDist}m`}`
      : isArterialBounded
      ? `jalan utama ${inputs.arterialBounded?.displayValue || '>10 km'}`
      : 'data jalan utama tidak tersedia';
    const arterialDescEn = arterialDist !== null
      ? `major road ${arterialDist >= 1000 ? `${(arterialDist / 1000).toFixed(1)} km` : `${arterialDist}m`}`
      : isArterialBounded
      ? `major road ${inputs.arterialBounded?.displayValue || '>10 km'}`
      : 'major road data unavailable';

    const hospDescId = hospDist !== null
      ? `faskes ${hospDist >= 1000 ? `${(hospDist / 1000).toFixed(1)} km` : `${hospDist}m`}`
      : isHospBounded
      ? `faskes ${inputs.hospitalBounded?.displayValue || '>15 km'}`
      : 'data faskes tidak tersedia';
    const hospDescEn = hospDist !== null
      ? `healthcare ${hospDist >= 1000 ? `${(hospDist / 1000).toFixed(1)} km` : `${hospDist}m`}`
      : isHospBounded
      ? `healthcare ${inputs.hospitalBounded?.displayValue || '>15 km'}`
      : 'healthcare data unavailable';

    let transportCauseId = '';
    let transportCauseEn = '';

    if (transportObservedComponents === 0) {
      transportCauseId = 'Data parameter aksesibilitas dan jaringan jalan tidak cukup untuk penilaian.';
      transportCauseEn = 'Insufficient accessibility and road network parameter data for assessment.';
    } else if (transportObservedComponents === 1) {
      transportCauseId = 'Coverage data parsial: 1 dari 4 indikator akses tersedia. Indikator arteri, fasilitas medis darurat, atau transit belum memadai untuk menghasilkan skor aksesibilitas definitif.';
      transportCauseEn = 'Partial data coverage: 1 of 4 access indicators available. Arterial, emergency healthcare, or transit data are insufficient to produce a definitive accessibility score.';
    } else {
      const partialNoteId = transportObservedComponents < 4 ? ` (Penilaian Parsial: ${transportObservedComponents}/4 indikator teramati)` : '';
      const partialNoteEn = transportObservedComponents < 4 ? ` (Partial Assessment: ${transportObservedComponents}/4 indicators observed)` : '';

      transportCauseId = transportScore !== null && transportScore <= 35
        ? `Aksesibilitas prima dengan ${roadDescId}, ${arterialDescId}, dan ${hospDescId}.${partialNoteId}`
        : transportScore !== null && transportScore <= 65
        ? `Konektivitas kawasan memadai dengan ${roadDescId}, ${arterialDescId}, dan ${hospDescId}.${partialNoteId}`
        : `Kawasan dengan akses terisolasi, ${roadDescId} dan ${hospDescId}.${partialNoteId}`;

      transportCauseEn = transportScore !== null && transportScore <= 35
        ? `Prime accessibility with ${roadDescEn}, ${arterialDescEn}, and ${hospDescEn}.${partialNoteEn}`
        : transportScore !== null && transportScore <= 65
        ? `Adequate district connectivity with ${roadDescEn}, ${arterialDescEn}, and ${hospDescEn}.${partialNoteEn}`
        : `Isolated access profile, ${roadDescEn} and ${hospDescEn}.${partialNoteEn}`;
    }

    const hasRouteData = Boolean(
      inputs.estimatedTravelTimeMinutes &&
      inputs.travelTimeRouteDistanceMeters !== null &&
      !inputs.estimatedTravelTimeMinutes.includes('tidak tersedia') &&
      !inputs.estimatedTravelTimeMinutes.includes('Timeout')
    );
    const estimatedTravelTimeMinutes = hasRouteData ? inputs.estimatedTravelTimeMinutes! : null;
    const routingSource = hasRouteData ? (inputs.routingSource ?? null) : null;

    let connectivityLabelId = 'Data Tidak Tersedia';
    let connectivityLabelEn = 'Data Unavailable';

    if (transportObservedComponents === 0) {
      connectivityLabelId = 'Data Konektivitas Tidak Tersedia';
      connectivityLabelEn = 'Connectivity Data Unavailable';
    } else if (transportObservedComponents === 1) {
      connectivityLabelId = 'Data Parsial (1/4 Indikator)';
      connectivityLabelEn = 'Partial Data (1/4 Indicators)';
    } else {
      const partialTagId = transportObservedComponents < 4 ? ` (Parsial ${transportObservedComponents}/4)` : '';
      const partialTagEn = transportObservedComponents < 4 ? ` (Partial ${transportObservedComponents}/4)` : '';

      connectivityLabelId = transportScore !== null && transportScore <= 35
        ? `Konektivitas Sangat Baik${partialTagId}`
        : transportScore !== null && transportScore <= 65
        ? `Konektivitas Sedang${partialTagId}`
        : `Konektivitas Terbatas${partialTagId}`;

      connectivityLabelEn = transportScore !== null && transportScore <= 35
        ? `Excellent Connectivity${partialTagEn}`
        : transportScore !== null && transportScore <= 65
        ? `Moderate Connectivity${partialTagEn}`
        : `Limited Connectivity${partialTagEn}`;
    }

    const evacuationRouteStatusId = transportObservedComponents < 2 || transportScore === null
      ? 'Data Penapisan Aksesibilitas / Egress Tidak Tersedia'
      : transportScore <= 50
      ? 'Penapisan Aksesibilitas / Egress: Memadai'
      : 'Penapisan Aksesibilitas / Egress: Terbatas';

    const evacuationRouteStatusEn = transportObservedComponents < 2 || transportScore === null
      ? 'Accessibility / Egress Screening Data Unavailable'
      : transportScore <= 50
      ? 'Accessibility / Egress Screening: Adequate'
      : 'Accessibility / Egress Screening: Constrained';

    const transport: TransportMetrics = {
      score: transportScore,
      level: transportLevel,
      scoreReliability: transportReliability,
      observedComponents: transportObservedComponents,
      expectedComponents: transportExpectedComponents,
      coveragePct: transportCoveragePct,
      connectivityLabelId,
      connectivityLabelEn,
      distanceToNearestRoadMeters: nearestRoadDist,
      nearestRoadName: nearestRoadDist !== null ? (inputs.nearestRoadName || 'Jalan Akses Tapak') : null,
      roadBounded: inputs.roadBounded,
      distanceToArterialMeters: arterialDist,
      nearestArterialName: arterialDist !== null ? (inputs.nearestArterialName || 'Arteri Utama') : null,
      arterialBounded: inputs.arterialBounded,
      distanceToTransitHubMeters: transitDist,
      nearestTransitName: transitDist !== null ? (inputs.nearestTransitName || 'Simpul Transit') : null,
      transitBounded: inputs.transitBounded,
      distanceToHospitalMeters: hospDist,
      nearestHospitalName: hospDist !== null ? (inputs.nearestHospitalName || 'Fasilitas Kesehatan') : null,
      hospitalBounded: inputs.hospitalBounded,
      distanceToAssemblyPointMeters: assemblyDist,
      nearestAssemblyPointName: assemblyDist !== null ? (assemblyName || 'Titik Kumpul Evakuasi') : null,
      assemblyPointBounded: inputs.assemblyPointBounded || assemblyEv?.boundedObservation,
      assemblyPointIsOfficial: assemblyIsOfficial,
      assemblyPointFacilityType: assemblyFacilityType,
      travelTimeToAssemblyPointMinutes,
      travelTimeToAssemblyPointRouteDistanceMeters,
      distanceToFireStationMeters: fireDist,
      nearestFireStationName: fireDist !== null ? (inputs.nearestFireStationName || 'Pos Pemadam') : null,
      fireStationBounded: inputs.fireStationBounded,
      estimatedTravelTimeMinutes,
      travelTimeRouteDistanceMeters: hasRouteData ? inputs.travelTimeRouteDistanceMeters ?? null : null,
      routingSource,
      evacuationRouteStatusId,
      evacuationRouteStatusEn,
      causeId: transportCauseId,
      causeEn: transportCauseEn,
      impactId: transportObservedComponents < 2 || transportScore === null
        ? 'Data parameter aksesibilitas dan jaringan jalan tidak cukup untuk penilaian dampak.'
        : transportScore <= 35
        ? 'Estimasi waktu tempuh berkendara ke fasilitas medis darurat tergolong cepat.'
        : transportScore <= 65
        ? 'Estimasi waktu tempuh berkendara ke fasilitas darurat dalam rentang standar.'
        : 'Estimasi waktu tempuh berkendara memerlukan waktu lebih panjang, butuh perencanaan jalur evakuasi mandiri.',
      impactEn: transportObservedComponents < 2 || transportScore === null
        ? 'Insufficient accessibility and road network data to assess impacts.'
        : transportScore <= 35
        ? 'Estimated driving travel time to emergency medical facilities is short.'
        : transportScore <= 65
        ? 'Estimated driving travel time to emergency facilities is within standard range.'
        : 'Estimated driving travel time is extended, requires dedicated on-site emergency readiness.',
      recomId: transportObservedComponents < 2 || transportScore === null
        ? 'Data parameter aksesibilitas dan jaringan jalan tidak cukup untuk merumuskan rekomendasi penapisan.'
        : transportScore <= 35
        ? 'Pertahankan kelancaran akses frontage jalan utama dan titik kumpul evakuasi tapak.'
        : transportScore <= 65
        ? 'Pastikan lebar akses jalan lingkungan bebas hambatan untuk kendaraan darurat dan ambulans.'
        : 'Sediakan jalur evakuasi darurat alternatif dan lengkapi bangunan dengan perlengkapan tanggap darurat mandiri.',
      recomEn: transportObservedComponents < 2 || transportScore === null
        ? 'Insufficient accessibility and road network parameter data to formulate screening recommendations.'
        : transportScore <= 35
        ? 'Maintain clear frontage access to primary road and designated assembly point.'
        : transportScore <= 65
        ? 'Ensure local access road clearances remain unobstructed for emergency response vehicles.'
        : 'Establish alternative emergency evacuation routes and maintain on-site emergency preparedness gear.'
    };

    // =========================================================================
    // 6. GoTangguh Multi-Hazard Dominant Score (Overall Index)
    // Formula: 70% Max Hazard Score + 30% Mean of Available Hazard Scores
    // =========================================================================
    const activeHazards: { name: HazardCategory; score: number }[] = [];
    if (flood.score !== null) activeHazards.push({ name: 'flood', score: flood.score });
    if (quake.score !== null) activeHazards.push({ name: 'earthquake', score: quake.score });
    if (heat.score !== null) activeHazards.push({ name: 'heat', score: heat.score });

    let overallScore: number | null = null;
    let overallLevel: RiskLevel = 'insufficient_data';
    let dominantHazard: HazardCategory | null = null;

    if (activeHazards.length > 0) {
      const maxActiveScore = Math.max(...activeHazards.map((h) => h.score));
      const meanActiveScore =
        activeHazards.reduce((sum, h) => sum + h.score, 0) / activeHazards.length;
      
      const overallScoreRaw = Math.round(
        maxActiveScore * RISK_MODEL_CONFIG.OVERALL.dominantHazardWeight +
        meanActiveScore * RISK_MODEL_CONFIG.OVERALL.meanHazardsWeight
      );
      const clampedOverallScore = Math.max(0, Math.min(100, overallScoreRaw));
      
      const overallRiskScoreObj = new RiskScore(clampedOverallScore);
      overallScore = overallRiskScoreObj.value;
      overallLevel = overallRiskScoreObj.level;

      // Deterministic tie-breaking: Strict '>' preserves the earlier hazard in activeHazards array (Flood > Quake > Heat)
      const topHazard = activeHazards.reduce((prev, curr) => (curr.score > prev.score ? curr : prev), activeHazards[0]);
      dominantHazard = topHazard.name;
    }

    const scoringStatus: 'complete' | 'partial' | 'insufficient_data' =
      activeHazards.length === RISK_MODEL_CONFIG.OVERALL.totalCategories
        ? 'complete'
        : activeHazards.length > 0
        ? 'partial'
        : 'insufficient_data';

    // =========================================================================
    // 7. Prescriptions & Financial Screening Generation
    // =========================================================================
    const prescriptions = PrescriptionEngine.generatePrescriptions(flood, quake, heat, transport);

    const financialScreening = GoTangguhFinancialScreeningEngine.calculateLossMetrics(
      flood.score,
      quake.score,
      heat.score,
      null, // Property value not assumed; requires explicit user/property input
      null  // Live FX rate not assumed; requires explicit market feed
    );

    const worldBankReport = inputs.thinkHazardReport;

    // =========================================================================
    // 8. Bilingual Executive Summary
    // =========================================================================
    let executiveSummaryId = '';
    let executiveSummaryEn = '';

    if (scoringStatus === 'insufficient_data') {
      executiveSummaryId = 'Data parameter lingkungan dan spasial tidak mencukupi untuk melakukan evaluasi risiko multi-bahaya.';
      executiveSummaryEn = 'Insufficient environmental and spatial parameter data to perform multi-hazard risk evaluation.';
    } else if (scoringStatus === 'partial') {
      const labelId = overallScore !== null ? new RiskScore(overallScore).getLabel('id') : 'Data Tidak Tersedia';
      const labelEn = overallScore !== null ? new RiskScore(overallScore).getLabel('en') : 'Insufficient Data';
      executiveSummaryId = `Penilaian parsial berdasarkan parameter yang tersedia: skor risiko gabungan ${overallScore}/100 (${labelId}) dengan ancaman utama ${dominantHazard?.toUpperCase()} (${activeHazards.length}/3 bahaya fisik terevaluasi). Parameter bahaya lainnya belum lengkap (Kelengkapan Data: ${dataCompletenessScorePct}%).`;
      executiveSummaryEn = `Partial assessment based on available parameters: combined risk score of ${overallScore}/100 (${labelEn}) with ${dominantHazard?.toUpperCase()} as the primary evaluated threat (${activeHazards.length}/3 physical hazards evaluated). Other hazard parameters remain incomplete (Data Completeness: ${dataCompletenessScorePct}%).`;
    } else {
      const labelId = overallScore !== null ? new RiskScore(overallScore).getLabel('id') : 'Data Tidak Tersedia';
      const labelEn = overallScore !== null ? new RiskScore(overallScore).getLabel('en') : 'Insufficient Data';
      executiveSummaryId = `Berdasarkan evaluasi spasial terpadu GoTangguh Multi-Hazard Engine, tapak ini memiliki skor risiko gabungan ${overallScore}/100 (${labelId}) dengan ancaman dominan ${dominantHazard?.toUpperCase()} (Kelengkapan Data: ${dataCompletenessScorePct}%). Rekomendasi mitigasi spesifik disarankan sebelum proses finalisasi transaksi atau konstruksi.`;
      executiveSummaryEn = `Based on integrated spatial evaluation by GoTangguh Multi-Hazard Engine, this site exhibits an overall risk score of ${overallScore}/100 (${labelEn}) with ${dominantHazard?.toUpperCase()} as the dominant threat (Data Completeness: ${dataCompletenessScorePct}%). Targeted mitigation measures are recommended prior to transaction settlement or construction.`;
    }

    const result: MultiHazardAssessmentResult = {
      referenceNumber: refCode,
      evaluatedAt: new Date().toISOString(),
      location: {
        formattedAddress: address,
        latitude: coords.lat,
        longitude: coords.lng,
        country
      },
      propertyType: finalPropType || 'Residential',
      userPersona: finalPersona || 'Home Buyer',
      overallScore,
      overallLevel,
      dominantHazard,
      scoringStatus,
      confidenceScorePct,
      dataCompletenessScorePct,
      modelMetadata: {
        modelName: this.MODEL_NAME,
        modelVersion: this.MODEL_VERSION,
        overallFormula: RISK_MODEL_CONFIG.METADATA.overallFormula,
        hazardWeights: {
          dominantHazard: RISK_MODEL_CONFIG.OVERALL.dominantHazardWeight,
          meanHazards: RISK_MODEL_CONFIG.OVERALL.meanHazardsWeight
        },
        missingDataPolicy: RISK_MODEL_CONFIG.METADATA.missingDataPolicy,
        scoringCoverage: {
          flood: hasFloodData,
          earthquake: hasQuakeData,
          heat: hasHeatData,
          transport: hasTransportData,
          totalAvailable: activeHazards.length,
          totalCategories: RISK_MODEL_CONFIG.OVERALL.totalCategories
        },
        scoringStatus,
        componentModels: {
          flood: {
            modelName: RISK_MODEL_CONFIG.FLOOD.modelName,
            baseline: hasFloodClassEvidence ? (floodClassStr === 'Tinggi' || floodClassStr === 'High' ? RISK_MODEL_CONFIG.FLOOD.baseTiers.high : floodClassStr === 'Sedang' || floodClassStr === 'Medium' ? RISK_MODEL_CONFIG.FLOOD.baseTiers.medium : RISK_MODEL_CONFIG.FLOOD.baseTiers.low) : (hasFloodData ? RISK_MODEL_CONFIG.FLOOD.baseTiers.physicalOnlyBaseline : 'N/A'),
            inputsEvaluated: [
              hasFloodClassEvidence ? `Official Tier: ${floodClassStr} (${floodClassSource})` : 'Official Tier: None',
              inputs.elevationMeters !== null ? `Elevation: ${inputs.elevationMeters}m` : 'Elevation: N/A',
              inputs.distanceToRiverMeters !== null ? `River Dist: ${inputs.distanceToRiverMeters}m` : 'River Dist: N/A',
              inputs.max24hRainfallMm !== null ? `24h Rainfall: ${inputs.max24hRainfallMm}mm` : '24h Rainfall: N/A',
              inputs.riverDischargeM3s !== null ? `GloFAS Discharge: ${inputs.riverDischargeM3s} m³/s` : 'Discharge: N/A'
            ],
            missingDataPolicy: 'Score requires official hazard tier or physical metrics; unmeasured inputs receive 0 additive adjustment.',
            formulaDescription: 'Base Tier (20-70) + Elevation adjustment (-8 to +18) + Waterway proximity (0 to +15) + Peak rainfall (0 to +10) + River discharge (0 to +8), clamped 0-100.'
          },
          earthquake: {
            modelName: RISK_MODEL_CONFIG.SEISMIC.modelName,
            baseline: hasQuakeClassEvidence ? (quakeClassStr === 'Tinggi' || quakeClassStr === 'High' ? RISK_MODEL_CONFIG.SEISMIC.baseTiers.high : quakeClassStr === 'Sedang' || quakeClassStr === 'Medium' ? RISK_MODEL_CONFIG.SEISMIC.baseTiers.medium : RISK_MODEL_CONFIG.SEISMIC.baseTiers.lowOrVeryLow) : (hasQuakeData ? RISK_MODEL_CONFIG.SEISMIC.baseTiers.historicalOnlyBaseline : 'N/A'),
            inputsEvaluated: [
              hasQuakeClassEvidence ? `Official Tier: ${quakeClassStr} (${quakeClassSource})` : 'Official Tier: None',
              inputs.historicalQuakesCount150km !== null ? `10Yr Quakes (150km): ${inputs.historicalQuakesCount150km}` : 'Catalog (150km): N/A',
              inputs.maxHistoricalMag !== null ? `Max Mag: M${inputs.maxHistoricalMag}` : 'Max Mag: N/A',
              inputs.inariskLiquefactionRisk ? `Liquefaction: ${inputs.inariskLiquefactionRisk}` : 'Liquefaction: N/A'
            ],
            missingDataPolicy: 'Score requires official tier or historical catalog events (liquefaction alone does not trigger score); unmeasured inputs receive 0 additive adjustment.',
            formulaDescription: 'Base Tier (15-65) + 10Yr Quakes Count (0 to +18) + Max Historical Mag (0 to +15) + Liquefaction modifier (0 to +12), clamped 0-100.'
          },
          heat: {
            modelName: RISK_MODEL_CONFIG.HEAT.modelName,
            baseline: hasHeatData ? RISK_MODEL_CONFIG.HEAT.baseTier : 'N/A',
            inputsEvaluated: [
              inputs.avgMaxTempC !== null ? `Avg Max Temp: ${inputs.avgMaxTempC}°C` : 'Avg Max Temp: N/A',
              inputs.historicalPeakTempC !== null ? `Peak Temp: ${inputs.historicalPeakTempC}°C` : 'Peak Temp: N/A',
              hasThinkHazardHeat ? 'ThinkHazard: High Extreme Heat' : 'ThinkHazard: None',
              inputs.greenSpaceRatioPct !== null ? `OSM Green Ratio: ${inputs.greenSpaceRatioPct}%` : 'OSM Green Ratio: N/A'
            ],
            missingDataPolicy: 'Score requires temperature evidence or ThinkHazard heat tier (green-space alone does not trigger score).',
            formulaDescription: 'Base Tier (20) + Daily Max Temp (0 to +35) + Historical Peak (0 to +25) + ThinkHazard flag (0 to +15) + Low Green Ratio flag (0 to +8), clamped 0-100.'
          },
          transport: {
            modelName: RISK_MODEL_CONFIG.TRANSPORT.modelName,
            baseline: 'Dynamic weight renormalization over observed distance components',
            inputsEvaluated: [
              nearestRoadDist !== null ? `Frontage Road: ${nearestRoadDist}m` : 'Road Dist: N/A',
              arterialDist !== null ? `Arterial: ${arterialDist}m` : 'Arterial: N/A',
              hospDist !== null ? `Hospital: ${hospDist}m` : 'Hospital: N/A',
              transitDist !== null ? `Transit: ${transitDist}m` : 'Transit: N/A'
            ],
            missingDataPolicy: 'Missing distance components are omitted from weighted sum and available weights are renormalized to 1.0 (no static imputation).',
            formulaDescription: 'Weighted sum of components: Road (0.25) + Arterial (0.25) + Hospital (0.30) + Transit (0.20) normalized by total available weight, clamped 0-100.'
          }
        }
      },
      flood,
      quake,
      heat,
      transport,
      prescriptions,
      financialScreening,
      climadaFinancial: financialScreening,
      worldBankReport,
      soil: inputs.soil ?? null,
      airQuality: inputs.airQuality ?? null,
      populationExposure: inputs.populationExposure ?? null,
      wildfireActivity: inputs.wildfireActivity ?? null,
      executiveSummaryId,
      executiveSummaryEn,
      sourceAttributions: [
        'Copernicus DEM & Open-Elevation Services',
        'Badan Nasional Penanggulangan Bencana (BNPB) inaRISK GIS Server',
        'World Bank / GFDRR ThinkHazard! Multi-Hazard Intelligence API',
        'USGS Earthquake Hazards Program',
        'EMSC / SeismicPortal FDSN Services',
        'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) TEWS',
        'NASA POWER Agroclimatology & Open-Meteo Climate APIs',
        'Open-Meteo Air Quality (CAMS European Model)',
        'ISRIC SoilGrids 2.0 (World Soil Information)',
        'WorldPop Global High Resolution Population Denominators',
        'NASA FIRMS (Fire Information for Resource Management System)',
        'OpenStreetMap Contributors & Overpass API',
        'OSRM (Open Source Routing Machine) road-network routing'
      ],
      features: inputs.features,
      featureStore: inputs.featureStore
    };

    return result;
  }
}
