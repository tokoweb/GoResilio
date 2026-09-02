import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import { EmscSeismicClient } from './EmscSeismicClient';

export interface SeismicHistoryData {
  quakesCount50km: number | null;
  quakesCount100km: number | null;
  quakesCount150km: number | null;
  quakesCount250km: number | null;
  maxMagnitude: number | null;
  meanMagnitude: number | null;
  medianMagnitude: number | null;
  maxDepthKm: number | null;
  shallowQuakesCount: number | null; // Depth < 30 km within 150 km
  m4PlusCount: number | null;
  m5PlusCount: number | null;
  m6PlusCount: number | null;
  mostRecentEventDate: string | null;
  daysSinceMostRecentEvent: number | null;
  annualEventDensity: number | null; // Events per year within 150 km
  catalogProvider: string;
}

export class UsgsEarthquakeClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';

  /**
   * Query real USGS Earthquake Catalog (FDSN Event Web Service) for multi-radius historical counts and statistics.
   * Direct spatial query using geodesic maxradiuskm filter with orderby=magnitude.
   * With automatic fallback to EMSC / SeismicPortal Global FDSN.
   */
  public static async fetchSeismicHistory(coords: Coordinates): Promise<ApiResult<SeismicHistoryData>> {
    const cacheKey = `usgs_expanded_v2_${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}`;
    const cached = LocalApiCache.get<ApiResult<SeismicHistoryData>>(cacheKey);
    if (cached) return cached;

    const lat = coords.lat.toFixed(4);
    const lon = coords.lng.toFixed(4);

    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const startTime = tenYearsAgo.toISOString().split('T')[0];

    // 1. Primary: USGS FDSN Web Service (Query up to 250km to compute multi-radius metrics accurately)
    try {
      const queryUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=250&minmagnitude=4.0&starttime=${startTime}&limit=1000`;
      const count150Url = `https://earthquake.usgs.gov/fdsnws/event/1/count?latitude=${lat}&longitude=${lon}&maxradiuskm=150&minmagnitude=4.0&starttime=${startTime}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      const [queryRes, count150Res] = await Promise.all([
        fetch(queryUrl, {
          headers: { 'User-Agent': this.USER_AGENT },
          signal: controller.signal
        }).catch(() => null),
        fetch(count150Url, {
          headers: { 'User-Agent': this.USER_AGENT },
          signal: controller.signal
        }).catch(() => null)
      ]);
      clearTimeout(timeoutId);

      if (queryRes && queryRes.ok) {
        const geojson = await queryRes.json();
        const features = Array.isArray(geojson.features) ? geojson.features : [];

        // Haversine distance helper to categorize exact radius distance for each event
        const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
          const R = 6371; // km
          const dLat = (lat2 - lat1) * (Math.PI / 180);
          const dLon = (lon2 - lon1) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

interface UsgsGeoJsonFeature {
  geometry?: {
    coordinates?: [number, number, number?];
  };
  properties?: {
    mag?: number | null;
    time?: number | null;
    [key: string]: unknown;
  };
}

interface ParsedSeismicEvent {
  mag: number | null;
  depth: number | null;
  time: Date | null;
  distKm: number;
}

        const eventsWithDistance: ParsedSeismicEvent[] = (features as UsgsGeoJsonFeature[]).map((f) => {
          const geomLon = f.geometry?.coordinates?.[0];
          const geomLat = f.geometry?.coordinates?.[1];
          const depth = f.geometry?.coordinates?.[2] ?? null;
          const mag = typeof f.properties?.mag === 'number' && Number.isFinite(f.properties.mag) ? f.properties.mag : null;
          const time = typeof f.properties?.time === 'number' ? new Date(f.properties.time) : null;
          const distKm = geomLat !== undefined && geomLon !== undefined ? haversineKm(coords.lat, coords.lng, geomLat, geomLon) : 9999;
          return { mag, depth, time, distKm };
        });

        const events50km = eventsWithDistance.filter((e) => e.distKm <= 50);
        const events100km = eventsWithDistance.filter((e) => e.distKm <= 100);
        const events150km = eventsWithDistance.filter((e) => e.distKm <= 150);
        const events250km = eventsWithDistance.filter((e) => e.distKm <= 250);

        let count150 = events150km.length;
        if (count150Res && count150Res.ok) {
          const countText = await count150Res.text();
          const parsed = parseInt(countText.trim(), 10);
          if (!isNaN(parsed) && parsed > count150) {
            count150 = parsed;
          }
        }

        const mags150km = events150km.map((e) => e.mag).filter((m): m is number => m !== null);
        const depths150km = events150km.map((e) => e.depth).filter((d): d is number => d !== null);

        const maxMag = mags150km.length > 0 ? Math.max(...mags150km) : null;
        const meanMag = mags150km.length > 0 ? +(mags150km.reduce((s: number, v: number) => s + v, 0) / mags150km.length).toFixed(2) : null;
        
        // Median magnitude
        let medianMag: number | null = null;
        if (mags150km.length > 0) {
          const sorted = [...mags150km].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          medianMag = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
        }

        const maxDepth = depths150km.length > 0 ? Math.max(...depths150km) : null;
        const shallowCount = events150km.filter((e) => e.depth !== null && e.depth < 30).length;

        const m4Plus = events150km.filter((e) => e.mag !== null && e.mag >= 4.0 && e.mag < 5.0).length;
        const m5Plus = events150km.filter((e) => e.mag !== null && e.mag >= 5.0 && e.mag < 6.0).length;
        const m6Plus = events150km.filter((e) => e.mag !== null && e.mag >= 6.0).length;

        const validTimes150km = events150km.map((e) => e.time).filter((t): t is Date => t !== null);
        let mostRecentEventDate: string | null = null;
        let daysSinceMostRecentEvent: number | null = null;
        if (validTimes150km.length > 0) {
          const latest = new Date(Math.max(...validTimes150km.map((d: Date) => d.getTime())));
          mostRecentEventDate = latest.toISOString().split('T')[0];
          const diffMs = Date.now() - latest.getTime();
          daysSinceMostRecentEvent = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }

        const annualEventDensity = +(count150 / 10).toFixed(2);

        const payload: SeismicHistoryData = {
          quakesCount50km: events50km.length,
          quakesCount100km: events100km.length,
          quakesCount150km: count150,
          quakesCount250km: events250km.length,
          maxMagnitude: maxMag !== null ? +maxMag.toFixed(1) : null,
          meanMagnitude: meanMag,
          medianMagnitude: medianMag,
          maxDepthKm: maxDepth,
          shallowQuakesCount: shallowCount,
          m4PlusCount: m4Plus,
          m5PlusCount: m5Plus,
          m6PlusCount: m6Plus,
          mostRecentEventDate,
          daysSinceMostRecentEvent,
          annualEventDensity,
          catalogProvider: 'USGS Earthquake Hazards Program'
        };

        const result: ApiResult<SeismicHistoryData> = {
          data: payload,
          isFallback: false,
          confidenceLevel: 'high',
          sourceName: 'USGS Earthquake Hazards Program'
        };

        LocalApiCache.set(cacheKey, result, 86400); // 24h cache
        return result;
      }
    } catch {
      // Fallback to EMSC
    }

    // 2. Backup: EMSC / SeismicPortal Global FDSN
    try {
      const emscResult = await EmscSeismicClient.fetchSeismicHistory(coords);
      if (emscResult.data && !emscResult.isFallback) {
        const count = emscResult.data.quakesCount150km ?? 0;
        const payload: SeismicHistoryData = {
          quakesCount50km: null,
          quakesCount100km: emscResult.data.quakesCount100km ?? null,
          quakesCount150km: count,
          quakesCount250km: null,
          maxMagnitude: emscResult.data.maxMagnitude ?? null,
          meanMagnitude: null,
          medianMagnitude: null,
          maxDepthKm: null,
          shallowQuakesCount: null,
          m4PlusCount: count,
          m5PlusCount: null,
          m6PlusCount: null,
          mostRecentEventDate: null,
          daysSinceMostRecentEvent: null,
          annualEventDensity: +(count / 10).toFixed(2),
          catalogProvider: 'EMSC / SeismicPortal'
        };

        const result: ApiResult<SeismicHistoryData> = {
          data: payload,
          isFallback: true, // Fallback provider
          confidenceLevel: 'medium',
          sourceName: 'EMSC / SeismicPortal FDSN Services'
        };

        LocalApiCache.set(cacheKey, result, 86400);
        return result;
      }
    } catch {
      // Fallback
    }

    const fallbackResult: ApiResult<SeismicHistoryData> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: 'USGS and EMSC Seismic APIs unreachable',
      sourceName: 'USGS / EMSC Earthquake Catalog'
    };

    LocalApiCache.set(cacheKey, fallbackResult, 300);
    return fallbackResult;
  }
}
