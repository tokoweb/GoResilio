import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface EmscSeismicData {
  eventCount: number;                              // EXACT geodesically verified earthquake count within 150 km (M >= 4.0)
  radiusKm: number;                                // Exact geodesic filter radius in km (150 km)
  minMagnitude: number;                            // 4.0
  maxMagnitude: number | null;                     // Peak magnitude recorded in the 10-year period within 150 km
  periodStart: string;                             // 10 years ago ISO date (YYYY-MM-DD)
  periodEnd: string;                               // Present ISO date (YYYY-MM-DD)
  provider: string;                                // 'EMSC / SeismicPortal'

  // Backward-compatible aliases for callers
  quakesCount150km: number;
  quakesCount100km?: number;                       // Geodesically verified count within 100 km (distinct from 150 km)

  // Granular provenance & catalog audit metadata
  rawFeaturesReturned: number;                     // Total candidate features aggregated across all pages
  validGeospatialFeaturesProcessed: number;        // Valid features with finite coordinates
  candidateAngularEventCount?: number | null;      // EMSC /count result for 1.5° angular retrieval circle (candidate pool, NOT final 150km count)
  candidateRadiusDegrees: number;                  // 1.5 degrees
  isTruncated: boolean;
  countCompleteness: 'complete' | 'truncated';
  paginationComplete: boolean;
  partialDataReason?: string;
  distanceFilterMethod: string;
  pagination: {
    pageSize: number;
    pagesFetched: number;
    totalFeaturesFetched: number;
  };
  queryUrl: string;
  countEndpointUrl?: string;
  countSource?: string;
}

/**
 * EMSC (European-Mediterranean Seismological Centre) / SeismicPortal Client
 * Secondary fallback global earthquake catalog using standard FDSN web services with complete pagination.
 * 
 * Official Documentation: https://www.seismicportal.eu/fdsnws/event/1/
 * Endpoints:
 * - Count: https://www.seismicportal.eu/fdsnws/event/1/count
 * - Query: https://www.seismicportal.eu/fdsnws/event/1/query
 */
export class EmscSeismicClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 8000;
  private static readonly PAGE_SIZE = 20000;
  private static readonly MAX_PAGES = 5; // Safety cap (up to 100,000 candidate events)

  /**
   * Geodesic Haversine formula to accurately filter FDSN angular degree results to true metric distance in meters.
   */
  private static calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth mean radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public static async fetchSeismicHistory(coords: Coordinates): Promise<ApiResult<EmscSeismicData>> {
    const latStr = coords.lat.toFixed(4);
    const lngStr = coords.lng.toFixed(4);

    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const startTime = tenYearsAgo.toISOString().split('T')[0];
    const endTime = new Date().toISOString().split('T')[0];

    const cacheKey = `emsc_fdsn_v8_${latStr}_${lngStr}_${startTime}_${endTime}_m4.0_r150km`;
    const cached = LocalApiCache.get<ApiResult<EmscSeismicData>>(cacheKey);
    if (cached) return cached;

    let failureReason = 'EMSC SeismicPortal API unreachable';

    // Angular search radius: 1.5 degrees (~167 km at equator) to ensure complete 150 km circle coverage before Haversine filtering
    const maxRadiusDegrees = 1.5;
    const countUrl = `https://www.seismicportal.eu/fdsnws/event/1/count?lat=${latStr}&lon=${lngStr}&maxradius=${maxRadiusDegrees}&minmag=4.0&starttime=${startTime}&endtime=${endTime}`;

    try {
      // 1. Query candidate count from official /count endpoint (with independent AbortController)
      let candidateAngularCount: number | null = null;
      try {
        const countController = new AbortController();
        const countTimeoutId = setTimeout(() => countController.abort(), this.TIMEOUT_MS);
        try {
          const countRes = await fetch(countUrl, {
            headers: { 'User-Agent': this.USER_AGENT },
            signal: countController.signal
          });
          if (countRes.ok) {
            const text = await countRes.text();
            const parsed = parseInt((text || '').trim(), 10);
            if (Number.isFinite(parsed)) {
              candidateAngularCount = parsed;
            }
          }
        } finally {
          clearTimeout(countTimeoutId);
        }
      } catch {
        // /count failure is non-fatal; proceed with /query pagination
      }

      // 2. Paginate through /query endpoint to retrieve ALL candidate features
      const allFeatures: any[] = [];
      let offset = 1;
      let pagesFetched = 0;
      let isTruncated = false;
      let paginationComplete = false;
      let partialDataReason: string | undefined = undefined;
      let baseQueryUrl = '';

      while (pagesFetched < this.MAX_PAGES) {
        const queryUrl = `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&lat=${latStr}&lon=${lngStr}&maxradius=${maxRadiusDegrees}&minmag=4.0&starttime=${startTime}&endtime=${endTime}&limit=${this.PAGE_SIZE}&offset=${offset}`;
        if (pagesFetched === 0) {
          baseQueryUrl = queryUrl;
        }

        const queryController = new AbortController();
        const queryTimeoutId = setTimeout(() => queryController.abort(), this.TIMEOUT_MS);

        let data: any = null;
        try {
          const res = await fetch(queryUrl, {
            headers: { 'User-Agent': this.USER_AGENT },
            signal: queryController.signal
          });

          if (!res.ok) {
            failureReason = `EMSC SeismicPortal returned HTTP ${res.status} (${res.statusText}) on page ${pagesFetched + 1}`;
            partialDataReason = failureReason;
            break;
          }

          data = await res.json();
        } catch (err: any) {
          failureReason = err.name === 'AbortError'
            ? `EMSC SeismicPortal request timed out on page ${pagesFetched + 1} (${this.TIMEOUT_MS}ms)`
            : (err.message || `Network error on page ${pagesFetched + 1}`);
          partialDataReason = failureReason;
          break;
        } finally {
          clearTimeout(queryTimeoutId);
        }

        if (!data || !Array.isArray(data.features)) {
          failureReason = `EMSC SeismicPortal response missing features array on page ${pagesFetched + 1}`;
          partialDataReason = failureReason;
          break;
        }

        const pageFeatures = data.features;
        allFeatures.push(...pageFeatures);
        pagesFetched++;

        // Terminal conditions:
        // A. If candidateAngularCount is known and all candidate features have been fetched
        if (candidateAngularCount !== null && allFeatures.length >= candidateAngularCount) {
          paginationComplete = true;
          break;
        }

        // B. If returned features in page are fewer than PAGE_SIZE, catalog is exhausted
        if (pageFeatures.length < this.PAGE_SIZE) {
          paginationComplete = true;
          break;
        }

        offset += this.PAGE_SIZE;
      }

      if (pagesFetched >= this.MAX_PAGES && allFeatures.length >= this.MAX_PAGES * this.PAGE_SIZE && !paginationComplete) {
        isTruncated = true;
        paginationComplete = false;
        partialDataReason = `Safety limit of ${this.MAX_PAGES} pages (${this.MAX_PAGES * this.PAGE_SIZE} events) reached before candidate catalog was exhausted`;
      }

      // Accuracy-first policy: If pagination did not complete or was truncated, fail instead of presenting incomplete count as authoritative 10-year truth
      if (!paginationComplete || isTruncated) {
        const fallbackResult: ApiResult<EmscSeismicData> = {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: partialDataReason || failureReason || 'Incomplete EMSC seismic catalog retrieval',
          sourceName: 'EMSC / SeismicPortal FDSN Global Catalog'
        };
        LocalApiCache.set(cacheKey, fallbackResult, 300);
        return fallbackResult;
      }

      // 3. Perform exact geodesic Haversine distance filtering ONLY on verified complete candidate feature set
      let validGeospatialFeaturesProcessed = 0;
      let count150km = 0;
      let count100km = 0;
      const validMags150km: number[] = [];

      for (const feat of allFeatures) {
        if (!feat || !feat.geometry || !Array.isArray(feat.geometry.coordinates)) continue;
        const featLon = Number(feat.geometry.coordinates[0]);
        const featLat = Number(feat.geometry.coordinates[1]);

        if (!Number.isFinite(featLon) || !Number.isFinite(featLat)) continue;

        validGeospatialFeaturesProcessed++;

        const distMeters = this.calculateHaversineDistanceMeters(coords.lat, coords.lng, featLat, featLon);

        const mag = Number(feat.properties?.mag);
        const isValidMag = Number.isFinite(mag);

        if (distMeters <= 150000) {
          count150km++;
          if (isValidMag) {
            validMags150km.push(mag);
          }
        }

        if (distMeters <= 100000) {
          count100km++;
        }
      }

      let maxMag: number | null = null;
      if (validMags150km.length > 0) {
        maxMag = +Math.max(...validMags150km).toFixed(1);
      }

      const countCompleteness: 'complete' | 'truncated' = 'complete';

      const payload: EmscSeismicData = {
        eventCount: count150km,
        radiusKm: 150,
        minMagnitude: 4.0,
        maxMagnitude: maxMag,
        periodStart: startTime,
        periodEnd: endTime,
        provider: 'EMSC / SeismicPortal',
        quakesCount150km: count150km,
        quakesCount100km: count100km,
        rawFeaturesReturned: allFeatures.length,
        validGeospatialFeaturesProcessed,
        candidateAngularEventCount: candidateAngularCount,
        candidateRadiusDegrees: maxRadiusDegrees,
        isTruncated: false,
        countCompleteness,
        paginationComplete: true,
        partialDataReason: undefined,
        distanceFilterMethod: 'Haversine geodesic distance <= 150 km',
        pagination: {
          pageSize: this.PAGE_SIZE,
          pagesFetched,
          totalFeaturesFetched: allFeatures.length
        },
        queryUrl: baseQueryUrl,
        countEndpointUrl: countUrl,
        countSource: 'EMSC FDSN /count'
      };

      const result: ApiResult<EmscSeismicData> = {
        data: payload,
        isFallback: false,
        confidenceLevel: 'medium', // Calibrated honest confidence for secondary fallback catalog
        sourceName: 'EMSC / SeismicPortal FDSN Global Catalog'
      };

      LocalApiCache.set(cacheKey, result, 86400); // 24h cache
      return result;
    } catch (err: any) {
      const fallbackResult: ApiResult<EmscSeismicData> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: err.message || 'Execution failure',
        sourceName: 'EMSC / SeismicPortal FDSN Global Catalog'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 300);
      return fallbackResult;
    }
  }
}
