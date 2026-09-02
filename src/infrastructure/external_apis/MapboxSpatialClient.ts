import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import type { BoundedSpatialDistance } from '../../domain/types/feature.types';
import type { ApiResult } from '../../domain/types/api.types';
import { OsrmRoutingClient, NearestRoadResult, RouteEstimate } from './OsrmRoutingClient';

export type MapboxProviderStatus = 'success_exact' | 'success_no_result' | 'error' | 'timeout';

export type MapboxRouteStatus = 'success' | 'no_route' | 'error' | 'timeout';

export type MapboxPoiCategory = 'hospital' | 'transit' | 'fire_station';

export interface MapboxPoiItem {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  source: 'mapbox';
  providerStatus: MapboxProviderStatus;
  searchRadiusMeters: number;
  boundedDisplay?: string | null;
  boundedObservation: BoundedSpatialDistance;
  category: MapboxPoiCategory;
}

export interface MapboxRoadResult {
  nearestRoadName: string | null;
  distanceToNearestRoadMeters: number | null;
  snappedLocation?: Coordinates | null;
  source: 'mapbox' | 'osrm';
  endpoint: string;
  providerStatus: MapboxProviderStatus;
  boundedObservation?: BoundedSpatialDistance;
}

export interface MapboxRouteResult {
  travelTimeRouteDistanceMeters: number | null;
  travelTimeMinutes: number | null;
  estimatedTravelTimeMinutes: string | null;
  routingSource: string;
  source: 'mapbox' | 'osrm';
  endpoint: string;
  providerStatus: MapboxRouteStatus;
  durationSeconds: number | null;
  origin: Coordinates;
  destination: Coordinates;
}

export interface MapboxSpatialSummary {
  hospital: MapboxPoiItem;
  transit: MapboxPoiItem;
  fireStation: MapboxPoiItem;
  nearestRoad?: MapboxRoadResult | null;
  route?: MapboxRouteResult | null;
  evaluatedAt: string;
  providerStatus: MapboxProviderStatus;
}

interface RawMapboxFeature {
  id?: string;
  text?: string;
  place_name?: string;
  name?: string;
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    category?: string;
    maki?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: [number, number]; // [lon, lat]
  };
  center?: [number, number]; // [lon, lat]
}

/**
 * MapboxSpatialClient
 * Primary commercial spatial provider for:
 * 1. Emergency POI discovery (Hospital, Transit, Fire Station)
 * 2. Reliable road / street snapping
 * 3. Driving route calculation via Mapbox Directions API
 * 
 * Features:
 * - Uses Mapbox Search Box / Geocoding API with canonical assessmentCoordinates proximity.
 * - Computes exact spherical Haversine distances to canonical assessmentCoordinates.
 * - Resolves driving routes via Mapbox Directions API with OSRM fallback.
 * - Normalizes results into exact (`success_exact`), bounded (`success_no_result`), or failure (`error`/`timeout`).
 * - Strictly avoids converting error/timeout states into fake ">5km" or ">15km" strings.
 * - Retains full metadata provenance for every discovered POI, road, and route.
 */
export class MapboxSpatialClient {
  private static readonly TIMEOUT_MS = 6000;
  private static readonly CACHE_TTL_SECONDS = 7200;

  /**
   * Search radius progression configurations per POI category.
   */
  public static readonly RADIUS_CONFIG: Record<MapboxPoiCategory, { stages: number[]; maxRadius: number; defaultQuery: string; categoryId: string }> = {
    hospital: {
      stages: [5000, 10000, 15000],
      maxRadius: 15000,
      defaultQuery: 'hospital medical center rumah sakit',
      categoryId: 'hospital'
    },
    transit: {
      stages: [3000, 10000],
      maxRadius: 10000,
      defaultQuery: 'transit station bus stop train station stasiun terminal',
      categoryId: 'transit_station'
    },
    fire_station: {
      stages: [5000, 10000],
      maxRadius: 10000,
      defaultQuery: 'fire station pemadam kebakaran damkar',
      categoryId: 'fire_station'
    }
  };

  /**
   * Retrieves public Mapbox access token from environment variables.
   */
  public static getToken(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    }
    return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';
  }

  /**
   * Computes exact great-circle distance in meters between two WGS84 coordinate pairs.
   */
  public static calculateHaversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Mean Earth radius in meters
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Helper to construct a normalized BoundedSpatialDistance observation record.
   */
  public static createBoundedObservation(
    exactDistanceMeters: number | null,
    searchedRadiusMeters: number,
    featureName: string | null,
    providerFailed: boolean
  ): BoundedSpatialDistance {
    if (providerFailed) {
      return {
        state: 'ERROR_OR_TIMEOUT',
        exactDistanceMeters: null,
        relation: null,
        lowerBoundMeters: null,
        searchedRadiusMeters,
        displayValue: null,
        name: featureName || 'Data fasilitas tidak dapat dimuat (Sumber Mapbox tidak merespon)'
      };
    }

    if (exactDistanceMeters !== null) {
      const displayValue = exactDistanceMeters >= 1000
        ? `${(exactDistanceMeters / 1000).toFixed(1)} km`
        : `±${Math.round(exactDistanceMeters)} m`;
      return {
        state: 'AVAILABLE_EXACT',
        exactDistanceMeters: Math.round(exactDistanceMeters),
        relation: 'exact',
        lowerBoundMeters: null,
        searchedRadiusMeters,
        displayValue,
        name: featureName
      };
    }

    const radiusKm = searchedRadiusMeters >= 1000 ? Math.round(searchedRadiusMeters / 1000) : searchedRadiusMeters;
    const radiusUnit = searchedRadiusMeters >= 1000 ? 'km' : 'm';
    const displayValue = `>${radiusKm} ${radiusUnit}`;

    return {
      state: 'AVAILABLE_BOUNDED',
      exactDistanceMeters: null,
      relation: 'greater_than',
      lowerBoundMeters: searchedRadiusMeters,
      searchedRadiusMeters,
      displayValue,
      name: featureName || `Tidak terdeteksi dalam radius ${radiusKm} ${radiusUnit}`
    };
  }

  /**
   * Fetches POI candidates from Mapbox Search Box API or Geocoding API with proximity bias.
   */
  private static async queryMapboxPoiEndpoint(
    coords: Coordinates,
    category: MapboxPoiCategory
  ): Promise<{ features: RawMapboxFeature[]; status: MapboxProviderStatus }> {
    const token = this.getToken();
    if (!token) {
      return { features: [], status: 'error' };
    }

    const config = this.RADIUS_CONFIG[category];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      // Primary attempt: Mapbox Search Box category endpoint
      const searchBoxUrl = `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(
        config.categoryId
      )}?proximity=${coords.lng.toFixed(6)},${coords.lat.toFixed(6)}&limit=10&access_token=${encodeURIComponent(token)}`;

      const res = await fetch(searchBoxUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        clearTimeout(timeoutId);
        const data = await res.json();
        const features: RawMapboxFeature[] = Array.isArray(data?.features) ? data.features : [];
        return { features, status: 'success_exact' };
      }

      // Secondary attempt: Mapbox Geocoding v5 places POI search
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        config.defaultQuery
      )}.json?proximity=${coords.lng.toFixed(6)},${coords.lat.toFixed(6)}&types=poi&limit=10&access_token=${encodeURIComponent(token)}`;

      const geoRes = await fetch(geocodingUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const data = await geoRes.json();
        const features: RawMapboxFeature[] = Array.isArray(data?.features) ? data.features : [];
        return { features, status: 'success_exact' };
      }

      return { features: [], status: 'error' };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        return { features: [], status: 'timeout' };
      }
      return { features: [], status: 'error' };
    }
  }

  /**
   * Search a specific POI category with progressive radius stages.
   */
  public static async searchPoiCategory(
    coords: Coordinates,
    category: MapboxPoiCategory
  ): Promise<MapboxPoiItem> {
    const config = this.RADIUS_CONFIG[category];
    const cacheKey = `mapbox_poi_${category}_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<MapboxPoiItem>(cacheKey);
    if (cached) return cached;

    const { features, status } = await this.queryMapboxPoiEndpoint(coords, category);

    // If Mapbox failed or timed out
    if (status === 'error' || status === 'timeout') {
      const failedItem: MapboxPoiItem = {
        name: null,
        latitude: null,
        longitude: null,
        distanceMeters: null,
        source: 'mapbox',
        providerStatus: status,
        searchRadiusMeters: config.maxRadius,
        boundedDisplay: null,
        boundedObservation: this.createBoundedObservation(null, config.maxRadius, null, true),
        category
      };
      return failedItem;
    }

    // Extract valid candidates with coordinates & distances
    const candidates: Array<{ name: string; lat: number; lon: number; distM: number }> = [];

    for (const f of features) {
      const coordsArr = f.geometry?.coordinates || f.center;
      if (!Array.isArray(coordsArr) || coordsArr.length < 2) continue;

      const lon = Number(coordsArr[0]);
      const lat = Number(coordsArr[1]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const name =
        f.properties?.name ||
        f.properties?.name_preferred ||
        f.text ||
        f.place_name?.split(',')[0] ||
        'Fasilitas Layanan';

      const distM = this.calculateHaversineDistanceMeters(coords.lat, coords.lng, lat, lon);
      candidates.push({ name, lat, lon, distM });
    }

    // Sort candidates by distance ascending
    candidates.sort((a, b) => a.distM - b.distM);

    // Progressive radius evaluation: find nearest within max radius
    const nearestWithinMax = candidates.find((c) => c.distM <= config.maxRadius);

    let resultItem: MapboxPoiItem;

    if (nearestWithinMax) {
      // Determine which stage radius captured this item
      const matchedStage = config.stages.find((stage) => nearestWithinMax.distM <= stage) || config.maxRadius;

      resultItem = {
        name: nearestWithinMax.name,
        latitude: nearestWithinMax.lat,
        longitude: nearestWithinMax.lon,
        distanceMeters: nearestWithinMax.distM,
        source: 'mapbox',
        providerStatus: 'success_exact',
        searchRadiusMeters: matchedStage,
        boundedDisplay: null,
        boundedObservation: this.createBoundedObservation(
          nearestWithinMax.distM,
          matchedStage,
          nearestWithinMax.name,
          false
        ),
        category
      };
    } else {
      // Valid query returned 0 POIs within maximum search radius -> Bounded result
      resultItem = {
        name: `Tidak terdeteksi dalam radius ${(config.maxRadius / 1000).toFixed(0)} km`,
        latitude: null,
        longitude: null,
        distanceMeters: null,
        source: 'mapbox',
        providerStatus: 'success_no_result',
        searchRadiusMeters: config.maxRadius,
        boundedDisplay: `>${(config.maxRadius / 1000).toFixed(0)} km`,
        boundedObservation: this.createBoundedObservation(
          null,
          config.maxRadius,
          `Tidak terdeteksi dalam radius ${(config.maxRadius / 1000).toFixed(0)} km`,
          false
        ),
        category
      };
    }

    LocalApiCache.set(cacheKey, resultItem, this.CACHE_TTL_SECONDS);
    return resultItem;
  }

  /**
   * Discover nearest Hospital / Emergency Healthcare Facility.
   * Search radius: 5km -> 10km -> 15km.
   */
  public static async fetchHospitalProximity(coords: Coordinates): Promise<MapboxPoiItem> {
    return this.searchPoiCategory(coords, 'hospital');
  }

  /**
   * Discover nearest Public Transit Stop / Hub.
   * Search radius: 3km -> 10km.
   */
  public static async fetchTransitProximity(coords: Coordinates): Promise<MapboxPoiItem> {
    return this.searchPoiCategory(coords, 'transit');
  }

  /**
   * Discover nearest Fire Station / Damkar Post.
   * Search radius: 5km -> 10km.
   */
  public static async fetchFireStationProximity(coords: Coordinates): Promise<MapboxPoiItem> {
    return this.searchPoiCategory(coords, 'fire_station');
  }

  // ===========================================================================
  // ROAD / STREET SNAPPING (PRIMARY: MAPBOX, FALLBACK: OSRM)
  // ===========================================================================

  /**
   * Resolves nearest road / street using Mapbox reverse geocoding / Places API.
   * Returns exact snapped distance and street name, or falls back seamlessly to OSRM.
   */
  public static async getNearestRoad(coords: Coordinates): Promise<ApiResult<MapboxRoadResult | null>> {
    const cacheKey = `mapbox_road_v1_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<ApiResult<MapboxRoadResult | null>>(cacheKey);
    if (cached) return cached;

    const token = this.getToken();
    if (token) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng.toFixed(6)},${coords.lat.toFixed(
          6
        )}.json?types=address,street&limit=1&access_token=${encodeURIComponent(token)}`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.features) && json.features.length > 0) {
            const f = json.features[0];
            const coordsArr = f.geometry?.coordinates || f.center;

            if (Array.isArray(coordsArr) && coordsArr.length >= 2) {
              const lon = Number(coordsArr[0]);
              const lat = Number(coordsArr[1]);
              const distM = this.calculateHaversineDistanceMeters(coords.lat, coords.lng, lat, lon);
              const roadName = f.text || f.place_name?.split(',')[0] || null;

              if (distM <= 500) {
                const result: ApiResult<MapboxRoadResult | null> = {
                  data: {
                    nearestRoadName: roadName,
                    distanceToNearestRoadMeters: distM,
                    snappedLocation: new Coordinates(lat, lon),
                    source: 'mapbox',
                    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
                    providerStatus: 'success_exact',
                    boundedObservation: this.createBoundedObservation(distM, 500, roadName, false)
                  },
                  isFallback: false,
                  confidenceLevel: 'high',
                  sourceName: 'Mapbox Street Geocoding'
                };
                LocalApiCache.set(cacheKey, result, this.CACHE_TTL_SECONDS);
                return result;
              } else {
                const boundedResult: ApiResult<MapboxRoadResult | null> = {
                  data: {
                    nearestRoadName: 'Tidak terdeteksi dalam radius 500 m',
                    distanceToNearestRoadMeters: null,
                    snappedLocation: null,
                    source: 'mapbox',
                    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
                    providerStatus: 'success_no_result',
                    boundedObservation: this.createBoundedObservation(null, 500, 'Tidak terdeteksi dalam radius 500 m', false)
                  },
                  isFallback: false,
                  confidenceLevel: 'high',
                  sourceName: 'Mapbox Street Geocoding'
                };
                LocalApiCache.set(cacheKey, boundedResult, this.CACHE_TTL_SECONDS);
                return boundedResult;
              }
            }
          }
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        console.warn('[MapboxSpatialClient] Nearest road query error, triggering OSRM fallback:', err);
      }
    }

    // Fallback: Use OSRM nearest snapping
    const osrmRes = await OsrmRoutingClient.getNearestRoad(coords);
    if (osrmRes.data && !osrmRes.isFallback) {
      const fallbackResult: ApiResult<MapboxRoadResult | null> = {
        data: {
          nearestRoadName: osrmRes.data.roadName,
          distanceToNearestRoadMeters: osrmRes.data.distanceMeters,
          snappedLocation: osrmRes.data.location,
          source: 'osrm',
          endpoint: 'https://router.project-osrm.org/nearest/v1/driving',
          providerStatus: 'success_exact',
          boundedObservation: this.createBoundedObservation(
            osrmRes.data.distanceMeters,
            500,
            osrmRes.data.roadName,
            false
          )
        },
        isFallback: true,
        confidenceLevel: 'medium',
        reason: 'Mapbox unavailable, resolved via OSRM street snapping',
        sourceName: 'OSRM Road-Network Street Snapping (Fallback)'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 3600);
      return fallbackResult;
    }

    const failedResult: ApiResult<MapboxRoadResult | null> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: 'Both Mapbox and OSRM nearest road snapping failed or unavailable',
      sourceName: 'Mapbox / OSRM Road Provider'
    };
    LocalApiCache.set(cacheKey, failedResult, 300);
    return failedResult;
  }

  // ===========================================================================
  // DRIVING ROUTE CALCULATION (PRIMARY: MAPBOX, FALLBACK: OSRM)
  // ===========================================================================

  /**
   * Calculates live driving route duration and road distance between two coordinates.
   * Uses Mapbox Directions API as primary, falling back to OSRM if unavailable.
   * Labeled strictly as "estimated driving travel time" (never "emergency response time").
   */
  public static async calculateDrivingRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<ApiResult<MapboxRouteResult | null>> {
    const cacheKey = `mapbox_route_v1_${origin.lat.toFixed(5)}_${origin.lng.toFixed(5)}_${destination.lat.toFixed(
      5
    )}_${destination.lng.toFixed(5)}_driving`;
    const cached = LocalApiCache.get<ApiResult<MapboxRouteResult | null>>(cacheKey);
    if (cached) return cached;

    const token = this.getToken();
    if (token) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng.toFixed(6)},${origin.lat.toFixed(
          6
        )};${destination.lng.toFixed(6)},${destination.lat.toFixed(
          6
        )}?geometries=geojson&overview=simplified&steps=false&alternatives=false&access_token=${encodeURIComponent(token)}`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();

          if (json.code === 'Ok' && Array.isArray(json.routes) && json.routes.length > 0) {
            const route = json.routes[0];
            const distanceMeters = Math.round(route.distance);
            const durationSeconds = Math.round(route.duration);
            const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10;
            const durationMinutesCeil = Math.max(1, Math.ceil(durationSeconds / 60));

            const result: ApiResult<MapboxRouteResult | null> = {
              data: {
                travelTimeRouteDistanceMeters: distanceMeters,
                travelTimeMinutes: durationMinutes,
                estimatedTravelTimeMinutes: `${durationMinutesCeil} menit`,
                routingSource: 'Mapbox Directions API (driving profile)',
                source: 'mapbox',
                endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
                providerStatus: 'success',
                durationSeconds,
                origin,
                destination
              },
              isFallback: false,
              confidenceLevel: 'high',
              sourceName: 'Mapbox Directions API'
            };
            LocalApiCache.set(cacheKey, result, this.CACHE_TTL_SECONDS);
            return result;
          } else if (json.code === 'NoRoute') {
            const noRouteResult: ApiResult<MapboxRouteResult | null> = {
              data: {
                travelTimeRouteDistanceMeters: null,
                travelTimeMinutes: null,
                estimatedTravelTimeMinutes: 'Rute jalan tidak dapat diakses langsung',
                routingSource: 'Mapbox Directions API (no route found)',
                source: 'mapbox',
                endpoint: 'https://api.mapbox.com/directions/v5/mapbox/driving',
                providerStatus: 'no_route',
                durationSeconds: null,
                origin,
                destination
              },
              isFallback: false,
              confidenceLevel: 'high',
              sourceName: 'Mapbox Directions API'
            };
            LocalApiCache.set(cacheKey, noRouteResult, this.CACHE_TTL_SECONDS);
            return noRouteResult;
          }
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        console.warn('[MapboxSpatialClient] Directions query error, triggering OSRM fallback:', err);
      }
    }

    // Fallback: Use OSRM routing engine
    const osrmRes = await OsrmRoutingClient.calculateDrivingRoute(origin, destination);
    if (osrmRes.data && !osrmRes.isFallback) {
      const fallbackResult: ApiResult<MapboxRouteResult | null> = {
        data: {
          travelTimeRouteDistanceMeters: osrmRes.data.distanceMeters,
          travelTimeMinutes: osrmRes.data.durationMinutes,
          estimatedTravelTimeMinutes: osrmRes.data.durationMinutesFormatted,
          routingSource: 'OSRM Road-Network Driving Engine',
          source: 'osrm',
          endpoint: 'https://router.project-osrm.org/route/v1/driving',
          providerStatus: 'success',
          durationSeconds: osrmRes.data.durationSeconds,
          origin,
          destination
        },
        isFallback: true,
        confidenceLevel: 'medium',
        reason: 'Mapbox Directions unavailable, resolved via OSRM routing',
        sourceName: 'OSRM Road-Network Routing Engine (Fallback)'
      };
      LocalApiCache.set(cacheKey, fallbackResult, 3600);
      return fallbackResult;
    }

    const failedResult: ApiResult<MapboxRouteResult | null> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: 'Both Mapbox and OSRM routing calculations failed or unavailable',
      sourceName: 'Mapbox / OSRM Route Provider'
    };
    LocalApiCache.set(cacheKey, failedResult, 300);
    return failedResult;
  }

  /**
   * Fetches full multi-category transport, road snapping, and emergency POI proximity summary.
   */
  public static async fetchProximitySummary(coords: Coordinates): Promise<ApiResult<MapboxSpatialSummary>> {
    const [hospital, transit, fireStation, roadRes] = await Promise.all([
      this.fetchHospitalProximity(coords),
      this.fetchTransitProximity(coords),
      this.fetchFireStationProximity(coords),
      this.getNearestRoad(coords)
    ]);

    let routeResult: MapboxRouteResult | null = null;

    // If hospital was found with exact coordinate, calculate driving route from assessmentCoordinates
    if (
      hospital.providerStatus === 'success_exact' &&
      hospital.latitude !== null &&
      hospital.longitude !== null
    ) {
      const hospCoords = new Coordinates(hospital.latitude, hospital.longitude);
      const routeRes = await this.calculateDrivingRoute(coords, hospCoords);
      if (routeRes.data) {
        routeResult = routeRes.data;
      }
    }

    const isAnyError =
      hospital.providerStatus === 'error' ||
      transit.providerStatus === 'error' ||
      fireStation.providerStatus === 'error';
    const isAnyTimeout =
      hospital.providerStatus === 'timeout' ||
      transit.providerStatus === 'timeout' ||
      fireStation.providerStatus === 'timeout';
    const overallStatus: MapboxProviderStatus = isAnyTimeout ? 'timeout' : isAnyError ? 'error' : 'success_exact';

    const summary: MapboxSpatialSummary = {
      hospital,
      transit,
      fireStation,
      nearestRoad: roadRes.data || null,
      route: routeResult,
      evaluatedAt: new Date().toISOString(),
      providerStatus: overallStatus
    };

    if (overallStatus === 'error' || overallStatus === 'timeout') {
      return {
        data: summary,
        isFallback: true,
        confidenceLevel: 'low',
        reason: overallStatus === 'timeout' ? 'Mapbox API request timed out' : 'Mapbox API unreachable or no token provided',
        sourceName: 'Mapbox Spatial POI Discovery'
      };
    }

    return {
      data: summary,
      isFallback: false,
      confidenceLevel: 'high',
      sourceName: 'Mapbox Spatial POI Discovery'
    };
  }
}
