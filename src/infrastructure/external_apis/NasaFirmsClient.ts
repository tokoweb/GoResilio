import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import type { NasaFirmsData } from '../../domain/types/hazard.types';

export interface FirmsDetectionRecord {
  latitude: number;
  longitude: number;
  acqDate: string | null;
  acqTime: string | null;
  satellite: string;
  instrument: string;
  confidence?: string;
  frp: number | null; // Fire Radiative Power (MW), null if invalid or unmeasured
  distanceKm: number;
}

export class NasaFirmsClient {
  private static readonly BASE_API = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  private static readonly WFS_ENDPOINT = 'https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/fires/';
  private static readonly TIMEOUT_MS = 8000;
  private static readonly CACHE_TTL_SECONDS = 1800; // 30 minutes for NRT satellite fire passes
  private static readonly DEFAULT_RADIUS_KM = 50;

  /**
   * Calculates geodesic Haversine distance in kilometers between two coordinates.
   */
  private static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371.0; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
    const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Fetches real active fire & thermal anomaly detections from NASA FIRMS.
   * Computes geodesic distance to actual fire coordinates and FRP statistics.
   * Keeps secrets server-side via process.env.NASA_FIRMS_MAP_KEY.
   * Does NOT fabricate random hotspot counts or classify "fire risk".
   */
  public static async fetchRecentHotspots(
    coords: Coordinates,
    radiusKm: number = NasaFirmsClient.DEFAULT_RADIUS_KM
  ): Promise<ApiResult<NasaFirmsData>> {
    const lat = coords.lat;
    const lng = coords.lng;
    const cacheKey = `firms_v2_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusKm}`;

    const cached = LocalApiCache.get<NasaFirmsData>(cacheKey);
    if (cached) {
      return {
        data: cached,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'NASA FIRMS'
      };
    }

    // Bounding box for ~radiusKm (1 degree ~ 111 km)
    const degDelta = (radiusKm * 1.2) / 111.0;
    const minLat = Number((lat - degDelta).toFixed(4));
    const maxLat = Number((lat + degDelta).toFixed(4));
    const minLon = Number((lng - degDelta).toFixed(4));
    const maxLon = Number((lng + degDelta).toFixed(4));
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;

    const mapKey = process.env.NASA_FIRMS_MAP_KEY || process.env.FIRMS_MAP_KEY;
    const sourceSensor = 'VIIRS_SNPP_NRT';
    const queryDays = 10; // FIRMS Area API query window limit per request

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      let detections: FirmsDetectionRecord[] = [];
      let usedEndpoint = '';

      if (mapKey) {
        // Authenticated NASA FIRMS Area API
        usedEndpoint = `${this.BASE_API}/${mapKey}/${sourceSensor}/${bbox}/${queryDays}`;
        const response = await fetch(usedEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv, application/json',
            'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const csvText = await response.text();
          detections = this.parseCsvDetections(csvText, coords, radiusKm);
        } else {
          return {
            data: null,
            isFallback: true,
            confidenceLevel: 'low',
            reason: `firms_api_http_${response.status}`,
            sourceName: 'NASA FIRMS'
          };
        }
      } else {
        // Public NASA FIRMS WFS / Open Feed (24hr layer)
        usedEndpoint = `${this.WFS_ENDPOINT}?service=WFS&version=2.0.0&request=GetFeature&typeName=ms:fires_viirs_snpp_24hrs&outputFormat=application/json&bbox=${bbox},urn:ogc:def:crs:EPSG::4326`;
        const response = await fetch(usedEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          detections = this.parseGeoJsonDetections(json, coords, radiusKm);
        } else {
          return {
            data: null,
            isFallback: true,
            confidenceLevel: 'low',
            reason: 'firms_map_key_not_configured_and_public_wfs_unavailable',
            sourceName: 'NASA FIRMS'
          };
        }
      }

      // Compute statistics over verified detections within radiusKm
      const now = Date.now();
      const oneDayMs = 24 * 3600 * 1000;
      const sevenDaysMs = 7 * 24 * 3600 * 1000;
      const thirtyDaysMs = 30 * 24 * 3600 * 1000;

      let count24h = 0;
      let count7d = 0;
      let count30d = 0;
      const frpList: number[] = [];
      let minDistanceKm: number | null = null;
      let latestIso: string | null = null;

      for (const d of detections) {
        if (d.acqDate) {
          const timeStr = d.acqTime || '0000';
          const hh = timeStr.padStart(4, '0').slice(0, 2);
          const mm = timeStr.padStart(4, '0').slice(2, 4);
          const detectDate = new Date(`${d.acqDate}T${hh}:${mm}:00Z`);

          if (!isNaN(detectDate.getTime())) {
            const ageMs = now - detectDate.getTime();
            if (ageMs <= oneDayMs) count24h++;
            if (ageMs <= sevenDaysMs) count7d++;
            if (ageMs <= thirtyDaysMs) count30d++;

            if (!latestIso || detectDate.toISOString() > latestIso) {
              latestIso = detectDate.toISOString();
            }
          }
        }

        if (typeof d.frp === 'number' && !isNaN(d.frp) && d.frp > 0) {
          frpList.push(d.frp);
        }

        if (minDistanceKm === null || d.distanceKm < minDistanceKm) {
          minDistanceKm = d.distanceKm;
        }
      }

      const maxFrp = frpList.length > 0 ? Number(Math.max(...frpList).toFixed(1)) : null;
      const meanFrp = frpList.length > 0 ? Number((frpList.reduce((a, b) => a + b, 0) / frpList.length).toFixed(1)) : null;

      const firmsData: NasaFirmsData = {
        activeHotspots24h: count24h,
        activeHotspots7d: count7d,
        activeHotspots30d: count30d,
        nearestHotspotKm: minDistanceKm,
        maxFrpMw: maxFrp,
        meanFrpMw: meanFrp,
        latestDetectionTime: latestIso,
        satelliteSensor: 'VIIRS Suomi-NPP NRT',
        searchRadiusKm: radiusKm,
        source: 'NASA FIRMS',
        endpoint: usedEndpoint,
        isAvailable: true
      };

      LocalApiCache.set(cacheKey, firmsData, this.CACHE_TTL_SECONDS);

      return {
        data: firmsData,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'NASA FIRMS'
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: isTimeout ? 'firms_api_timeout' : (err?.message || 'firms_fetch_failed'),
        sourceName: 'NASA FIRMS'
      };
    }
  }

  /**
   * Parses CSV payload from NASA FIRMS Area API.
   * Header format: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
   */
  public static parseCsvDetections(csv: string, coords: Coordinates, radiusKm: number): FirmsDetectionRecord[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    const dateIdx = header.indexOf('acq_date');
    const timeIdx = header.indexOf('acq_time');
    const frpIdx = header.indexOf('frp');
    const satIdx = header.indexOf('satellite');
    const instIdx = header.indexOf('instrument');
    const confIdx = header.indexOf('confidence');

    if (latIdx === -1 || lonIdx === -1) return [];

    const results: FirmsDetectionRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((r) => r.trim());
      if (row.length <= Math.max(latIdx, lonIdx)) continue;

      const fLat = parseFloat(row[latIdx]);
      const fLon = parseFloat(row[lonIdx]);
      if (isNaN(fLat) || isNaN(fLon)) continue;

      const distanceKm = this.calculateDistanceKm(coords.lat, coords.lng, fLat, fLon);
      if (distanceKm > radiusKm) continue; // Filter strictly to configured radius

      let frpVal: number | null = null;
      if (frpIdx !== -1 && row[frpIdx] !== '' && !isNaN(parseFloat(row[frpIdx]))) {
        const parsed = parseFloat(row[frpIdx]);
        if (parsed >= 0) frpVal = parsed;
      }

      results.push({
        latitude: fLat,
        longitude: fLon,
        acqDate: dateIdx !== -1 && row[dateIdx].trim().length > 0 ? row[dateIdx].trim() : null,
        acqTime: timeIdx !== -1 && row[timeIdx].trim().length > 0 ? row[timeIdx].trim() : null,
        satellite: satIdx !== -1 && row[satIdx].trim().length > 0 ? row[satIdx].trim() : 'VIIRS',
        instrument: instIdx !== -1 && row[instIdx].trim().length > 0 ? row[instIdx].trim() : 'VIIRS',
        confidence: confIdx !== -1 ? row[confIdx] : undefined,
        frp: frpVal,
        distanceKm
      });
    }

    return results;
  }

  /**
   * Parses GeoJSON payload from NASA FIRMS WFS service.
   */
  public static parseGeoJsonDetections(geoJson: any, coords: Coordinates, radiusKm: number): FirmsDetectionRecord[] {
    if (!geoJson || !Array.isArray(geoJson.features)) return [];
    const results: FirmsDetectionRecord[] = [];

    for (const feat of geoJson.features) {
      const geom = feat.geometry;
      if (!geom || geom.type !== 'Point' || !Array.isArray(geom.coordinates)) continue;

      const fLon = geom.coordinates[0];
      const fLat = geom.coordinates[1];
      if (typeof fLat !== 'number' || typeof fLon !== 'number' || isNaN(fLat) || isNaN(fLon)) continue;

      const distanceKm = this.calculateDistanceKm(coords.lat, coords.lng, fLat, fLon);
      if (distanceKm > radiusKm) continue;

      const props = feat.properties || {};
      let frpVal: number | null = null;
      const rawFrp = props.frp ?? props.FRP;
      if (rawFrp !== undefined && rawFrp !== null && !isNaN(parseFloat(rawFrp))) {
        const parsed = parseFloat(rawFrp);
        if (parsed >= 0) frpVal = parsed;
      }

      const rawDate = props.acq_date || props.ACQ_DATE || null;
      const rawTime = props.acq_time || props.ACQ_TIME || null;

      results.push({
        latitude: fLat,
        longitude: fLon,
        acqDate: typeof rawDate === 'string' && rawDate.trim().length > 0 ? rawDate.trim() : null,
        acqTime: typeof rawTime === 'string' && rawTime.trim().length > 0 ? rawTime.trim() : null,
        satellite: props.satellite || 'VIIRS',
        instrument: props.instrument || 'VIIRS',
        confidence: props.confidence,
        frp: frpVal,
        distanceKm
      });
    }

    return results;
  }
}
