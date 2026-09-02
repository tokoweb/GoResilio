import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface NasaPowerMetrics {
  avgMaxTempC: number | null;               // Mean of daily T2M_MAX over 2023-01-01 to 2023-12-31 (yearly average, NOT a 7-day forecast peak)
  historicalPeakTempC: number | null;       // Maximum daily T2M_MAX recorded during calendar year 2023 (2023 annual record, NOT an all-time historical extreme)
  maxDailyPrecipitationMm: number | null;   // Maximum daily precipitation (PRECTOTCORR) recorded during calendar year 2023
  max24hRainfallMm: number | null;          // Backward-compatible alias for maxDailyPrecipitationMm

  period?: string;                          // Explicit temporal scope (2023-01-01 to 2023-12-31)
  temperatureDataset?: string;              // Dataset name for 2-meter air temperature
  precipitationDataset?: string;            // Dataset name for precipitation
  temperatureValidDaysCount?: number;       // Number of valid daily temperature records processed
  precipitationValidDaysCount?: number;     // Number of valid daily precipitation records processed
  validDaysCount?: number;                  // Backward-compatible legacy alias for temperatureValidDaysCount
}

/**
 * NASA POWER (Prediction of Worldwide Energy Resources) API Client
 * Secondary fallback global meteorological dataset provided by NASA Langley Research Center.
 * 
 * Official Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 * Endpoint: https://power.larc.nasa.gov/api/temporal/daily/point
 */
export class NasaPowerClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 8000;
  private static readonly MIN_VALID_DAYS = 350; // Strict full calendar year completeness threshold (>=350/365 days)

  public static async fetchClimateMetrics(coords: Coordinates): Promise<ApiResult<NasaPowerMetrics>> {
    const lat = coords.lat.toFixed(4);
    const lng = coords.lng.toFixed(4);
    const cacheKey = `nasa_power_v4_${lat}_${lng}`;
    const cached = LocalApiCache.get<ApiResult<NasaPowerMetrics>>(cacheKey);
    if (cached) return cached;

    let failureReason = 'NASA POWER API unreachable';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      // Query 1 full calendar year of daily parameters (T2M_MAX: 2m Max Temperature, PRECTOTCORR: Precipitation Corrected)
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,PRECTOTCORR&community=RE&longitude=${lng}&latitude=${lat}&start=20230101&end=20231231&format=JSON`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (!res.ok) {
        failureReason = `NASA POWER returned HTTP ${res.status} (${res.statusText})`;
      } else {
        const json = await res.json();
        const param = json?.properties?.parameter;

        if (param && param.T2M_MAX && param.PRECTOTCORR) {
          const t2mMaxObj = param.T2M_MAX;
          const precObj = param.PRECTOTCORR;

          // Reject NASA missing fill values (-999, -99) without arbitrary application temperature bounds
          const temps: number[] = Object.values(t2mMaxObj).filter(
            (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > -900
          );

          // Precipitation must be non-negative finite number (rejecting negative fill values)
          const rains: number[] = Object.values(precObj).filter(
            (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
          );

          if (temps.length >= this.MIN_VALID_DAYS && rains.length >= this.MIN_VALID_DAYS) {
            const avgMaxTemp = +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const peakTemp = +Math.max(...temps).toFixed(1);
            const maxRain = +Math.max(...rains).toFixed(0);

            const payload: NasaPowerMetrics = {
              avgMaxTempC: avgMaxTemp,
              historicalPeakTempC: peakTemp,
              maxDailyPrecipitationMm: maxRain,
              max24hRainfallMm: maxRain,
              period: '2023-01-01 to 2023-12-31',
              temperatureDataset: 'NASA POWER T2M_MAX (MERRA-2 derived)',
              precipitationDataset: 'NASA POWER PRECTOTCORR (Precipitation Corrected Total)',
              temperatureValidDaysCount: temps.length,
              precipitationValidDaysCount: rains.length,
              validDaysCount: temps.length
            };

            const result: ApiResult<NasaPowerMetrics> = {
              data: payload,
              isFallback: false,
              confidenceLevel: 'medium', // Calibrated honest confidence for secondary 1-year fallback dataset
              sourceName: 'NASA POWER'
            };

            LocalApiCache.set(cacheKey, result, 86400 * 3); // 3 days cache
            return result;
          } else {
            failureReason = `NASA POWER returned insufficient valid daily records (Required: >=${this.MIN_VALID_DAYS}, Found: Temps=${temps.length}, Rains=${rains.length})`;
          }
        } else {
          failureReason = 'NASA POWER response missing required T2M_MAX or PRECTOTCORR parameters';
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        failureReason = `NASA POWER request timed out (${this.TIMEOUT_MS}ms)`;
      } else {
        failureReason = err instanceof Error ? err.message : 'Network error occurred while querying NASA POWER';
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const fallbackResult: ApiResult<NasaPowerMetrics> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: failureReason,
      sourceName: 'NASA POWER'
    };

    // Cache transient failure briefly (5 minutes)
    LocalApiCache.set(cacheKey, fallbackResult, 300);
    return fallbackResult;
  }
}
