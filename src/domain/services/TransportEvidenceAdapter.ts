import { Coordinates } from '../value_objects/Coordinates.vo';
import type {
  NormalizedTransportEvidence,
  NormalizedTransportComponent,
  NormalizedRouteEvidence,
  TransportComponentStatus,
  TransportRouteStatus,
  TransportProviderSource
} from '../types/transport.types';
import type { MapboxSpatialSummary } from '../../infrastructure/external_apis/MapboxSpatialClient';
import type { SpatialProximityData } from '../../infrastructure/external_apis/OverpassOsmClient';
import type { BoundedSpatialDistance } from '../types/feature.types';
import { formatDistanceMeters } from '../utils/UnitConversions';

export interface TransportAdapterInput {
  mapbox?: MapboxSpatialSummary | null;
  osm?: SpatialProximityData | null;
  evaluatedAt?: string;
}

/**
 * TransportEvidenceAdapter
 * 
 * Central domain adapter implementing the OPEN SOURCE FIRST architecture for spatial transport
 * and accessibility evidence (OSRM + OpenStreetMap Overpass as primary, Mapbox as optional fallback/enrichment).
 * 
 * Guarantees:
 * 1. Open Source First: OSRM is primary for frontage road & routing; Overpass is primary for major road, healthcare, & transit.
 * 2. Mapbox is strictly optional: missing or invalid Mapbox token never degrades open-source resolution.
 * 3. Exact distances vs bounded distances are strictly differentiated (never store >15km as distanceMeters = 15000).
 * 4. Error and timeout states NEVER produce fake '>15 km' strings.
 * 5. All 4 transport indicators (Frontage, Major Road, Healthcare, Transit) maintain clear data provenance and status.
 */
export class TransportEvidenceAdapter {
  /**
   * Helper to construct a BoundedSpatialDistance object from normalized component fields.
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
        name: featureName || 'Data fasilitas/jalan tidak dapat dimuat (Penyedia tidak merespon)'
      };
    }

    if (exactDistanceMeters !== null) {
      const displayValue = formatDistanceMeters(exactDistanceMeters);
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
   * Transforms raw OSM/OSRM and Mapbox outputs into the canonical NormalizedTransportEvidence contract.
   * Resolves via Open Source First: OSRM & Overpass as primary, Mapbox as optional fallback.
   */
  public static normalize(input: TransportAdapterInput): NormalizedTransportEvidence {
    const evaluatedAt = input.evaluatedAt || new Date().toISOString();
    const mapbox = input.mapbox;
    const osm = input.osm;

    // -------------------------------------------------------------------------
    // 1. NEAREST ROAD / FRONTAGE (PRIMARY: OSRM, FALLBACK: MAPBOX)
    // -------------------------------------------------------------------------
    let nearestRoad: NormalizedTransportComponent;

    if (osm?.distanceToNearestRoadMeters !== null && osm?.distanceToNearestRoadMeters !== undefined) {
      const distM = osm.distanceToNearestRoadMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      nearestRoad = {
        name: osm.nearestRoadName || 'Jalan Akses Tapak (OSRM)',
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'osrm',
        provider: 'OSRM Road-Network Street Snapping',
        searchRadiusMeters: 500,
        searchRadiusKm: 0.5,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: 'https://router.project-osrm.org/nearest/v1/driving',
        isFallback: false,
        type: 'nearest_road',
        boundedObservation: osm.nearestRoadObservation || this.createBoundedObservation(distM, 500, osm.nearestRoadName, false)
      };
    } else if (osm?.nearestRoadObservation && (osm.nearestRoadObservation.state === 'AVAILABLE_BOUNDED' || osm.nearestRoadObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      nearestRoad = {
        name: osm.nearestRoadName || 'Tidak terdeteksi dalam radius 500 m',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Local Highways',
        searchRadiusMeters: 500,
        searchRadiusKm: 0.5,
        relation: 'greater_than',
        lowerBoundMeters: 500,
        endpoint: 'https://overpass-api.de/api/interpreter',
        isFallback: false,
        type: 'nearest_road',
        boundedObservation: osm.nearestRoadObservation
      };
    } else if (mapbox?.nearestRoad && (mapbox.nearestRoad.providerStatus === 'success_exact' || mapbox.nearestRoad.providerStatus === 'success_no_result')) {
      // Optional fallback: Mapbox Street Geocoding
      const isExact = mapbox.nearestRoad.providerStatus === 'success_exact' && mapbox.nearestRoad.distanceToNearestRoadMeters !== null;
      const distM = isExact ? mapbox.nearestRoad.distanceToNearestRoadMeters : null;
      const distKm = distM !== null ? Math.round((distM / 1000) * 10) / 10 : null;
      nearestRoad = {
        name: mapbox.nearestRoad.nearestRoadName,
        distanceMeters: distM,
        distanceKm: distKm,
        status: isExact ? 'success_exact' : 'success_bounded',
        source: 'mapbox',
        provider: 'Mapbox Street Geocoding (Fallback)',
        searchRadiusMeters: 500,
        searchRadiusKm: 0.5,
        relation: isExact ? 'exact' : 'greater_than',
        lowerBoundMeters: isExact ? null : 500,
        endpoint: mapbox.nearestRoad.endpoint,
        isFallback: true,
        type: 'nearest_road',
        boundedObservation: mapbox.nearestRoad.boundedObservation || this.createBoundedObservation(distM, 500, mapbox.nearestRoad.nearestRoadName, false)
      };
    } else {
      const isTimeout = osm?.queryStatus?.nearestRoad === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      nearestRoad = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'unknown',
        provider: 'Road Network Providers (Unavailable)',
        searchRadiusMeters: 500,
        searchRadiusKm: 0.5,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        type: 'nearest_road',
        error: isTimeout ? 'OSRM nearest road request timed out' : 'OSRM nearest road provider failed',
        boundedObservation: this.createBoundedObservation(null, 500, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 2. MAJOR / ARTERIAL ROAD (PRIMARY: OPENSTREETMAP OVERPASS)
    // -------------------------------------------------------------------------
    let majorRoad: NormalizedTransportComponent;

    if (osm?.distanceToArterialMeters !== null && osm?.distanceToArterialMeters !== undefined) {
      const distM = osm.distanceToArterialMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      majorRoad = {
        name: osm.nearestArterialName || 'Akses Jalan Arteri Utama',
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Polyline Segments',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: osm.auditTrail?.endpointsUsed?.majorRoad || null,
        isFallback: false,
        type: 'major_road',
        highwayClass: osm.arterialHighwayClass || null,
        geometryMethod: osm.auditTrail?.calculationMethod?.selectedArterialDistanceMethod === 'geometry_segment' ? 'geometry_segment' : 'center',
        boundedObservation: osm.arterialObservation || this.createBoundedObservation(distM, 15000, osm.nearestArterialName, false)
      };
    } else if (osm?.arterialObservation && (osm.arterialObservation.state === 'AVAILABLE_BOUNDED' || osm.arterialObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      majorRoad = {
        name: osm.nearestArterialName || 'Tidak terdeteksi dalam radius 15 km',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Polyline Segments',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'greater_than',
        lowerBoundMeters: 15000,
        endpoint: osm.auditTrail?.endpointsUsed?.majorRoad || null,
        isFallback: false,
        type: 'major_road',
        highwayClass: null,
        boundedObservation: osm.arterialObservation
      };
    } else {
      const isTimeout = osm?.queryStatus?.arterial === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      majorRoad = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Polyline Segments (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        type: 'major_road',
        error: isTimeout ? 'Overpass major road query timed out' : 'Overpass major road query failed',
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 3. HEALTHCARE / REFERRAL HOSPITAL (PRIMARY: OVERPASS, FALLBACK: MAPBOX)
    // -------------------------------------------------------------------------
    let healthcare: NormalizedTransportComponent;

    if (osm?.distanceToHospitalMeters !== null && osm?.distanceToHospitalMeters !== undefined) {
      const distM = osm.distanceToHospitalMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      healthcare = {
        name: osm.nearestHospitalName || 'Fasilitas Layanan Kesehatan',
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Healthcare Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: osm.auditTrail?.endpointsUsed?.hospital || osm.auditTrail?.endpointsUsed?.healthcare || null,
        isFallback: false,
        type: 'healthcare',
        facilityType: osm.hospitalFacilityType || 'hospital',
        coordinates: osm.hospitalCoordinates || null,
        latitude: osm.hospitalCoordinates?.latitude ?? null,
        longitude: osm.hospitalCoordinates?.longitude ?? null,
        boundedObservation: osm.hospitalObservation || this.createBoundedObservation(distM, 15000, osm.nearestHospitalName, false)
      };
    } else if (osm?.hospitalObservation && (osm.hospitalObservation.state === 'AVAILABLE_BOUNDED' || osm.hospitalObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      healthcare = {
        name: osm.nearestHospitalName || 'Tidak terdeteksi dalam radius 15 km',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Healthcare Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'greater_than',
        lowerBoundMeters: 15000,
        endpoint: osm.auditTrail?.endpointsUsed?.hospital || osm.auditTrail?.endpointsUsed?.healthcare || null,
        isFallback: false,
        type: 'healthcare',
        facilityType: null,
        boundedObservation: osm.hospitalObservation
      };
    } else if (mapbox?.hospital && (mapbox.hospital.providerStatus === 'success_exact' || mapbox.hospital.providerStatus === 'success_no_result')) {
      // Optional fallback: Mapbox Search Box / POI
      const isExact = mapbox.hospital.providerStatus === 'success_exact' && mapbox.hospital.distanceMeters !== null;
      const distM = isExact ? mapbox.hospital.distanceMeters : null;
      const distKm = distM !== null ? Math.round((distM / 1000) * 10) / 10 : null;
      healthcare = {
        name: mapbox.hospital.name,
        distanceMeters: distM,
        distanceKm: distKm,
        status: isExact ? 'success_exact' : 'success_bounded',
        source: 'mapbox',
        provider: 'Mapbox Search Box / POI API (Fallback)',
        searchRadiusMeters: mapbox.hospital.searchRadiusMeters || 15000,
        searchRadiusKm: Math.round((mapbox.hospital.searchRadiusMeters || 15000) / 1000),
        relation: isExact ? 'exact' : 'greater_than',
        lowerBoundMeters: isExact ? null : 15000,
        endpoint: 'https://api.mapbox.com/search/searchbox/v1/category/hospital',
        isFallback: true,
        type: 'healthcare',
        facilityType: 'hospital',
        coordinates: mapbox.hospital.latitude && mapbox.hospital.longitude ? { latitude: mapbox.hospital.latitude, longitude: mapbox.hospital.longitude } : null,
        latitude: mapbox.hospital.latitude,
        longitude: mapbox.hospital.longitude,
        boundedObservation: mapbox.hospital.boundedObservation
      };
    } else {
      const isTimeout = osm?.queryStatus?.hospital === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      healthcare = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'unknown',
        provider: 'Healthcare POI Providers (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        type: 'healthcare',
        error: isTimeout ? 'Overpass healthcare query timed out' : 'Healthcare provider unreachable',
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 4. PUBLIC TRANSIT (PRIMARY: OVERPASS, FALLBACK: MAPBOX)
    // -------------------------------------------------------------------------
    let transit: NormalizedTransportComponent;

    if (osm?.distanceToNearestTransitMeters !== null && osm?.distanceToNearestTransitMeters !== undefined) {
      const distM = osm.distanceToNearestTransitMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      transit = {
        name: osm.nearestTransitName || 'Simpul Transit Terdekat',
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Transit Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: osm.auditTrail?.endpointsUsed?.transit || null,
        isFallback: false,
        type: 'transit',
        transitType: osm.transitType || 'station',
        boundedObservation: osm.transitObservation || this.createBoundedObservation(distM, 15000, osm.nearestTransitName, false)
      };
    } else if (osm?.transitObservation && (osm.transitObservation.state === 'AVAILABLE_BOUNDED' || osm.transitObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      transit = {
        name: osm.nearestTransitName || 'Tidak terdeteksi dalam radius 15 km',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Transit Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'greater_than',
        lowerBoundMeters: 15000,
        endpoint: osm.auditTrail?.endpointsUsed?.transit || null,
        isFallback: false,
        type: 'transit',
        transitType: null,
        boundedObservation: osm.transitObservation
      };
    } else if (mapbox?.transit && (mapbox.transit.providerStatus === 'success_exact' || mapbox.transit.providerStatus === 'success_no_result')) {
      // Optional fallback: Mapbox Search Box / POI
      const isExact = mapbox.transit.providerStatus === 'success_exact' && mapbox.transit.distanceMeters !== null;
      const distM = isExact ? mapbox.transit.distanceMeters : null;
      const distKm = distM !== null ? Math.round((distM / 1000) * 10) / 10 : null;
      transit = {
        name: mapbox.transit.name,
        distanceMeters: distM,
        distanceKm: distKm,
        status: isExact ? 'success_exact' : 'success_bounded',
        source: 'mapbox',
        provider: 'Mapbox Search Box / POI API (Fallback)',
        searchRadiusMeters: mapbox.transit.searchRadiusMeters || 10000,
        searchRadiusKm: Math.round((mapbox.transit.searchRadiusMeters || 10000) / 1000),
        relation: isExact ? 'exact' : 'greater_than',
        lowerBoundMeters: isExact ? null : 10000,
        endpoint: 'https://api.mapbox.com/search/searchbox/v1/category/transit_station',
        isFallback: true,
        type: 'transit',
        transitType: 'station',
        coordinates: mapbox.transit.latitude && mapbox.transit.longitude ? { latitude: mapbox.transit.latitude, longitude: mapbox.transit.longitude } : null,
        latitude: mapbox.transit.latitude,
        longitude: mapbox.transit.longitude,
        boundedObservation: mapbox.transit.boundedObservation
      };
    } else {
      const isTimeout = osm?.queryStatus?.transit === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      transit = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'unknown',
        provider: 'Public Transit Providers (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        type: 'transit',
        error: isTimeout ? 'Overpass transit query timed out' : 'Public transit provider unreachable',
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 5. FIRE STATION (PRIMARY: OVERPASS, FALLBACK: MAPBOX)
    // -------------------------------------------------------------------------
    let fireStation: NormalizedTransportComponent;

    if (osm?.distanceToFireStationMeters !== null && osm?.distanceToFireStationMeters !== undefined) {
      const distM = osm.distanceToFireStationMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      fireStation = {
        name: osm.nearestFireStationName || 'Pos Pemadam Kebakaran',
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Fire Station Query',
        searchRadiusMeters: 10000,
        searchRadiusKm: 10,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: osm.auditTrail?.endpointsUsed?.fireStation || null,
        isFallback: false,
        type: 'fire_station',
        boundedObservation: osm.fireStationObservation || this.createBoundedObservation(distM, 10000, osm.nearestFireStationName, false)
      };
    } else if (osm?.fireStationObservation && (osm.fireStationObservation.state === 'AVAILABLE_BOUNDED' || osm.fireStationObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      fireStation = {
        name: osm.nearestFireStationName || 'Tidak terdeteksi dalam radius 10 km',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Overpass Fire Station Query',
        searchRadiusMeters: 10000,
        searchRadiusKm: 10,
        relation: 'greater_than',
        lowerBoundMeters: 10000,
        endpoint: osm.auditTrail?.endpointsUsed?.fireStation || null,
        isFallback: false,
        type: 'fire_station',
        boundedObservation: osm.fireStationObservation
      };
    } else if (mapbox?.fireStation && (mapbox.fireStation.providerStatus === 'success_exact' || mapbox.fireStation.providerStatus === 'success_no_result')) {
      const isExact = mapbox.fireStation.providerStatus === 'success_exact' && mapbox.fireStation.distanceMeters !== null;
      const distM = isExact ? mapbox.fireStation.distanceMeters : null;
      const distKm = distM !== null ? Math.round((distM / 1000) * 10) / 10 : null;
      fireStation = {
        name: mapbox.fireStation.name,
        distanceMeters: distM,
        distanceKm: distKm,
        status: isExact ? 'success_exact' : 'success_bounded',
        source: 'mapbox',
        provider: 'Mapbox Search Box / POI API (Fallback)',
        searchRadiusMeters: mapbox.fireStation.searchRadiusMeters || 10000,
        searchRadiusKm: Math.round((mapbox.fireStation.searchRadiusMeters || 10000) / 1000),
        relation: isExact ? 'exact' : 'greater_than',
        lowerBoundMeters: isExact ? null : 10000,
        endpoint: 'https://api.mapbox.com/search/searchbox/v1/category/fire_station',
        isFallback: true,
        type: 'fire_station',
        boundedObservation: mapbox.fireStation.boundedObservation
      };
    } else {
      const isTimeout = osm?.queryStatus?.fireStation === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      fireStation = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'unknown',
        provider: 'Fire Service Providers (Unavailable)',
        searchRadiusMeters: 10000,
        searchRadiusKm: 10,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        type: 'fire_station',
        error: isTimeout ? 'Overpass fire station query timed out' : 'Fire service provider unreachable',
        boundedObservation: this.createBoundedObservation(null, 10000, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 5.5 ASSEMBLY POINT (PRIMARY: OVERPASS)
    // -------------------------------------------------------------------------
    let assemblyPoint: NormalizedTransportComponent;

    if (osm?.distanceToAssemblyPointMeters !== null && osm?.distanceToAssemblyPointMeters !== undefined) {
      const distM = osm.distanceToAssemblyPointMeters;
      const distKm = Math.round((distM / 1000) * 10) / 10;
      assemblyPoint = {
        name: osm.assemblyPointIsOfficial ? (osm.nearestAssemblyPointName || 'Titik Kumpul Terverifikasi') : (osm.nearestAssemblyPointName || 'Ruang Terbuka Publik (Kandidat Evakuasi)'),
        distanceMeters: distM,
        distanceKm: distKm,
        status: 'success_exact',
        source: 'overpass',
        provider: 'OpenStreetMap Assembly Point Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'exact',
        lowerBoundMeters: null,
        endpoint: osm.auditTrail?.endpointsUsed?.assemblyPoint || null,
        isFallback: false,
        isOfficial: Boolean(osm.assemblyPointIsOfficial),
        type: 'assembly_point',
        facilityType: osm.assemblyPointFacilityType || (osm.assemblyPointIsOfficial ? 'verified_assembly_point' : 'candidate_open_space'),
        coordinates: osm.assemblyPointCoordinates || null,
        latitude: osm.assemblyPointCoordinates?.latitude ?? null,
        longitude: osm.assemblyPointCoordinates?.longitude ?? null,
        boundedObservation: osm.assemblyPointObservation || this.createBoundedObservation(distM, 15000, osm.nearestAssemblyPointName || null, false)
      };
    } else if (osm?.assemblyPointObservation && (osm.assemblyPointObservation.state === 'AVAILABLE_BOUNDED' || osm.assemblyPointObservation.state === 'NODATA_SEARCH_SUCCESS')) {
      assemblyPoint = {
        name: osm.nearestAssemblyPointName || 'Tidak terdeteksi dalam radius 15 km',
        distanceMeters: null,
        distanceKm: null,
        status: 'success_bounded',
        source: 'overpass',
        provider: 'OpenStreetMap Assembly Point Query',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: 'greater_than',
        lowerBoundMeters: 15000,
        endpoint: osm.auditTrail?.endpointsUsed?.assemblyPoint || null,
        isFallback: false,
        isOfficial: false,
        type: 'assembly_point',
        boundedObservation: osm.assemblyPointObservation
      };
    } else {
      const isTimeout = osm?.queryStatus?.assemblyPoint === 'timeout';
      const status: TransportComponentStatus = isTimeout ? 'timeout' : 'error';
      assemblyPoint = {
        name: null,
        distanceMeters: null,
        distanceKm: null,
        status,
        source: 'unknown',
        provider: 'Assembly Point Providers (Unavailable)',
        searchRadiusMeters: 15000,
        searchRadiusKm: 15,
        relation: null,
        lowerBoundMeters: null,
        isFallback: true,
        isOfficial: false,
        type: 'assembly_point',
        error: isTimeout ? 'Overpass assembly point query timed out' : 'Assembly point provider unreachable',
        boundedObservation: this.createBoundedObservation(null, 15000, null, true)
      };
    }

    // -------------------------------------------------------------------------
    // 5.6 ASSEMBLY POINT ROUTE (OSRM)
    // -------------------------------------------------------------------------
    let assemblyPointRoute: NormalizedRouteEvidence | undefined = undefined;

    if (osm?.assemblyPointTravelTimeMinutes !== null && osm?.assemblyPointTravelTimeMinutes !== undefined) {
      assemblyPointRoute = {
        routeDistanceMeters: osm.assemblyPointRouteDistanceMeters ?? null,
        durationMinutes: osm.assemblyPointTravelTimeMinutes,
        estimatedTravelTimeMinutes: osm.assemblyPointTravelTimeDisplay || `${osm.assemblyPointTravelTimeMinutes} menit`,
        routingSource: 'OSRM Egress / Assembly Point Routing',
        source: 'osrm',
        provider: 'OSRM Road-Network Routing Engine',
        status: 'success',
        endpoint: 'https://router.project-osrm.org/route/v1/driving'
      };
    }

    // -------------------------------------------------------------------------
    // 6. DRIVING ROUTE (PRIMARY: OSRM, FALLBACK: MAPBOX)
    // -------------------------------------------------------------------------
    let route: NormalizedRouteEvidence;

    if (osm?.travelTimeMinutes !== null && osm?.travelTimeMinutes !== undefined) {
      route = {
        routeDistanceMeters: osm.travelTimeRouteDistanceMeters ?? null,
        durationMinutes: osm.travelTimeMinutes,
        estimatedTravelTimeMinutes: osm.estimatedTravelTimeMinutes || `${osm.travelTimeMinutes} menit`,
        routingSource: osm.routingSource || 'OSRM Road-Network Driving Graph',
        source: 'osrm',
        provider: 'OSRM Road-Network Routing Engine',
        status: 'success',
        endpoint: 'https://router.project-osrm.org/route/v1/driving'
      };
    } else if (mapbox?.route && mapbox.route.providerStatus === 'success') {
      route = {
        routeDistanceMeters: mapbox.route.travelTimeRouteDistanceMeters,
        durationMinutes: mapbox.route.travelTimeMinutes,
        estimatedTravelTimeMinutes: mapbox.route.estimatedTravelTimeMinutes,
        routingSource: 'Mapbox Directions API (driving profile)',
        source: 'mapbox',
        provider: 'Mapbox Directions API (Fallback)',
        status: 'success',
        endpoint: mapbox.route.endpoint
      };
    } else if (mapbox?.route && mapbox.route.providerStatus === 'no_route') {
      route = {
        routeDistanceMeters: null,
        durationMinutes: null,
        estimatedTravelTimeMinutes: 'Rute jalan tidak dapat diakses langsung',
        routingSource: 'Mapbox Directions API (no route found)',
        source: 'mapbox',
        provider: 'Mapbox Directions API',
        status: 'no_route',
        endpoint: mapbox.route.endpoint
      };
    } else {
      route = {
        routeDistanceMeters: null,
        durationMinutes: null,
        estimatedTravelTimeMinutes: null,
        routingSource: 'Layanan rute mengemudi tidak merespon',
        source: 'unknown',
        provider: 'Routing Engine (Unavailable)',
        status: 'error',
        endpoint: null
      };
    }

    return {
      nearestRoad,
      majorRoad,
      healthcare,
      transit,
      fireStation,
      assemblyPoint,
      assemblyPointRoute,
      route,
      evaluatedAt
    };
  }
}
