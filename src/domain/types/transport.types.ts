import type { BoundedSpatialDistance } from './feature.types';
import type { Coordinates } from '../value_objects/Coordinates.vo';
import type { ApiResult } from './api.types';

/**
 * GoTangguh Provider-Neutral Transport Evidence Contract
 * 
 * Defines standardized, provider-agnostic domain contracts for spatial transport
 * and accessibility evidence (nearest road, major road access, referral healthcare,
 * public transit, fire station, and driving route).
 * 
 * Rules:
 * 1. RiskScoringEngine and presentation layers MUST NOT depend on specific vendor response formats.
 * 2. Status discrimination is strictly preserved: success_exact, success_bounded, no_result, error, timeout.
 * 3. Exact distances vs bounded distances are strictly differentiated (never store >15km as distanceMeters = 15000).
 * 4. Driving routes are strictly "estimated driving travel time", never "emergency response time".
 */

export type TransportComponentStatus = 
  | 'success_exact'
  | 'success_bounded'
  | 'no_result'
  | 'error'
  | 'timeout';

export type TransportRouteStatus = 
  | 'success'
  | 'no_route'
  | 'error'
  | 'timeout';

export type TransportProviderSource = 'mapbox' | 'overpass' | 'osrm' | 'unknown';

export interface NormalizedTransportComponent {
  /** Resolved name of facility or road corridor (null if unmapped or error) */
  name: string | null;
  /** Exact geodesic or network distance in meters (null if bounded, unmapped, or error) */
  distanceMeters: number | null;
  /** Canonical normalized distance in kilometers for internal domain consistency */
  distanceKm: number | null;
  /** Explicit query/observation state */
  status: TransportComponentStatus;
  /** Canonical provider source identity ('mapbox' | 'overpass' | 'osrm') */
  source: TransportProviderSource;
  /** Descriptive provider attribution string (e.g., 'OSRM Road-Network', 'OpenStreetMap Overpass') */
  provider: string;
  /** Search radius in meters used for this spatial query */
  searchRadiusMeters: number;
  /** Search radius in kilometers */
  searchRadiusKm?: number | null;
  /** Spatial relation: 'exact' if found, 'greater_than' if bounded/no_result, null if error */
  relation: 'exact' | 'greater_than' | null;
  /** Numerical lower bound in meters when status is success_bounded / no_result */
  lowerBoundMeters: number | null;
  /** API endpoint queried */
  endpoint?: string | null;
  /** Canonical BoundedSpatialDistance record for downstream UI and reporting */
  boundedObservation?: BoundedSpatialDistance;
  /** Indicates whether a fallback provider or method was used */
  isFallback?: boolean;
  /** Canonical feature category/type */
  type?: string | null;
  /** Highway functional class if road component (e.g. 'trunk', 'primary', 'secondary') */
  highwayClass?: string | null;
  /** Specific healthcare facility type (e.g. 'hospital', 'clinic') */
  facilityType?: string | null;
  /** Transit classification type (e.g. 'station', 'halt', 'bus_stop', 'platform') */
  transitType?: string | null;
  /** Resolved feature coordinate location */
  coordinates?: { latitude: number; longitude: number } | null;
  latitude?: number | null;
  longitude?: number | null;
  /** Indicates whether this component is an officially designated government asset vs open-source/contextual */
  isOfficial?: boolean;
  /** Indicates whether object is explicitly tagged for disaster evacuation / assembly */
  isEvacuationPoint?: boolean;
  /** Error or failure reason if query was unsuccessful */
  error?: string | null;
}

export interface NormalizedRouteEvidence {
  /** Routed road distance in meters (null if no route or error) */
  routeDistanceMeters: number | null;
  /** Duration in fractional minutes for modeling (null if no route or error) */
  durationMinutes: number | null;
  /** Formatted driving duration string (e.g., "4 menit"), strictly labeled as estimated driving travel time */
  estimatedTravelTimeMinutes: string | null;
  /** Descriptive routing source summary */
  routingSource: string;
  /** Canonical provider source identity */
  source: TransportProviderSource;
  /** Descriptive provider name */
  provider: string;
  /** Route discovery status */
  status: TransportRouteStatus;
  /** API endpoint queried */
  endpoint?: string | null;
}

export interface NormalizedTransportEvidence {
  nearestRoad: NormalizedTransportComponent;
  majorRoad: NormalizedTransportComponent;
  healthcare: NormalizedTransportComponent;
  transit: NormalizedTransportComponent;
  fireStation: NormalizedTransportComponent;
  assemblyPoint?: NormalizedTransportComponent;
  assemblyPointRoute?: NormalizedRouteEvidence;
  route: NormalizedRouteEvidence;
  evaluatedAt: string;
}

/**
 * Standard Provider Contract for Spatial Accessibility and Transport Evidence
 */
export interface TransportProvider {
  getNearestRoad(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getMajorRoad(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getHealthcare(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getTransit(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getFireStation(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getAssemblyPoint?(coords: Coordinates): Promise<ApiResult<NormalizedTransportComponent>>;
  getRoute(origin: Coordinates, destination: Coordinates): Promise<ApiResult<NormalizedRouteEvidence>>;
}

