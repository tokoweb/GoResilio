import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface RouteEstimate {
  distanceMeters: number;                  // Live OSRM routed road distance in meters
  durationSeconds: number;                // Live OSRM free-flow route duration in seconds (without live traffic)
  durationMinutes: number;                // Live OSRM route duration in fractional minutes
  durationMinutesFormatted: string;       // Formatted single duration (e.g. "4 Menit")
  estimatedDisplayRange?: string;         // GoTangguh presentation estimate calculation, NOT raw OSRM data
  routingProfile?: 'driving';             // OSRM routing profile used
  source: 'OSRM Road-Network Routing Engine'; // Authoritative road network routing engine
  dataVersion?: string;                   // OSRM data version timestamp if provided by server
}

export interface NearestRoadResult {
  distanceMeters: number;                  // Live OSRM snapped distance in meters to road centerline
  roadName: string;                       // Name of nearest mapped road segment in the OSRM network
  location: Coordinates;                  // Snapped point coordinates on road centerline
  routingProfile?: 'driving';             // OSRM snapping profile used
  dataVersion?: string;                   // OSRM data version timestamp if provided by server
}

/**
 * Open Source Routing Machine (OSRM) Road-Network Routing Client
 * Official API: http://project-osrm.org/docs/v5.24.0/api/#route-service
 * Free street network routing and road snapping based on OpenStreetMap road data (standard speed profiles, no real-time traffic).
 */
export class OsrmRoutingClient {
  /**
   * Alternate OSRM route servers used strictly as a high-availability fallback pool.
   * They are alternate routing instances using OSM-derived road networks.
   */
  private static readonly OSRM_ENDPOINTS = [
    'https://router.project-osrm.org/route/v1/driving',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving'
  ];

  /**
   * Alternate OSRM nearest-snapping servers used strictly as a high-availability fallback pool.
   */
  private static readonly NEAREST_ENDPOINTS = [
    'https://router.project-osrm.org/nearest/v1/driving',
    'https://routing.openstreetmap.de/routed-car/nearest/v1/driving'
  ];

  /**
   * Snaps a coordinate to the nearest mapped road segment in the OSRM network
   * and returns live distance in meters and road name.
   * Returns null if OSRM servers are unreachable without fabricating synthetic distances.
   */
  public static async getNearestRoad(coords: Coordinates): Promise<ApiResult<NearestRoadResult | null>> {
    const cacheKey = `osrm_near_v3_${coords.lat.toFixed(5)}_${coords.lng.toFixed(5)}`;
    const cached = LocalApiCache.get<ApiResult<NearestRoadResult | null>>(cacheKey);
    if (cached) return cached;

    const coordsParam = `${coords.lng.toFixed(6)},${coords.lat.toFixed(6)}`;

    for (const endpoint of this.NEAREST_ENDPOINTS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const url = `${endpoint}/${coordsParam}?number=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)' },
          signal: controller.signal
        });

        if (res.ok) {
          const json = await res.json();
          if (
            json.code === 'Ok' &&
            Array.isArray(json.waypoints) &&
            json.waypoints.length > 0 &&
            typeof json.waypoints[0].distance === 'number' &&
            isFinite(json.waypoints[0].distance) &&
            Array.isArray(json.waypoints[0].location) &&
            json.waypoints[0].location.length >= 2 &&
            isFinite(json.waypoints[0].location[0]) &&
            isFinite(json.waypoints[0].location[1])
          ) {
            const wp = json.waypoints[0];
            const roadName = typeof wp.name === 'string' && wp.name.trim().length > 0
              ? wp.name.trim()
              : 'Nama jalan tidak tersedia (OSRM)';

            const result: ApiResult<NearestRoadResult | null> = {
              data: {
                distanceMeters: Math.round(wp.distance),
                roadName,
                location: new Coordinates(wp.location[1], wp.location[0]),
                routingProfile: 'driving',
                dataVersion: typeof json.data_version === 'string' ? json.data_version : undefined
              },
              isFallback: false,
              confidenceLevel: 'medium', // Calibrated internal confidence for live OSRM response
              sourceName: 'OSRM Road-Network Street Snapping'
            };
            LocalApiCache.set(cacheKey, result, 7200);
            return result;
          }
        }
      } catch {
        // Try next alternate endpoint
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const fallbackResult: ApiResult<NearestRoadResult | null> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: 'All OSRM nearest endpoints unavailable or returned invalid response',
      sourceName: 'OSRM Road-Network Street Snapping'
    };

    // Cache transient failure briefly (5 minutes)
    LocalApiCache.set(cacheKey, fallbackResult, 300);
    return fallbackResult;
  }

  /**
   * Calculate live driving route distance and free-flow duration between two coordinates via OSRM.
   * Returns null if OSRM routing servers are unreachable without fabricating synthetic models.
   */
  public static async calculateDrivingRoute(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<ApiResult<RouteEstimate | null>> {
    const cacheKey = `osrm_route_v3_${origin.lat.toFixed(4)}_${origin.lng.toFixed(4)}_${destination.lat.toFixed(4)}_${destination.lng.toFixed(4)}`;
    const cached = LocalApiCache.get<ApiResult<RouteEstimate | null>>(cacheKey);
    if (cached) return cached;

    // Coordinate string format for OSRM: {lon},{lat};{lon},{lat}
    const coordsParam = `${origin.lng.toFixed(6)},${origin.lat.toFixed(6)};${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`;

    for (const endpoint of this.OSRM_ENDPOINTS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const url = `${endpoint}/${coordsParam}?overview=false&alternatives=false&steps=false`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
          },
          signal: controller.signal
        });

        if (res.ok) {
          const json = await res.json();
          if (
            json.code === 'Ok' &&
            Array.isArray(json.routes) &&
            json.routes.length > 0 &&
            typeof json.routes[0].distance === 'number' &&
            isFinite(json.routes[0].distance) &&
            typeof json.routes[0].duration === 'number' &&
            isFinite(json.routes[0].duration)
          ) {
            const route = json.routes[0];
            const distanceMeters = Math.round(route.distance);
            const durationSeconds = Math.round(route.duration);
            const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10;
            const durationMinutesCeil = Math.max(1, Math.ceil(durationSeconds / 60));

            const estimate: RouteEstimate = {
              distanceMeters,
              durationSeconds,
              durationMinutes,
              durationMinutesFormatted: `${durationMinutesCeil} Menit`,
              estimatedDisplayRange: `${durationMinutesCeil} Menit`,
              routingProfile: 'driving',
              source: 'OSRM Road-Network Routing Engine',
              dataVersion: typeof json.data_version === 'string' ? json.data_version : undefined
            };

            const result: ApiResult<RouteEstimate | null> = {
              data: estimate,
              isFallback: false,
              confidenceLevel: 'medium', // Calibrated internal confidence for live OSRM response
              sourceName: 'OSRM Road-Network Routing Engine'
            };

            LocalApiCache.set(cacheKey, result, 7200);
            return result;
          }
        }
      } catch {
        // Try next alternate endpoint
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const fallbackResult: ApiResult<RouteEstimate | null> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: 'All OSRM route endpoints unavailable or returned invalid response',
      sourceName: 'OSRM Road-Network Routing Engine'
    };

    // Cache transient failure briefly (5 minutes)
    LocalApiCache.set(cacheKey, fallbackResult, 300);
    return fallbackResult;
  }
}
