import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import type { AssessmentDepth } from '../../domain/types/hazard.types';
import { OpenElevationClient } from './OpenElevationClient';
import { NasaPowerClient } from './NasaPowerClient';

export interface ClimateFieldProvenance {
  provider: 'Open-Meteo' | 'Open-Elevation' | 'NASA POWER' | 'none';
  dataset: string;
  endpoint: string;
  model?: string;
  aggregation?: string;
  spatialResolution?: string;
  period?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  recordsReturned?: number;
  validRecords?: number;
  baselineRecords?: number;
  futureRecords?: number;
  notes?: string;
  status: 'live_api' | 'fallback_provider' | 'unavailable';
  error?: string;
  fallbackError?: string;
}

export interface ClimateAuditTrail {
  elevation: ClimateFieldProvenance;
  forecastTemperature: ClimateFieldProvenance;
  historicalTemperature: ClimateFieldProvenance;
  historicalPrecipitation: ClimateFieldProvenance;
  riverDischarge: ClimateFieldProvenance;
  climateProjection: ClimateFieldProvenance;
}

export interface ClimateAndElevationData {
  // Canonical Domain Fields
  elevationMeters: number | null;               // Elevation above mean sea level in meters (Copernicus DEM 90m / Open-Elevation)
  slopeDegrees: number | null;                  // Terrain slope in degrees derived from 5-point DEM stencil
  slopePercent: number | null;                  // Terrain slope gradient in percentage
  slopeClassification: string | null;           // Classification: Datar (0–2°), Landai (2–5°), Miring (5–15°), Curam (>15°)
  localReliefMeters: number | null;             // Difference between site elevation and median surrounding elevation (~100m radius)
  localReliefType: string | null;               // Topographic relief type: Cekungan Lokal, Permukaan Rata, Punggung Lahan
  flowAccumulationPotential: string | null;     // Flow accumulation / convergence potential (Tinggi, Sedang, Rendah)
  forecastPeakTempC: number | null;             // Maximum daily temperature_2m_max across 7 forecast days
  forecastMeanMaxTempC: number | null;         // Mean daily temperature_2m_max across 7 forecast days
  historicalPeakTempC: number | null;           // Maximum daily temperature_2m_max over 2020-01-01 to 2024-12-31 (Open-Meteo ERA5-Seamless / NASA POWER)
  historicalMaxDailyPrecipitationMm: number | null; // Maximum daily precipitation_sum over 2020-01-01 to 2024-12-31 (ERA5 / NASA POWER)
  maxDailyPrecipitationMm: number | null;       // Alias for historicalMaxDailyPrecipitationMm
  recent24hPrecipitationMm: number | null;      // Actual recent 24h precipitation from forecast day 0 (today)
  meanRiverDischargeM3s: number | null;         // Mean of returned 14 daily river_discharge values (GloFAS ~5km grid cell)
  projectedMeanTempChange2046_2049C: number | null; // Mean modeled daily temperature change for 2046–2049 relative to CMIP6 MRI-AGCM3-2-S 2020–2024 model baseline

  // Rich Numerical Meteorological & Hydrological Feature Vector
  apparentTempMax7d: number | null;
  apparentTempMean7d: number | null;
  tempMean7d: number | null;
  totalPrecipitation7d: number | null;
  hotDaysCount7d: number | null;                // Count of forecast days with max temp >= 35°C
  heavyRainDaysCount7d: number | null;          // Count of forecast days with precipitation >= 50mm
  maxWindSpeedKmh: number | null;
  maxWindGustKmh: number | null;
  dominantWindDirectionDeg: number | null;
  shortwaveRadiationSumMj: number | null;
  sunshineDurationHours: number | null;
  et0FaoMm: number | null;                      // Daily reference evapotranspiration FAO-56 Penman-Monteith
  glofasDischargeMaxM3s: number | null;
  glofasDischargeMinM3s: number | null;
  glofasDischargeMedianM3s: number | null;
  glofasP25M3s: number | null;
  glofasP75M3s: number | null;

  // Backward-Compatible Aliases for existing callers
  projectedMeanTempChange2046_2050C: number | null;
  projectedTempChange2050C: number | null;
  projectedTempRise2050C: number | null;
  avgMaxTempC: number | null;
  max24hRainfallMm: number | null;
  riverDischargeM3s: number | null;

  usedFallbackProvider: boolean;
  elevationSource?: string;
  climateSource?: string;
  auditTrail?: ClimateAuditTrail;
}

export class OpenMeteoClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 6000;

  /**
   * Fetch Digital Elevation Model (DEM), numerical weather forecast, GloFAS river discharge,
   * ERA5-Seamless historical reanalysis, and CMIP6 climate model projections directly from Open-Meteo live APIs.
   * With automatic fallback to Open-Elevation (DEM) and NASA POWER (MERRA-2 reanalysis).
   */
  public static async fetchMetrics(
    coords: Coordinates,
    options?: { depth?: AssessmentDepth }
  ): Promise<ApiResult<ClimateAndElevationData>> {
    const isDeep = options?.depth === 'deep';
    const cacheKey = `meteo_${isDeep ? 'deep' : 'screen'}_v13_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    const cached = LocalApiCache.get<ApiResult<ClimateAndElevationData>>(cacheKey);
    if (cached) return cached;

    const lat = coords.lat.toFixed(4);
    const lng = coords.lng.toFixed(4);

    let elevation: number | null = null;
    let forecastPeakTemp: number | null = null;
    let forecastMeanMaxTemp: number | null = null;
    let historicalPeakTemp: number | null = null;
    let maxDailyRain: number | null = null;
    let recent24hRain: number | null = null;
    let meanDischarge: number | null = null;
    let projectedDelta: number | null = null;

    // Expanded Feature Variables
    let apparentTempMax7d: number | null = null;
    let apparentTempMean7d: number | null = null;
    let tempMean7d: number | null = null;
    let totalPrecipitation7d: number | null = null;
    let hotDaysCount7d: number | null = null;
    let heavyRainDaysCount7d: number | null = null;
    let maxWindSpeedKmh: number | null = null;
    let maxWindGustKmh: number | null = null;
    let dominantWindDirectionDeg: number | null = null;
    let shortwaveRadiationSumMj: number | null = null;
    let sunshineDurationHours: number | null = null;
    let et0FaoMm: number | null = null;

    let glofasDischargeMaxM3s: number | null = null;
    let glofasDischargeMinM3s: number | null = null;
    let glofasDischargeMedianM3s: number | null = null;
    let glofasP25M3s: number | null = null;
    let glofasP75M3s: number | null = null;

    const audit: ClimateAuditTrail = {
      elevation: {
        provider: 'none',
        dataset: 'Copernicus DEM 90m',
        endpoint: 'https://api.open-meteo.com/v1/elevation',
        spatialResolution: '~90m',
        status: 'unavailable'
      },
      forecastTemperature: {
        provider: 'none',
        dataset: 'Open-Meteo Numerical Weather Forecast',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        aggregation: 'maximum_of_7_daily_temperature_2m_max',
        period: '7-day forecast window',
        status: 'unavailable'
      },
      historicalTemperature: {
        provider: 'none',
        dataset: 'Open-Meteo ERA5-Seamless reanalysis product',
        endpoint: 'https://archive-api.open-meteo.com/v1/archive',
        model: 'era5_seamless',
        aggregation: 'maximum_of_daily_temperature_2m_max',
        period: '2020-01-01 to 2024-12-31',
        status: 'unavailable'
      },
      historicalPrecipitation: {
        provider: 'none',
        dataset: 'Open-Meteo ERA5-Seamless reanalysis product',
        endpoint: 'https://archive-api.open-meteo.com/v1/archive',
        model: 'era5_seamless',
        aggregation: 'maximum_of_daily_precipitation_sum',
        period: '2020-01-01 to 2024-12-31',
        status: 'unavailable'
      },
      riverDischarge: {
        provider: 'none',
        dataset: 'Copernicus GloFAS River Discharge',
        endpoint: 'https://flood-api.open-meteo.com/v1/flood',
        spatialResolution: '~5km grid cell',
        aggregation: 'mean_of_returned_14_daily_discharge_values',
        period: 'Past 14 days',
        notes: 'Model-derived discharge on ~5km grid cell, not instantaneous or peak discharge',
        status: 'unavailable'
      },
      climateProjection: {
        provider: 'none',
        dataset: 'CMIP6 Climate Projections',
        endpoint: 'https://climate-api.open-meteo.com/v1/climate',
        model: 'MRI-AGCM3-2-S',
        aggregation: 'delta_between_2046_2049_mean_and_2020_2024_model_baseline',
        period: 'Model Baseline: 2020-2024 vs Future: 2046-2049 (Full Calendar Years)',
        notes: 'MRI-AGCM3-2-S single-model CMIP6/HighResMIP projection. Baseline is modeled climate data, not observed ERA5 measurements.',
        status: 'unavailable'
      }
    };

    // Helper for safe fetch with strict AbortController timeout and finally cleanup
    const safeFetchJson = async (url: string): Promise<{ data: any; error?: string }> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': this.USER_AGENT },
          signal: controller.signal
        });

        if (!res.ok) {
          return { data: null, error: `HTTP ${res.status} (${res.statusText})` };
        }

        const json = await res.json();
        return { data: json };
      } catch (err: any) {
        return { data: null, error: err.name === 'AbortError' ? 'Request timed out (6000ms)' : (err.message || 'Network error') };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // 1. Concurrent API calls to Open-Meteo endpoints
    const latN = (coords.lat + 0.001).toFixed(4);
    const latS = (coords.lat - 0.001).toFixed(4);
    const lngE = (coords.lng + 0.001).toFixed(4);
    const lngW = (coords.lng - 0.001).toFixed(4);
    const elevUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat},${latN},${latS},${lat},${lat}&longitude=${lng},${lng},${lng},${lngE},${lngW}`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_max,apparent_temperature_min,apparent_temperature_mean,precipitation_sum,rain_sum,showers_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,sunshine_duration,et0_fao_evapotranspiration&timezone=auto&forecast_days=7`;
    const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_mean,river_discharge_max,river_discharge_min,river_discharge_median,p25,p75&past_days=14`;
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=2020-01-01&end_date=2024-12-31&daily=temperature_2m_max,precipitation_sum&timezone=auto&models=era5_seamless`;
    const climateUrl = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&models=MRI_AGCM3_2_S&start_date=2020-01-01&end_date=2050-01-01&daily=temperature_2m_mean`;

    const [elevRes, weatherRes, floodRes, archiveRes, climateRes] = await Promise.all([
      safeFetchJson(elevUrl),
      safeFetchJson(weatherUrl),
      isDeep ? safeFetchJson(floodUrl) : Promise.resolve<{ data: any; error?: string }>({ data: null }),
      safeFetchJson(archiveUrl),
      safeFetchJson(climateUrl)
    ]);


    let slopeDegrees: number | null = null;
    let slopePercent: number | null = null;
    let slopeClassification: string | null = null;
    let localReliefMeters: number | null = null;
    let localReliefType: string | null = null;
    let flowAccumulationPotential: string | null = null;

    // Parse Elevation (Copernicus DEM 90m) & Topographic Derivatives
    if (elevRes.data && Array.isArray(elevRes.data.elevation) && elevRes.data.elevation.length > 0) {
      const elevs = elevRes.data.elevation;
      const zC = elevs[0];
      if (typeof zC === 'number' && isFinite(zC)) {
        elevation = Math.round(zC);
        audit.elevation.provider = 'Open-Meteo';
        audit.elevation.status = 'live_api';

        if (elevs.length >= 5) {
          const zN = elevs[1];
          const zS = elevs[2];
          const zE = elevs[3];
          const zW = elevs[4];

          if (typeof zN === 'number' && typeof zS === 'number' && typeof zE === 'number' && typeof zW === 'number' &&
              isFinite(zN) && isFinite(zS) && isFinite(zE) && isFinite(zW)) {
            const latRad = (coords.lat * Math.PI) / 180;
            const dy = 2 * 0.001 * 110574;
            const dx = 2 * 0.001 * 111320 * Math.cos(latRad);

            const dzdx = (zE - zW) / (dx || 1);
            const dzdy = (zN - zS) / (dy || 1);
            const gradient = Math.sqrt(dzdx * dzdx + dzdy * dzdy);

            const deg = (Math.atan(gradient) * 180) / Math.PI;
            slopeDegrees = +(deg.toFixed(1));
            slopePercent = +( (gradient * 100).toFixed(1) );

            if (slopeDegrees <= 2.0) slopeClassification = 'Datar (0–2°)';
            else if (slopeDegrees <= 5.0) slopeClassification = 'Landai (2–5°)';
            else if (slopeDegrees <= 15.0) slopeClassification = 'Miring (5–15°)';
            else slopeClassification = 'Curam (>15°)';

            const surroundingElevs = [zN, zS, zE, zW].sort((a, b) => a - b);
            const medianSurrounding = (surroundingElevs[1] + surroundingElevs[2]) / 2;
            localReliefMeters = +( (zC - medianSurrounding).toFixed(1) );

            if (localReliefMeters <= -0.5) {
              localReliefType = 'Cekungan Lokal';
              flowAccumulationPotential = slopeDegrees <= 2.5 ? 'Tinggi (Zona Cekungan / Konvergensi Aliran)' : 'Sedang (Limpasan Terkonsentrasi)';
            } else if (localReliefMeters >= 0.5) {
              localReliefType = 'Punggung Lahan / Ketinggian Relatif';
              flowAccumulationPotential = 'Rendah (Zona Divergen / Pelepasan Bebas)';
            } else {
              localReliefType = 'Permukaan Rata / Netral';
              flowAccumulationPotential = slopeDegrees <= 2.0 ? 'Sedang (Potensi Genangan Rata)' : 'Rendah (Limpasan Standar)';
            }
          }
        }
      } else {
        audit.elevation.error = 'Elevation value was not a finite number';
      }
    } else {
      audit.elevation.error = elevRes.error || 'Empty elevation response';
    }

    // Parse Forecast Weather Parameters
    if (weatherRes.data && weatherRes.data.daily) {
      const daily = weatherRes.data.daily;

      // 1. Peak & Mean Daily Max Temperatures
      if (Array.isArray(daily.temperature_2m_max)) {
        const temps: number[] = daily.temperature_2m_max.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (temps.length > 0) {
          forecastPeakTemp = +Math.max(...temps).toFixed(1);
          forecastMeanMaxTemp = +(temps.reduce((s, v) => s + v, 0) / temps.length).toFixed(1);
          hotDaysCount7d = temps.filter((t) => t >= 35).length;
          audit.forecastTemperature.provider = 'Open-Meteo';
          audit.forecastTemperature.status = 'live_api';
        }
      }

      if (Array.isArray(daily.temperature_2m_mean)) {
        const means: number[] = daily.temperature_2m_mean.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (means.length > 0) {
          tempMean7d = +(means.reduce((s, v) => s + v, 0) / means.length).toFixed(1);
        }
      }

      // 2. Apparent (Heat-Index) Temperatures
      if (Array.isArray(daily.apparent_temperature_max)) {
        const appTemps: number[] = daily.apparent_temperature_max.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (appTemps.length > 0) {
          apparentTempMax7d = +Math.max(...appTemps).toFixed(1);
        }
      }

      if (Array.isArray(daily.apparent_temperature_mean)) {
        const appMeans: number[] = daily.apparent_temperature_mean.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (appMeans.length > 0) {
          apparentTempMean7d = +(appMeans.reduce((s, v) => s + v, 0) / appMeans.length).toFixed(1);
        }
      }

      // 3. Precipitation components
      if (Array.isArray(daily.precipitation_sum)) {
        const rains: number[] = daily.precipitation_sum.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (rains.length > 0) {
          recent24hRain = rains[0] !== undefined ? rains[0] : null;
          totalPrecipitation7d = +rains.reduce((s, v) => s + v, 0).toFixed(1);
          heavyRainDaysCount7d = rains.filter((r) => r >= 50).length;
        }
      }

      // 4. Wind Dynamics
      if (Array.isArray(daily.wind_speed_10m_max)) {
        const speeds: number[] = daily.wind_speed_10m_max.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (speeds.length > 0) maxWindSpeedKmh = +Math.max(...speeds).toFixed(1);
      }
      if (Array.isArray(daily.wind_gusts_10m_max)) {
        const gusts: number[] = daily.wind_gusts_10m_max.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (gusts.length > 0) maxWindGustKmh = +Math.max(...gusts).toFixed(1);
      }
      if (Array.isArray(daily.wind_direction_10m_dominant)) {
        const dirs: number[] = daily.wind_direction_10m_dominant.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (dirs.length > 0) dominantWindDirectionDeg = Math.round(dirs[0]);
      }

      // 5. Radiation & Evapotranspiration
      if (Array.isArray(daily.shortwave_radiation_sum)) {
        const rads: number[] = daily.shortwave_radiation_sum.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (rads.length > 0) shortwaveRadiationSumMj = +rads.reduce((s, v) => s + v, 0).toFixed(2);
      }
      if (Array.isArray(daily.sunshine_duration)) {
        const suns: number[] = daily.sunshine_duration.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (suns.length > 0) sunshineDurationHours = +(suns.reduce((s, v) => s + v, 0) / 3600).toFixed(1);
      }
      if (Array.isArray(daily.et0_fao_evapotranspiration)) {
        const ets: number[] = daily.et0_fao_evapotranspiration.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (ets.length > 0) et0FaoMm = +(ets.reduce((s, v) => s + v, 0) / ets.length).toFixed(2);
      }
    } else {
      audit.forecastTemperature.error = weatherRes.error || 'Empty forecast response';
    }

    // Parse GloFAS River Discharge
    if (floodRes.data && floodRes.data.daily && Array.isArray(floodRes.data.daily.river_discharge)) {
      const rawDischarges: number[] = floodRes.data.daily.river_discharge.filter(
        (v: any) => typeof v === 'number' && isFinite(v) && v >= 0
      );
      if (rawDischarges.length > 0) {
        meanDischarge = +(rawDischarges.reduce((s, v) => s + v, 0) / rawDischarges.length).toFixed(2);
        glofasDischargeMaxM3s = +Math.max(...rawDischarges).toFixed(2);
        glofasDischargeMinM3s = +Math.min(...rawDischarges).toFixed(2);

        const sorted = [...rawDischarges].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        glofasDischargeMedianM3s = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
        glofasP25M3s = sorted[Math.floor(sorted.length * 0.25)] ?? null;
        glofasP75M3s = sorted[Math.floor(sorted.length * 0.75)] ?? null;

        audit.riverDischarge.provider = 'Open-Meteo';
        audit.riverDischarge.recordsReturned = rawDischarges.length;
        audit.riverDischarge.validRecords = rawDischarges.length;
        audit.riverDischarge.status = 'live_api';
      } else {
        audit.riverDischarge.error = 'No non-negative finite river discharge values returned';
      }
    } else {
      audit.riverDischarge.error = floodRes.error || 'Empty flood response';
    }

    // Parse ERA5-Seamless Historical Reanalysis
    if (archiveRes.data && archiveRes.data.daily) {
      if (Array.isArray(archiveRes.data.daily.temperature_2m_max)) {
        const temps: number[] = archiveRes.data.daily.temperature_2m_max.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (temps.length > 0) {
          historicalPeakTemp = +Math.max(...temps).toFixed(1);
          audit.historicalTemperature.provider = 'Open-Meteo';
          audit.historicalTemperature.recordsReturned = temps.length;
          audit.historicalTemperature.status = 'live_api';
        } else {
          audit.historicalTemperature.error = 'No finite historical temperature records';
        }
      }

      if (Array.isArray(archiveRes.data.daily.precipitation_sum)) {
        const rains: number[] = archiveRes.data.daily.precipitation_sum.filter((v: any) => typeof v === 'number' && isFinite(v));
        if (rains.length > 0) {
          maxDailyRain = +Math.max(...rains).toFixed(1);
          audit.historicalPrecipitation.provider = 'Open-Meteo';
          audit.historicalPrecipitation.recordsReturned = rains.length;
          audit.historicalPrecipitation.status = 'live_api';
        } else {
          audit.historicalPrecipitation.error = 'No finite historical precipitation records';
        }
      }
    } else {
      audit.historicalTemperature.error = archiveRes.error || 'Empty archive response';
      audit.historicalPrecipitation.error = archiveRes.error || 'Empty archive response';
    }

    // Parse CMIP6 Climate Model Projection
    if (
      climateRes.data &&
      climateRes.data.daily &&
      Array.isArray(climateRes.data.daily.time) &&
      Array.isArray(climateRes.data.daily.temperature_2m_mean)
    ) {
      const times: string[] = climateRes.data.daily.time;
      const temps: (number | null)[] = climateRes.data.daily.temperature_2m_mean;

      const baselineTemps: number[] = [];
      const futureTemps: number[] = [];

      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const val = temps[i];
        if (typeof val === 'number' && isFinite(val) && t) {
          const year = parseInt(t.substring(0, 4), 10);
          if (year >= 2020 && year <= 2024) baselineTemps.push(val);
          else if (year >= 2046 && year <= 2049) futureTemps.push(val);
        }
      }

      audit.climateProjection.baselineRecords = baselineTemps.length;
      audit.climateProjection.futureRecords = futureTemps.length;

      const expectedBaselineMin = 365 * 5 * 0.8;
      const expectedFutureMin = 365 * 4 * 0.8;

      if (baselineTemps.length >= expectedBaselineMin && futureTemps.length >= expectedFutureMin) {
        const baselineMean = baselineTemps.reduce((s, v) => s + v, 0) / baselineTemps.length;
        const futureMean = futureTemps.reduce((s, v) => s + v, 0) / futureTemps.length;
        const delta = futureMean - baselineMean;
        if (isFinite(delta)) {
          projectedDelta = +delta.toFixed(2);
          audit.climateProjection.provider = 'Open-Meteo';
          audit.climateProjection.status = 'live_api';
        } else {
          audit.climateProjection.error = 'Calculated delta was not finite';
        }
      } else {
        audit.climateProjection.error = `Insufficient valid CMIP6 daily records (Baseline: ${baselineTemps.length}/${expectedBaselineMin}, Future: ${futureTemps.length}/${expectedFutureMin})`;
      }
    } else {
      audit.climateProjection.error = climateRes.error || 'Empty climate response';
    }

    // 2. Secondary Fallback Handling for DEM (Open-Elevation) & ERA5 (NASA POWER)
    let usedFallback = false;

    if (elevation === null) {
      try {
        const elevResult = await OpenElevationClient.fetchElevation(coords);
        if (elevResult.data && elevResult.data.elevationMeters !== null) {
          elevation = Math.round(elevResult.data.elevationMeters);
          if (slopeDegrees === null && elevResult.data.slopeDegrees !== undefined) slopeDegrees = elevResult.data.slopeDegrees;
          if (slopePercent === null && elevResult.data.slopePercent !== undefined) slopePercent = elevResult.data.slopePercent;
          if (slopeClassification === null && elevResult.data.slopeClassification !== undefined) slopeClassification = elevResult.data.slopeClassification;
          if (localReliefMeters === null && elevResult.data.localReliefMeters !== undefined) localReliefMeters = elevResult.data.localReliefMeters;
          if (localReliefType === null && elevResult.data.localReliefType !== undefined) localReliefType = elevResult.data.localReliefType;
          if (flowAccumulationPotential === null && elevResult.data.flowAccumulationPotential !== undefined) flowAccumulationPotential = elevResult.data.flowAccumulationPotential;
          usedFallback = true;
          audit.elevation.provider = 'Open-Elevation';
          audit.elevation.dataset = 'Open-Elevation Global Public DEM API';
          audit.elevation.endpoint = 'https://api.open-elevation.com/api/v1/lookup';
          audit.elevation.status = 'fallback_provider';
        } else {
          audit.elevation.fallbackError = elevResult.reason || 'Open-Elevation lookup failed';
        }
      } catch (err: any) {
        audit.elevation.fallbackError = err.message || 'Open-Elevation request failed';
      }
    }

    if (historicalPeakTemp === null || maxDailyRain === null) {
      try {
        const nasaRes = await NasaPowerClient.fetchClimateMetrics(coords);
        if (nasaRes.data) {
          if (historicalPeakTemp === null && nasaRes.data.historicalPeakTempC !== null) {
            historicalPeakTemp = nasaRes.data.historicalPeakTempC;
            usedFallback = true;
            audit.historicalTemperature.provider = 'NASA POWER';
            audit.historicalTemperature.dataset = nasaRes.data.temperatureDataset || 'NASA POWER T2M_MAX (MERRA-2 derived)';
            audit.historicalTemperature.endpoint = 'https://power.larc.nasa.gov/api/temporal/daily/point';
            audit.historicalTemperature.aggregation = 'calendar_year_2023_daily_maximum_temperature';
            audit.historicalTemperature.period = nasaRes.data.period || '2023-01-01 to 2023-12-31';
            audit.historicalTemperature.recordsReturned = nasaRes.data.temperatureValidDaysCount;
            audit.historicalTemperature.validRecords = nasaRes.data.temperatureValidDaysCount;
            audit.historicalTemperature.notes = 'NASA POWER fallback represents calendar year 2023 peak daily maximum temperature (MERRA-2 reanalysis), not multi-year ERA5 archive.';
            audit.historicalTemperature.status = 'fallback_provider';
          }
          if (forecastMeanMaxTemp === null && nasaRes.data.avgMaxTempC !== null) {
            forecastMeanMaxTemp = nasaRes.data.avgMaxTempC;
          }
          if (maxDailyRain === null && nasaRes.data.maxDailyPrecipitationMm !== null) {
            maxDailyRain = nasaRes.data.maxDailyPrecipitationMm;
            usedFallback = true;
            audit.historicalPrecipitation.provider = 'NASA POWER';
            audit.historicalPrecipitation.dataset = 'NASA POWER / MERRA-2 Daily Meteorological Archives';
            audit.historicalPrecipitation.endpoint = 'https://power.larc.nasa.gov/api/temporal/daily/point';
            audit.historicalPrecipitation.aggregation = 'maximum_daily_precipitation';
            audit.historicalPrecipitation.period = '2023 full calendar year';
            audit.historicalPrecipitation.status = 'fallback_provider';
          }
        } else {
          if (historicalPeakTemp === null) audit.historicalTemperature.fallbackError = nasaRes.reason;
          if (maxDailyRain === null) audit.historicalPrecipitation.fallbackError = nasaRes.reason;
        }
      } catch (err: any) {
        const fallbackMsg = err.message || 'NASA POWER request failed';
        if (historicalPeakTemp === null) audit.historicalTemperature.fallbackError = fallbackMsg;
        if (maxDailyRain === null) audit.historicalPrecipitation.fallbackError = fallbackMsg;
      }
    }

    const hasAnySuccess = Boolean(
      elevation !== null ||
      forecastPeakTemp !== null ||
      historicalPeakTemp !== null ||
      maxDailyRain !== null ||
      meanDischarge !== null
    );

    if (!hasAnySuccess) {
      const fallbackResult: ApiResult<ClimateAndElevationData> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: 'All meteorological & DEM providers unreachable or returned invalid data',
        sourceName: 'Open-Meteo / NASA POWER'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 300);
      return fallbackResult;
    }

    const elevationSource = audit.elevation.status !== 'unavailable'
      ? `${audit.elevation.provider} (${audit.elevation.dataset})`
      : 'Data elevasi tidak tersedia';

    const climateProviders = new Set<string>();
    if (audit.forecastTemperature.status !== 'unavailable') climateProviders.add(audit.forecastTemperature.provider);
    if (audit.historicalTemperature.status !== 'unavailable') climateProviders.add(audit.historicalTemperature.provider);
    if (audit.historicalPrecipitation.status !== 'unavailable') climateProviders.add(audit.historicalPrecipitation.provider);
    if (audit.riverDischarge.status !== 'unavailable') climateProviders.add(`${audit.riverDischarge.provider} (GloFAS)`);
    if (audit.climateProjection.status !== 'unavailable') climateProviders.add(`${audit.climateProjection.provider} (CMIP6 MRI-AGCM3-2-S)`);

    const climateSource = climateProviders.size > 0
      ? Array.from(climateProviders).join(' & ')
      : 'Data iklim tidak tersedia';

    const payload: ClimateAndElevationData = {
      elevationMeters: elevation,
      slopeDegrees,
      slopePercent,
      slopeClassification,
      localReliefMeters,
      localReliefType,
      flowAccumulationPotential,
      forecastPeakTempC: forecastPeakTemp,
      forecastMeanMaxTempC: forecastMeanMaxTemp,
      historicalPeakTempC: historicalPeakTemp,
      historicalMaxDailyPrecipitationMm: maxDailyRain,
      maxDailyPrecipitationMm: maxDailyRain,
      recent24hPrecipitationMm: recent24hRain,
      meanRiverDischargeM3s: meanDischarge,
      projectedMeanTempChange2046_2049C: projectedDelta,

      apparentTempMax7d,
      apparentTempMean7d,
      tempMean7d,
      totalPrecipitation7d,
      hotDaysCount7d,
      heavyRainDaysCount7d,
      maxWindSpeedKmh,
      maxWindGustKmh,
      dominantWindDirectionDeg,
      shortwaveRadiationSumMj,
      sunshineDurationHours,
      et0FaoMm,
      glofasDischargeMaxM3s,
      glofasDischargeMinM3s,
      glofasDischargeMedianM3s,
      glofasP25M3s,
      glofasP75M3s,

      projectedMeanTempChange2046_2050C: projectedDelta,
      projectedTempChange2050C: projectedDelta,
      projectedTempRise2050C: projectedDelta,
      avgMaxTempC: forecastMeanMaxTemp,
      max24hRainfallMm: recent24hRain ?? maxDailyRain,
      riverDischargeM3s: meanDischarge,

      usedFallbackProvider: usedFallback,
      elevationSource,
      climateSource,
      auditTrail: audit
    };

    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    const allCoreFromOpenMeteo = (
      audit.elevation.status === 'live_api' &&
      audit.forecastTemperature.status === 'live_api' &&
      audit.historicalTemperature.status === 'live_api' &&
      audit.historicalPrecipitation.status === 'live_api'
    );

    const coreAvailableCount = [
      elevation !== null,
      forecastPeakTemp !== null,
      historicalPeakTemp !== null,
      maxDailyRain !== null
    ].filter(Boolean).length;

    if (allCoreFromOpenMeteo) {
      confidenceLevel = 'high';
    } else if (coreAvailableCount >= 3) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    const result: ApiResult<ClimateAndElevationData> = {
      data: payload,
      isFallback: coreAvailableCount === 0,
      confidenceLevel,
      sourceName: [elevationSource, climateSource].filter(s => !s.includes('tidak tersedia')).join(' · ') || 'Open-Meteo Live API'
    };

    LocalApiCache.set(cacheKey, result, 7200); // 2 hours TTL
    return result;
  }
}
