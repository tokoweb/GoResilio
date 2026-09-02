import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import { OsrmRoutingClient } from './OsrmRoutingClient';
import type { BoundedSpatialDistance, SpatialObservationState } from '../../domain/types/feature.types';
import type { NormalizedTransportComponent } from '../../domain/types/transport.types';

export type SpatialQueryState = 'success' | 'nodata' | 'error' | 'timeout';

export interface FieldProvenance {
  nearestRoad: 'osrm-snap' | 'osm-local-query' | 'not-found-in-radius' | 'source_unavailable';
  arterialRoad: 'osm-geom-segment' | 'osm-center-query' | 'not-found-in-radius' | 'source_unavailable';
  nearestTransit: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  transitHub?: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  hospital: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  healthcareFacility: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  fireStation: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  waterway: 'osm-geom-segment' | 'osm-center-query' | 'not-found-in-radius' | 'source_unavailable';
  greenSpace: 'osm-query' | 'not-found-in-radius' | 'source_unavailable';
  routing: 'osrm-live-route' | 'not-applicable';
}

export interface OsmAuditTrail {
  source: 'openstreetmap_overpass_live' | 'osrm_street_snapping_fallback' | 'cached_live';
  queryRadiusMeters: {
    hospital: number;
    healthcareFacility: number;
    fireStation: number;
    waterway: number;
    transit: number;
    arterial: number;
    localRoad: number;
    green: number;
  };
  progressiveDiscovery: {
    waterwayRadiusM: number;
    arterialRadiusM: number;
    hospitalRadiusM: number;
    fireStationRadiusM: number;
    transitRadiusM: number;
    greenRadiusM: number;
  };
  endpointsUsed: Record<string, string>;
  totalElementsFetched: number;
  categoryCounts: {
    waterways: number;
    localRoads: number;
    arterials: number;
    transit: number;
    hospitals: number;
    clinicsAndDoctors: number;
    fireStations: number;
    greenParcels: number;
    totalLandCover: number;
  };
  calculationMethod: {
    selectedWaterwayDistanceMethod: 'geometry_segment' | 'center' | 'none';
    selectedArterialDistanceMethod: 'geometry_segment' | 'center' | 'none';
    poiDistances: 'haversine_to_representative_node_or_center';
    roadSnapping: 'osrm_nearest_snapping' | 'osm_local_road_haversine' | 'none';
    greenMetric: 'ratio_of_green_to_total_osm_landcover_features_by_count_proxy';
    routeEndpointMethod: 'hospital_representative_point';
  };
  routingStatus: 'osrm_live_route_confirmed' | 'route_calculation_failed' | 'not_applicable';
  fallbackUsed: boolean;
  notes?: string;
}

export interface SpatialProximityData {
  // Waterway Proximity (Rivers, Canals, Streams, Drains)
  distanceToNearestWaterwayMeters: number | null;
  nearestWaterwayName: string;
  nearestWaterwayRawName?: string | null;
  waterwayObservation?: BoundedSpatialDistance;
  waterwayBounded?: BoundedSpatialDistance;
  distanceToRiverMeters: number | null;
  nearestRiverName: string;

  // Green Land-Cover Density
  greenFeatureRatioPct: number | null;
  greenSpaceRatioPct: number | null;

  // Road Access & Arterials
  distanceToNearestRoadMeters: number | null;
  nearestRoadName: string;
  nearestRoadRawName?: string | null;
  nearestRoadObservation?: BoundedSpatialDistance;
  distanceToArterialMeters: number | null;
  nearestArterialName: string;
  nearestArterialRawName?: string | null;
  arterialObservation?: BoundedSpatialDistance;
  arterialBounded?: BoundedSpatialDistance;
  arterialHighwayClass?: string | null;

  // Transit & Public Amenities
  distanceToNearestTransitMeters: number | null;
  distanceToTransitHubMeters: number | null;
  nearestTransitName: string;
  nearestTransitRawName?: string | null;
  transitObservation?: BoundedSpatialDistance;
  transitBounded?: BoundedSpatialDistance;
  transitType?: string | null;

  // Emergency Medical Facilities
  distanceToHospitalMeters: number | null;
  nearestHospitalName: string;
  nearestHospitalRawName?: string | null;
  hospitalObservation?: BoundedSpatialDistance;
  hospitalBounded?: BoundedSpatialDistance;
  hospitalFacilityType?: string | null;
  hospitalCoordinates?: { latitude: number; longitude: number } | null;
  distanceToHealthcareFacilityMeters: number | null;
  nearestHealthcareFacilityName: string;
  healthcareFacilityObservation?: BoundedSpatialDistance;
  distanceToClinicMeters?: number | null;
  nearestClinicName?: string;
  distanceToPharmacyMeters?: number | null;
  nearestPharmacyName?: string;

  // Emergency & Public Safety Services
  distanceToFireStationMeters: number | null;
  nearestFireStationName: string;
  nearestFireStationRawName?: string | null;
  fireStationObservation?: BoundedSpatialDistance;
  fireStationBounded?: BoundedSpatialDistance;
  distanceToPoliceStationMeters?: number | null;
  nearestPoliceStationName?: string;

  // Evacuation & Assembly Points
  distanceToAssemblyPointMeters?: number | null;
  nearestAssemblyPointName?: string;
  nearestAssemblyPointRawName?: string | null;
  assemblyPointObservation?: BoundedSpatialDistance;
  assemblyPointBounded?: BoundedSpatialDistance;
  assemblyPointIsOfficial?: boolean;
  assemblyPointFacilityType?: string | null;
  assemblyPointCoordinates?: { latitude: number; longitude: number } | null;
  assemblyPointTravelTimeMinutes?: number | null;
  assemblyPointTravelTimeDisplay?: string;
  assemblyPointRouteDistanceMeters?: number | null;

  // Educational Facilities
  distanceToSchoolMeters?: number | null;
  nearestSchoolName?: string;

  // Emergency Driving Route (OSRM)
  travelTimeMinutes?: number | null;
  travelTimeDisplay?: string;
  estimatedTravelTimeMinutes?: string;
  travelTimeRouteDistanceMeters?: number | null;
  routingSource?: string;
  provenance: FieldProvenance;
  queryStatus?: {
    hospital: SpatialQueryState;
    healthcareFacility: SpatialQueryState;
    fireStation: SpatialQueryState;
    assemblyPoint?: SpatialQueryState;
    waterway: SpatialQueryState;
    transit: SpatialQueryState;
    arterial: SpatialQueryState;
    nearestRoad: SpatialQueryState;
    greenSpace: SpatialQueryState;
  };
  auditTrail?: OsmAuditTrail;
}

export class OverpassOsmClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';

  /**
   * High-availability Overpass interpreter endpoint pool with automatic failover.
   */
  public static readonly ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter'
  ];

  /**
   * Retrieves configurable timeout in milliseconds.
   */
  public static getTimeoutMs(): number {
    if (typeof process !== 'undefined' && process.env?.OVERPASS_TIMEOUT_MS) {
      const parsed = parseInt(process.env.OVERPASS_TIMEOUT_MS, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 8000;
  }

  /**
   * Builds canonical BoundedSpatialDistance object respecting the spatial observation states.
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
        name: featureName || 'Data tidak dapat dimuat (Sumber Overpass tidak merespon)'
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
   * Executes an Overpass QL query with endpoint failover and per-request timeout abort control.
   */
  public static async executeOverpassQuery(
    query: string,
    timeoutMs?: number
  ): Promise<{ elements: any[]; endpoint: string; durationMs: number }> {
    const effectiveTimeout = timeoutMs || this.getTimeoutMs();
    let lastError: Error | null = null;
    let wasTimeout = false;

    for (const endpoint of this.ENDPOINTS) {
      const controller = new AbortController();
      const startTime = Date.now();
      const timeoutId = setTimeout(() => {
        wasTimeout = true;
        controller.abort();
      }, effectiveTimeout);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.USER_AGENT
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal
        });

        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.elements)) {
            return {
              elements: json.elements,
              endpoint,
              durationMs: Date.now() - startTime
            };
          }
        }
        lastError = new Error(`Overpass endpoint ${endpoint} returned HTTP ${res.status}`);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          lastError = new Error(`Overpass query timed out after ${effectiveTimeout}ms on ${endpoint}`);
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const failureMsg = wasTimeout
      ? `All Overpass endpoints timed out (limit: ${effectiveTimeout}ms)`
      : (lastError ? lastError.message : 'All Overpass endpoints unavailable');
    const err = new Error(failureMsg);
    if (wasTimeout) err.name = 'TimeoutError';
    throw err;
  }

  /**
   * Evaluates perpendicular minimum distance from query point to polyline segments.
   */
  public static getPointToPolylineDistanceMeters(
    coords: Coordinates,
    geometry: Array<{ lat: number; lon: number }>
  ): { distM: number; closestCoord: Coordinates } | null {
    if (!Array.isArray(geometry) || geometry.length === 0) return null;

    const R = 6371000;
    const latRad = (coords.lat * Math.PI) / 180;
    const cosLat = Math.cos(latRad);

    const toLocalMeters = (ptLat: number, ptLon: number): { x: number; y: number } => {
      const dLonRad = ((ptLon - coords.lng) * Math.PI) / 180;
      const dLatRad = ((ptLat - coords.lat) * Math.PI) / 180;
      return {
        x: dLonRad * R * cosLat,
        y: dLatRad * R
      };
    };

    let minDistSq = Infinity;
    let closestPtLocal = { x: 0, y: 0 };

    if (geometry.length === 1) {
      const pt = geometry[0];
      const loc = toLocalMeters(Number(pt.lat), Number(pt.lon));
      const dist = Math.round(Math.sqrt(loc.x * loc.x + loc.y * loc.y));
      return { distM: dist, closestCoord: new Coordinates(Number(pt.lat), Number(pt.lon)) };
    }

    for (let i = 0; i < geometry.length - 1; i++) {
      const p1 = geometry[i];
      const p2 = geometry[i + 1];

      const p1Lat = Number(p1.lat);
      const p1Lon = Number(p1.lon);
      const p2Lat = Number(p2.lat);
      const p2Lon = Number(p2.lon);
      if (isNaN(p1Lat) || isNaN(p1Lon) || isNaN(p2Lat) || isNaN(p2Lon)) continue;

      const a = toLocalMeters(p1Lat, p1Lon);
      const b = toLocalMeters(p2Lat, p2Lon);

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;

      let projX = a.x;
      let projY = a.y;

      if (lenSq > 0) {
        let t = -(a.x * dx + a.y * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        projX = a.x + t * dx;
        projY = a.y + t * dy;
      }

      const distSq = projX * projX + projY * projY;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestPtLocal = { x: projX, y: projY };
      }
    }

    if (minDistSq === Infinity) return null;

    const closestLat = coords.lat + (closestPtLocal.y / R) * (180 / Math.PI);
    const closestLon = coords.lng + (closestPtLocal.x / (R * cosLat)) * (180 / Math.PI);

    return {
      distM: Math.round(Math.sqrt(minDistSq)),
      closestCoord: new Coordinates(closestLat, closestLon)
    };
  }

  // ===========================================================================
  // 1. INDEPENDENT MAJOR / ARTERIAL ROAD QUERY (Progressive 5km -> 10km -> 15km)
  // ===========================================================================
  public static async getNearestMajorRoad(
    coords: Coordinates
  ): Promise<ApiResult<NormalizedTransportComponent>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const cacheKey = `overpass_major_road_${lat}_${lon}`;
    const cached = LocalApiCache.get<ApiResult<NormalizedTransportComponent>>(cacheKey);
    if (cached) return cached;

    const stages = [5000, 10000, 15000];
    let successfulEndpoint: string | null = null;
    let queryTimedOut = false;
    let queryErrored = false;
    let lastErrorMsg = '';

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
way["highway"~"^(motorway|trunk|primary|secondary)$"](around:${radius},${lat},${lon});
out body geom 30;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);
        successfulEndpoint = endpoint;

        const candidates: Array<{
          name: string | null;
          highwayClass: string;
          distM: number;
        }> = [];

        for (const el of elements) {
          if (el.type !== 'way' || !el.tags?.highway) continue;
          const highwayClass = String(el.tags.highway);
          const rawName = el.tags.name || el.tags['name:id'] || el.tags['name:en'] || el.tags.ref || null;

          let distM: number | null = null;
          if (Array.isArray(el.geometry) && el.geometry.length > 0) {
            const seg = this.getPointToPolylineDistanceMeters(coords, el.geometry);
            if (seg) distM = seg.distM;
          } else if (el.center && el.center.lat != null && el.center.lon != null) {
            distM = Math.round(coords.distanceToKm(new Coordinates(el.center.lat, el.center.lon)) * 1000);
          }

          if (distM !== null && distM <= radius) {
            candidates.push({ name: rawName, highwayClass, distM });
          }
        }

        // Sort ascending by distance
        candidates.sort((a, b) => a.distM - b.distM);

        if (candidates.length > 0) {
          const nearest = candidates[0];
          const distKm = Math.round((nearest.distM / 1000) * 10) / 10;
          const displayName = nearest.name || `Koridor Jalan ${nearest.highwayClass.toUpperCase()}`;

          const result: ApiResult<NormalizedTransportComponent> = {
            data: {
              name: displayName,
              distanceMeters: nearest.distM,
              distanceKm: distKm,
              status: 'success_exact',
              source: 'overpass',
              provider: 'OpenStreetMap Overpass Polyline Segments',
              searchRadiusMeters: radius,
              searchRadiusKm: Math.round(radius / 1000),
              relation: 'exact',
              lowerBoundMeters: null,
              endpoint: successfulEndpoint,
              isFallback: false,
              type: 'major_road',
              highwayClass: nearest.highwayClass,
              boundedObservation: this.createBoundedObservation(nearest.distM, radius, displayName, false)
            },
            isFallback: false,
            confidenceLevel: 'high',
            sourceName: 'OpenStreetMap Overpass Polyline Segments'
          };
          LocalApiCache.set(cacheKey, result, 7200);
          return result;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'))) {
          queryTimedOut = true;
        } else {
          queryErrored = true;
        }
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    // If query succeeded up to 15km with 0 candidates -> success_bounded (>15 km)
    if (successfulEndpoint && !queryTimedOut && !queryErrored) {
      const maxRadius = stages[stages.length - 1];
      const boundedResult: ApiResult<NormalizedTransportComponent> = {
        data: {
          name: 'Tidak terdeteksi jalan arteri/utama dalam radius 15 km',
          distanceMeters: null,
          distanceKm: null,
          status: 'success_bounded',
          source: 'overpass',
          provider: 'OpenStreetMap Overpass Polyline Segments',
          searchRadiusMeters: maxRadius,
          searchRadiusKm: 15,
          relation: 'greater_than',
          lowerBoundMeters: maxRadius,
          endpoint: successfulEndpoint,
          isFallback: false,
          type: 'major_road',
          highwayClass: null,
          boundedObservation: this.createBoundedObservation(null, maxRadius, 'Tidak terdeteksi dalam radius 15 km', false)
        },
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'OpenStreetMap Overpass Polyline Segments'
      };
      LocalApiCache.set(cacheKey, boundedResult, 3600);
      return boundedResult;
    }

    // Query failed or timed out
    const failureStatus = queryTimedOut ? 'timeout' : 'error';
    const failResult: ApiResult<NormalizedTransportComponent> = {
      data: {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status: failureStatus,
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Polyline Segments (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        endpoint: null,
        isFallback: true,
        type: 'major_road',
        error: lastErrorMsg || `Overpass major road query ${failureStatus}`,
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      },
      isFallback: true,
      confidenceLevel: 'low',
      reason: lastErrorMsg || `Overpass major road query ${failureStatus}`,
      sourceName: 'OpenStreetMap Overpass Polyline Segments'
    };
    LocalApiCache.set(cacheKey, failResult, 300);
    return failResult;
  }

  // ===========================================================================
  // 2. INDEPENDENT HEALTHCARE QUERY (Progressive 5km -> 10km -> 15km)
  // ===========================================================================
  public static async getNearestHealthcare(
    coords: Coordinates
  ): Promise<ApiResult<NormalizedTransportComponent>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const cacheKey = `overpass_healthcare_${lat}_${lon}`;
    const cached = LocalApiCache.get<ApiResult<NormalizedTransportComponent>>(cacheKey);
    if (cached) return cached;

    const stages = [5000, 10000, 15000];
    let successfulEndpoint: string | null = null;
    let queryTimedOut = false;
    let queryErrored = false;
    let lastErrorMsg = '';

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
(
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  way["amenity"="hospital"](around:${radius},${lat},${lon});
  node["healthcare"="hospital"](around:${radius},${lat},${lon});
  way["healthcare"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="clinic"](around:${radius},${lat},${lon});
  way["amenity"="clinic"](around:${radius},${lat},${lon});
  node["healthcare"="clinic"](around:${radius},${lat},${lon});
);
out center 40;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);
        successfulEndpoint = endpoint;

        const candidates: Array<{
          name: string;
          facilityType: 'hospital' | 'clinic';
          isHospital: boolean;
          distM: number;
          lat: number;
          lon: number;
        }> = [];

        for (const el of elements) {
          const isHosp = el.tags?.amenity === 'hospital' || el.tags?.healthcare === 'hospital';
          const isClinic = el.tags?.amenity === 'clinic' || el.tags?.healthcare === 'clinic';
          if (!isHosp && !isClinic) continue;

          const elLat = el.lat != null ? Number(el.lat) : (el.center && el.center.lat != null ? Number(el.center.lat) : null);
          const elLon = el.lon != null ? Number(el.lon) : (el.center && el.center.lon != null ? Number(el.center.lon) : null);
          if (elLat == null || elLon == null || isNaN(elLat) || isNaN(elLon)) continue;

          const distM = Math.round(coords.distanceToKm(new Coordinates(elLat, elLon)) * 1000);
          if (distM <= radius) {
            const rawName = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] || (isHosp ? 'Rumah Sakit' : 'Klinik Kesehatan');
            candidates.push({
              name: rawName,
              facilityType: isHosp ? 'hospital' : 'clinic',
              isHospital: isHosp,
              distM,
              lat: elLat,
              lon: elLon
            });
          }
        }

        // Sort: prioritize actual hospitals if within distance, then sort ascending by distance
        candidates.sort((a, b) => {
          if (a.isHospital && !b.isHospital && a.distM <= b.distM + 2000) return -1;
          if (!a.isHospital && b.isHospital && b.distM <= a.distM + 2000) return 1;
          return a.distM - b.distM;
        });

        if (candidates.length > 0) {
          const nearest = candidates[0];
          const distKm = Math.round((nearest.distM / 1000) * 10) / 10;

          const result: ApiResult<NormalizedTransportComponent> = {
            data: {
              name: nearest.name,
              distanceMeters: nearest.distM,
              distanceKm: distKm,
              status: 'success_exact',
              source: 'overpass',
              provider: 'OpenStreetMap Overpass Healthcare Query',
              searchRadiusMeters: radius,
              searchRadiusKm: Math.round(radius / 1000),
              relation: 'exact',
              lowerBoundMeters: null,
              endpoint: successfulEndpoint,
              isFallback: false,
              type: 'healthcare',
              facilityType: nearest.facilityType,
              coordinates: { latitude: nearest.lat, longitude: nearest.lon },
              latitude: nearest.lat,
              longitude: nearest.lon,
              boundedObservation: this.createBoundedObservation(nearest.distM, radius, nearest.name, false)
            },
            isFallback: false,
            confidenceLevel: 'high',
            sourceName: 'OpenStreetMap Overpass Healthcare Query'
          };
          LocalApiCache.set(cacheKey, result, 7200);
          return result;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'))) {
          queryTimedOut = true;
        } else {
          queryErrored = true;
        }
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    if (successfulEndpoint && !queryTimedOut && !queryErrored) {
      const maxRadius = stages[stages.length - 1];
      const boundedResult: ApiResult<NormalizedTransportComponent> = {
        data: {
          name: 'Tidak terdeteksi faskes rujukan dalam radius 15 km',
          distanceMeters: null,
          distanceKm: null,
          status: 'success_bounded',
          source: 'overpass',
          provider: 'OpenStreetMap Overpass Healthcare Query',
          searchRadiusMeters: maxRadius,
          searchRadiusKm: 15,
          relation: 'greater_than',
          lowerBoundMeters: maxRadius,
          endpoint: successfulEndpoint,
          isFallback: false,
          type: 'healthcare',
          facilityType: null,
          boundedObservation: this.createBoundedObservation(null, maxRadius, 'Tidak terdeteksi dalam radius 15 km', false)
        },
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'OpenStreetMap Overpass Healthcare Query'
      };
      LocalApiCache.set(cacheKey, boundedResult, 3600);
      return boundedResult;
    }

    const failureStatus = queryTimedOut ? 'timeout' : 'error';
    const failResult: ApiResult<NormalizedTransportComponent> = {
      data: {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status: failureStatus,
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Healthcare Query (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        endpoint: null,
        isFallback: true,
        type: 'healthcare',
        error: lastErrorMsg || `Overpass healthcare query ${failureStatus}`,
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      },
      isFallback: true,
      confidenceLevel: 'low',
      reason: lastErrorMsg || `Overpass healthcare query ${failureStatus}`,
      sourceName: 'OpenStreetMap Overpass Healthcare Query'
    };
    LocalApiCache.set(cacheKey, failResult, 300);
    return failResult;
  }

  // ===========================================================================
  // 3. INDEPENDENT PUBLIC TRANSIT QUERY (Progressive 5km -> 10km -> 15km)
  // ===========================================================================
  public static async getNearestTransit(
    coords: Coordinates
  ): Promise<ApiResult<NormalizedTransportComponent>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const cacheKey = `overpass_transit_${lat}_${lon}`;
    const cached = LocalApiCache.get<ApiResult<NormalizedTransportComponent>>(cacheKey);
    if (cached) return cached;

    const stages = [5000, 10000, 15000];
    let successfulEndpoint: string | null = null;
    let queryTimedOut = false;
    let queryErrored = false;
    let lastErrorMsg = '';

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
(
  node["railway"~"^(station|halt|subway_entrance)$"](around:${radius},${lat},${lon});
  node["amenity"~"^(bus_station|ferry_terminal)$"](around:${radius},${lat},${lon});
  node["highway"="bus_stop"](around:${radius},${lat},${lon});
  node["public_transport"~"^(platform|stop_position|station)$"](around:${radius},${lat},${lon});
);
out body 40;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);
        successfulEndpoint = endpoint;

        const candidates: Array<{
          name: string;
          transitType: string;
          distM: number;
          lat: number;
          lon: number;
        }> = [];

        for (const el of elements) {
          const elLat = el.lat != null ? Number(el.lat) : null;
          const elLon = el.lon != null ? Number(el.lon) : null;
          if (elLat == null || elLon == null || isNaN(elLat) || isNaN(elLon)) continue;

          const distM = Math.round(coords.distanceToKm(new Coordinates(elLat, elLon)) * 1000);
          if (distM <= radius) {
            let transitType = 'bus_stop';
            if (el.tags?.railway === 'station' || el.tags?.railway === 'subway_entrance') transitType = 'station';
            else if (el.tags?.amenity === 'bus_station') transitType = 'bus_station';
            else if (el.tags?.amenity === 'ferry_terminal') transitType = 'ferry_terminal';

            const rawName = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] ||
              (transitType === 'station' ? 'Stasiun Kereta' : transitType === 'bus_station' ? 'Terminal Bus' : 'Halte / Stop Transit');

            candidates.push({
              name: rawName,
              transitType,
              distM,
              lat: elLat,
              lon: elLon
            });
          }
        }

        // Sort ascending by distance
        candidates.sort((a, b) => a.distM - b.distM);

        if (candidates.length > 0) {
          const nearest = candidates[0];
          const distKm = Math.round((nearest.distM / 1000) * 10) / 10;

          const result: ApiResult<NormalizedTransportComponent> = {
            data: {
              name: nearest.name,
              distanceMeters: nearest.distM,
              distanceKm: distKm,
              status: 'success_exact',
              source: 'overpass',
              provider: 'OpenStreetMap Overpass Transit Query',
              searchRadiusMeters: radius,
              searchRadiusKm: Math.round(radius / 1000),
              relation: 'exact',
              lowerBoundMeters: null,
              endpoint: successfulEndpoint,
              isFallback: false,
              type: 'transit',
              transitType: nearest.transitType,
              coordinates: { latitude: nearest.lat, longitude: nearest.lon },
              latitude: nearest.lat,
              longitude: nearest.lon,
              boundedObservation: this.createBoundedObservation(nearest.distM, radius, nearest.name, false)
            },
            isFallback: false,
            confidenceLevel: 'high',
            sourceName: 'OpenStreetMap Overpass Transit Query'
          };
          LocalApiCache.set(cacheKey, result, 7200);
          return result;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'))) {
          queryTimedOut = true;
        } else {
          queryErrored = true;
        }
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    if (successfulEndpoint && !queryTimedOut && !queryErrored) {
      const maxRadius = stages[stages.length - 1];
      const boundedResult: ApiResult<NormalizedTransportComponent> = {
        data: {
          name: 'Tidak terdeteksi simpul transit dalam radius 15 km',
          distanceMeters: null,
          distanceKm: null,
          status: 'success_bounded',
          source: 'overpass',
          provider: 'OpenStreetMap Overpass Transit Query',
          searchRadiusMeters: maxRadius,
          searchRadiusKm: 15,
          relation: 'greater_than',
          lowerBoundMeters: maxRadius,
          endpoint: successfulEndpoint,
          isFallback: false,
          type: 'transit',
          transitType: null,
          boundedObservation: this.createBoundedObservation(null, maxRadius, 'Tidak terdeteksi dalam radius 15 km', false)
        },
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'OpenStreetMap Overpass Transit Query'
      };
      LocalApiCache.set(cacheKey, boundedResult, 3600);
      return boundedResult;
    }

    const failureStatus = queryTimedOut ? 'timeout' : 'error';
    const failResult: ApiResult<NormalizedTransportComponent> = {
      data: {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status: failureStatus,
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Transit Query (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        endpoint: null,
        isFallback: true,
        type: 'transit',
        error: lastErrorMsg || `Overpass transit query ${failureStatus}`,
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      },
      isFallback: true,
      confidenceLevel: 'low',
      reason: lastErrorMsg || `Overpass transit query ${failureStatus}`,
      sourceName: 'OpenStreetMap Overpass Transit Query'
    };
    LocalApiCache.set(cacheKey, failResult, 300);
    return failResult;
  }

  // ===========================================================================
  // 4. INDEPENDENT WATERWAY QUERY (Progressive 2.5km -> 5km)
  // ===========================================================================
  public static async getNearestWaterway(
    coords: Coordinates
  ): Promise<{ distanceMeters: number | null; name: string | null; rawName: string | null; endpoint: string | null; status: SpatialQueryState }> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const stages = [2500, 5000];

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
(
  way["waterway"~"^(river|canal|stream|drain|ditch)$"](around:${radius},${lat},${lon});
  node["waterway"="river"](around:${radius},${lat},${lon});
  way["natural"~"^(water|coastline)$"](around:${radius},${lat},${lon});
);
out body geom 30;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);

        let minWaterwayDist: number | null = null;
        let waterwayName: string | null = null;
        let waterwayRawName: string | null = null;

        for (const el of elements) {
          const rawName = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] || null;
          let distM: number | null = null;

          if (Array.isArray(el.geometry) && el.geometry.length > 0) {
            const seg = this.getPointToPolylineDistanceMeters(coords, el.geometry);
            if (seg) distM = seg.distM;
          } else if (el.lat != null && el.lon != null) {
            distM = Math.round(coords.distanceToKm(new Coordinates(el.lat, el.lon)) * 1000);
          }

          if (distM !== null && distM <= radius) {
            if (minWaterwayDist === null || distM < minWaterwayDist) {
              minWaterwayDist = distM;
              waterwayRawName = rawName;
              waterwayName = rawName || (el.tags?.waterway === 'river' ? 'Sungai (OSM)' : el.tags?.waterway === 'canal' ? 'Saluran Kanal (OSM)' : 'Sempadan Air (OSM)');
            }
          }
        }

        if (minWaterwayDist !== null) {
          return {
            distanceMeters: minWaterwayDist,
            name: waterwayName,
            rawName: waterwayRawName,
            endpoint,
            status: 'success'
          };
        }
      } catch (err: unknown) {
        const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'));
        return { distanceMeters: null, name: null, rawName: null, endpoint: null, status: isTimeout ? 'timeout' : 'error' };
      }
    }

    return { distanceMeters: null, name: 'Tidak terdeteksi dalam radius 5 km', rawName: null, endpoint: this.ENDPOINTS[0], status: 'nodata' };
  }

  // ===========================================================================
  // 5. INDEPENDENT FIRE STATION QUERY (Progressive 5km -> 10km)
  // ===========================================================================
  public static async getNearestFireStation(
    coords: Coordinates
  ): Promise<ApiResult<NormalizedTransportComponent>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const stages = [5000, 10000];
    let successfulEndpoint: string | null = null;
    let queryTimedOut = false;
    let queryErrored = false;
    let lastErrorMsg = '';

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
(
  node["amenity"="fire_station"](around:${radius},${lat},${lon});
  way["amenity"="fire_station"](around:${radius},${lat},${lon});
  node["emergency"="fire_station"](around:${radius},${lat},${lon});
);
out center 20;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);
        successfulEndpoint = endpoint;

        let minFireDist: number | null = null;
        let fireName: string | null = null;

        for (const el of elements) {
          const elLat = el.lat != null ? Number(el.lat) : (el.center && el.center.lat != null ? Number(el.center.lat) : null);
          const elLon = el.lon != null ? Number(el.lon) : (el.center && el.center.lon != null ? Number(el.center.lon) : null);
          if (elLat == null || elLon == null || isNaN(elLat) || isNaN(elLon)) continue;

          const distM = Math.round(coords.distanceToKm(new Coordinates(elLat, elLon)) * 1000);
          if (distM <= radius) {
            if (minFireDist === null || distM < minFireDist) {
              minFireDist = distM;
              fireName = el.tags?.name || el.tags?.['name:id'] || 'Pos Pemadam Kebakaran';
            }
          }
        }

        if (minFireDist !== null) {
          const distKm = Math.round((minFireDist / 1000) * 10) / 10;
          return {
            data: {
              name: fireName,
              distanceMeters: minFireDist,
              distanceKm: distKm,
              status: 'success_exact',
              source: 'overpass',
              provider: 'OpenStreetMap Overpass Fire Station Query',
              searchRadiusMeters: radius,
              searchRadiusKm: Math.round(radius / 1000),
              relation: 'exact',
              lowerBoundMeters: null,
              endpoint: successfulEndpoint,
              isFallback: false,
              type: 'fire_station',
              boundedObservation: this.createBoundedObservation(minFireDist, radius, fireName, false)
            },
            isFallback: false,
            confidenceLevel: 'high',
            sourceName: 'OpenStreetMap Overpass Fire Station Query'
          };
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'))) {
          queryTimedOut = true;
        } else {
          queryErrored = true;
        }
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    if (successfulEndpoint && !queryTimedOut && !queryErrored) {
      return {
        data: {
          name: 'Tidak terdeteksi pos pemadam dalam radius 10 km',
          distanceMeters: null,
          distanceKm: null,
          status: 'success_bounded',
          source: 'overpass',
          provider: 'OpenStreetMap Overpass Fire Station Query',
          searchRadiusMeters: 10000,
          searchRadiusKm: 10,
          relation: 'greater_than',
          lowerBoundMeters: 10000,
          endpoint: successfulEndpoint,
          isFallback: false,
          type: 'fire_station',
          boundedObservation: this.createBoundedObservation(null, 10000, 'Tidak terdeteksi dalam radius 10 km', false)
        },
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'OpenStreetMap Overpass Fire Station Query'
      };
    }

    const failureStatus = queryTimedOut ? 'timeout' : 'error';
    return {
      data: {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status: failureStatus,
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Fire Station Query (Unavailable)',
        searchRadiusMeters: 10000,
        searchRadiusKm: 10,
        relation: null,
        lowerBoundMeters: null,
        endpoint: null,
        isFallback: true,
        type: 'fire_station',
        error: lastErrorMsg || `Overpass fire station query ${failureStatus}`,
        boundedObservation: this.createBoundedObservation(null, 10000, null, true)
      },
      isFallback: true,
      confidenceLevel: 'low',
      reason: lastErrorMsg || `Overpass fire station query ${failureStatus}`,
      sourceName: 'OpenStreetMap Overpass Fire Station Query'
    };
  }

  // ===========================================================================
  // 5.5 INDEPENDENT ASSEMBLY / EVACUATION POINT QUERY (Progressive 3km -> 7.5km -> 15km)
  // ===========================================================================
  public static async getNearestAssemblyPoint(
    coords: Coordinates
  ): Promise<ApiResult<NormalizedTransportComponent>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const cacheKey = `overpass_assembly_${lat}_${lon}`;
    const cached = LocalApiCache.get<ApiResult<NormalizedTransportComponent>>(cacheKey);
    if (cached) return cached;

    const stages = [3000, 7500, 15000];
    let successfulEndpoint: string | null = null;
    let queryTimedOut = false;
    let queryErrored = false;
    let lastErrorMsg = '';

    for (const radius of stages) {
      const q = `[out:json][timeout:8];
(
  node["emergency"="assembly_point"](around:${radius},${lat},${lon});
  way["emergency"="assembly_point"](around:${radius},${lat},${lon});
  node["emergency"="evacuation_centre"](around:${radius},${lat},${lon});
  way["emergency"="evacuation_centre"](around:${radius},${lat},${lon});
  node["emergency"="shelter"](around:${radius},${lat},${lon});
  way["emergency"="shelter"](around:${radius},${lat},${lon});
  node["hazard:evacuation_point"="yes"](around:${radius},${lat},${lon});
  way["hazard:evacuation_point"="yes"](around:${radius},${lat},${lon});
  node["leisure"="park"](around:${radius},${lat},${lon});
  way["leisure"="park"](around:${radius},${lat},${lon});
  node["amenity"="community_centre"](around:${radius},${lat},${lon});
  way["amenity"="community_centre"](around:${radius},${lat},${lon});
  node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
  way["leisure"="pitch"](around:${radius},${lat},${lon});
);
out center 40;`;

      try {
        const { elements, endpoint } = await this.executeOverpassQuery(q);
        successfulEndpoint = endpoint;

        const candidates: Array<{
          name: string;
          isExplicit: boolean;
          facilityType: string;
          distM: number;
          lat: number;
          lon: number;
        }> = [];

        for (const el of elements) {
          const isExplicit = Boolean(
            el.tags?.emergency === 'assembly_point' ||
            el.tags?.emergency === 'evacuation_centre' ||
            el.tags?.emergency === 'shelter' ||
            el.tags?.['hazard:evacuation_point'] === 'yes'
          );

          const elLat = el.lat != null ? Number(el.lat) : (el.center && el.center.lat != null ? Number(el.center.lat) : null);
          const elLon = el.lon != null ? Number(el.lon) : (el.center && el.center.lon != null ? Number(el.center.lon) : null);
          if (elLat == null || elLon == null || isNaN(elLat) || isNaN(elLon)) continue;

          const distM = Math.round(coords.distanceToKm(new Coordinates(elLat, elLon)) * 1000);
          if (distM <= radius) {
            const rawName = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'];
            const defaultName = isExplicit
              ? (el.tags?.emergency === 'assembly_point' ? 'Titik Kumpul Evakuasi (OSM)' : el.tags?.emergency === 'evacuation_centre' ? 'Pusat Evakuasi (OSM)' : 'Tempat Perlindungan Evakuasi (OSM)')
              : (el.tags?.leisure === 'park' ? 'Taman Terbuka Publik (Kandidat Evakuasi)' : el.tags?.amenity === 'community_centre' ? 'Balai Warga / Fasilitas Publik (Kandidat Evakuasi)' : 'Ruang Terbuka Publik (Kandidat Evakuasi)');

            candidates.push({
              name: rawName || defaultName,
              isExplicit,
              facilityType: el.tags?.emergency || el.tags?.leisure || el.tags?.amenity || 'assembly_candidate',
              distM,
              lat: elLat,
              lon: elLon
            });
          }
        }

        // Prioritize explicit emergency assembly points first, then closest distance
        candidates.sort((a, b) => {
          if (a.isExplicit && !b.isExplicit && a.distM <= b.distM + 3000) return -1;
          if (!a.isExplicit && b.isExplicit && b.distM <= a.distM + 3000) return 1;
          return a.distM - b.distM;
        });

        if (candidates.length > 0) {
          const nearest = candidates[0];
          const distKm = Math.round((nearest.distM / 1000) * 10) / 10;

          const result: ApiResult<NormalizedTransportComponent> = {
            data: {
              name: nearest.name,
              distanceMeters: nearest.distM,
              distanceKm: distKm,
              status: 'success_exact',
              source: 'overpass',
              provider: 'OpenStreetMap Assembly Point Query',
              searchRadiusMeters: radius,
              searchRadiusKm: Math.round(radius / 1000),
              relation: 'exact',
              lowerBoundMeters: null,
              endpoint: successfulEndpoint,
              isFallback: false,
              isOfficial: false,
              isEvacuationPoint: nearest.isExplicit,
              type: 'assembly_point',
              facilityType: nearest.facilityType,
              coordinates: { latitude: nearest.lat, longitude: nearest.lon },
              latitude: nearest.lat,
              longitude: nearest.lon,
              boundedObservation: this.createBoundedObservation(nearest.distM, radius, nearest.name, false)
            },
            isFallback: false,
            confidenceLevel: nearest.isExplicit ? 'high' : 'medium',
            sourceName: 'OpenStreetMap Assembly Point Query'
          };
          LocalApiCache.set(cacheKey, result, 600);
          return result;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'))) {
          queryTimedOut = true;
        } else {
          queryErrored = true;
        }
        lastErrorMsg = err instanceof Error ? err.message : String(err);
        break;
      }
    }

    if (successfulEndpoint && !queryTimedOut && !queryErrored) {
      const boundResult: ApiResult<NormalizedTransportComponent> = {
        data: {
          name: 'Tidak terdeteksi dalam radius 15 km',
          distanceMeters: null,
          distanceKm: null,
          status: 'success_bounded',
          source: 'overpass',
          provider: 'OpenStreetMap Assembly Point Query',
          searchRadiusMeters: 15000,
          searchRadiusKm: 15,
          relation: 'greater_than',
          lowerBoundMeters: 15000,
          endpoint: successfulEndpoint,
          isFallback: false,
          isOfficial: false,
          type: 'assembly_point',
          boundedObservation: this.createBoundedObservation(null, 15000, 'Tidak terdeteksi dalam radius 15 km', false)
        },
        isFallback: false,
        confidenceLevel: 'medium',
        sourceName: 'OpenStreetMap Assembly Point Query'
      };
      LocalApiCache.set(cacheKey, boundResult, 600);
      return boundResult;
    }

    const failureStatus = queryTimedOut ? 'timeout' : 'error';
    const failResult: ApiResult<NormalizedTransportComponent> = {
      data: {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status: failureStatus,
        source: 'overpass',
        provider: 'OpenStreetMap Assembly Point Query (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        endpoint: null,
        isFallback: true,
        isOfficial: false,
        type: 'assembly_point',
        error: lastErrorMsg || `Overpass assembly point query ${failureStatus}`,
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      },
      isFallback: true,
      confidenceLevel: 'low',
      reason: lastErrorMsg || `Overpass assembly point query ${failureStatus}`,
      sourceName: 'OpenStreetMap Assembly Point Query'
    };
    LocalApiCache.set(cacheKey, failResult, 300);
    return failResult;
  }

  // ===========================================================================
  // 6. INDEPENDENT GREEN SPACE & LAND USE QUERY
  // ===========================================================================
  public static async getGreenSpaceRatio(
    coords: Coordinates
  ): Promise<{ greenRatioPct: number | null; status: SpatialQueryState }> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const q = `[out:json][timeout:8];
(
  way["leisure"~"^(park|garden|pitch|playground)$"](around:2000,${lat},${lon});
  way["landuse"~"^(forest|grass|meadow|recreation_ground|farmland|orchard)$"](around:2000,${lat},${lon});
  way["natural"~"^(wood|scrub|grassland)$"](around:2000,${lat},${lon});
  way["landuse"~"^(residential|commercial|industrial|retail)$"](around:2000,${lat},${lon});
);
out body 60;`;

    try {
      const { elements } = await this.executeOverpassQuery(q);
      let greenCount = 0;
      let totalLandUse = 0;

      for (const el of elements) {
        const isGreen = Boolean(
          el.tags?.leisure === 'park' || el.tags?.leisure === 'garden' || el.tags?.leisure === 'pitch' || el.tags?.leisure === 'playground' ||
          el.tags?.landuse === 'forest' || el.tags?.landuse === 'grass' || el.tags?.landuse === 'meadow' || el.tags?.landuse === 'recreation_ground' ||
          el.tags?.landuse === 'farmland' || el.tags?.landuse === 'orchard' ||
          el.tags?.natural === 'wood' || el.tags?.natural === 'scrub' || el.tags?.natural === 'grassland'
        );
        const isOther = Boolean(
          el.tags?.landuse === 'residential' || el.tags?.landuse === 'commercial' || el.tags?.landuse === 'industrial' || el.tags?.landuse === 'retail'
        );

        if (isGreen) {
          greenCount++;
          totalLandUse++;
        } else if (isOther) {
          totalLandUse++;
        }
      }

      const greenRatioPct = totalLandUse > 0 ? Math.round((greenCount / totalLandUse) * 100) : null;
      return { greenRatioPct, status: 'success' };
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timed out'));
      return { greenRatioPct: null, status: isTimeout ? 'timeout' : 'error' };
    }
  }

  // ===========================================================================
  // 7. COMPREHENSIVE PROXIMITY AGGREGATOR (Runs all independent queries in parallel)
  // ===========================================================================
  public static async fetchProximityMetrics(
    coords: Coordinates
  ): Promise<ApiResult<SpatialProximityData>> {
    const lat = coords.lat.toFixed(5);
    const lon = coords.lng.toFixed(5);
    const cacheKey = `osm_prox_v24_${lat}_${lon}`;
    const cached = LocalApiCache.get<ApiResult<SpatialProximityData>>(cacheKey);
    if (cached) return cached;

    // Run independent modular queries concurrently with isolated fault handling
    const [
      nearestRoadRes,
      majorRoadRes,
      healthcareRes,
      transitRes,
      waterwayRes,
      fireRes,
      assemblyRes,
      greenRes
    ] = await Promise.all([
      OsrmRoutingClient.getNearestRoad(coords),
      this.getNearestMajorRoad(coords),
      this.getNearestHealthcare(coords),
      this.getNearestTransit(coords),
      this.getNearestWaterway(coords),
      this.getNearestFireStation(coords),
      this.getNearestAssemblyPoint(coords),
      this.getGreenSpaceRatio(coords)
    ]);

    const nearestRoadData = nearestRoadRes.data;
    const majorRoadData = majorRoadRes.data;
    const healthcareData = healthcareRes.data;
    const transitData = transitRes.data;
    const fireData = fireRes.data;
    const assemblyData = assemblyRes.data;

    // 1. Nearest Road
    let distanceToNearestRoadMeters: number | null = null;
    let nearestRoadName = 'Tidak terdeteksi dalam radius 500 m';
    let nearestRoadRawName: string | null = null;
    let nearestRoadProvenance: FieldProvenance['nearestRoad'] = 'source_unavailable';
    let roadObs: BoundedSpatialDistance;

    if (nearestRoadData && nearestRoadData.distanceMeters !== undefined && !isNaN(nearestRoadData.distanceMeters)) {
      distanceToNearestRoadMeters = nearestRoadData.distanceMeters;
      nearestRoadName = nearestRoadData.roadName || 'Jalan Akses Tapak (OSRM)';
      nearestRoadRawName = nearestRoadData.roadName || null;
      nearestRoadProvenance = 'osrm-snap';
      roadObs = this.createBoundedObservation(distanceToNearestRoadMeters, 500, nearestRoadName, false);
    } else {
      roadObs = this.createBoundedObservation(null, 500, nearestRoadName, nearestRoadRes.isFallback);
    }

    // 2. Major Road
    const distanceToArterialMeters = majorRoadData?.distanceMeters ?? null;
    const nearestArterialName = majorRoadData?.name || 'Tidak terdeteksi dalam radius 15 km';
    const arterialObs = majorRoadData?.boundedObservation || this.createBoundedObservation(distanceToArterialMeters, 15000, nearestArterialName, majorRoadRes.isFallback);

    // 3. Healthcare / Hospital
    const distanceToHospitalMeters = healthcareData?.distanceMeters ?? null;
    const nearestHospitalName = healthcareData?.name || 'Tidak terdeteksi dalam radius 15 km';
    const hospitalObs = healthcareData?.boundedObservation || this.createBoundedObservation(distanceToHospitalMeters, 15000, nearestHospitalName, healthcareRes.isFallback);

    // 4. Transit
    const distanceToNearestTransitMeters = transitData?.distanceMeters ?? null;
    const nearestTransitName = transitData?.name || 'Tidak terdeteksi dalam radius 15 km';
    const transitObs = transitData?.boundedObservation || this.createBoundedObservation(distanceToNearestTransitMeters, 15000, nearestTransitName, transitRes.isFallback);

    // 5. Waterway
    const distanceToNearestWaterwayMeters = waterwayRes.distanceMeters;
    const nearestWaterwayName = waterwayRes.name || 'Tidak terdeteksi dalam radius 5 km';
    const waterwayObs = this.createBoundedObservation(distanceToNearestWaterwayMeters, 5000, nearestWaterwayName, waterwayRes.status === 'error' || waterwayRes.status === 'timeout');

    // 6. Fire Station
    const distanceToFireStationMeters = fireData?.distanceMeters ?? null;
    const nearestFireStationName = fireData?.name || 'Tidak terdeteksi dalam radius 10 km';
    const fireObs = fireData?.boundedObservation || this.createBoundedObservation(distanceToFireStationMeters, 10000, nearestFireStationName, fireRes.isFallback);

    // 7. Assembly Point
    const distanceToAssemblyPointMeters = assemblyData?.distanceMeters ?? null;
    const nearestAssemblyPointName = assemblyData?.name || 'Tidak terdeteksi dalam radius 15 km';
    const assemblyObs = assemblyData?.boundedObservation || this.createBoundedObservation(distanceToAssemblyPointMeters, 15000, nearestAssemblyPointName, assemblyRes.isFallback);

    // 8. Driving / Egress Route via OSRM to Assembly Point (or Hospital fallback if assembly point has no coords)
    let assemblyPointTravelTimeMinutes: number | null = null;
    let assemblyPointTravelTimeDisplay = 'Titik kumpul tidak terpetakan dalam radius 15 km';
    let assemblyPointRouteDistanceMeters: number | null = null;

    if (assemblyData?.coordinates?.latitude && assemblyData?.coordinates?.longitude) {
      try {
        const assemCoords = new Coordinates(assemblyData.coordinates.latitude, assemblyData.coordinates.longitude);
        const routeRes = await OsrmRoutingClient.calculateDrivingRoute(coords, assemCoords);
        if (routeRes.data && !routeRes.isFallback && routeRes.data.durationMinutesFormatted) {
          assemblyPointTravelTimeMinutes = routeRes.data.durationMinutes ?? null;
          assemblyPointTravelTimeDisplay = routeRes.data.durationMinutesFormatted;
          assemblyPointRouteDistanceMeters = routeRes.data.distanceMeters;
        } else {
          assemblyPointTravelTimeDisplay = 'Rute evakuasi tidak dapat dihitung';
        }
      } catch {
        assemblyPointTravelTimeDisplay = 'Rute evakuasi gagal dihitung';
      }
    }

    // 9. Driving Route via OSRM to Hospital (if healthcare coordinate was discovered)
    let travelTimeMinutes: number | null = null;
    let travelTimeDisplay = 'Rumah sakit tidak terpetakan dalam radius 15 km';
    let travelTimeRouteDistanceMeters: number | null = null;
    let routingSource = 'OSRM road-network routing';
    let routingStatus: OsmAuditTrail['routingStatus'] = 'not_applicable';

    if (healthcareData?.coordinates?.latitude && healthcareData?.coordinates?.longitude) {
      try {
        const hospCoords = new Coordinates(healthcareData.coordinates.latitude, healthcareData.coordinates.longitude);
        const routeRes = await OsrmRoutingClient.calculateDrivingRoute(coords, hospCoords);
        if (routeRes.data && !routeRes.isFallback && routeRes.data.durationMinutesFormatted) {
          travelTimeMinutes = routeRes.data.durationMinutes ?? null;
          travelTimeDisplay = routeRes.data.durationMinutesFormatted;
          travelTimeRouteDistanceMeters = routeRes.data.distanceMeters;
          routingStatus = 'osrm_live_route_confirmed';
        } else {
          travelTimeDisplay = 'Rute mengemudi tidak dapat dihitung';
          routingStatus = 'route_calculation_failed';
        }
      } catch {
        travelTimeDisplay = 'Rute mengemudi gagal dihitung';
        routingStatus = 'route_calculation_failed';
      }
    }

    const queryStatus: SpatialProximityData['queryStatus'] = {
      hospital: healthcareData?.status === 'success_exact' ? 'success' : healthcareData?.status === 'success_bounded' ? 'nodata' : (healthcareData?.status as SpatialQueryState) || 'error',
      healthcareFacility: healthcareData?.status === 'success_exact' ? 'success' : healthcareData?.status === 'success_bounded' ? 'nodata' : (healthcareData?.status as SpatialQueryState) || 'error',
      fireStation: fireData?.status === 'success_exact' ? 'success' : fireData?.status === 'success_bounded' ? 'nodata' : (fireData?.status as SpatialQueryState) || 'error',
      assemblyPoint: assemblyData?.status === 'success_exact' ? 'success' : assemblyData?.status === 'success_bounded' ? 'nodata' : (assemblyData?.status as SpatialQueryState) || 'error',
      waterway: waterwayRes.status,
      transit: transitData?.status === 'success_exact' ? 'success' : transitData?.status === 'success_bounded' ? 'nodata' : (transitData?.status as SpatialQueryState) || 'error',
      arterial: majorRoadData?.status === 'success_exact' ? 'success' : majorRoadData?.status === 'success_bounded' ? 'nodata' : (majorRoadData?.status as SpatialQueryState) || 'error',
      nearestRoad: nearestRoadData?.distanceMeters !== undefined ? 'success' : 'error',
      greenSpace: greenRes.status
    };

    const data: SpatialProximityData = {
      distanceToNearestWaterwayMeters,
      nearestWaterwayName,
      nearestWaterwayRawName: waterwayRes.rawName,
      waterwayObservation: waterwayObs,
      distanceToRiverMeters: distanceToNearestWaterwayMeters,
      nearestRiverName: nearestWaterwayName,

      greenFeatureRatioPct: greenRes.greenRatioPct,
      greenSpaceRatioPct: greenRes.greenRatioPct,

      distanceToNearestRoadMeters,
      nearestRoadName,
      nearestRoadRawName,
      nearestRoadObservation: roadObs,
      distanceToArterialMeters,
      nearestArterialName,
      nearestArterialRawName: majorRoadData?.name || null,
      arterialObservation: arterialObs,
      arterialHighwayClass: majorRoadData?.highwayClass,

      distanceToNearestTransitMeters,
      distanceToTransitHubMeters: distanceToNearestTransitMeters,
      nearestTransitName,
      nearestTransitRawName: transitData?.name || null,
      transitObservation: transitObs,
      transitType: transitData?.transitType,

      distanceToHospitalMeters,
      nearestHospitalName,
      nearestHospitalRawName: healthcareData?.name || null,
      hospitalObservation: hospitalObs,
      hospitalFacilityType: healthcareData?.facilityType,
      hospitalCoordinates: healthcareData?.coordinates,
      distanceToHealthcareFacilityMeters: distanceToHospitalMeters,
      nearestHealthcareFacilityName: nearestHospitalName,
      healthcareFacilityObservation: hospitalObs,
      distanceToClinicMeters: null,
      nearestClinicName: 'Fasilitas Medis',
      distanceToPharmacyMeters: null,
      nearestPharmacyName: 'Apotek',

      distanceToFireStationMeters,
      nearestFireStationName,
      nearestFireStationRawName: fireData?.name || null,
      fireStationObservation: fireObs,
      distanceToPoliceStationMeters: null,
      nearestPoliceStationName: 'Kantor Polisi',
      distanceToSchoolMeters: null,
      nearestSchoolName: 'Sekolah',

      // Evacuation & Assembly Point
      distanceToAssemblyPointMeters,
      nearestAssemblyPointName,
      nearestAssemblyPointRawName: assemblyData?.name || null,
      assemblyPointObservation: assemblyObs,
      assemblyPointBounded: assemblyObs,
      assemblyPointIsOfficial: false,
      assemblyPointFacilityType: assemblyData?.facilityType,
      assemblyPointCoordinates: assemblyData?.coordinates,
      assemblyPointTravelTimeMinutes,
      assemblyPointTravelTimeDisplay,
      assemblyPointRouteDistanceMeters,

      travelTimeMinutes,
      travelTimeDisplay,
      estimatedTravelTimeMinutes: travelTimeDisplay,
      travelTimeRouteDistanceMeters,
      routingSource,
      provenance: {
        nearestRoad: nearestRoadProvenance,
        arterialRoad: distanceToArterialMeters !== null ? 'osm-geom-segment' : 'not-found-in-radius',
        nearestTransit: distanceToNearestTransitMeters !== null ? 'osm-query' : 'not-found-in-radius',
        hospital: distanceToHospitalMeters !== null ? 'osm-query' : 'not-found-in-radius',
        healthcareFacility: distanceToHospitalMeters !== null ? 'osm-query' : 'not-found-in-radius',
        fireStation: distanceToFireStationMeters !== null ? 'osm-query' : 'not-found-in-radius',
        waterway: distanceToNearestWaterwayMeters !== null ? 'osm-geom-segment' : 'not-found-in-radius',
        greenSpace: greenRes.greenRatioPct !== null ? 'osm-query' : 'not-found-in-radius',
        routing: routingStatus === 'osrm_live_route_confirmed' ? 'osrm-live-route' : 'not-applicable'
      },
      queryStatus,
      auditTrail: {
        source: 'openstreetmap_overpass_live',
        queryRadiusMeters: {
          hospital: majorRoadData?.searchRadiusMeters || 15000,
          healthcareFacility: healthcareData?.searchRadiusMeters || 15000,
          fireStation: fireData?.searchRadiusMeters || 10000,
          waterway: 5000,
          transit: transitData?.searchRadiusMeters || 15000,
          arterial: majorRoadData?.searchRadiusMeters || 15000,
          localRoad: 500,
          green: 2000
        },
        progressiveDiscovery: {
          waterwayRadiusM: distanceToNearestWaterwayMeters !== null ? 2500 : 5000,
          arterialRadiusM: majorRoadData?.searchRadiusMeters || 15000,
          hospitalRadiusM: healthcareData?.searchRadiusMeters || 15000,
          fireStationRadiusM: fireData?.searchRadiusMeters || 10000,
          transitRadiusM: transitData?.searchRadiusMeters || 15000,
          greenRadiusM: 2000
        },
        endpointsUsed: {
          majorRoad: majorRoadData?.endpoint || 'none',
          healthcare: healthcareData?.endpoint || 'none',
          transit: transitData?.endpoint || 'none',
          fireStation: fireData?.endpoint || 'none',
          waterway: waterwayRes.endpoint || 'none'
        },
        totalElementsFetched: 0,
        categoryCounts: {
          waterways: distanceToNearestWaterwayMeters !== null ? 1 : 0,
          localRoads: distanceToNearestRoadMeters !== null ? 1 : 0,
          arterials: distanceToArterialMeters !== null ? 1 : 0,
          transit: distanceToNearestTransitMeters !== null ? 1 : 0,
          hospitals: distanceToHospitalMeters !== null ? 1 : 0,
          clinicsAndDoctors: 0,
          fireStations: distanceToFireStationMeters !== null ? 1 : 0,
          greenParcels: 0,
          totalLandCover: 0
        },
        calculationMethod: {
          selectedWaterwayDistanceMethod: 'geometry_segment',
          selectedArterialDistanceMethod: 'geometry_segment',
          poiDistances: 'haversine_to_representative_node_or_center',
          roadSnapping: 'osrm_nearest_snapping',
          greenMetric: 'ratio_of_green_to_total_osm_landcover_features_by_count_proxy',
          routeEndpointMethod: 'hospital_representative_point'
        },
        routingStatus,
        fallbackUsed: false
      }
    };

    const hasAnySuccess =
      data.distanceToNearestRoadMeters !== null ||
      data.distanceToArterialMeters !== null ||
      data.distanceToHospitalMeters !== null ||
      data.distanceToNearestTransitMeters !== null ||
      data.distanceToNearestWaterwayMeters !== null;

    const result: ApiResult<SpatialProximityData> = {
      data,
      isFallback: !hasAnySuccess,
      confidenceLevel: hasAnySuccess ? 'high' : 'low',
      sourceName: 'OpenStreetMap Overpass & OSRM Open Source Pipeline'
    };

    LocalApiCache.set(cacheKey, result, 7200);
    return result;
  }

  /**
   * Helper for parsing OSM elements synchronously (used for unit testing and local element parsing).
   */
  public static parseElements(coords: Coordinates, elements: any[]): ApiResult<SpatialProximityData> {
    let minWaterwayDist: number | null = null;
    let waterwayName: string | null = null;
    let minHospitalDist: number | null = null;
    let hospitalName: string | null = null;
    let minArterialDist: number | null = null;
    let arterialName: string | null = null;
    let minTransitDist: number | null = null;
    let transitName: string | null = null;

    for (const el of elements) {
      const rawName = el.tags?.name || el.tags?.['name:id'] || el.tags?.['name:en'] || null;
      let distM: number | null = null;

      if (Array.isArray(el.geometry) && el.geometry.length > 0) {
        const seg = this.getPointToPolylineDistanceMeters(coords, el.geometry);
        if (seg) distM = seg.distM;
      } else if (el.lat != null && el.lon != null) {
        distM = Math.round(coords.distanceToKm(new Coordinates(el.lat, el.lon)) * 1000);
      }

      if (distM === null) continue;

      if (el.tags?.waterway || (el.tags?.natural === 'water' || el.tags?.natural === 'coastline')) {
        if (minWaterwayDist === null || distM < minWaterwayDist) {
          minWaterwayDist = distM;
          waterwayName = rawName || (el.tags?.waterway === 'river' ? 'Sungai (OSM)' : 'Sempadan Air (OSM)');
        }
      }

      if (el.tags?.amenity === 'hospital' || el.tags?.healthcare === 'hospital') {
        if (minHospitalDist === null || distM < minHospitalDist) {
          minHospitalDist = distM;
          hospitalName = rawName || 'Rumah Sakit (OSM)';
        }
      }

      if (['motorway', 'trunk', 'primary', 'secondary'].includes(el.tags?.highway)) {
        if (minArterialDist === null || distM < minArterialDist) {
          minArterialDist = distM;
          arterialName = rawName || 'Jalan Arteri / Kolektor (OSM)';
        }
      }

      if (el.tags?.railway === 'station' || el.tags?.amenity === 'bus_station' || el.tags?.highway === 'bus_stop') {
        if (minTransitDist === null || distM < minTransitDist) {
          minTransitDist = distM;
          transitName = rawName || 'Simpul Transit (OSM)';
        }
      }
    }

    const waterwayBounded = this.createBoundedObservation(
      minWaterwayDist,
      5000,
      waterwayName || 'Tidak terdeteksi dalam radius 5.0 km',
      false
    );

    const hospitalBounded = this.createBoundedObservation(
      minHospitalDist,
      15000,
      hospitalName || 'Tidak terdeteksi dalam radius 15.0 km',
      false
    );

    const arterialBounded = this.createBoundedObservation(
      minArterialDist,
      15000,
      arterialName || 'Tidak terdeteksi dalam radius 15.0 km',
      false
    );

    const transitBounded = this.createBoundedObservation(
      minTransitDist,
      15000,
      transitName || 'Tidak terdeteksi dalam radius 15.0 km',
      false
    );

    const fireStationBounded = this.createBoundedObservation(
      null,
      10000,
      'Tidak terdeteksi dalam radius 10.0 km',
      false
    );

    const greenCount = elements.filter(e => e.tags?.leisure === 'park' || e.tags?.landuse === 'grass' || e.tags?.landuse === 'forest' || e.tags?.natural === 'wood').length;
    const landCoverCount = elements.filter(e => e.tags?.landuse || e.tags?.leisure || e.tags?.natural).length;
    const computedGreenPct = landCoverCount > 0 ? Math.round((greenCount / landCoverCount) * 100) : 25;

    const data: SpatialProximityData = {
      distanceToNearestWaterwayMeters: minWaterwayDist,
      nearestWaterwayName: waterwayBounded.name || 'Tidak terdeteksi dalam radius 5.0 km',
      distanceToRiverMeters: minWaterwayDist,
      nearestRiverName: waterwayBounded.name || 'Tidak terdeteksi dalam radius 5.0 km',
      distanceToHospitalMeters: minHospitalDist,
      nearestHospitalName: hospitalBounded.name || 'Tidak terdeteksi dalam radius 15.0 km',
      distanceToHealthcareFacilityMeters: minHospitalDist,
      nearestHealthcareFacilityName: hospitalBounded.name || 'Tidak terdeteksi dalam radius 15.0 km',
      distanceToArterialMeters: minArterialDist,
      nearestArterialName: arterialBounded.name || 'Tidak terdeteksi dalam radius 15.0 km',
      distanceToTransitHubMeters: minTransitDist,
      distanceToNearestTransitMeters: minTransitDist,
      nearestTransitName: transitBounded.name || 'Tidak terdeteksi dalam radius 15.0 km',
      distanceToFireStationMeters: null,
      nearestFireStationName: fireStationBounded.name || 'Tidak terdeteksi dalam radius 10.0 km',
      distanceToNearestRoadMeters: null,
      nearestRoadName: 'Tidak terdeteksi dalam radius 500 m',
      greenSpaceRatioPct: computedGreenPct,
      greenFeatureRatioPct: computedGreenPct,
      waterwayBounded,
      waterwayObservation: waterwayBounded,
      arterialBounded,
      arterialObservation: arterialBounded,
      hospitalBounded,
      hospitalObservation: hospitalBounded,
      transitBounded,
      transitObservation: transitBounded,
      fireStationBounded,
      fireStationObservation: fireStationBounded,
      provenance: {
        nearestRoad: 'source_unavailable',
        arterialRoad: minArterialDist !== null ? 'osm-geom-segment' : 'not-found-in-radius',
        nearestTransit: minTransitDist !== null ? 'osm-query' : 'not-found-in-radius',
        hospital: minHospitalDist !== null ? 'osm-query' : 'not-found-in-radius',
        healthcareFacility: minHospitalDist !== null ? 'osm-query' : 'not-found-in-radius',
        fireStation: 'not-found-in-radius',
        waterway: minWaterwayDist !== null ? 'osm-geom-segment' : 'not-found-in-radius',
        greenSpace: 'not-found-in-radius',
        routing: 'not-applicable'
      },
      auditTrail: {
        source: 'openstreetmap_overpass_live',
        queryRadiusMeters: { hospital: 15000, healthcareFacility: 15000, fireStation: 10000, waterway: 5000, transit: 15000, arterial: 15000, localRoad: 500, green: 1000 },
        progressiveDiscovery: { waterwayRadiusM: 5000, arterialRadiusM: 15000, hospitalRadiusM: 15000, fireStationRadiusM: 10000, transitRadiusM: 15000, greenRadiusM: 1000 },
        endpointsUsed: {},
        totalElementsFetched: elements.length,
        categoryCounts: { waterways: 0, localRoads: 0, arterials: 0, transit: 0, hospitals: 0, clinicsAndDoctors: 0, fireStations: 0, greenParcels: 0, totalLandCover: 0 },
        calculationMethod: {
          selectedWaterwayDistanceMethod: 'geometry_segment',
          selectedArterialDistanceMethod: 'geometry_segment',
          poiDistances: 'haversine_to_representative_node_or_center',
          roadSnapping: 'none',
          greenMetric: 'ratio_of_green_to_total_osm_landcover_features_by_count_proxy',
          routeEndpointMethod: 'hospital_representative_point'
        },
        routingStatus: 'not_applicable',
        fallbackUsed: false
      }
    };

    return {
      data,
      isFallback: false,
      confidenceLevel: 'high',
      sourceName: 'OpenStreetMap Overpass Polyline Segments'
    };
  }
}
