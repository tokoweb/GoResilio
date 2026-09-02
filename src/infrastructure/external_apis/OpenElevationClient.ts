import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface ElevationResult {
  elevationMeters: number | null;
  slopeDegrees?: number | null;
  slopePercent?: number | null;
  slopeClassification?: string | null;
  localReliefMeters?: number | null;
  localReliefType?: string | null;
  flowAccumulationPotential?: string | null;
}

/**
 * Open-Elevation API Client
 * Open-source fallback for Digital Elevation Models (DEM).
 * 
 * Official Documentation: https://open-elevation.com/
 * Endpoint: https://api.open-elevation.com/api/v1/lookup
 */
export class OpenElevationClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly TIMEOUT_MS = 6000;

  public static async fetchElevation(coords: Coordinates): Promise<ApiResult<ElevationResult>> {
    const lat = coords.lat.toFixed(4);
    const lng = coords.lng.toFixed(4);
    const cacheKey = `open_elev_v3_${lat}_${lng}`;
    const cached = LocalApiCache.get<ApiResult<ElevationResult>>(cacheKey);
    if (cached) return cached;

    let failureReason = 'Open-Elevation API unreachable';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const latN = (coords.lat + 0.001).toFixed(4);
      const latS = (coords.lat - 0.001).toFixed(4);
      const lngE = (coords.lng + 0.001).toFixed(4);
      const lngW = (coords.lng - 0.001).toFixed(4);
      const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}|${latN},${lng}|${latS},${lng}|${lat},${lngE}|${lat},${lngW}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal
      });

      if (!res.ok) {
        failureReason = `Open-Elevation returned HTTP ${res.status} (${res.statusText})`;
      } else {
        const json = await res.json();
        if (json && Array.isArray(json.results) && json.results.length >= 1) {
          const elev0 = json.results[0]?.elevation;
          if (typeof elev0 === 'number' && Number.isFinite(elev0)) {
            const zC = Math.round(elev0);
            let slopeDegrees: number | null = null;
            let slopePercent: number | null = null;
            let slopeClassification: string | null = null;
            let localReliefMeters: number | null = null;
            let localReliefType: string | null = null;
            let flowAccumulationPotential: string | null = null;

            if (json.results.length >= 5) {
              const zN = json.results[1]?.elevation;
              const zS = json.results[2]?.elevation;
              const zE = json.results[3]?.elevation;
              const zW = json.results[4]?.elevation;

              if (typeof zN === 'number' && typeof zS === 'number' && typeof zE === 'number' && typeof zW === 'number' &&
                  Number.isFinite(zN) && Number.isFinite(zS) && Number.isFinite(zE) && Number.isFinite(zW)) {
                const latRad = (coords.lat * Math.PI) / 180;
                const dy = 2 * 0.001 * 110574;
                const dx = 2 * 0.001 * 111320 * Math.cos(latRad);

                const dzdx = (zE - zW) / (dx || 1);
                const dzdy = (zN - zS) / (dy || 1);
                const gradient = Math.sqrt(dzdx * dzdx + dzdy * dzdy);

                const deg = (Math.atan(gradient) * 180) / Math.PI;
                slopeDegrees = +(deg.toFixed(1));
                slopePercent = +( (gradient * 100).toFixed(1) );

                if (slopeDegrees <= 2.0) slopeClassification = 'Datar (0–2°)';
                else if (slopeDegrees <= 5.0) slopeClassification = 'Landai (2–5°)';
                else if (slopeDegrees <= 15.0) slopeClassification = 'Miring (5–15°)';
                else slopeClassification = 'Curam (>15°)';

                const surroundingElevs = [zN, zS, zE, zW].sort((a, b) => a - b);
                const medianSurrounding = (surroundingElevs[1] + surroundingElevs[2]) / 2;
                localReliefMeters = +( (zC - medianSurrounding).toFixed(1) );

                if (localReliefMeters <= -0.5) {
                  localReliefType = 'Cekungan Lokal';
                  flowAccumulationPotential = slopeDegrees <= 2.5 ? 'Tinggi (Zona Cekungan / Konvergensi Aliran)' : 'Sedang (Limpasan Terkonsentrasi)';
                } else if (localReliefMeters >= 0.5) {
                  localReliefType = 'Punggung Lahan / Ketinggian Relatif';
                  flowAccumulationPotential = 'Rendah (Zona Divergen / Pelepasan Bebas)';
                } else {
                  localReliefType = 'Permukaan Rata / Netral';
                  flowAccumulationPotential = slopeDegrees <= 2.0 ? 'Sedang (Potensi Genangan Rata)' : 'Rendah (Limpasan Standar)';
                }
              }
            }

            const result: ApiResult<ElevationResult> = {
              data: {
                elevationMeters: zC,
                slopeDegrees,
                slopePercent,
                slopeClassification,
                localReliefMeters,
                localReliefType,
                flowAccumulationPotential
              },
              isFallback: false,
              confidenceLevel: 'medium',
              sourceName: 'Open-Elevation Public API'
            };
            LocalApiCache.set(cacheKey, result, 86400 * 7);
            return result;
          } else {
            failureReason = 'Open-Elevation results did not contain a finite numerical elevation';
          }
        } else {
          failureReason = 'Open-Elevation returned empty or malformed results array';
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        failureReason = `Open-Elevation request timed out (${this.TIMEOUT_MS}ms)`;
      } else {
        failureReason = err.message || 'Network error occurred while querying Open-Elevation';
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const fallbackResult: ApiResult<ElevationResult> = {
      data: null,
      isFallback: true,
      confidenceLevel: 'low',
      reason: failureReason,
      sourceName: 'Open-Elevation Public API'
    };

    LocalApiCache.set(cacheKey, fallbackResult, 300);
    return fallbackResult;
  }
}
