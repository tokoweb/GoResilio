import { GeocodingSuggestion } from '../../domain/types/location.types';
import { LocalApiCache } from '../cache/LocalApiCache';

/**
 * Mapbox Geocoding API Client (v5)
 * Primary commercial geocoding and location search provider for address discovery.
 * 
 * Role in GoTangguh:
 * Mapbox is strictly a LOCATION DISCOVERY & AUTOCOMPLETE LAYER (resolves search queries to coordinates),
 * NOT a natural hazard or risk assessment source.
 * 
 * Official Documentation: https://docs.mapbox.com/api/search/geocoding/
 */
export class MapboxGeocodingClient {
  private static readonly TIMEOUT_MS = 5000;

  /**
   * Retrieves public Mapbox access token from environment variables.
   * Only public Mapbox tokens (e.g. pk.*) are exposed to client-side code via NEXT_PUBLIC_MAPBOX_TOKEN.
   * MAPBOX_ACCESS_TOKEN is strictly restricted to server-side execution.
   */
  private static getToken(): string {
    if (typeof window !== 'undefined') {
      // Browser-side execution: strictly use public token only
      return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    }
    // Server-side execution: fallback to server access token if available
    return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';
  }

  /**
   * Normalize search queries to maximize cache hit rate and prevent redundant network calls.
   */
  private static normalizeQuery(query: string): string {
    return (query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Search locations using Mapbox Geocoding v5 API with typo-tolerance and POI support.
   * Filters to supported service countries (Indonesia and Philippines).
   */
  public static async searchLocations(query: string): Promise<GeocodingSuggestion[]> {
    const normalized = this.normalizeQuery(query);
    if (!normalized || normalized.length < 2) return [];

    const token = this.getToken();
    if (!token) {
      return []; // Signal fallback to Nominatim / Photon
    }

    const cacheKey = `mapbox_srch_v3_${encodeURIComponent(normalized)}`;
    const cached = LocalApiCache.get<GeocodingSuggestion[]>(cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        normalized
      )}.json?access_token=${token}&country=id,ph&limit=10&types=country,region,postcode,district,place,locality,neighborhood,address,poi&language=id,en&fuzzyMatch=true`;

      const res = await fetch(url, { signal: controller.signal });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.features) && data.features.length > 0) {
          // Strict response validation: filter only features with finite [lon, lat] coordinates
          const validFeatures = data.features.filter((feat: any) => {
            return (
              feat &&
              Array.isArray(feat.center) &&
              feat.center.length >= 2 &&
              typeof feat.center[0] === 'number' &&
              Number.isFinite(feat.center[0]) &&
              typeof feat.center[1] === 'number' &&
              Number.isFinite(feat.center[1])
            );
          });

          const totalCount = validFeatures.length;

          const suggestions: GeocodingSuggestion[] = validFeatures.map((feat: any, idx: number) => {
            const lng = Number(feat.center[0]);
            const lat = Number(feat.center[1]);

            // Explicit context parsing: never substitute region/state into city
            const placeContext = feat.context?.find((c: any) => typeof c?.id === 'string' && c.id.startsWith('place'))?.text;
            const regionContext = feat.context?.find((c: any) => typeof c?.id === 'string' && c.id.startsWith('region'))?.text;
            const countryContext = feat.context?.find((c: any) => typeof c?.id === 'string' && c.id.startsWith('country'))?.text;
            const postcodeContext = feat.context?.find((c: any) => typeof c?.id === 'string' && c.id.startsWith('postcode'))?.text;

            // City is assigned only if a true place/city is resolved
            const city = placeContext || (feat.place_type?.[0] === 'place' ? feat.text : undefined);
            const state = regionContext || (feat.place_type?.[0] === 'region' ? feat.text : undefined);
            const country = countryContext || (feat.place_type?.[0] === 'country' ? feat.text : undefined);
            const postcode = postcodeContext || (feat.place_type?.[0] === 'postcode' ? feat.text : undefined);

            const featureId = typeof feat.id === 'string' && feat.id.trim().length > 0 ? feat.id.trim() : undefined;

            const suggestion: GeocodingSuggestion = {
              displayName: feat.place_name || feat.text || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
              type: feat.place_type?.[0] || 'place',
              addressDetails: {
                city,
                state,
                country,
                postcode
              },
              provenance: {
                source: 'mapbox_geocoding',
                query: normalized,
                resultCount: totalCount,
                selectedIndex: idx,
                featureId,
                coordinates: {
                  latitude: lat,
                  longitude: lng
                }
              }
            };

            return suggestion;
          });

          LocalApiCache.set(cacheKey, suggestions, 3600); // 1 hour TTL
          return suggestions;
        }
      }
    } catch {
      // Fallback to Nominatim / Photon
    } finally {
      clearTimeout(timeoutId);
    }

    return [];
  }
}
