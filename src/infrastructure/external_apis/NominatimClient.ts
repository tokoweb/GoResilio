import type { GeocodingSuggestion } from '../../domain/types/location.types';
import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { MapboxGeocodingClient } from './MapboxGeocodingClient';
import { PhotonGeocodingClient } from './PhotonGeocodingClient';

interface NominatimRawItem {
  osm_type?: string;
  osm_id?: number | string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

export interface AdministrativeLocation {
  country: string;
  countryCode: string;
  state?: string;      // Province / State / Region
  city?: string;       // City / Town / Municipality (never state/province)
  county?: string;     // Regency / County
  district?: string;   // OSM-derived local subdivision (suburb/neighbourhood/village/locality; NOT guaranteed to equal Indonesian Kecamatan)
  locality?: string;   // Local settlement / neighborhood (only if explicitly provided as distinct field)
  districtNote?: string;
  rawDisplayName?: string;
  osmType?: string;
  osmId?: string | number;
  source?: 'nominatim_osm' | 'photon_komoot_osm';
  diagnosticError?: string;
}

/**
 * OpenStreetMap Nominatim Geocoding Client
 * Free public search and reverse geocoding API.
 * Rate limit policy: Maximum 1 request/second to nominatim.openstreetmap.org enforced via a private serialized FIFO queue.
 */
export class NominatimClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 5000;

  // Serialized FIFO Promise Queue to strictly guarantee >= 1000ms between concurrent request starts
  private static rateLimitQueue: Promise<void> = Promise.resolve();
  private static lastRequestStartTime = 0;

  /**
   * Concurrency-safe serialized execution queue.
   * Ensures that all requests to nominatim.openstreetmap.org start at least 1000ms apart,
   * regardless of how many asynchronous callers invoke Nominatim concurrently.
   */
  private static async scheduleSerializedFetch<T>(fn: () => Promise<T>): Promise<T> {
    const execution = this.rateLimitQueue.then(async () => {
      const now = Date.now();
      const elapsed = now - this.lastRequestStartTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }
      this.lastRequestStartTime = Date.now();
      return await fn();
    });

    // Ensure the queue chain advances and recovers even if fn() throws an exception
    this.rateLimitQueue = execution.then(
      () => {},
      () => {}
    );

    return await execution;
  }

  /**
   * Normalize search queries to maximize cache hit rate and prevent redundant network calls.
   */
  private static normalizeQuery(query: string): string {
    return (query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Search locations by keyword with Chain-of-Responsibility:
   * 1. Mapbox Geocoding (if API token configured)
   * 2. OpenStreetMap Nominatim (single rate-limit compliant request focused on ID & PH)
   * 3. Photon by Komoot (free global OSM geocoding backup)
   */
  public static async searchLocations(query: string): Promise<GeocodingSuggestion[]> {
    const normalized = this.normalizeQuery(query);
    if (!normalized || normalized.length < 2) return [];

    const cacheKey = `geo_srch_v6_${encodeURIComponent(normalized)}`;
    const cached = LocalApiCache.get<GeocodingSuggestion[]>(cacheKey);
    if (cached) return cached;

    // 1. Try Mapbox Geocoding first (if token configured)
    try {
      const mapboxResults = await MapboxGeocodingClient.searchLocations(query);
      if (mapboxResults && mapboxResults.length > 0) {
        LocalApiCache.set(cacheKey, mapboxResults, 3600);
        return mapboxResults;
      }
    } catch {
      // Fallback to OSM Nominatim
    }

    // 2. OpenStreetMap Nominatim (Single query scheduled via serialized rate-limiting queue)
    try {
      const items = await this.scheduleSerializedFetch(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json` +
            `&q=${encodeURIComponent(normalized)}` +
            `&limit=10` +
            `&addressdetails=1` +
            `&dedupe=1` +
            `&countrycodes=id,ph`;

          const res = await fetch(url, {
            headers: {
              'Accept-Language': 'id,en',
              'User-Agent': this.USER_AGENT
            },
            signal: controller.signal
          });

          if (res.ok) {
            return (await res.json()) as NominatimRawItem[];
          }
          return [] as NominatimRawItem[];
        } finally {
          clearTimeout(timeoutId);
        }
      });

      if (Array.isArray(items) && items.length > 0) {
        const seen = new Set<string>();
        const unique: NominatimRawItem[] = [];

        for (const item of items) {
          const lat = Number(item.lat);
          const lon = Number(item.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

          const dedupeKey = item.osm_type && item.osm_id
            ? `${item.osm_type}_${item.osm_id}`
            : `${lat.toFixed(6)},${lon.toFixed(6)}`;

          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            unique.push(item);
          }
        }

        if (unique.length > 0) {
          const suggestions: GeocodingSuggestion[] = unique.map((item, idx) => {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            // Strict city parsing: only city, town, or municipality. Never state/province.
            const city = item.address?.city || item.address?.town || item.address?.municipality || undefined;

            return {
              displayName: item.display_name,
              latitude: lat,
              longitude: lon,
              type: item.type,
              addressDetails: {
                city,
                state: item.address?.state || item.address?.province || item.address?.region || undefined,
                country: item.address?.country || undefined,
                postcode: item.address?.postcode || undefined
              },
              provenance: {
                source: 'nominatim_osm',
                query: normalized,
                resultCount: unique.length,
                selectedIndex: idx,
                osmType: item.osm_type,
                osmId: item.osm_id,
                coordinates: {
                  latitude: lat,
                  longitude: lon
                }
              }
            };
          });

          LocalApiCache.set(cacheKey, suggestions, 3600);
          return suggestions;
        }
      }
    } catch {
      // Fallback to Photon
    }

    // 3. Fallback to Photon by Komoot (using audited PhotonGeocodingClient)
    try {
      const photonRes = await PhotonGeocodingClient.searchLocations(query);
      if (photonRes.data && photonRes.data.length > 0) {
        LocalApiCache.set(cacheKey, photonRes.data, 3600);
        return photonRes.data;
      }
    } catch {
      // Fallback exhausted
    }

    return [];
  }

  /**
   * Reverse geocode coordinates to human-readable address string with Photon fallback.
   */
  public static async reverseGeocode(coords: Coordinates): Promise<string> {
    const cacheKey = `rev_geo_v6_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<string>(cacheKey);
    if (cached) return cached;

    // 1. Nominatim Reverse Geocoding (Scheduled via serialized queue)
    try {
      const displayName = await this.scheduleSerializedFetch(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat.toFixed(
            5
          )}&lon=${coords.lng.toFixed(5)}&zoom=18&addressdetails=1`;

          const res = await fetch(url, {
            headers: {
              'Accept-Language': 'id,en',
              'User-Agent': this.USER_AGENT
            },
            signal: controller.signal
          });

          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.display_name === 'string' && data.display_name.trim().length > 0) {
              return data.display_name.trim();
            }
          }
          return null;
        } finally {
          clearTimeout(timeoutId);
        }
      });

      if (displayName) {
        LocalApiCache.set(cacheKey, displayName, 86400);
        return displayName;
      }
    } catch {
      // Fallback to Photon
    }

    // 2. Photon Reverse Geocoding (Audited Single Entry Point)
    try {
      const photonRes = await PhotonGeocodingClient.reverseGeocode(coords);
      if (photonRes.data && photonRes.data.trim().length > 0) {
        LocalApiCache.set(cacheKey, photonRes.data.trim(), 86400);
        return photonRes.data.trim();
      }
    } catch {
      // Fallback
    }

    // 3. UI Display Fallback (Coordinate string label only, not a geocoded postal address)
    return `Lokasi Koordinat (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
  }

  /**
   * Reverse geocode coordinates to structured administrative boundaries using GeocodeJSON parser.
   * Note: Local subdivisions are parsed from OSM tags/GeocodeJSON and do NOT guarantee official ADM3 / Kecamatan boundaries.
   */
  public static async getAdministrativeLocation(coords: Coordinates): Promise<AdministrativeLocation | null> {
    const cacheKey = `admin_loc_v6_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<AdministrativeLocation>(cacheKey);
    if (cached) return cached;

    let nominatimDiagnosticError: string | undefined;

    // 1. Primary: Nominatim Reverse Geocode with format=geocodejson for structured classification
    try {
      const loc = await this.scheduleSerializedFetch(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=geocodejson&lat=${coords.lat.toFixed(
            5
          )}&lon=${coords.lng.toFixed(5)}&addressdetails=1`;

          const res = await fetch(url, {
            headers: {
              'Accept-Language': 'en,id',
              'User-Agent': this.USER_AGENT
            },
            signal: controller.signal
          });

          if (!res.ok) {
            nominatimDiagnosticError = `Nominatim HTTP ${res.status} (${res.statusText})`;
            return null;
          }

          const data = await res.json();
          if (data && Array.isArray(data.features) && data.features.length > 0) {
            const feat = data.features[0];
            const geocoding = feat.properties?.geocoding || {};
            const country = geocoding.country || '';
            const countryCode = (geocoding.country_code || '').toUpperCase();

            if (country || countryCode) {
              const parsedLoc: AdministrativeLocation = {
                country: country || (countryCode === 'ID' ? 'Indonesia' : countryCode === 'PH' ? 'Philippines' : countryCode),
                countryCode: countryCode || (country.toLowerCase() === 'indonesia' ? 'ID' : country.toLowerCase() === 'philippines' ? 'PH' : ''),
                state: geocoding.state || geocoding.province || geocoding.region || undefined,
                city: geocoding.city || geocoding.town || geocoding.municipality || undefined,
                county: geocoding.county || undefined,
                district: geocoding.district || geocoding.suburb || geocoding.village || undefined,
                locality: geocoding.locality || undefined, // Only populate locality if explicitly distinct
                districtNote: 'OSM-derived local subdivision; NOT guaranteed to equal Indonesian Kecamatan.',
                rawDisplayName: geocoding.label || feat.properties?.display_name || undefined,
                osmType: geocoding.osm_type,
                osmId: geocoding.osm_id,
                source: 'nominatim_osm'
              };
              return parsedLoc;
            }
          }
          nominatimDiagnosticError = 'Nominatim returned empty features array';
          return null;
        } catch (err: any) {
          nominatimDiagnosticError = err.name === 'AbortError' ? 'Nominatim request timed out (5000ms)' : (err.message || 'Network error');
          return null;
        } finally {
          clearTimeout(timeoutId);
        }
      });

      if (loc) {
        LocalApiCache.set(cacheKey, loc, 86400 * 7); // 7 days cache
        return loc;
      }
    } catch (err: any) {
      nominatimDiagnosticError = err.message || 'Nominatim execution failed';
    }

    // 2. Backup: Photon Reverse Geocoding via Audited PhotonGeocodingClient
    try {
      const photonRes = await PhotonGeocodingClient.reverseGeocodeDetailed(coords);
      if (photonRes.data && photonRes.data.addressDetails) {
        const details = photonRes.data.addressDetails;
        const country = details.country || '';
        const countryCode = country.toLowerCase() === 'indonesia' ? 'ID' : country.toLowerCase() === 'philippines' ? 'PH' : '';

        if (country || countryCode) {
          const loc: AdministrativeLocation = {
            country: country || (countryCode === 'ID' ? 'Indonesia' : countryCode === 'PH' ? 'Philippines' : countryCode),
            countryCode: countryCode || '',
            state: details.state,
            city: details.city,
            district: details.district,
            locality: undefined, // Do not duplicate district into locality
            districtNote: 'Photon/OSM-derived local subdivision; NOT guaranteed to equal Indonesian Kecamatan.',
            rawDisplayName: photonRes.data.displayName || undefined,
            diagnosticError: nominatimDiagnosticError,
            source: 'photon_komoot_osm'
          };
          LocalApiCache.set(cacheKey, loc, 86400 * 7);
          return loc;
        }
      }
    } catch {
      // Fallback exhausted
    }

    return null;
  }
}
