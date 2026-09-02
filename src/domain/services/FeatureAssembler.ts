import type { Coordinates } from '../value_objects/Coordinates.vo';
import type { SpatialFeatureRecord, FeatureStore } from '../types/feature.types';
import type { InaRiskAssessmentData } from '../../infrastructure/external_apis/InaRiskBnpbClient';
import type { SeismicHistoryData } from '../../infrastructure/external_apis/UsgsEarthquakeClient';
import type { BmkgSeismicSummary } from '../../infrastructure/external_apis/BmkgEarthquakeClient';
import type { ClimateAndElevationData } from '../../infrastructure/external_apis/OpenMeteoClient';
import type { SpatialProximityData } from '../../infrastructure/external_apis/OverpassOsmClient';
import type { MapboxSpatialSummary } from '../../infrastructure/external_apis/MapboxSpatialClient';
import type { NormalizedTransportEvidence } from '../types/transport.types';
import { TransportEvidenceAdapter } from './TransportEvidenceAdapter';
import type {
  SoilGridsData,
  AirQualityData,
  WorldPopData,
  NasaFirmsData,
  ThinkHazardReportSummary
} from '../types/hazard.types';

export interface FeatureAssemblyInput {
  coords: Coordinates;
  address: string;
  country: string;
  evaluatedAt: string;
  inarisk?: InaRiskAssessmentData | null;
  seismic?: SeismicHistoryData | null;
  bmkg?: BmkgSeismicSummary | null;
  meteo?: ClimateAndElevationData | null;
  osm?: SpatialProximityData | null;
  mapbox?: MapboxSpatialSummary | null;
  transportEvidence?: NormalizedTransportEvidence | null;
  thinkHazard?: ThinkHazardReportSummary | null;
  soil?: SoilGridsData | null;
  airQuality?: AirQualityData | null;
  population?: WorldPopData | null;
  firms?: NasaFirmsData | null;
}

export class FeatureAssembler {
  /**
   * Standardizes and structures all verified source inputs into canonical SpatialFeatureRecord entities.
   * Ensures 100% data provenance, physical units, coordinate binding, and zero synthetic metric fabrication.
   */
  public static assemble(input: FeatureAssemblyInput): {
    features: SpatialFeatureRecord[];
    featureStore: FeatureStore;
  } {
    const records: SpatialFeatureRecord[] = [];
    const lat = input.coords.lat;
    const lng = input.coords.lng;
    const evaluatedAt = input.evaluatedAt;

    const addFeature = (record: SpatialFeatureRecord) => {
      records.push({
        retrievedAt: record.retrievedAt || evaluatedAt,
        schemaVersion: record.schemaVersion || '1.0',
        ...record
      });
    };

    // =========================================================================
    // 1. FLOOD & HYDROLOGY FEATURES (BNPB, GloFAS, OSM)
    // =========================================================================
    addFeature({
      featureName: 'flood_bnpb_hazard_index',
      category: 'flood',
      numericValue: input.inarisk?.floodHazardIndex ?? null,
      stringValue: input.inarisk?.floodHazardClass ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_BANJIR',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.floodHazardIndex === null || input.inarisk?.floodHazardIndex === undefined,
      missingReason: input.country !== 'Indonesia' ? 'outside_indonesia_bounds' : (input.inarisk?.floodHazardIndex === null ? 'nodata_or_service_timeout' : undefined)
    });

    addFeature({
      featureName: 'flood_bnpb_risk_index',
      category: 'flood',
      numericValue: input.inarisk?.floodRiskIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'layer_risiko_banjir',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/layer_risiko_banjir/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.floodRiskIndex === null || input.inarisk?.floodRiskIndex === undefined,
      missingReason: input.country !== 'Indonesia' ? 'outside_indonesia_bounds' : (input.inarisk?.floodRiskIndex === null ? 'nodata_or_service_timeout' : undefined)
    });

    addFeature({
      featureName: 'hydrology_glofas_mean_discharge_m3s',
      category: 'hydrology',
      numericValue: input.meteo?.meanRiverDischargeM3s ?? null,
      unit: 'm³/s',
      source: 'Copernicus / Open-Meteo',
      sourceDataset: 'GloFAS River Discharge',
      endpoint: 'https://flood-api.open-meteo.com/v1/flood',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~5km grid cell',
      isDerived: true,
      calculationMethod: 'mean_of_14d_daily_discharge',
      missing: input.meteo?.meanRiverDischargeM3s === null || input.meteo?.meanRiverDischargeM3s === undefined,
      missingReason: input.meteo?.meanRiverDischargeM3s === null ? 'glofas_nodata_or_timeout' : undefined
    });

    addFeature({
      featureName: 'hydrology_glofas_max_discharge_m3s',
      category: 'hydrology',
      numericValue: input.meteo?.glofasDischargeMaxM3s ?? null,
      unit: 'm³/s',
      source: 'Copernicus / Open-Meteo',
      sourceDataset: 'GloFAS River Discharge',
      endpoint: 'https://flood-api.open-meteo.com/v1/flood',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~5km grid cell',
      isDerived: true,
      calculationMethod: 'max_of_14d_daily_discharge',
      missing: input.meteo?.glofasDischargeMaxM3s === null || input.meteo?.glofasDischargeMaxM3s === undefined
    });

    addFeature({
      featureName: 'flood_distance_to_nearest_waterway_meters',
      category: 'flood',
      numericValue: input.osm?.distanceToNearestWaterwayMeters ?? null,
      stringValue: input.osm?.nearestWaterwayName ?? null,
      unit: 'meters',
      source: 'OpenStreetMap',
      sourceDataset: 'OSM Waterways (river, canal, stream, drain)',
      endpoint: 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_polyline_geometry',
      isDerived: true,
      calculationMethod: 'point_to_segment_perpendicular_distance',
      missing: input.osm?.distanceToNearestWaterwayMeters === null || input.osm?.distanceToNearestWaterwayMeters === undefined,
      missingReason: input.osm?.distanceToNearestWaterwayMeters === null ? 'no_waterway_within_5000m' : undefined
    });

    addFeature({
      featureName: 'topography_slope_degrees',
      category: 'topography',
      numericValue: input.meteo?.slopeDegrees ?? null,
      stringValue: input.meteo?.slopeClassification ?? null,
      unit: 'degrees',
      source: input.meteo?.auditTrail?.elevation?.provider || 'Copernicus DEM (Open-Meteo)',
      sourceDataset: 'Copernicus DEM 90m 5-point stencil',
      endpoint: 'https://api.open-meteo.com/v1/elevation',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~90m grid',
      isDerived: true,
      calculationMethod: 'finite_difference_gradient_stencil',
      missing: input.meteo?.slopeDegrees === null || input.meteo?.slopeDegrees === undefined
    });

    addFeature({
      featureName: 'topography_local_relief_meters',
      category: 'topography',
      numericValue: input.meteo?.localReliefMeters ?? null,
      stringValue: input.meteo?.localReliefType ?? null,
      unit: 'meters',
      source: 'Copernicus DEM 90m',
      sourceDataset: 'Copernicus DEM 90m 5-point stencil',
      endpoint: 'https://api.open-meteo.com/v1/elevation',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~90m grid',
      isDerived: true,
      calculationMethod: 'center_minus_median_surrounding_elevation',
      missing: input.meteo?.localReliefMeters === null || input.meteo?.localReliefMeters === undefined
    });

    addFeature({
      featureName: 'topography_flow_accumulation_potential',
      category: 'topography',
      numericValue: null,
      stringValue: input.meteo?.flowAccumulationPotential ?? null,
      unit: null,
      source: 'GoTangguh Terrain Heuristic Model',
      sourceDataset: 'Copernicus DEM 90m Derivatives (5-point Stencil)',
      endpoint: 'https://api.open-meteo.com/v1/elevation',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~90m grid stencil',
      isDerived: true,
      calculationMethod: 'derived_terrain_heuristic_stencil',
      missing: !input.meteo?.flowAccumulationPotential
    });

    addFeature({
      featureName: 'flood_inundation_depth_meters',
      category: 'flood',
      numericValue: null,
      stringValue: 'Data sensor genangan in-situ belum tersedia',
      unit: 'meters',
      source: 'In-Situ Gauge / Hydrological Micro-Simulation',
      sourceDataset: 'In-Situ Flood Gauge Network',
      endpoint: 'in_situ_monitoring',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'site_point',
      isDerived: false,
      calculationMethod: 'unmeasured_micro_sensor_gate',
      missing: true,
      missingReason: 'no_verified_insitu_flood_depth_sensor'
    });

    addFeature({
      featureName: 'flood_historical_events_count',
      category: 'flood',
      numericValue: null,
      stringValue: 'Data rekaman histori banjir mikro tapak belum tersedia',
      unit: 'events',
      source: 'DIBI BNPB / BPBD Regional Catalog',
      sourceDataset: 'DIBI Disaster Database',
      endpoint: 'https://dibi.bnpb.go.id',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'administrative_district',
      isDerived: false,
      calculationMethod: 'historical_disaster_catalog_query',
      missing: true,
      missingReason: 'point_specific_historical_flood_unverified'
    });

    addFeature({
      featureName: 'infrastructure_nearest_drainage_channel',
      category: 'infrastructure',
      numericValue: null,
      stringValue: 'Data jaringan drainase tertutup mikro belum tersedia',
      unit: 'meters',
      source: 'OpenStreetMap Infrastructure',
      sourceDataset: 'OSM Infrastructure (waterway=drain, ditch)',
      endpoint: 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_polyline_geometry',
      isDerived: true,
      calculationMethod: 'spatial_proximity_query',
      missing: true,
      missingReason: 'no_verified_drainage_asset_mapped'
    });

    addFeature({
      featureName: 'flood_thinkhazard_level',
      category: 'flood',
      numericValue: null,
      stringValue: input.thinkHazard?.floodLevel ?? null,
      unit: null,
      source: 'World Bank / GFDRR',
      sourceDataset: 'ThinkHazard! Multi-Hazard Risk Assessment',
      endpoint: input.thinkHazard?.floodEndpoint || 'https://thinkhazard.org/en/report',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: input.thinkHazard?.granularity || 'administrative_division',
      isDerived: false,
      calculationMethod: 'administrative_division_catalog_lookup',
      missing: !input.thinkHazard?.floodLevel || input.thinkHazard?.floodLevel === 'No Data',
      missingReason: !input.thinkHazard?.floodLevel ? 'thinkhazard_unreachable_or_unresolved' : undefined
    });

    // =========================================================================
    // 2. SEISMIC & GEOPHYSICAL FEATURES (BNPB, USGS, BMKG)
    // =========================================================================
    addFeature({
      featureName: 'seismic_bnpb_pga_mceg_g',
      category: 'seismic',
      numericValue: input.inarisk?.pgaMcegG ?? null,
      unit: 'g',
      source: 'BNPB',
      sourceDataset: 'PGA_MCEG_100',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/PGA_MCEG_100/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.pgaMcegG === null || input.inarisk?.pgaMcegG === undefined,
      missingReason: input.country !== 'Indonesia' ? 'outside_indonesia_bounds' : (input.inarisk?.pgaMcegG === null ? 'nodata_or_service_timeout' : undefined)
    });

    addFeature({
      featureName: 'seismic_bnpb_pga_mcer_s1_g',
      category: 'seismic',
      numericValue: input.inarisk?.pgaMcerS1 ?? null,
      unit: 'g',
      source: 'BNPB',
      sourceDataset: 'PGA_MCER_S1_100',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/PGA_MCER_S1_100/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.pgaMcerS1 === null || input.inarisk?.pgaMcerS1 === undefined
    });

    addFeature({
      featureName: 'seismic_bnpb_pga_mcer_ss_g',
      category: 'seismic',
      numericValue: input.inarisk?.pgaMcerSs ?? null,
      unit: 'g',
      source: 'BNPB',
      sourceDataset: 'PGA_MCER_Ss_100',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/PGA_MCER_Ss_100/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.pgaMcerSs === null || input.inarisk?.pgaMcerSs === undefined
    });

    addFeature({
      featureName: 'seismic_bnpb_liquefaction_index',
      category: 'seismic',
      numericValue: input.inarisk?.liquefactionIndex ?? null,
      stringValue: input.inarisk?.liquefactionHazardClass ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_LIKUEFAKSI',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_LIKUEFAKSI/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.liquefactionIndex === null || input.inarisk?.liquefactionIndex === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_quakes_count_50km',
      category: 'seismic',
      numericValue: input.seismic?.quakesCount50km ?? null,
      unit: 'count_events',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'geodesic_haversine_radius_filter_50km',
      missing: input.seismic?.quakesCount50km === null || input.seismic?.quakesCount50km === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_quakes_count_100km',
      category: 'seismic',
      numericValue: input.seismic?.quakesCount100km ?? null,
      unit: 'count_events',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'geodesic_haversine_radius_filter_100km',
      missing: input.seismic?.quakesCount100km === null || input.seismic?.quakesCount100km === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_quakes_count_150km',
      category: 'seismic',
      numericValue: input.seismic?.quakesCount150km ?? null,
      unit: 'count_events',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'geodesic_haversine_radius_filter_150km',
      missing: input.seismic?.quakesCount150km === null || input.seismic?.quakesCount150km === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_quakes_count_250km',
      category: 'seismic',
      numericValue: input.seismic?.quakesCount250km ?? null,
      unit: 'count_events',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'geodesic_haversine_radius_filter_250km',
      missing: input.seismic?.quakesCount250km === null || input.seismic?.quakesCount250km === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_max_magnitude',
      category: 'seismic',
      numericValue: input.seismic?.maxMagnitude ?? null,
      unit: 'moment_magnitude_Mw',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'max_magnitude_within_150km',
      missing: input.seismic?.maxMagnitude === null || input.seismic?.maxMagnitude === undefined
    });

    addFeature({
      featureName: 'seismic_usgs_shallow_quakes_count',
      category: 'seismic',
      numericValue: input.seismic?.shallowQuakesCount ?? null,
      unit: 'count_events',
      source: 'USGS',
      sourceDataset: 'USGS Earthquake Hazards Program (FDSN)',
      endpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
      periodStart: '10_years_prior',
      periodEnd: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'depth_less_than_30km_within_150km',
      missing: input.seismic?.shallowQuakesCount === null || input.seismic?.shallowQuakesCount === undefined
    });

    addFeature({
      featureName: 'seismic_bmkg_distance_to_latest_km',
      category: 'seismic',
      numericValue: input.bmkg?.latestQuake?.distanceToSiteKm ?? null,
      stringValue: input.bmkg?.latestQuake ? `${input.bmkg.latestQuake.wilayah} (M${input.bmkg.latestQuake.magnitude})` : null,
      unit: 'km',
      source: 'BMKG',
      sourceDataset: 'autogempa.json',
      endpoint: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
      observedAt: input.bmkg?.latestQuake?.tanggal ?? evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'haversine_distance_to_latest_epicenter',
      missing: !input.bmkg?.latestQuake,
      missingReason: input.country !== 'Indonesia' ? 'bmkg_feed_only_in_indonesia' : undefined
    });

    // =========================================================================
    // 3. CLIMATE, METEOROLOGY & TOPOGRAPHY (Open-Meteo, DEM, ERA5, CMIP6)
    // =========================================================================
    addFeature({
      featureName: 'topography_elevation_meters',
      category: 'climate',
      numericValue: input.meteo?.elevationMeters ?? null,
      unit: 'meters_amsl',
      source: input.meteo?.auditTrail?.elevation?.provider || 'Open-Meteo',
      sourceDataset: input.meteo?.auditTrail?.elevation?.dataset || 'Copernicus DEM 90m',
      endpoint: 'https://api.open-meteo.com/v1/elevation',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~90m grid',
      isDerived: false,
      calculationMethod: 'digital_elevation_model_sample',
      missing: input.meteo?.elevationMeters === null || input.meteo?.elevationMeters === undefined
    });

    addFeature({
      featureName: 'climate_forecast_peak_temp_c',
      category: 'climate',
      numericValue: input.meteo?.forecastPeakTempC ?? null,
      unit: '°C',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast (ECMWF/GFS Seamless)',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      periodStart: evaluatedAt,
      periodEnd: '7_days_forecast',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'maximum_of_7_daily_temperature_2m_max',
      missing: input.meteo?.forecastPeakTempC === null || input.meteo?.forecastPeakTempC === undefined
    });

    addFeature({
      featureName: 'climate_apparent_temp_max_7d_c',
      category: 'climate',
      numericValue: input.meteo?.apparentTempMax7d ?? null,
      unit: '°C',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'maximum_of_7_daily_apparent_temperature_max',
      missing: input.meteo?.apparentTempMax7d === null || input.meteo?.apparentTempMax7d === undefined
    });

    addFeature({
      featureName: 'climate_historical_peak_temp_c',
      category: 'climate',
      numericValue: input.meteo?.historicalPeakTempC ?? null,
      unit: '°C',
      source: input.meteo?.auditTrail?.historicalTemperature?.provider || 'Open-Meteo',
      sourceDataset: input.meteo?.auditTrail?.historicalTemperature?.dataset || 'ERA5-Seamless Reanalysis',
      endpoint: 'https://archive-api.open-meteo.com/v1/archive',
      periodStart: '2020-01-01',
      periodEnd: '2024-12-31',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'maximum_daily_temperature_2m_max_2020_2024',
      missing: input.meteo?.historicalPeakTempC === null || input.meteo?.historicalPeakTempC === undefined
    });

    addFeature({
      featureName: 'climate_max_daily_precipitation_mm',
      category: 'climate',
      numericValue: input.meteo?.maxDailyPrecipitationMm ?? null,
      unit: 'mm/24h',
      source: input.meteo?.auditTrail?.historicalPrecipitation?.provider || 'Open-Meteo',
      sourceDataset: input.meteo?.auditTrail?.historicalPrecipitation?.dataset || 'ERA5-Seamless Reanalysis',
      endpoint: 'https://archive-api.open-meteo.com/v1/archive',
      periodStart: '2020-01-01',
      periodEnd: '2024-12-31',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'maximum_daily_precipitation_sum_2020_2024',
      missing: input.meteo?.maxDailyPrecipitationMm === null || input.meteo?.maxDailyPrecipitationMm === undefined
    });

    addFeature({
      featureName: 'climate_projected_temp_change_2050_c',
      category: 'climate',
      numericValue: input.meteo?.projectedMeanTempChange2046_2049C ?? null,
      unit: '°C_delta',
      source: 'Open-Meteo / CMIP6',
      sourceDataset: 'CMIP6 MRI-AGCM3-2-S Climate Projections',
      endpoint: 'https://climate-api.open-meteo.com/v1/climate',
      periodStart: '2020-2024 (Model Baseline)',
      periodEnd: '2046-2049 (Future Projection)',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'delta_between_2046_2049_mean_and_2020_2024_model_baseline',
      missing: input.meteo?.projectedMeanTempChange2046_2049C === null || input.meteo?.projectedMeanTempChange2046_2049C === undefined
    });

    addFeature({
      featureName: 'climate_hot_days_count_7d',
      category: 'climate',
      numericValue: input.meteo?.hotDaysCount7d ?? null,
      unit: 'count_days',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'count_of_days_with_max_temp_gte_35C',
      missing: input.meteo?.hotDaysCount7d === null || input.meteo?.hotDaysCount7d === undefined
    });

    addFeature({
      featureName: 'climate_heavy_rain_days_count_7d',
      category: 'climate',
      numericValue: input.meteo?.heavyRainDaysCount7d ?? null,
      unit: 'count_days',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'count_of_days_with_precipitation_gte_50mm',
      missing: input.meteo?.heavyRainDaysCount7d === null || input.meteo?.heavyRainDaysCount7d === undefined
    });

    addFeature({
      featureName: 'climate_max_wind_gust_kmh',
      category: 'climate',
      numericValue: input.meteo?.maxWindGustKmh ?? null,
      unit: 'km/h',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'maximum_of_7_daily_wind_gusts_10m_max',
      missing: input.meteo?.maxWindGustKmh === null || input.meteo?.maxWindGustKmh === undefined
    });

    addFeature({
      featureName: 'climate_et0_fao_evapotranspiration_mm',
      category: 'climate',
      numericValue: input.meteo?.et0FaoMm ?? null,
      unit: 'mm/day',
      source: 'Open-Meteo',
      sourceDataset: 'Numerical Weather Forecast (FAO-56 Penman-Monteith)',
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'mean_of_7_daily_et0_values',
      missing: input.meteo?.et0FaoMm === null || input.meteo?.et0FaoMm === undefined
    });

    // =========================================================================
    // 4. INFRASTRUCTURE, PROXIMITY & ROUTING (NORMALIZED TRANSPORT EVIDENCE)
    // =========================================================================
    const transport = input.transportEvidence || TransportEvidenceAdapter.normalize({
      mapbox: input.mapbox,
      osm: input.osm,
      evaluatedAt
    });

    addFeature({
      featureName: 'infrastructure_distance_to_nearest_road_meters',
      category: 'infrastructure',
      numericValue: transport.nearestRoad.distanceMeters,
      stringValue: transport.nearestRoad.name,
      unit: 'meters',
      source: transport.nearestRoad.provider,
      sourceDataset: transport.nearestRoad.source === 'mapbox' ? 'Mapbox Address & Street Layer' : 'OSRM Nearest Snapping / OSM Local Highways',
      endpoint: transport.nearestRoad.endpoint || (transport.nearestRoad.source === 'mapbox' ? 'https://api.mapbox.com/geocoding/v5/mapbox.places' : 'https://router.project-osrm.org/nearest/v1/driving'),
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'road_network_node_snap',
      isDerived: true,
      calculationMethod: transport.nearestRoad.source === 'mapbox' ? 'mapbox_reverse_street_geocoding_snap' : 'osrm_nearest_driving_segment_snap',
      missing: transport.nearestRoad.status === 'error' || (transport.nearestRoad.distanceMeters === null && transport.nearestRoad.status !== 'success_bounded')
    });

    addFeature({
      featureName: 'infrastructure_distance_to_arterial_meters',
      category: 'infrastructure',
      numericValue: transport.majorRoad.distanceMeters,
      stringValue: transport.majorRoad.name,
      unit: 'meters',
      source: transport.majorRoad.provider,
      sourceDataset: 'OSM Arterial Ways (motorway, trunk, primary, secondary)',
      endpoint: transport.majorRoad.endpoint || 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_polyline_geometry',
      isDerived: true,
      calculationMethod: 'point_to_segment_perpendicular_distance',
      missing: transport.majorRoad.status === 'error' || (transport.majorRoad.distanceMeters === null && transport.majorRoad.status !== 'success_bounded')
    });

    // Hospital / Healthcare POI
    addFeature({
      featureName: 'infrastructure_distance_to_hospital_meters',
      category: 'infrastructure',
      numericValue: transport.healthcare.distanceMeters,
      stringValue: transport.healthcare.name,
      unit: 'meters',
      source: transport.healthcare.provider,
      sourceDataset: transport.healthcare.source === 'mapbox'
        ? 'Mapbox Global POI Index (Category: hospital)'
        : 'OSM POIs (amenity=hospital)',
      endpoint: transport.healthcare.endpoint || (transport.healthcare.source === 'mapbox'
        ? 'https://api.mapbox.com/search/searchbox/v1/category/hospital'
        : 'https://overpass-api.de/api/interpreter'),
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_node_or_center',
      isDerived: true,
      calculationMethod: 'geodesic_haversine_to_representative_point',
      missing: transport.healthcare.status === 'error' || (transport.healthcare.distanceMeters === null && transport.healthcare.status !== 'success_bounded')
    });

    // Fire Station POI
    addFeature({
      featureName: 'infrastructure_distance_to_fire_station_meters',
      category: 'infrastructure',
      numericValue: transport.fireStation.distanceMeters,
      stringValue: transport.fireStation.name,
      unit: 'meters',
      source: transport.fireStation.provider,
      sourceDataset: transport.fireStation.source === 'mapbox'
        ? 'Mapbox Global POI Index (Category: fire_station)'
        : 'OSM POIs (amenity=fire_station)',
      endpoint: transport.fireStation.endpoint || (transport.fireStation.source === 'mapbox'
        ? 'https://api.mapbox.com/search/searchbox/v1/category/fire_station'
        : 'https://overpass-api.de/api/interpreter'),
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_node_or_center',
      isDerived: true,
      calculationMethod: 'geodesic_haversine_to_representative_point',
      missing: transport.fireStation.status === 'error' || (transport.fireStation.distanceMeters === null && transport.fireStation.status !== 'success_bounded')
    });

    // Assembly / Evacuation Point POI
    if (transport.assemblyPoint) {
      addFeature({
        featureName: 'infrastructure_distance_to_assembly_point_meters',
        category: 'infrastructure',
        numericValue: transport.assemblyPoint.distanceMeters,
        stringValue: transport.assemblyPoint.name,
        unit: 'meters',
        source: transport.assemblyPoint.provider,
        sourceDataset: 'OSM Emergency & Assembly POIs',
        endpoint: transport.assemblyPoint.endpoint || 'https://overpass-api.de/api/interpreter',
        observedAt: evaluatedAt,
        latitude: lat,
        longitude: lng,
        spatialResolution: 'vector_node_or_center',
        isDerived: true,
        calculationMethod: 'geodesic_haversine_to_representative_point',
        missing: transport.assemblyPoint.status === 'error' || (transport.assemblyPoint.distanceMeters === null && transport.assemblyPoint.status !== 'success_bounded')
      });
    }

    addFeature({
      featureName: 'infrastructure_distance_to_police_station_meters',
      category: 'infrastructure',
      numericValue: input.osm?.distanceToPoliceStationMeters ?? null,
      stringValue: input.osm?.nearestPoliceStationName ?? null,
      unit: 'meters',
      source: 'OpenStreetMap',
      sourceDataset: 'OSM POIs (amenity=police)',
      endpoint: 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_node_or_center',
      isDerived: true,
      calculationMethod: 'geodesic_haversine_to_representative_point',
      missing: input.osm?.distanceToPoliceStationMeters === null || input.osm?.distanceToPoliceStationMeters === undefined
    });

    addFeature({
      featureName: 'infrastructure_distance_to_school_meters',
      category: 'infrastructure',
      numericValue: input.osm?.distanceToSchoolMeters ?? null,
      stringValue: input.osm?.nearestSchoolName ?? null,
      unit: 'meters',
      source: 'OpenStreetMap',
      sourceDataset: 'OSM POIs (amenity=school)',
      endpoint: 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_node_or_center',
      isDerived: true,
      calculationMethod: 'geodesic_haversine_to_representative_point',
      missing: input.osm?.distanceToSchoolMeters === null || input.osm?.distanceToSchoolMeters === undefined
    });

    // Transit Hub POI
    addFeature({
      featureName: 'infrastructure_distance_to_transit_hub_meters',
      category: 'infrastructure',
      numericValue: transport.transit.distanceMeters,
      stringValue: transport.transit.name,
      unit: 'meters',
      source: transport.transit.provider,
      sourceDataset: transport.transit.source === 'mapbox'
        ? 'Mapbox Global POI Index (Category: transit_station)'
        : 'OSM Transit (railway=station|halt, highway=bus_stop)',
      endpoint: transport.transit.endpoint || (transport.transit.source === 'mapbox'
        ? 'https://api.mapbox.com/search/searchbox/v1/category/transit_station'
        : 'https://overpass-api.de/api/interpreter'),
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'vector_node_or_center',
      isDerived: true,
      calculationMethod: 'geodesic_haversine_to_representative_point',
      missing: transport.transit.status === 'error' || (transport.transit.distanceMeters === null && transport.transit.status !== 'success_bounded')
    });

    addFeature({
      featureName: 'infrastructure_travel_time_to_hospital_minutes',
      category: 'infrastructure',
      numericValue: transport.route.durationMinutes,
      stringValue: transport.route.estimatedTravelTimeMinutes,
      unit: 'minutes',
      source: transport.route.provider,
      sourceDataset: transport.route.source === 'mapbox'
        ? 'Mapbox Road Network Driving Profile'
        : 'OpenStreetMap Road Network Driving Graph',
      endpoint: transport.route.endpoint || (transport.route.source === 'mapbox'
        ? 'https://api.mapbox.com/directions/v5/mapbox/driving'
        : 'https://router.project-osrm.org/route/v1/driving'),
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'shortest_path_dijkstra_graph',
      isDerived: true,
      calculationMethod: transport.route.source === 'mapbox'
        ? 'mapbox_directions_live_driving_route'
        : 'osrm_live_graph_shortest_duration_driving',
      missing: transport.route.durationMinutes === null,
      missingReason: transport.route.durationMinutes === null
        ? 'no_hospital_or_routing_unreachable'
        : undefined
    });

    addFeature({
      featureName: 'infrastructure_green_space_ratio_pct',
      category: 'infrastructure',
      numericValue: input.osm?.greenFeatureRatioPct ?? null,
      unit: '%_feature_count_proxy',
      source: 'OpenStreetMap',
      sourceDataset: 'OSM Land-use & Leisure Parcels (park, garden, forest, grass)',
      endpoint: 'https://overpass-api.de/api/interpreter',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      isDerived: true,
      calculationMethod: 'ratio_of_green_to_total_osm_landcover_features_by_count_proxy',
      missing: input.osm?.greenFeatureRatioPct === null || input.osm?.greenFeatureRatioPct === undefined
    });

    // =========================================================================
    // 5. BNPB MULTI-HAZARD EXTENDED RASTER INDICES
    // =========================================================================
    addFeature({
      featureName: 'multi_hazard_bnpb_landslide_index',
      category: 'multi_hazard',
      numericValue: input.inarisk?.landslideHazardIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_TANAHLONGSOR',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_TANAHLONGSOR/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.landslideHazardIndex === null || input.inarisk?.landslideHazardIndex === undefined
    });

    addFeature({
      featureName: 'multi_hazard_bnpb_drought_index',
      category: 'multi_hazard',
      numericValue: input.inarisk?.droughtHazardIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_KEKERINGAN',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_KEKERINGAN/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.droughtHazardIndex === null || input.inarisk?.droughtHazardIndex === undefined
    });

    addFeature({
      featureName: 'multi_hazard_bnpb_extreme_weather_index',
      category: 'multi_hazard',
      numericValue: input.inarisk?.extremeWeatherHazardIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_CUACAEKSTRIM',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_CUACAEKSTRIM/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.extremeWeatherHazardIndex === null || input.inarisk?.extremeWeatherHazardIndex === undefined
    });

    addFeature({
      featureName: 'multi_hazard_bnpb_wildfire_index',
      category: 'multi_hazard',
      numericValue: input.inarisk?.wildfireHazardIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_KEBAKARAN_HUTAN_DAN_LAHAN',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_KEBAKARAN_HUTAN_DAN_LAHAN/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.wildfireHazardIndex === null || input.inarisk?.wildfireHazardIndex === undefined
    });

    addFeature({
      featureName: 'multi_hazard_bnpb_tsunami_index',
      category: 'multi_hazard',
      numericValue: input.inarisk?.tsunamiHazardIndex ?? null,
      unit: 'index_0_1',
      source: 'BNPB',
      sourceDataset: 'INDEKS_BAHAYA_TSUNAMI',
      endpoint: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_TSUNAMI/ImageServer/identify',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: 'raster_pixel_bnpb',
      isDerived: false,
      calculationMethod: 'arcgis_imageserver_identify',
      missing: input.inarisk?.tsunamiHazardIndex === null || input.inarisk?.tsunamiHazardIndex === undefined
    });

    // =========================================================================
    // 8. REGIONAL SOIL PROPERTIES (ISRIC SoilGrids 2.0)
    // =========================================================================
    const soil = input.soil;
    const isSoilMissing = !soil || !soil.isAvailable;

    addFeature({
      featureName: 'soil.phh2o',
      category: 'soil',
      numericValue: soil?.phH2o ?? null,
      stringValue: soil?.phH2o !== null && soil?.phH2o !== undefined ? `${soil.phH2o} pH` : null,
      unit: 'pH',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (phh2o 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.phH2o === null || soil?.phH2o === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.clay_pct',
      category: 'soil',
      numericValue: soil?.clayPercent ?? null,
      stringValue: soil?.clayPercent !== null && soil?.clayPercent !== undefined ? `${soil.clayPercent}%` : null,
      unit: '%',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (clay 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.clayPercent === null || soil?.clayPercent === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.sand_pct',
      category: 'soil',
      numericValue: soil?.sandPercent ?? null,
      stringValue: soil?.sandPercent !== null && soil?.sandPercent !== undefined ? `${soil.sandPercent}%` : null,
      unit: '%',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (sand 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.sandPercent === null || soil?.sandPercent === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.silt_pct',
      category: 'soil',
      numericValue: soil?.siltPercent ?? null,
      stringValue: soil?.siltPercent !== null && soil?.siltPercent !== undefined ? `${soil.siltPercent}%` : null,
      unit: '%',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (silt 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.siltPercent === null || soil?.siltPercent === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.bulk_density',
      category: 'soil',
      numericValue: soil?.bulkDensityCgCm3 ?? null,
      stringValue: soil?.bulkDensityCgCm3 !== null && soil?.bulkDensityCgCm3 !== undefined ? `${soil.bulkDensityCgCm3} cg/cm³` : null,
      unit: 'cg/cm³',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (bdod 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.bulkDensityCgCm3 === null || soil?.bulkDensityCgCm3 === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.organic_carbon',
      category: 'soil',
      numericValue: soil?.organicCarbonDgKg ?? null,
      stringValue: soil?.organicCarbonDgKg !== null && soil?.organicCarbonDgKg !== undefined ? `${soil.organicCarbonDgKg} dg/kg` : null,
      unit: 'dg/kg',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (soc 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.organicCarbonDgKg === null || soil?.organicCarbonDgKg === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.cec',
      category: 'soil',
      numericValue: soil?.cecMmolcKg ?? null,
      stringValue: soil?.cecMmolcKg !== null && soil?.cecMmolcKg !== undefined ? `${soil.cecMmolcKg} mmol(c)/kg` : null,
      unit: 'mmol(c)/kg',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (cec 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.cecMmolcKg === null || soil?.cecMmolcKg === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.nitrogen',
      category: 'soil',
      numericValue: soil?.nitrogenCgKg ?? null,
      stringValue: soil?.nitrogenCgKg !== null && soil?.nitrogenCgKg !== undefined ? `${soil.nitrogenCgKg} cg/kg` : null,
      unit: 'cg/kg',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (nitrogen 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.nitrogenCgKg === null || soil?.nitrogenCgKg === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'soil.coarse_fragments',
      category: 'soil',
      numericValue: soil?.coarseFragmentsPct ?? null,
      stringValue: soil?.coarseFragmentsPct !== null && soil?.coarseFragmentsPct !== undefined ? `${soil.coarseFragmentsPct}%` : null,
      unit: '%',
      source: 'ISRIC SoilGrids',
      sourceDataset: 'SoilGrids 2.0 (cfvo 0-30cm)',
      endpoint: soil?.endpoint || 'https://rest.isric.org/soilgrids/v2.0/properties/query',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '250m',
      depthInterval: soil?.depthInterval || '0-30cm',
      isDerived: false,
      calculationMethod: 'isric_wcs_point_query',
      missing: isSoilMissing || soil?.coarseFragmentsPct === null || soil?.coarseFragmentsPct === undefined,
      missingReason: isSoilMissing ? (soil?.missingReason || 'isric_nodata_or_ocean_pixel') : undefined,
      schemaVersion: '1.0'
    });

    // =========================================================================
    // 9. ENVIRONMENTAL & AIR QUALITY FEATURES (Open-Meteo Air Quality)
    // =========================================================================
    const aq = input.airQuality;
    const isAqMissing = !aq || !aq.isAvailable;

    addFeature({
      featureName: 'air_quality.pm25',
      category: 'air_quality',
      numericValue: aq?.currentPm25 ?? null,
      stringValue: aq?.currentPm25 !== null && aq?.currentPm25 !== undefined ? `${aq.currentPm25} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentPm25 === null || aq?.currentPm25 === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.pm10',
      category: 'air_quality',
      numericValue: aq?.currentPm10 ?? null,
      stringValue: aq?.currentPm10 !== null && aq?.currentPm10 !== undefined ? `${aq.currentPm10} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentPm10 === null || aq?.currentPm10 === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.o3',
      category: 'air_quality',
      numericValue: aq?.currentO3 ?? null,
      stringValue: aq?.currentO3 !== null && aq?.currentO3 !== undefined ? `${aq.currentO3} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentO3 === null || aq?.currentO3 === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.no2',
      category: 'air_quality',
      numericValue: aq?.currentNo2 ?? null,
      stringValue: aq?.currentNo2 !== null && aq?.currentNo2 !== undefined ? `${aq.currentNo2} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentNo2 === null || aq?.currentNo2 === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.so2',
      category: 'air_quality',
      numericValue: aq?.currentSo2 ?? null,
      stringValue: aq?.currentSo2 !== null && aq?.currentSo2 !== undefined ? `${aq.currentSo2} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentSo2 === null || aq?.currentSo2 === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.co',
      category: 'air_quality',
      numericValue: aq?.currentCo ?? null,
      stringValue: aq?.currentCo !== null && aq?.currentCo !== undefined ? `${aq.currentCo} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentCo === null || aq?.currentCo === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.aod',
      category: 'air_quality',
      numericValue: aq?.currentAod ?? null,
      unit: 'index_0_1',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS Aerosol Optical Depth 550nm',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentAod === null || aq?.currentAod === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.uv_index',
      category: 'air_quality',
      numericValue: aq?.currentUvIndex ?? null,
      stringValue: aq?.currentUvIndex !== null && aq?.currentUvIndex !== undefined ? `UV ${aq.currentUvIndex}` : null,
      unit: 'index',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS UV Index Model',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'direct_hourly_observation',
      missing: isAqMissing || aq?.currentUvIndex === null || aq?.currentUvIndex === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.aqi',
      category: 'air_quality',
      numericValue: aq?.currentEuropeanAqi ?? null,
      stringValue: aq?.currentEuropeanAqi !== null && aq?.currentEuropeanAqi !== undefined ? `AQI ${aq.currentEuropeanAqi}` : null,
      unit: 'EAQI',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'European Air Quality Index (EAQI)',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: aq?.spatialResolution || '~11km grid cell',
      model: aq?.model || 'CAMS European Model',
      sourceValidTime: aq?.sourceValidTime ?? null,
      isDerived: false,
      calculationMethod: 'official_eaqi_methodology',
      missing: isAqMissing || aq?.currentEuropeanAqi === null || aq?.currentEuropeanAqi === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    // Deterministic Derived Air Quality Features
    addFeature({
      featureName: 'air_quality.max_pm25_24h',
      category: 'air_quality',
      numericValue: aq?.maxPm25_24h ?? null,
      stringValue: aq?.maxPm25_24h !== null && aq?.maxPm25_24h !== undefined ? `${aq.maxPm25_24h} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'maximum of returned hourly PM2.5 values over 24h',
      sourceVariables: ['hourly.pm2_5'],
      missing: isAqMissing || aq?.maxPm25_24h === null || aq?.maxPm25_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.mean_pm25_24h',
      category: 'air_quality',
      numericValue: aq?.meanPm25_24h ?? null,
      stringValue: aq?.meanPm25_24h !== null && aq?.meanPm25_24h !== undefined ? `${aq.meanPm25_24h} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'arithmetic mean of returned hourly PM2.5 values over 24h',
      sourceVariables: ['hourly.pm2_5'],
      missing: isAqMissing || aq?.meanPm25_24h === null || aq?.meanPm25_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.max_pm10_24h',
      category: 'air_quality',
      numericValue: aq?.maxPm10_24h ?? null,
      stringValue: aq?.maxPm10_24h !== null && aq?.maxPm10_24h !== undefined ? `${aq.maxPm10_24h} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'maximum of returned hourly PM10 values over 24h',
      sourceVariables: ['hourly.pm10'],
      missing: isAqMissing || aq?.maxPm10_24h === null || aq?.maxPm10_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.mean_pm10_24h',
      category: 'air_quality',
      numericValue: aq?.meanPm10_24h ?? null,
      stringValue: aq?.meanPm10_24h !== null && aq?.meanPm10_24h !== undefined ? `${aq.meanPm10_24h} µg/m³` : null,
      unit: 'µg/m³',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS European Air Quality Forecast',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'arithmetic mean of returned hourly PM10 values over 24h',
      sourceVariables: ['hourly.pm10'],
      missing: isAqMissing || aq?.meanPm10_24h === null || aq?.meanPm10_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.max_aqi_24h',
      category: 'air_quality',
      numericValue: aq?.maxEuropeanAqi_24h ?? null,
      stringValue: aq?.maxEuropeanAqi_24h !== null && aq?.maxEuropeanAqi_24h !== undefined ? `AQI ${aq.maxEuropeanAqi_24h}` : null,
      unit: 'EAQI',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'European Air Quality Index (EAQI)',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'maximum of returned hourly European AQI values over 24h',
      sourceVariables: ['hourly.european_aqi'],
      missing: isAqMissing || aq?.maxEuropeanAqi_24h === null || aq?.maxEuropeanAqi_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'air_quality.max_uv_index_24h',
      category: 'air_quality',
      numericValue: aq?.maxUvIndex_24h ?? null,
      stringValue: aq?.maxUvIndex_24h !== null && aq?.maxUvIndex_24h !== undefined ? `UV ${aq.maxUvIndex_24h}` : null,
      unit: 'index',
      source: 'Open-Meteo Air Quality',
      sourceDataset: 'CAMS UV Index Model',
      endpoint: aq?.endpoint || 'https://air-quality-api.open-meteo.com/v1/air-quality',
      observedAt: evaluatedAt,
      periodStart: aq?.periodStart,
      periodEnd: aq?.periodEnd,
      latitude: lat,
      longitude: lng,
      spatialResolution: '~11km grid cell',
      isDerived: true,
      calculationMethod: 'maximum of returned hourly UV index values over 24h',
      sourceVariables: ['hourly.uv_index'],
      missing: isAqMissing || aq?.maxUvIndex_24h === null || aq?.maxUvIndex_24h === undefined,
      missingReason: isAqMissing ? (aq?.missingReason || 'openmeteo_aq_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    // =========================================================================
    // 10. POPULATION EXPOSURE & DENSITY FEATURES (WorldPop)
    // =========================================================================
    const pop = input.population;
    const isPopMissing = !pop || !pop.isAvailable;

    addFeature({
      featureName: 'exposure.population_1km',
      category: 'exposure',
      numericValue: pop?.population1km ?? null,
      stringValue: pop?.population1km !== null && pop?.population1km !== undefined ? `${pop.population1km.toLocaleString()} jiwa` : null,
      unit: 'persons',
      source: 'WorldPop',
      sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
      endpoint: pop?.endpoint || 'https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '100m raster grid',
      bufferRadiusMeters: 1000,
      isDerived: true,
      calculationMethod: 'population sum within 1 km site circular buffer',
      missing: isPopMissing || pop?.population1km === null || pop?.population1km === undefined,
      missingReason: isPopMissing ? (pop?.missingReason || 'worldpop_nodata_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'exposure.population_density_1km',
      category: 'exposure',
      numericValue: pop?.populationDensity1km ?? null,
      stringValue: pop?.populationDensity1km !== null && pop?.populationDensity1km !== undefined ? `${pop.populationDensity1km.toLocaleString()} jiwa/km²` : null,
      unit: 'persons/km²',
      source: 'WorldPop',
      sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
      endpoint: pop?.endpoint || 'https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '100m raster grid',
      bufferRadiusMeters: 1000,
      isDerived: true,
      calculationMethod: 'population sum divided by 1 km circular buffer area (3.1416 km²)',
      sourceVariables: ['exposure.population_1km'],
      missing: isPopMissing || pop?.populationDensity1km === null || pop?.populationDensity1km === undefined,
      missingReason: isPopMissing ? (pop?.missingReason || 'worldpop_nodata_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'exposure.population_5km',
      category: 'exposure',
      numericValue: pop?.population5km ?? null,
      stringValue: pop?.population5km !== null && pop?.population5km !== undefined ? `${pop.population5km.toLocaleString()} jiwa` : null,
      unit: 'persons',
      source: 'WorldPop',
      sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
      endpoint: pop?.endpoint || 'https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '100m raster grid',
      bufferRadiusMeters: 5000,
      isDerived: true,
      calculationMethod: 'population sum within 5 km site circular buffer',
      missing: isPopMissing || pop?.population5km === null || pop?.population5km === undefined,
      missingReason: isPopMissing ? (pop?.missingReason || 'worldpop_nodata_pixel') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'exposure.population_density_5km',
      category: 'exposure',
      numericValue: pop?.populationDensity5km ?? null,
      stringValue: pop?.populationDensity5km !== null && pop?.populationDensity5km !== undefined ? `${pop.populationDensity5km.toLocaleString()} jiwa/km²` : null,
      unit: 'persons/km²',
      source: 'WorldPop',
      sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
      endpoint: pop?.endpoint || 'https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '100m raster grid',
      bufferRadiusMeters: 5000,
      isDerived: true,
      calculationMethod: 'population sum divided by 5 km circular buffer area (78.54 km²)',
      sourceVariables: ['exposure.population_5km'],
      missing: isPopMissing || pop?.populationDensity5km === null || pop?.populationDensity5km === undefined,
      missingReason: isPopMissing ? (pop?.missingReason || 'worldpop_nodata_pixel') : undefined,
      schemaVersion: '1.0'
    });

    // =========================================================================
    // 11. ACTIVE WILDFIRE & HOTSPOT DETECTIONS (NASA FIRMS)
    // =========================================================================
    const firms = input.firms;
    const isFirmsMissing = !firms || !firms.isAvailable;

    addFeature({
      featureName: 'fire.active_hotspots_24h',
      category: 'wildfire',
      numericValue: firms?.activeHotspots24h ?? null,
      stringValue: firms?.activeHotspots24h !== null && firms?.activeHotspots24h !== undefined ? `${firms.activeHotspots24h} titik` : null,
      unit: 'detections',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      bufferRadiusMeters: (firms?.searchRadiusKm || 50) * 1000,
      isDerived: true,
      calculationMethod: 'count of verified thermal anomaly detections within 24h in search radius',
      missing: isFirmsMissing || firms?.activeHotspots24h === null || firms?.activeHotspots24h === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.active_hotspots_7d',
      category: 'wildfire',
      numericValue: firms?.activeHotspots7d ?? null,
      stringValue: firms?.activeHotspots7d !== null && firms?.activeHotspots7d !== undefined ? `${firms.activeHotspots7d} titik` : null,
      unit: 'detections',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      bufferRadiusMeters: (firms?.searchRadiusKm || 50) * 1000,
      isDerived: true,
      calculationMethod: 'count of verified thermal anomaly detections within 7 days in search radius',
      missing: isFirmsMissing || firms?.activeHotspots7d === null || firms?.activeHotspots7d === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.active_hotspots_30d',
      category: 'wildfire',
      numericValue: firms?.activeHotspots30d ?? null,
      stringValue: firms?.activeHotspots30d !== null && firms?.activeHotspots30d !== undefined ? `${firms.activeHotspots30d} titik` : null,
      unit: 'detections',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      bufferRadiusMeters: (firms?.searchRadiusKm || 50) * 1000,
      isDerived: true,
      calculationMethod: 'count of verified thermal anomaly detections within 30 days in search radius',
      missing: isFirmsMissing || firms?.activeHotspots30d === null || firms?.activeHotspots30d === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : undefined,
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.nearest_hotspot_km',
      category: 'wildfire',
      numericValue: firms?.nearestHotspotKm ?? null,
      stringValue: firms?.nearestHotspotKm !== null && firms?.nearestHotspotKm !== undefined ? `${firms.nearestHotspotKm} km` : null,
      unit: 'km',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      isDerived: true,
      calculationMethod: 'minimum geodesic Haversine distance to detected hotspot coordinates',
      missing: isFirmsMissing || firms?.nearestHotspotKm === null || firms?.nearestHotspotKm === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : (firms?.nearestHotspotKm === null ? 'no_hotspots_detected_within_search_radius' : undefined),
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.max_frp',
      category: 'wildfire',
      numericValue: firms?.maxFrpMw ?? null,
      stringValue: firms?.maxFrpMw !== null && firms?.maxFrpMw !== undefined ? `${firms.maxFrpMw} MW` : null,
      unit: 'MW',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      isDerived: true,
      calculationMethod: 'maximum Fire Radiative Power (MW) across detections in search radius',
      missing: isFirmsMissing || firms?.maxFrpMw === null || firms?.maxFrpMw === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : (firms?.maxFrpMw === null ? 'no_hotspots_detected_within_search_radius' : undefined),
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.mean_frp',
      category: 'wildfire',
      numericValue: firms?.meanFrpMw ?? null,
      stringValue: firms?.meanFrpMw !== null && firms?.meanFrpMw !== undefined ? `${firms.meanFrpMw} MW` : null,
      unit: 'MW',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      isDerived: true,
      calculationMethod: 'mean Fire Radiative Power (MW) across detections in search radius',
      missing: isFirmsMissing || firms?.meanFrpMw === null || firms?.meanFrpMw === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : (firms?.meanFrpMw === null ? 'no_hotspots_detected_within_search_radius' : undefined),
      schemaVersion: '1.0'
    });

    addFeature({
      featureName: 'fire.latest_detection_time',
      category: 'wildfire',
      numericValue: null,
      stringValue: firms?.latestDetectionTime ?? null,
      unit: 'iso8601',
      source: 'NASA FIRMS',
      sourceDataset: 'VIIRS NRT Active Fire (375m)',
      endpoint: firms?.endpoint || 'https://firms.modaps.eosdis.nasa.gov/api/area/csv',
      observedAt: evaluatedAt,
      latitude: lat,
      longitude: lng,
      spatialResolution: '375m sensor pixel',
      isDerived: false,
      calculationMethod: 'direct_observation_timestamp',
      missing: isFirmsMissing || firms?.latestDetectionTime === null || firms?.latestDetectionTime === undefined,
      missingReason: isFirmsMissing ? (firms?.missingReason || 'firms_unavailable') : (firms?.latestDetectionTime === null ? 'no_hotspots_detected_within_search_radius' : undefined),
      schemaVersion: '1.0'
    });

    // Build constant-time feature store index
    const featureStore: FeatureStore = {};
    for (const f of records) {
      featureStore[f.featureName] = f;
    }

    return {
      features: records,
      featureStore
    };
  }
}
