import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import type { AirQualityData } from '../../domain/types/hazard.types';

export class OpenMeteoAirQualityClient {
  private static readonly ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  private static readonly TIMEOUT_MS = 6000;
  private static readonly CACHE_TTL_SECONDS = 3600; // 1 hour for air quality forecasts

  /**
   * Fetches real atmospheric quality and pollutant parameters from Open-Meteo Air Quality API.
   * Uses `current=` parameter for real-time pollutants and `hourly=` for deterministic 24h aggregates.
   * Does NOT fabricate synthetic AQI or set PM2.5 = 0 on failure.
   */
  public static async fetchAirQualityMetrics(coords: Coordinates): Promise<ApiResult<AirQualityData>> {
    const lat = coords.lat;
    const lng = coords.lng;
    const cacheKey = `openmeteo_aq_v2_${lat.toFixed(4)}_${lng.toFixed(4)}`;

    const cached = LocalApiCache.get<AirQualityData>(cacheKey);
    if (cached) {
      return {
        data: cached,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'Open-Meteo Air Quality'
      };
    }

    const currentVars = [
      'european_aqi',
      'us_aqi',
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'aerosol_optical_depth',
      'dust',
      'uv_index'
    ].join(',');

    const hourlyVars = [
      'pm10',
      'pm2_5',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'sulphur_dioxide',
      'ozone',
      'aerosol_optical_depth',
      'dust',
      'uv_index',
      'european_aqi',
      'us_aqi'
    ].join(',');

    const url = `${this.ENDPOINT}?latitude=${lat}&longitude=${lng}&current=${currentVars}&hourly=${hourlyVars}&timezone=auto`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: `openmeteo_aq_http_${response.status}`,
          sourceName: 'Open-Meteo Air Quality'
        };
      }

      const json = await response.json();
      if (!json || (!json.current && (!json.hourly || !Array.isArray(json.hourly.time)))) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: 'openmeteo_aq_empty_payload',
          sourceName: 'Open-Meteo Air Quality'
        };
      }

      const current = json.current || {};
      const hourly = json.hourly || {};
      const times: string[] = Array.isArray(hourly.time) ? hourly.time : [];

      // Extract first 24 hours of data for deterministic 24h aggregates
      const count24 = Math.min(24, times.length);
      const periodStart = times[0] || null;
      const periodEnd = times[count24 - 1] || null;

      const get24hSlice = (arr?: (number | null)[]): number[] => {
        if (!Array.isArray(arr)) return [];
        return arr.slice(0, count24).filter((v): v is number => typeof v === 'number' && !isNaN(v) && v !== null);
      };

      const pm25Values = get24hSlice(hourly.pm2_5);
      const pm10Values = get24hSlice(hourly.pm10);
      const o3Values = get24hSlice(hourly.ozone);
      const no2Values = get24hSlice(hourly.nitrogen_dioxide);
      const aqiValues = get24hSlice(hourly.european_aqi);
      const uvValues = get24hSlice(hourly.uv_index);

      const calcMax = (vals: number[]): number | null => (vals.length > 0 ? Math.max(...vals) : null);
      const calcMean = (vals: number[]): number | null => {
        if (vals.length === 0) return null;
        const sum = vals.reduce((a, b) => a + b, 0);
        return Number((sum / vals.length).toFixed(1));
      };

      const parseNumber = (v: any): number | null => {
        if (typeof v === 'number' && !isNaN(v) && isFinite(v)) return v;
        return null;
      };

      const aqData: AirQualityData = {
        // True current API fields (from `current=` parameter)
        currentPm25: parseNumber(current.pm2_5),
        currentPm10: parseNumber(current.pm10),
        currentO3: parseNumber(current.ozone),
        currentNo2: parseNumber(current.nitrogen_dioxide),
        currentSo2: parseNumber(current.sulphur_dioxide),
        currentCo: parseNumber(current.carbon_monoxide),
        currentAod: parseNumber(current.aerosol_optical_depth),
        currentUvIndex: parseNumber(current.uv_index),
        currentEuropeanAqi: parseNumber(current.european_aqi),
        currentUsAqi: parseNumber(current.us_aqi),
        currentDust: parseNumber(current.dust),

        // Deterministic 24h aggregations from hourly vectors
        maxPm25_24h: calcMax(pm25Values),
        meanPm25_24h: calcMean(pm25Values),
        maxPm10_24h: calcMax(pm10Values),
        meanPm10_24h: calcMean(pm10Values),
        maxO3_24h: calcMax(o3Values),
        maxNo2_24h: calcMax(no2Values),
        maxEuropeanAqi_24h: calcMax(aqiValues),
        maxUvIndex_24h: calcMax(uvValues),

        periodStart,
        periodEnd,
        sourceValidTime: typeof current.time === 'string' ? current.time : null,
        model: 'CAMS European Model',
        spatialResolution: '~11km grid cell',
        source: 'Open-Meteo Air Quality',
        endpoint: url,
        isAvailable: true
      };

      LocalApiCache.set(cacheKey, aqData, this.CACHE_TTL_SECONDS);

      return {
        data: aqData,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'Open-Meteo Air Quality'
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: isTimeout ? 'openmeteo_aq_timeout' : (err?.message || 'openmeteo_aq_fetch_failed'),
        sourceName: 'Open-Meteo Air Quality'
      };
    }
  }
}
