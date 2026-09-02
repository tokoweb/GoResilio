import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import type { WorldPopData } from '../../domain/types/hazard.types';

export class WorldPopClient {
  private static readonly ENDPOINT = 'https://api.worldpop.org/v1/services/stats';
  private static readonly TIMEOUT_MS = 9000;
  private static readonly CACHE_TTL_SECONDS = 30 * 24 * 3600; // 30 days (static gridded population)

  /**
   * Helper to create a GeoJSON polygon circular buffer of radius R in meters.
   */
  private static createCircularBufferGeoJson(coords: Coordinates, radiusMeters: number, pointsCount: number = 16): any {
    const lat = coords.lat;
    const lng = coords.lng;
    const coordinates: [number, number][] = [];
    const earthRadius = 6371000; // meters

    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const distRad = radiusMeters / earthRadius;

    for (let i = 0; i <= pointsCount; i++) {
      const bearing = (i * 2 * Math.PI) / pointsCount;
      const pointLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(distRad) +
        Math.cos(latRad) * Math.sin(distRad) * Math.cos(bearing)
      );
      const pointLngRad = lngRad + Math.atan2(
        Math.sin(bearing) * Math.sin(distRad) * Math.cos(latRad),
        Math.cos(distRad) - Math.sin(latRad) * Math.sin(pointLatRad)
      );

      coordinates.push([
        Number(((pointLngRad * 180) / Math.PI).toFixed(6)),
        Number(((pointLatRad * 180) / Math.PI).toFixed(6))
      ]);
    }

    return {
      type: 'Feature',
      properties: { bufferRadiusMeters: radiusMeters },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  }

  /**
   * Fetches real gridded population exposure counts from WorldPop REST API.
   * Generates deterministic 1 km and 5 km radius circular buffer statistics.
   * Does NOT invent population counts if the API is offline or returns NoData.
   */
  public static async fetchPopulationExposure(coords: Coordinates): Promise<ApiResult<WorldPopData>> {
    const lat = coords.lat;
    const lng = coords.lng;
    const cacheKey = `worldpop_${lat.toFixed(4)}_${lng.toFixed(4)}`;

    const cached = LocalApiCache.get<WorldPopData>(cacheKey);
    if (cached) {
      return {
        data: cached,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'WorldPop'
      };
    }

    const geoJson1km = this.createCircularBufferGeoJson(coords, 1000);
    const geoJson5km = this.createCircularBufferGeoJson(coords, 5000);

    const area1kmSqKm = Math.PI * 1.0 * 1.0; // ~3.1416 km²
    const area5kmSqKm = Math.PI * 5.0 * 5.0; // ~78.54 km²

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Query WorldPop stats service for 1km buffer
      const response1km = await fetch(
        `${this.ENDPOINT}?dataset=wpgp&year=2020&geojson=${encodeURIComponent(JSON.stringify(geoJson1km.geometry))}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response1km.ok) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: `worldpop_api_http_${response1km.status}`,
          sourceName: 'WorldPop'
        };
      }

      const json1km = await response1km.json();
      let pop1km: number | null = null;

      if (json1km?.data?.total_population !== undefined && json1km.data.total_population !== null) {
        pop1km = Math.round(Number(json1km.data.total_population));
      } else if (typeof json1km?.total_population === 'number') {
        pop1km = Math.round(json1km.total_population);
      }

      // Query WorldPop stats service for 5km buffer
      let pop5km: number | null = null;
      try {
        const controller5 = new AbortController();
        const timeoutId5 = setTimeout(() => controller5.abort(), this.TIMEOUT_MS);

        const response5km = await fetch(
          `${this.ENDPOINT}?dataset=wpgp&year=2020&geojson=${encodeURIComponent(JSON.stringify(geoJson5km.geometry))}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
            },
            signal: controller5.signal
          }
        );
        clearTimeout(timeoutId5);

        if (response5km.ok) {
          const json5km = await response5km.json();
          if (json5km?.data?.total_population !== undefined && json5km.data.total_population !== null) {
            pop5km = Math.round(Number(json5km.data.total_population));
          } else if (typeof json5km?.total_population === 'number') {
            pop5km = Math.round(json5km.total_population);
          }
        }
      } catch {
        // pop5km remains null if secondary request fails
      }

      if (pop1km === null && pop5km === null) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: 'worldpop_nodata_or_empty_response',
          sourceName: 'WorldPop'
        };
      }

      const density1km = pop1km !== null ? Math.round(pop1km / area1kmSqKm) : null;
      const density5km = pop5km !== null ? Math.round(pop5km / area5kmSqKm) : null;

      const worldPopData: WorldPopData = {
        population1km: pop1km,
        populationDensity1km: density1km,
        population5km: pop5km,
        populationDensity5km: density5km,
        sourceYear: 2020,
        spatialResolution: '100m raster grid (aggregated to circular buffers)',
        source: 'WorldPop',
        sourceDataset: 'WorldPop Global High Resolution Population Denominators (wpgp 2020)',
        endpoint: `${this.ENDPOINT}?dataset=wpgp&year=2020`,
        isAvailable: true
      };

      LocalApiCache.set(cacheKey, worldPopData, this.CACHE_TTL_SECONDS);

      return {
        data: worldPopData,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'WorldPop'
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: isTimeout ? 'worldpop_api_timeout' : (err?.message || 'worldpop_fetch_failed'),
        sourceName: 'WorldPop'
      };
    }
  }
}
