import type { FinancialScreeningMetrics, ClimadaFinancialMetrics } from './financial.types';
import type { SpatialFeatureRecord, FeatureStore, FeatureCategory, BoundedSpatialDistance, SpatialObservationState } from './feature.types';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme' | 'insufficient_data';

export type HazardCategory = 'flood' | 'earthquake' | 'heat' | 'transport';

export type PropertyType = 'Residential' | 'Commercial';

export type UserPersona = 
  | 'Home Buyer'
  | 'Home Owner'
  | 'Property Developer'
  | 'Lender / Bank'
  | 'Real Estate Agent';

export type ScoreReliability = 'measured' | 'partially_observed' | 'imputed_model_baseline' | 'insufficient_data';

export type HazardClassSource = 'BNPB' | 'ThinkHazard' | null;

export type HeatModelLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Data Tidak Tersedia';

export interface ScoreLedgerAdjustment {
  name: string;
  source: string;
  input: string | number;
  delta: number;
  reason: string;
}

export interface FloodScoreLedger {
  officialClassification: string | null;
  officialSource: string | null;
  internalBaseScore: number;
  internalBaseTransformation: string;
  baseScore: number;
  baseSource: string;
  baseReason: string;
  adjustments: ScoreLedgerAdjustment[];
  rawScore: number;
  capApplied: boolean;
  floorApplied: boolean;
  finalScore: number;
  reliability: ScoreReliability;
}

export interface EarthquakeScoreLedger {
  officialClassification: string | null;
  officialSource: string | null;
  internalBaseScore: number;
  internalBaseTransformation: string;
  baseScore: number;
  baseSource: string;
  baseReason: string;
  adjustments: ScoreLedgerAdjustment[];
  rawScore: number;
  capApplied: boolean;
  floorApplied: boolean;
  finalScore: number;
  reliability: ScoreReliability;
}

export interface FloodMetrics {
  score: number | null;
  level: RiskLevel;
  scoreReliability: ScoreReliability;
  observedComponents: number;
  expectedComponents: number;
  coveragePct: number;
  floodModelLevel: string;
  floodClass: string | null;
  floodClassSource: HazardClassSource;
  elevationMeters: number | null;
  slopeDegrees?: number | null;
  slopePercent?: number | null;
  slopeClassification?: string | null;
  localReliefMeters?: number | null;
  localReliefType?: string | null;
  flowAccumulationPotential?: string | null;
  distanceToRiverMeters: number | null;
  nearestRiverName: string | null;
  waterwayBounded?: BoundedSpatialDistance;
  max24hRainfallMm: number | null;
  rainfallPeriod?: string | null;
  rainfallDataSource?: string | null;
  floodDepthMeters?: number | null;
  historicalFloodEventsCount?: number | null;
  historicalFloodPeriod?: string | null;
  imperviousSurfaceRatioPct?: number | null;
  nearestDrainageChannel?: string | null;
  distanceToDrainageMeters?: number | null;
  riverDischargeM3s: number | null;
  glofasDischargeModelM3s?: number | null;
  bnpbFloodHazardIndex?: number | null;
  thinkHazardFloodLevel?: string | null;
  thinkHazardGranularity?: string | null;
  potentialDepthRange: string | null;
  scoreLedger?: FloodScoreLedger;
  /** @deprecated Legacy compatibility field representing BNPB class only. Never populated from ThinkHazard. */
  bnpbInaRiskClass?: string | null;
  /** @deprecated Optional deprecated compatibility field */
  floodZoneType?: string | null;
  causeId: string;
  causeEn: string;
  impactId: string;
  impactEn: string;
  recomId: string;
  recomEn: string;
}

export interface QuakeMetrics {
  score: number | null;
  level: RiskLevel;
  scoreReliability: ScoreReliability;
  observedComponents: number;
  expectedComponents: number;
  coveragePct: number;
  quakeClass: string | null;
  quakeClassSource: HazardClassSource;
  nearestFaultName: string | null;
  distanceToFaultKm: number | null;
  nearestEpicenterKm: number | null;
  latestQuakeDescription?: string | null;
  historicalQuakesCount150km: number | null;
  historicalQuakesCount100km: number | null;
  maxHistoricalMag: number | null;
  recentM5PlusWithin350kmCount?: number | null;
  recentMaxMagnitude?: number | null;
  estimatedPgaG: number | null; // Populated from official BNPB PGA_MCEG_100 raster or null
  pgaMcegG?: number | null;      // Direct alias of verified BNPB PGA_MCEG_100
  pgaMcerS1?: number | null;     // Spectral acceleration S1 (1.0s) from BNPB PGA_MCER_S1_100
  pgaMcerSs?: number | null;     // Spectral acceleration Ss (0.2s) from BNPB PGA_MCER_Ss_100
  pgaSourceLayer?: string | null; // e.g. "BNPB PGA_MCEG_100 ImageServer (100yr MCEG)"
  bnpbQuakeHazardIndex?: number | null; // Continuous 0.0-1.0 raster value from INDEKS_BAHAYA_GEMPABUMI
  soilSiteClass: string | null;
  soilSiteClassSource?: string | null;
  sniStandardRef: string;
  liquefactionRisk: string | null;
  liquefactionSource?: string | null;
  scoreLedger?: EarthquakeScoreLedger;
  /** @deprecated Compatibility field representing BNPB class only. Never populated from ThinkHazard. */
  bnpbInaRiskClass?: string | null;
  causeId: string;
  causeEn: string;
  impactId: string;
  impactEn: string;
  recomId: string;
  recomEn: string;
}

export interface HeatMetrics {
  score: number | null;
  level: RiskLevel;
  scoreReliability: ScoreReliability;
  observedComponents: number;
  expectedComponents: number;
  coveragePct: number;
  heatModelLevel: HeatModelLevel;
  forecastPeakTempC?: number | null;
  avgMaxTempC: number | null;
  historicalPeakTempC: number | null;
  historicalPeriod?: string | null;
  historicalDataSource?: string | null;
  thinkHazardExtremeHeatLevel?: string | null;
  greenSpaceRatioPct: number | null;
  projectedTempRise2050C: number | null;
  climateProjectionModel?: string | null;
  acCostIncreasePct: number | null;
  /** @deprecated Optional deprecated legacy field only */
  urbanHeatIslandFactor?: HeatModelLevel;
  causeId: string;
  causeEn: string;
  impactId: string;
  impactEn: string;
  recomId: string;
  recomEn: string;
}

export interface TransportMetrics {
  score: number | null;
  level: 'good' | 'moderate' | 'isolated' | 'critical' | 'unavailable';
  scoreReliability: ScoreReliability;
  observedComponents: number;
  expectedComponents: number;
  coveragePct: number;
  connectivityLabelId: string;
  connectivityLabelEn: string;
  distanceToNearestRoadMeters: number | null;
  nearestRoadName: string | null;
  roadBounded?: BoundedSpatialDistance;
  distanceToArterialMeters: number | null;
  nearestArterialName: string | null;
  arterialBounded?: BoundedSpatialDistance;
  distanceToTransitHubMeters: number | null;
  nearestTransitName: string | null;
  transitBounded?: BoundedSpatialDistance;
  distanceToHospitalMeters: number | null;
  nearestHospitalName: string | null;
  hospitalBounded?: BoundedSpatialDistance;
  distanceToAssemblyPointMeters?: number | null;
  nearestAssemblyPointName?: string | null;
  assemblyPointBounded?: BoundedSpatialDistance;
  assemblyPointIsOfficial?: boolean;
  assemblyPointFacilityType?: string | null;
  travelTimeToAssemblyPointMinutes?: string | null;
  travelTimeToAssemblyPointRouteDistanceMeters?: number | null;
  distanceToFireStationMeters: number | null;
  nearestFireStationName: string | null;
  fireStationBounded?: BoundedSpatialDistance;
  estimatedTravelTimeMinutes: string | null;
  travelTimeRouteDistanceMeters: number | null;
  routingSource: string | null;
  evacuationRouteStatusId: string;
  evacuationRouteStatusEn: string;
  causeId: string;
  causeEn: string;
  impactId: string;
  impactEn: string;
  recomId: string;
  recomEn: string;
}

export interface PrescriptionItem {
  id: string;
  category: HazardCategory;
  titleId: string;
  titleEn: string;
  descriptionId: string;
  descriptionEn: string;
  actionType: 'Structural' | 'Architectural' | 'MEP' | 'Civil / Site';
  estimatedCostIdr: string | null;
  estimatedCostUsd: string | null;
  costBasis: 'unavailable' | 'indicative_screening' | 'unpriced';
  priority: 'High' | 'Medium' | 'Low';
  basis: 'risk_model' | 'official_guidance' | 'engineering_review_required';
  trigger?: string;
}

export type { FinancialScreeningMetrics, ClimadaFinancialMetrics, SpatialFeatureRecord, FeatureStore, FeatureCategory, BoundedSpatialDistance, SpatialObservationState };

export interface ThinkHazardReportSummary {
  divisionCode: string;
  divisionName?: string;
  countryName?: string;
  granularity?: 'adm3_region' | 'adm2_district' | 'adm1_province' | 'adm0_national' | 'urban_area' | 'city_regency' | 'provincial' | 'national';
  matchMethod?: 'adm3_catalog_hierarchy' | 'adm2_catalog_district' | 'adm1_catalog_province' | 'adm0_national_baseline' | 'urban_area_match';
  strongAdministrativeMatch?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  fallbackUsed?: boolean;
  identityStatus?: 'confirmed_hierarchy' | 'identity_unverified' | 'identity_conflict_rejected';
  catalogSource?: 'live_api' | 'static_provider_snapshot';
  catalogVersion?: string;
  floodLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  earthquakeLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  extremeHeatLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  tsunamiLevel: 'High' | 'Medium' | 'Low' | 'Very Low' | 'No Data';
  floodRecommendation?: string;
  earthquakeRecommendation?: string;
  heatRecommendation?: string;
  isWorldBankSource: boolean;
  floodEndpoint?: string | null;
  earthquakeEndpoint?: string | null;
  heatEndpoint?: string | null;
  tsunamiEndpoint?: string | null;
}

export interface ComponentModelMetadata {
  modelName: string;
  baseline: number | string;
  inputsEvaluated: string[];
  missingDataPolicy: string;
  formulaDescription: string;
}

export interface RiskModelMetadata {
  modelName: string;
  modelVersion: string;
  overallFormula: string;
  hazardWeights: {
    dominantHazard: number;
    meanHazards: number;
  };
  missingDataPolicy: string;
  scoringCoverage: {
    flood: boolean;
    earthquake: boolean;
    heat: boolean;
    transport: boolean;
    totalAvailable: number;
    totalCategories: number;
  };
  scoringStatus: 'complete' | 'partial' | 'insufficient_data';
  componentModels?: {
    flood: ComponentModelMetadata;
    earthquake: ComponentModelMetadata;
    heat: ComponentModelMetadata;
    transport: ComponentModelMetadata;
  };
}

export interface SoilGridsData {
  phH2o: number | null;               // pH in H2O (e.g. 6.2)
  phH2oRaw: number | null;            // Raw integer (pH * 10, e.g. 62)
  clayPercent: number | null;         // Clay content % (0-30cm)
  sandPercent: number | null;         // Sand content % (0-30cm)
  siltPercent: number | null;         // Silt content % (0-30cm)
  bulkDensityCgCm3: number | null;    // Bulk density in cg/cm³
  organicCarbonDgKg: number | null;   // Soil organic carbon in dg/kg
  cecMmolcKg: number | null;          // Cation exchange capacity in mmol(c)/kg
  nitrogenCgKg: number | null;        // Total nitrogen in cg/kg
  coarseFragmentsPct: number | null;  // Volumetric fraction of coarse fragments %
  soilClassificationWrb?: string | null;
  spatialResolution: string;          // e.g. '250m'
  depthInterval: string;              // e.g. '0-30cm'
  source: 'ISRIC SoilGrids';
  sourceDataset: string;
  endpoint: string;
  isAvailable: boolean;
  missingReason?: string | null;
}

export interface AirQualityData {
  currentPm25: number | null;         // µg/m³
  currentPm10: number | null;         // µg/m³
  currentO3: number | null;           // µg/m³
  currentNo2: number | null;          // µg/m³
  currentSo2: number | null;          // µg/m³
  currentCo: number | null;           // µg/m³
  currentAod: number | null;          // Aerosol Optical Depth
  currentUvIndex: number | null;
  currentEuropeanAqi: number | null;
  currentUsAqi: number | null;
  currentDust: number | null;         // µg/m³
  
  // 24h Deterministic Aggregations
  maxPm25_24h: number | null;
  meanPm25_24h: number | null;
  maxPm10_24h: number | null;
  meanPm10_24h: number | null;
  maxO3_24h: number | null;
  maxNo2_24h: number | null;
  maxEuropeanAqi_24h: number | null;
  maxUvIndex_24h: number | null;

  periodStart: string | null;
  periodEnd: string | null;
  sourceValidTime?: string | null;
  model?: string | null;
  spatialResolution?: string | null;
  source: 'Open-Meteo Air Quality';
  endpoint: string;
  isAvailable: boolean;
  missingReason?: string | null;
}

export interface WorldPopData {
  population1km: number | null;        // Total persons within 1 km radius buffer
  populationDensity1km: number | null; // Persons / km² within 1 km buffer
  population5km: number | null;        // Total persons within 5 km radius buffer
  populationDensity5km: number | null; // Persons / km² within 5 km buffer
  sourceYear: number;
  spatialResolution: string;           // e.g. '100m' or '1km'
  source: 'WorldPop';
  sourceDataset: string;
  endpoint: string;
  isAvailable: boolean;
  missingReason?: string | null;
}

export interface NasaFirmsData {
  activeHotspots24h: number | null;    // Total detections within search radius in last 24h
  activeHotspots7d: number | null;     // Total detections within search radius in last 7 days
  activeHotspots30d: number | null;    // Total detections within search radius in last 30 days
  nearestHotspotKm: number | null;     // Geodesic distance in km to closest fire detection
  maxFrpMw: number | null;             // Maximum Fire Radiative Power (MW)
  meanFrpMw: number | null;            // Mean Fire Radiative Power (MW)
  latestDetectionTime: string | null;  // ISO-8601 timestamp of most recent detection
  satelliteSensor: string;             // e.g. 'VIIRS_SNPP_NRT / MODIS'
  searchRadiusKm: number;              // e.g. 50 or 100 km
  source: 'NASA FIRMS';
  endpoint: string;
  isAvailable: boolean;
  missingReason?: string | null;
}

export interface BuildingVulnerabilityProfile {
  propertyType: PropertyType;
  buildingFloors: number | null;
  constructionYear: number | null;
  foundationType: string | null;
  structuralSystem: string | null;
  estimatedPropertyValueIdr: number | null;
  profilingLevel: 'basic_location_only' | 'enriched_building_attributes' | 'expert_verified';
  notesId: string;
  notesEn: string;
}

export interface MultiHazardAssessmentResult {
  referenceNumber: string;
  evaluatedAt: string;
  location: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    cityDistrict?: string | null;
    country: string;
  };
  propertyType: PropertyType;
  userPersona: UserPersona;
  overallScore: number | null;
  overallLevel: RiskLevel;
  dominantHazard: HazardCategory | null;
  scoringStatus?: 'complete' | 'partial' | 'insufficient_data';
  /**
   * Data Source Completeness Score (Coverage of live APIs vs fallbacks, 0-100%).
   */
  dataCompletenessScorePct: number;
  /**
   * @deprecated Use dataCompletenessScorePct. Represents data-source completeness, NOT probability of truth.
   */
  confidenceScorePct?: number;
  modelMetadata?: RiskModelMetadata;
  flood: FloodMetrics;
  quake: QuakeMetrics;
  heat: HeatMetrics;
  transport: TransportMetrics;
  prescriptions: PrescriptionItem[];
  buildingProfile?: BuildingVulnerabilityProfile | null;
  financialScreening?: FinancialScreeningMetrics | null;
  /** @deprecated Use financialScreening */
  climadaFinancial?: FinancialScreeningMetrics | null;
  worldBankReport?: ThinkHazardReportSummary | null;
  soil?: SoilGridsData | null;
  airQuality?: AirQualityData | null;
  populationExposure?: WorldPopData | null;
  population?: WorldPopData | null;
  wildfireActivity?: NasaFirmsData | null;
  wildfire?: NasaFirmsData | null;
  executiveSummaryId: string;
  executiveSummaryEn: string;
  sourceAttributions: string[];
  /** Canonical Machine-Readable Spatial Features for statistical modeling & ML */
  features?: SpatialFeatureRecord[];
  /** Keyed Feature Store for constant-time attribute lookup */
  featureStore?: FeatureStore;
}
