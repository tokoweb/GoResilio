import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';
import type { SoilGridsData } from '../../domain/types/hazard.types';

export class SoilGridsClient {
  private static readonly ENDPOINT = 'https://rest.isric.org/soilgrids/v2.0/properties/query';
  private static readonly TIMEOUT_MS = 8000;
  private static readonly CACHE_TTL_SECONDS = 7 * 24 * 3600; // 7 days (static soil raster)

  /**
   * Fetches real physical soil properties from ISRIC SoilGrids v2.0 REST API.
   * Preserves native units, raw values, and exact returned depth interval at 250m resolution.
   * Does NOT fabricate synthetic fallbacks or infer SNI site classes.
   */
  public static async fetchSoilMetrics(coords: Coordinates): Promise<ApiResult<SoilGridsData>> {
    const lat = coords.lat;
    const lng = coords.lng;
    const cacheKey = `soilgrids_v2_${lat.toFixed(4)}_${lng.toFixed(4)}`;

    const cached = LocalApiCache.get<SoilGridsData>(cacheKey);
    if (cached) {
      return {
        data: cached,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'ISRIC SoilGrids'
      };
    }

    const properties = ['phh2o', 'clay', 'sand', 'silt', 'bdod', 'soc', 'cec', 'nitrogen', 'cfvo'];
    const depths = ['0-5cm', '0-30cm'];
    const propParams = properties.map((p) => `property=${p}`).join('&');
    const depthParams = depths.map((d) => `depth=${d}`).join('&');
    const url = `${this.ENDPOINT}?lat=${lat}&lon=${lng}&${propParams}&${depthParams}&value=mean`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GoTangguh/1.0 (resilience@gotangguh.id)'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: `isric_api_http_${response.status}`,
          sourceName: 'ISRIC SoilGrids'
        };
      }

      const json = await response.json();
      if (!json || !json.properties || !Array.isArray(json.properties.layers)) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: 'isric_nodata_or_empty_layers',
          sourceName: 'ISRIC SoilGrids'
        };
      }

      const layers: any[] = json.properties.layers;
      const getLayerValue = (layerName: string, targetDepth: string = '0-30cm', fallbackDepth: string = '0-5cm'): { mean: number | null; raw: number | null; unit: string; depthLabel: string } => {
        const layer = layers.find((l) => l.name === layerName);
        if (!layer || !Array.isArray(layer.depths)) return { mean: null, raw: null, unit: '', depthLabel: targetDepth };

        let depthObj = layer.depths.find((d: any) => d.label === targetDepth);
        let matchedDepth = targetDepth;

        if (!depthObj || depthObj.values?.mean === null || depthObj.values?.mean === undefined) {
          depthObj = layer.depths.find((d: any) => d.label === fallbackDepth);
          if (depthObj) matchedDepth = fallbackDepth;
        }

        if (!depthObj || depthObj.values?.mean === null || depthObj.values?.mean === undefined) {
          return { mean: null, raw: null, unit: layer.unit_measure?.target_units || '', depthLabel: matchedDepth };
        }

        const rawMean = Number(depthObj.values.mean);
        if (isNaN(rawMean) || rawMean === -9999 || rawMean === 65535) {
          return { mean: null, raw: null, unit: layer.unit_measure?.target_units || '', depthLabel: matchedDepth };
        }

        return { mean: rawMean, raw: rawMean, unit: layer.unit_measure?.target_units || '', depthLabel: matchedDepth };
      };

      const phVal = getLayerValue('phh2o');
      const clayVal = getLayerValue('clay');
      const sandVal = getLayerValue('sand');
      const siltVal = getLayerValue('silt');
      const bdodVal = getLayerValue('bdod');
      const socVal = getLayerValue('soc');
      const cecVal = getLayerValue('cec');
      const nitrogenVal = getLayerValue('nitrogen');
      const cfvoVal = getLayerValue('cfvo');

      const hasValidMeasurement = [
        phVal.mean, clayVal.mean, sandVal.mean, siltVal.mean,
        bdodVal.mean, socVal.mean, cecVal.mean
      ].some((v) => v !== null);

      if (!hasValidMeasurement) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: 'isric_nodata_pixel (ocean or unmapped surface)',
          sourceName: 'ISRIC SoilGrids'
        };
      }

      // Determine predominant matched depth interval
      const resolvedDepth = clayVal.depthLabel || phVal.depthLabel || '0-30cm';

      // SoilGrids native scalings:
      // phh2o: pH * 10 (e.g. 62 -> 6.2)
      // clay, sand, silt: g/kg (e.g. 314 g/kg -> 31.4 %)
      // bdod: cg/cm³ (e.g. 135 cg/cm³ -> 1.35 kg/dm³)
      // soc: dg/kg (e.g. 150 dg/kg -> 15 g/kg)
      // cec: mmol(c)/kg (e.g. 180)
      // nitrogen: cg/kg (e.g. 120 -> 1.2 g/kg)
      // cfvo: cm3/100cm3 (volumetric % coarse fragments)
      const soilData: SoilGridsData = {
        phH2o: phVal.mean !== null ? Number((phVal.mean / 10).toFixed(1)) : null,
        phH2oRaw: phVal.raw,
        clayPercent: clayVal.mean !== null ? Number((clayVal.mean / 10).toFixed(1)) : null,
        sandPercent: sandVal.mean !== null ? Number((sandVal.mean / 10).toFixed(1)) : null,
        siltPercent: siltVal.mean !== null ? Number((siltVal.mean / 10).toFixed(1)) : null,
        bulkDensityCgCm3: bdodVal.mean !== null ? bdodVal.mean : null,
        organicCarbonDgKg: socVal.mean !== null ? socVal.mean : null,
        cecMmolcKg: cecVal.mean !== null ? cecVal.mean : null,
        nitrogenCgKg: nitrogenVal.mean !== null ? nitrogenVal.mean : null,
        coarseFragmentsPct: cfvoVal.mean !== null ? Number((cfvoVal.mean / 10).toFixed(1)) : null,
        spatialResolution: '250m',
        depthInterval: resolvedDepth,
        source: 'ISRIC SoilGrids',
        sourceDataset: 'SoilGrids 2.0 (ISRIC - World Soil Information)',
        endpoint: url,
        isAvailable: true
      };

      LocalApiCache.set(cacheKey, soilData, this.CACHE_TTL_SECONDS);

      return {
        data: soilData,
        isFallback: false,
        confidenceLevel: 'high',
        sourceName: 'ISRIC SoilGrids'
      };
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: isTimeout ? 'isric_timeout' : (err?.message || 'isric_fetch_failed'),
        sourceName: 'ISRIC SoilGrids'
      };
    }
  }
}
