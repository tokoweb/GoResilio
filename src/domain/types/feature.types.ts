/**
 * GoTangguh Canonical Spatial Feature Layer & ML-Ready Data Contract
 * 
 * Defines standardized, machine-readable, provenance-preserving spatial feature records.
 * All features preserve source attribution, units, spatial resolution, observation periods,
 * and calculation methods without synthetic fallback fabrication.
 */

export type FeatureCategory = 
  | 'flood'
  | 'seismic'
  | 'climate'
  | 'hydrology'
  | 'infrastructure'
  | 'administrative'
  | 'multi_hazard'
  | 'soil'
  | 'air_quality'
  | 'exposure'
  | 'wildfire'
  | 'environmental';

export interface SpatialFeatureRecord {
  /** Canonical unique identifier for the feature (e.g., 'soil.clay_pct', 'air_quality.pm25', 'exposure.population_1km', 'fire.active_hotspots_7d') */
  featureName: string;
  /** High-level hazard, exposure, or environmental domain category */
  category: FeatureCategory;
  /** Clean numerical value for statistical modeling and ML (null if unobserved) */
  numericValue: number | null;
  /** Formatted string representation for presentation/reports */
  stringValue?: string | null;
  /** Physical or standard unit (e.g., 'm', 'mm', '°C', 'g', 'm³/s', 'µg/m³', 'persons', 'detections', 'MW', '%', 'index_0_1') */
  unit: string | null;
  /** Primary data provider (e.g., 'ISRIC SoilGrids', 'Open-Meteo Air Quality', 'WorldPop', 'NASA FIRMS', 'BNPB', 'USGS', 'BMKG', 'Copernicus') */
  source: string;
  /** Specific layer, dataset, or catalog name */
  sourceDataset?: string | null;
  /** Exact API or GIS server endpoint URL */
  endpoint?: string | null;
  /** ISO-8601 timestamp of API retrieval/ingestion */
  retrievedAt?: string | null;
  /** ISO-8601 timestamp of source measurement/observation */
  observedAt?: string | null;
  /** ISO-8601 validity timestamp for model forecasts or reanalysis slices */
  sourceValidTime?: string | null;
  /** ISO-8601 forecast target valid time if applicable */
  forecastValidTime?: string | null;
  /** ISO-8601 start of temporal observation/archive window */
  periodStart?: string | null;
  /** ISO-8601 end of temporal observation/archive window */
  periodEnd?: string | null;
  /** Latitude coordinate of evaluated point */
  latitude: number;
  /** Longitude coordinate of evaluated point */
  longitude: number;
  /** Spatial resolution or pixel size if applicable (e.g., '250m', '100m', '1km', '~5km grid cell', 'vector_point') */
  spatialResolution?: string | null;
  /** Depth interval queried if applicable for soil/subsurface (e.g., '0-5cm', '0-30cm') */
  depthInterval?: string | null;
  /** Buffer radius in meters queried if applicable for exposure/clustering (e.g., 1000, 5000, 50000) */
  bufferRadiusMeters?: number | null;
  /** Model name or numerical model identifier if applicable (e.g., 'CAMS European Model', 'ERA5-Seamless', 'CMIP6 MRI-AGCM3-2-S') */
  model?: string | null;
  /** True if deterministically derived from other raw parameters; False if directly sampled from source */
  isDerived: boolean;
  /** Documented mathematical or spatial calculation method (e.g., 'point_to_segment_distance', 'geodesic_haversine_count', 'mean_of_hourly_values') */
  calculationMethod?: string | null;
  /** Names of prerequisite source features used to compute this derived feature */
  sourceVariables?: string[];
  /** True if source observation was unavailable, out of bounds, or missing */
  missing: boolean;
  /** Explicit reason for missing data (e.g., 'isric_nodata_pixel', 'worldpop_outside_bounds', 'firms_no_detections_in_radius') */
  missingReason?: string | null;
  /** Contract schema version */
  schemaVersion?: string | null;
}

export type FeatureStore = Record<string, SpatialFeatureRecord>;

export interface MLFeatureVector {
  referenceNumber: string;
  latitude: number;
  longitude: number;
  evaluatedAt: string;
  features: Record<string, number | null>;
  missingFlags: Record<string, boolean>;
}

export type SpatialObservationState = 'AVAILABLE_EXACT' | 'AVAILABLE_BOUNDED' | 'NODATA_SEARCH_SUCCESS' | 'ERROR_OR_TIMEOUT';

export interface BoundedSpatialDistance {
  state: SpatialObservationState;
  exactDistanceMeters: number | null;
  relation: 'exact' | 'greater_than' | null;
  lowerBoundMeters: number | null;
  searchedRadiusMeters: number;
  displayValue: string | null;
  name: string | null;
}

/**
 * Normalized UI & Reporting Metric Contract
 * Defines how every metric card is represented, filtered, and rendered in the presentation layer.
 */
export interface ReportMetric {
  id: string;
  labelId: string;
  labelEn: string;
  value: string | number | null;
  unit?: string | null;
  source: string;
  sourceTitle?: string | null;
  status: 'available' | 'bounded' | 'nodata' | 'error' | 'timeout' | 'status';
  spatialState?: SpatialObservationState;
  relation?: 'exact' | 'greater_than' | null;
  boundMeters?: number | null;
  priority: number;
  type: 'source' | 'derived' | 'model' | 'assessment_status';
  /** Backward-compatible alias for type */
  dataType?: 'source' | 'derived' | 'model' | 'assessment_status' | 'status';
  spatialResolution?: string | null;
  descriptionId?: string | null;
  descriptionEn?: string | null;
}
