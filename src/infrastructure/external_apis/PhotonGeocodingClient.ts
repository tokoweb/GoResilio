import { GeocodingSuggestion } from '../../domain/types/location.types';
import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface PhotonProvenance {
  source: 'photon_komoot_osm';
  query?: string;
  resultCount: number;
  selectedIndex?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PhotonReverseGeocodeResult {
  displayName: string | null;
  addressDetails?: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  provenance: PhotonProvenance;
}

/**
 * Photon Geocoding API Client (by Komoot, powered by OpenStreetMap).
 * Fast, open-source geocoding service for forward query search and reverse geocoding.
 * 
 * Role in GoTangguh:
 * Photon is strictly a SPATIAL LOCATION DISCOVERY LAYER (resolves names to coordinates),
 * NOT a natural hazard risk assessment source.
 * 
 * Official Documentation: https://photon.komoot.io/
 */
export class PhotonGeocodingClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';

  /**
   * Normalize search queries to maximize cache hit rate and prevent redundant remote calls.
   */
  private static normalizeQuery(query: string): string {
    return (query || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Calculate exact geographical distance between two coordinates in kilometers using Haversine formula.
   */
  private static calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Search locations via Photon forward geocoding API with ApiResult provenance envelope.
   * Target endpoint: https://photon.komoot.io/api/?q=...
   */
  public static async searchLocations(query: string): Promise<ApiResult<GeocodingSuggestion[]>> {
    const normalized = this.normalizeQuery(query);
    if (normalized.length < 2) {
      return {
        data: [],
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'Photon Geocoding (Komoot/OSM)'
      };
    }

    const cacheKey = `photon_srch_v3_${encodeURIComponent(normalized)}`;
    const cached = LocalApiCache.get<ApiResult<GeocodingSuggestion[]>>(cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(normalized)}&limit=5`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (res.ok) {
        const json = await res.json();
        if (json.features && Array.isArray(json.features)) {
          const totalFeatures = json.features.length;

          const suggestions: GeocodingSuggestion[] = json.features
            .map((feat: any, idx: number) => {
              const coords = feat.geometry?.coordinates;
              const props = feat.properties || {};
              if (!coords || coords.length < 2) return null;

              // GeoJSON specification: [longitude, latitude]
              const lng = Number(coords[0]);
              const lat = Number(coords[1]);
              if (isNaN(lat) || isNaN(lng)) return null;

              const parts = [
                props.name,
                props.street,
                props.district || props.suburb,
                props.city,
                props.state,
                props.country
              ].filter(Boolean);

              const displayName = parts.length > 0
                ? parts.join(', ')
                : `${props.name || 'Lokasi'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

              // Strict type assignment without falling back city to state
              const suggestion: GeocodingSuggestion = {
                displayName,
                latitude: lat,
                longitude: lng,
                type: props.osm_value || props.osm_key || 'unknown',
                addressDetails: {
                  city: props.city || undefined,
                  state: props.state || undefined,
                  country: props.country || undefined,
                  postcode: props.postcode || undefined
                },
                provenance: {
                  source: 'photon_komoot_osm',
                  query: normalized,
                  resultCount: totalFeatures,
                  selectedIndex: idx,
                  coordinates: {
                    latitude: lat,
                    longitude: lng
                  }
                }
              };

              return suggestion;
            })
            .filter((s: any): s is GeocodingSuggestion => s !== null);

          // Calibrate confidence level honestly:
          // 'medium' for standard API geocoding responses, as external web APIs do not guarantee parcel-level ground truth.
          const result: ApiResult<GeocodingSuggestion[]> = {
            data: suggestions,
            isFallback: false,
            confidenceLevel: suggestions.length > 0 ? 'medium' : 'low',
            sourceName: 'Photon Geocoding (Komoot/OSM)'
          };

          LocalApiCache.set(cacheKey, result, 3600);
          return result;
        }
      }

      const emptyResult: ApiResult<GeocodingSuggestion[]> = {
        data: [],
        isFallback: true,
        confidenceLevel: 'low',
        reason: `Photon API returned HTTP ${res.status}`,
        sourceName: 'Photon Geocoding (Komoot/OSM)'
      };
      return emptyResult;
    } catch (err) {
      const fallbackResult: ApiResult<GeocodingSuggestion[]> = {
        data: [],
        isFallback: true,
        confidenceLevel: 'low',
        reason: err instanceof Error ? err.message : 'Network error',
        sourceName: 'Photon Geocoding (Komoot/OSM)'
      };
      return fallbackResult;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Reverse geocode coordinates to human-readable address with candidate evaluation.
   * Target endpoint: https://photon.komoot.io/reverse?lat=...&lon=...
   */
  public static async reverseGeocode(coords: Coordinates): Promise<ApiResult<string | null>> {
    const detailed = await this.reverseGeocodeDetailed(coords);
    return {
      data: detailed.data?.displayName || null,
      isFallback: detailed.isFallback,
      confidenceLevel: detailed.confidenceLevel,
      reason: detailed.reason,
      sourceName: detailed.sourceName
    };
  }

  /**
   * Structured reverse geocode coordinates with full provenance metadata.
   */
  public static async reverseGeocodeDetailed(coords: Coordinates): Promise<ApiResult<PhotonReverseGeocodeResult>> {
    const cacheKey = `photon_rev_v3_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<ApiResult<PhotonReverseGeocodeResult>>(cacheKey);
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `https://photon.komoot.io/reverse?lat=${coords.lat.toFixed(5)}&lon=${coords.lng.toFixed(5)}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (res.ok) {
        const json = await res.json();
        if (json.features && Array.isArray(json.features) && json.features.length > 0) {
          // Internal heuristic candidate evaluation:
          // Heavily prioritizes spatial proximity (Haversine distance) as the primary factor,
          // with address field completeness acting as secondary tie-breakers.
          // Note: This is an internal GoTangguh heuristic, not an official statistical confidence metric from Photon.
          let bestIndex = 0;
          let bestHeuristicScore = -1;

          json.features.forEach((feat: any, idx: number) => {
            const props = feat.properties || {};
            const featCoords = feat.geometry?.coordinates;
            let candidateSelectionScore = 0;

            // 1. Primary: Haversine distance proximity score
            if (featCoords && featCoords.length >= 2) {
              const fLng = Number(featCoords[0]);
              const fLat = Number(featCoords[1]);
              if (!isNaN(fLat) && !isNaN(fLng)) {
                const distanceKm = this.calculateHaversineDistanceKm(coords.lat, coords.lng, fLat, fLng);
                if (distanceKm <= 0.1) {
                  candidateSelectionScore += 20; // Within 100m (immediate vicinity)
                } else if (distanceKm <= 0.5) {
                  candidateSelectionScore += 12; // Within 500m
                } else if (distanceKm <= 1.0) {
                  candidateSelectionScore += 8;  // Within 1km
                } else if (distanceKm <= 3.0) {
                  candidateSelectionScore += 4;  // Within 3km
                } else {
                  candidateSelectionScore -= 5;  // Far distance penalty
                }
              }
            }

            // 2. Secondary: Address element completeness (tie-breakers)
            if (props.name) candidateSelectionScore += 2;
            if (props.street) candidateSelectionScore += 2;
            if (props.district || props.suburb) candidateSelectionScore += 1;
            if (props.city) candidateSelectionScore += 1;
            if (props.state) candidateSelectionScore += 1;
            if (props.country) candidateSelectionScore += 1;

            if (candidateSelectionScore > bestHeuristicScore) {
              bestHeuristicScore = candidateSelectionScore;
              bestIndex = idx;
            }
          });

          const chosenProps = json.features[bestIndex]?.properties || {};
          const parts = [
            chosenProps.name,
            chosenProps.street,
            chosenProps.district || chosenProps.suburb,
            chosenProps.city,
            chosenProps.state,
            chosenProps.country
          ].filter(Boolean);

          const displayName = parts.length > 0 ? parts.join(', ') : null;

          const detailedResult: PhotonReverseGeocodeResult = {
            displayName,
            addressDetails: {
              name: chosenProps.name || undefined,
              street: chosenProps.street || undefined,
              district: chosenProps.district || chosenProps.suburb || undefined,
              city: chosenProps.city || undefined,
              state: chosenProps.state || undefined,
              country: chosenProps.country || undefined,
              postcode: chosenProps.postcode || undefined
            },
            provenance: {
              source: 'photon_komoot_osm',
              resultCount: json.features.length,
              selectedIndex: bestIndex,
              coordinates: {
                latitude: coords.lat,
                longitude: coords.lng
              }
            }
          };

          // Honest confidence calibration: 'medium' for standard reverse geocoding
          const result: ApiResult<PhotonReverseGeocodeResult> = {
            data: detailedResult,
            isFallback: false,
            confidenceLevel: displayName ? 'medium' : 'low',
            sourceName: 'Photon Reverse Geocoding (Komoot/OSM)'
          };

          LocalApiCache.set(cacheKey, result, 86400);
          return result;
        }
      }

      const emptyResult: ApiResult<PhotonReverseGeocodeResult> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: `Photon reverse endpoint returned HTTP ${res.status}`,
        sourceName: 'Photon Reverse Geocoding (Komoot/OSM)'
      };
      return emptyResult;
    } catch (err) {
      const fallbackResult: ApiResult<PhotonReverseGeocodeResult> = {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: err instanceof Error ? err.message : 'Network error',
        sourceName: 'Photon Reverse Geocoding (Komoot/OSM)'
      };
      return fallbackResult;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
