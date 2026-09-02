import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface BmkgEarthquakeData {
  tanggal: string;
  jam: string;
  coordinates: [number, number];
  magnitude: number | null;                    // Exact event magnitude from BMKG (null if unparseable/missing; never synthetic 0)
  kedalamanKm: number | null;                  // Focal depth in km (null if unparseable/missing; never synthetic 0)
  wilayah: string;
  potensi: string;
  dirasakan?: string;
  distanceToSiteKm: number;                    // Geodesic distance in km from site to event epicenter
}

export interface BmkgSeismicSummary {
  latestQuake: BmkgEarthquakeData | null;      // Latest single real-time earthquake event from BMKG autogempa.json
  recentM5PlusWithin350kmCount: number;        // Count of recent M >= 5.0 quakes within 350 km from BMKG gempaterkini feed (last 15 M5+ events)
  nearestRecentQuakeKm: number | null;        // Geodesic distance in km to nearest recent M5.0+ quake or latest quake
  regionalRecentMaxMagnitude: number | null;  // Peak magnitude among recent BMKG feed events within 350 km (NOT a 10-year historical maximum)

  // Backward-compatible aliases for callers
  nearbyQuakesCount: number;                  // Alias for recentM5PlusWithin350kmCount
  nearestQuakeKm: number | null;              // Alias for nearestRecentQuakeKm
  recentMaxMagnitude: number | null;          // Alias for regionalRecentMaxMagnitude
  maxMagnitude: number | null;                // Alias for regionalRecentMaxMagnitude

  // Provenance & feed status
  latestFeedStatus: 'success' | 'nodata' | 'error';
  recentFeedStatus: 'success' | 'nodata' | 'error';
  latestFeedUrl: string;
  recentFeedUrl: string;
  searchRadiusKm: number;                     // 350 km (recent regional monitoring radius)
  attribution: string;                        // 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
}

/**
 * BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) Earthquake Client
 * Official real-time earthquake and recent M5.0+ regional activity monitoring feeds for Indonesia.
 * 
 * Official Open Data Portal: https://data.bmkg.go.id/gempabumi/
 * Endpoints:
 * - Autogempa (Latest real-time event): https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json
 * - Gempaterkini (Last 15 M5.0+ events): https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json
 */
export class BmkgEarthquakeClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 6000;
  private static readonly BMKG_AUTOGEMPA_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
  private static readonly BMKG_TERKINI_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';
  private static readonly RECENT_SEARCH_RADIUS_KM = 350;

  public static async fetchLatestEarthquakes(coords: Coordinates): Promise<ApiResult<BmkgSeismicSummary>> {
    // 1. Boundary check: BMKG feeds strictly cover the Indonesian seismic region
    if (coords.lat < -11.0 || coords.lat > 6.0 || coords.lng < 95.0 || coords.lng > 141.0) {
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: 'Coordinates outside BMKG Indonesia territory monitoring coverage',
        sourceName: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
      };
    }

    const latStr = coords.lat.toFixed(4);
    const lngStr = coords.lng.toFixed(4);
    const cacheKey = `bmkg_quakes_v6_${latStr}_${lngStr}`;
    const cached = LocalApiCache.get<ApiResult<BmkgSeismicSummary>>(cacheKey);
    if (cached) return cached;

    let latestQuake: BmkgEarthquakeData | null = null;
    let recentM5PlusCount = 0;
    let nearestRecentQuakeKm: number | null = null;
    const regionalValidMagnitudes: number[] = [];

    let latestFeedStatus: 'success' | 'nodata' | 'error' = 'error';
    let recentFeedStatus: 'success' | 'nodata' | 'error' = 'error';
    let failureReason = 'BMKG feeds unreachable';

    // 1. Fetch BMKG autogempa (Latest single earthquake event) with independent AbortController
    const autoController = new AbortController();
    const autoTimeoutId = setTimeout(() => autoController.abort(), this.TIMEOUT_MS);

    try {
      const autoRes = await fetch(this.BMKG_AUTOGEMPA_URL, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: autoController.signal
      });

      if (autoRes.ok) {
        const autoData = await autoRes.json();
        const info = autoData?.Infogempa?.gempa;

        if (info && typeof info.Coordinates === 'string') {
          const parts = info.Coordinates.split(',');
          if (parts.length >= 2) {
            const lat = Number(parts[0].trim());
            const lng = Number(parts[1].trim());

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              const dist = coords.distanceToKm(new Coordinates(lat, lng));
              const rawMag = Number(info.Magnitude);
              const magnitude = (Number.isFinite(rawMag) && rawMag > 0 && rawMag <= 10) ? rawMag : null;

              const rawDepthNum = Number((info.Kedalaman || '').replace(/[^0-9.]/g, ''));
              const kedalamanKm = Number.isFinite(rawDepthNum) ? rawDepthNum : null;

              latestQuake = {
                tanggal: info.Tanggal || '',
                jam: info.Jam || '',
                coordinates: [lat, lng],
                magnitude,
                kedalamanKm,
                wilayah: info.Wilayah || '',
                potensi: info.Potensi || '',
                dirasakan: info.Dirasakan || undefined,
                distanceToSiteKm: Math.round(dist)
              };

              nearestRecentQuakeKm = Math.round(dist);
              if (dist <= this.RECENT_SEARCH_RADIUS_KM && magnitude !== null) {
                regionalValidMagnitudes.push(magnitude);
              }
              latestFeedStatus = 'success';
            } else {
              latestFeedStatus = 'nodata';
            }
          } else {
            latestFeedStatus = 'nodata';
          }
        } else {
          latestFeedStatus = 'nodata';
        }
      } else {
        latestFeedStatus = 'error';
        failureReason = `BMKG autogempa returned HTTP ${autoRes.status} (${autoRes.statusText})`;
      }
    } catch (err: unknown) {
      latestFeedStatus = 'error';
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : 'Network error on autogempa';
      failureReason = isAbort ? `BMKG autogempa timed out (${this.TIMEOUT_MS}ms)` : errMsg;
    } finally {
      clearTimeout(autoTimeoutId);
    }

    // 2. Fetch BMKG gempaterkini (Last 15 M5.0+ earthquakes) with independent AbortController
    const terkiniController = new AbortController();
    const terkiniTimeoutId = setTimeout(() => terkiniController.abort(), this.TIMEOUT_MS);

    try {
      const listRes = await fetch(this.BMKG_TERKINI_URL, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: terkiniController.signal
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const quakes = listData?.Infogempa?.gempa;

        if (Array.isArray(quakes)) {
          recentFeedStatus = 'success';
          for (const q of quakes) {
            if (!q || typeof q.Coordinates !== 'string') continue;
            const parts = q.Coordinates.split(',');
            if (parts.length < 2) continue;

            const qLat = Number(parts[0].trim());
            const qLng = Number(parts[1].trim());

            if (!Number.isFinite(qLat) || !Number.isFinite(qLng)) continue;

            const d = coords.distanceToKm(new Coordinates(qLat, qLng));
            const rawM = Number(q.Magnitude);
            const isM5Plus = Number.isFinite(rawM) && rawM >= 5.0 && rawM <= 10.0;

            if (d <= this.RECENT_SEARCH_RADIUS_KM) {
              if (isM5Plus) {
                recentM5PlusCount++;
                regionalValidMagnitudes.push(rawM);
              }
              if (nearestRecentQuakeKm === null || d < nearestRecentQuakeKm) {
                nearestRecentQuakeKm = Math.round(d);
              }
            }
          }
        } else {
          recentFeedStatus = 'nodata';
        }
      } else {
        recentFeedStatus = 'error';
      }
    } catch (err: unknown) {
      recentFeedStatus = 'error';
      if (latestFeedStatus === 'error') {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const errMsg = err instanceof Error ? err.message : 'Network error on gempaterkini';
        failureReason = isAbort ? `BMKG gempaterkini timed out (${this.TIMEOUT_MS}ms)` : errMsg;
      }
    } finally {
      clearTimeout(terkiniTimeoutId);
    }

    // If both feeds failed, return fallback result
    if (latestFeedStatus === 'error' && recentFeedStatus === 'error') {
      const fallbackResult: ApiResult<BmkgSeismicSummary> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: failureReason,
        sourceName: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 180); // 3 minutes outage cache
      return fallbackResult;
    }

    let regionalRecentMaxMagnitude: number | null = null;
    if (regionalValidMagnitudes.length > 0) {
      regionalRecentMaxMagnitude = +Math.max(...regionalValidMagnitudes).toFixed(1);
    }

    const payload: BmkgSeismicSummary = {
      latestQuake,
      recentM5PlusWithin350kmCount: recentM5PlusCount,
      nearestRecentQuakeKm,
      regionalRecentMaxMagnitude,
      nearbyQuakesCount: recentM5PlusCount,         // Backward-compatible alias
      nearestQuakeKm: nearestRecentQuakeKm,          // Backward-compatible alias
      recentMaxMagnitude: regionalRecentMaxMagnitude,// Backward-compatible alias
      maxMagnitude: regionalRecentMaxMagnitude,      // Backward-compatible alias
      latestFeedStatus,
      recentFeedStatus,
      latestFeedUrl: this.BMKG_AUTOGEMPA_URL,
      recentFeedUrl: this.BMKG_TERKINI_URL,
      searchRadiusKm: this.RECENT_SEARCH_RADIUS_KM,
      attribution: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
    };

    const result: ApiResult<BmkgSeismicSummary> = {
      data: payload,
      isFallback: false,
      confidenceLevel: 'medium', // Calibrated honest confidence for recent monitoring feed
      sourceName: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)'
    };

    LocalApiCache.set(cacheKey, result, 300); // 5 minutes cache (reflecting real-time updates)
    return result;
  }
}
