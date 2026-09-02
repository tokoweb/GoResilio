import { Coordinates } from '../../domain/value_objects/Coordinates.vo';
import { LocalApiCache } from '../cache/LocalApiCache';
import { ApiResult } from '../../domain/types/api.types';

export interface InaRiskLayerResult {
  layerName: string;
  serviceUrl: string;
  rawValue: number | null;

  // Classification Layer Provenance
  classificationLayerName?: string;
  classificationServiceUrl?: string;
  classificationRawValue?: number | null;
  classificationStatus?: 'success' | 'nodata' | 'error';
  classificationError?: string;
  officialClass?: string;
  classMappingSource?: string;

  // Metadata from Live Service Response (populated only if returned at runtime)
  pixelType?: string;
  pixelSizeMeters?: number;
  dataMin?: number;
  dataMax?: number;
  attributes?: Record<string, unknown>;

  status: 'success' | 'nodata' | 'error' | 'outside_bounds';
  error?: string;
}

export interface InaRiskAssessmentData {
  floodHazardIndex: number | null;          // Raw BNPB raster pixel value from INDEKS_BAHAYA_BANJIR
  floodHazardClass: string;                 // Official class or "Teridentifikasi — kelas resmi tidak tersedia" / "Data tidak tersedia"
  floodRiskIndex: number | null;            // Raw BNPB raster pixel value from layer_risiko_banjir
  quakeHazardIndex: number | null;          // Raw BNPB raster pixel value from INDEKS_BAHAYA_GEMPABUMI
  quakeHazardClass: string;                 // Official class from verified PVMBG layer or "Teridentifikasi — kelas resmi tidak tersedia" / "Data tidak tersedia"
  pgaMcegG: number | null;                  // Official PGA (MCEG, 100yr return period) in g from PGA_MCEG_100
  pgaMcerS1: number | null;                 // Spectral acceleration S1 (1.0s) in g from PGA_MCER_S1_100
  pgaMcerSs: number | null;                 // Spectral acceleration Ss (0.2s) in g from PGA_MCER_Ss_100
  liquefactionIndex: number | null;         // Raw BNPB raster pixel value from INDEKS_BAHAYA_LIKUEFAKSI
  liquefactionHazardClass: string;          // Official class or "Teridentifikasi — kelas resmi tidak tersedia" / "Data tidak tersedia"
  liquefactionRisk: string;                 // Backward-compatible alias for liquefactionHazardClass
  landslideHazardIndex: number | null;      // Raw BNPB raster pixel value from INDEKS_BAHAYA_TANAHLONGSOR
  landslideRiskIndex: number | null;        // Raw BNPB raster pixel value from layer_risiko_tanah_longsor
  droughtHazardIndex: number | null;        // Raw BNPB raster pixel value from INDEKS_BAHAYA_KEKERINGAN
  extremeWeatherHazardIndex: number | null; // Raw BNPB raster pixel value from INDEKS_BAHAYA_CUACAEKSTRIM
  extremeWeatherRiskIndex: number | null;   // Raw BNPB raster pixel value from layer_risiko_cuaca_ekstrim
  wildfireHazardIndex: number | null;       // Raw BNPB raster pixel value from INDEKS_BAHAYA_KEBAKARAN_HUTAN_DAN_LAHAN
  tsunamiHazardIndex: number | null;        // Raw BNPB raster pixel value from INDEKS_BAHAYA_TSUNAMI
  multiHazardIndex: number | null;          // Raw BNPB raster pixel value from layer_bahaya_multi
  multiHazardRiskIndex: number | null;      // Raw BNPB raster pixel value from layer_risiko_multi

  // Additional Verified BNPB Spatial Layers
  evacuationRoutesIdentified?: boolean;     // Arah_jalur_evakuasi layer
  adminBoundaryIdentified?: boolean;       // batas_administrasi layer
  activeFaultIdentified?: boolean;          // Faults layer
  hazardClassSdk?: string | null;           // LAYER_KELAS_H_SDK
  riskClassSdk?: string | null;             // LAYER_KELAS_R_SDK

  isOfficialBnpbSource: boolean;            // True if at least one layer returned verified data from official BNPB GIS Server
  layers?: Record<string, InaRiskLayerResult>;
}

/**
 * BNPB inaRISK GIS ImageServer & MapServer Client
 * Official Government Disaster Risk Index provided by Badan Nasional Penanggulangan Bencana (BNPB).
 * 
 * Official Documentation & Portal: https://inarisk.bnpb.go.id/
 * ArcGIS REST Services: https://gis.bnpb.go.id/server/rest/services/inarisk
 */
export class InaRiskBnpbClient {
  private static readonly USER_AGENT = 'GoTangguh/1.0 (resilience@gotangguh.id)';
  private static readonly BASE_GIS_URL = 'https://gis.bnpb.go.id/server/rest/services/inarisk';
  private static readonly TIMEOUT_MS = 6500;

  /**
   * Query official BNPB inaRISK GIS Server for multi-hazard raster indices, verified PGA maps, and spatial layers.
   * Direct spatial identify using EPSG:4326 point geometry without synthetic threshold approximations.
   */
  public static async fetchSiteHazards(coords: Coordinates): Promise<ApiResult<InaRiskAssessmentData>> {
    // 1. Boundary check: BNPB inaRISK raster data strictly covers the Indonesian national extent
    if (coords.lat < -11.0 || coords.lat > 6.0 || coords.lng < 95.0 || coords.lng > 141.0) {
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: 'Coordinates outside BNPB inaRISK national boundary coverage',
        sourceName: 'BNPB inaRISK GIS Server'
      };
    }

    const cacheKey = `inarisk_expanded_v2_${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    const cached = LocalApiCache.get<ApiResult<InaRiskAssessmentData>>(cacheKey);
    if (cached) return cached;

    try {
      const geometry = JSON.stringify({
        x: coords.lng,
        y: coords.lat,
        spatialReference: { wkid: 4326 }
      });

      /**
       * Helper: Query single ImageServer layer identify endpoint
       */
      const identifyImageServer = async (
        layerName: string
      ): Promise<{
        value: number | null;
        isNoData: boolean;
        error?: string;
        pixelType?: string;
        rawAttributes?: Record<string, unknown>;
      }> => {
        const url = `${this.BASE_GIS_URL}/${layerName}/ImageServer/identify?geometry=${encodeURIComponent(
          geometry
        )}&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&f=json`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': this.USER_AGENT },
            signal: controller.signal
          });

          if (!res.ok) {
            return { value: null, isNoData: false, error: `HTTP ${res.status} (${res.statusText})` };
          }

          const data = await res.json();
          if (data && data.error) {
            return { value: null, isNoData: false, error: data.error.message || 'ArcGIS Server error' };
          }

          if (!data || data.value === 'NoData' || data.value === '' || data.value === null || data.value === undefined) {
            return { value: null, isNoData: true };
          }

          const numVal = Number(data.value);
          if (Number.isFinite(numVal)) {
            return {
              value: numVal,
              isNoData: false,
              pixelType: typeof data.pixelType === 'string' ? data.pixelType : undefined,
              rawAttributes: data.attributes
            };
          }

          return { value: null, isNoData: false, error: `Malformed raster value: ${data.value}` };
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Network error';
          const isAbort = err instanceof Error && err.name === 'AbortError';
          return {
            value: null,
            isNoData: false,
            error: isAbort ? `Request timed out (${this.TIMEOUT_MS}ms)` : errorMsg
          };
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const queryGenericRaster = async (layerName: string): Promise<InaRiskLayerResult> => {
        const serviceUrl = `${this.BASE_GIS_URL}/${layerName}/ImageServer/identify`;
        const res = await identifyImageServer(layerName);
        if (res.error) {
          return { layerName, serviceUrl, rawValue: null, status: 'error', error: res.error };
        }
        if (res.isNoData || res.value === null) {
          return { layerName, serviceUrl, rawValue: null, officialClass: 'Data tidak tersedia', status: 'nodata' };
        }
        return {
          layerName,
          serviceUrl,
          rawValue: +res.value.toFixed(4),
          officialClass: 'Teridentifikasi — kelas resmi tidak tersedia',
          pixelType: res.pixelType,
          attributes: res.rawAttributes,
          status: 'success'
        };
      };

      /**
       * Helper: Query MapServer identify endpoint for vector/feature layers
       */
      const queryMapServerLayer = async (layerName: string): Promise<InaRiskLayerResult> => {
        const serviceUrl = `${this.BASE_GIS_URL}/${layerName}/MapServer/identify`;
        const url = `${serviceUrl}?geometry=${encodeURIComponent(
          geometry
        )}&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=5&mapExtent=${coords.lng - 0.05},${coords.lat - 0.05},${coords.lng + 0.05},${coords.lat + 0.05}&imageDisplay=800,600,96&returnGeometry=false&f=json`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': this.USER_AGENT },
            signal: controller.signal
          });

          if (!res.ok) {
            return { layerName, serviceUrl, rawValue: null, status: 'error', error: `HTTP ${res.status}` };
          }

          const data = await res.json();
          if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
            const topResult = data.results[0];
            return {
              layerName,
              serviceUrl,
              rawValue: 1,
              officialClass: topResult.value || topResult.layerName || 'Teridentifikasi',
              attributes: topResult.attributes,
              status: 'success'
            };
          }
          return { layerName, serviceUrl, rawValue: null, officialClass: 'Data tidak tersedia', status: 'nodata' };
        } catch (err: unknown) {
          const isAbort = err instanceof Error && err.name === 'AbortError';
          return {
            layerName,
            serviceUrl,
            rawValue: null,
            status: 'error',
            error: isAbort ? `Request timed out (${this.TIMEOUT_MS}ms)` : 'Network error'
          };
        } finally {
          clearTimeout(timeoutId);
        }
      };

      /**
       * 1. Query Flood Layer
       */
      const queryFloodLayer = async (): Promise<InaRiskLayerResult> => {
        return queryGenericRaster('INDEKS_BAHAYA_BANJIR');
      };

      /**
       * 2. Query Earthquake Layer (Raw Index + Live PVMBG Classification Layer Query)
       */
      const queryEarthquakeLayer = async (): Promise<InaRiskLayerResult> => {
        const rawLayerName = 'INDEKS_BAHAYA_GEMPABUMI';
        const rawServiceUrl = `${this.BASE_GIS_URL}/${rawLayerName}/ImageServer/identify`;
        const rawRes = await identifyImageServer(rawLayerName);

        if (rawRes.error) {
          return { layerName: rawLayerName, serviceUrl: rawServiceUrl, rawValue: null, status: 'error', error: rawRes.error };
        }
        if (rawRes.isNoData || rawRes.value === null) {
          return { layerName: rawLayerName, serviceUrl: rawServiceUrl, rawValue: null, officialClass: 'Data tidak tersedia', status: 'nodata' };
        }

        const rawValue = +rawRes.value.toFixed(4);

        // Execute query to official PVMBG earthquake classification ImageServer
        const classLayerName = 'layer_bahaya_gempabumi_klasifikasi_PVMBG';
        const classServiceUrl = `${this.BASE_GIS_URL}/${classLayerName}/ImageServer/identify`;
        const classRes = await identifyImageServer(classLayerName);

        let officialClass = 'Teridentifikasi — kelas resmi tidak tersedia';
        let classificationRawValue: number | null = null;
        let classificationStatus: 'success' | 'nodata' | 'error' = 'nodata';
        let classificationError: string | undefined = undefined;
        let classMappingSource: string | undefined = undefined;

        if (classRes.error) {
          classificationStatus = 'error';
          classificationError = classRes.error;
        } else if (classRes.isNoData || classRes.value === null) {
          classificationStatus = 'nodata';
        } else if (Number.isFinite(classRes.value)) {
          classificationStatus = 'success';
          classificationRawValue = Math.round(classRes.value);

          if (classificationRawValue === 1) {
            officialClass = 'Rendah';
            classMappingSource = 'BNPB PVMBG RAT (Value 1 = Rendah)';
          } else if (classificationRawValue === 2) {
            officialClass = 'Sedang';
            classMappingSource = 'BNPB PVMBG RAT (Value 2 = Sedang)';
          } else if (classificationRawValue === 3) {
            officialClass = 'Tinggi';
            classMappingSource = 'BNPB PVMBG RAT (Value 3 = Tinggi)';
          } else if (classificationRawValue === 4) {
            officialClass = 'Sangat Tinggi';
            classMappingSource = 'BNPB PVMBG RAT (Value 4 = Sangat Tinggi)';
          } else if (typeof classRes.rawAttributes?.ClassName === 'string' && classRes.rawAttributes.ClassName.trim().length > 0) {
            officialClass = classRes.rawAttributes.ClassName.trim();
            classMappingSource = 'PVMBG ImageServer ClassName attribute';
          } else {
            officialClass = 'Teridentifikasi — kelas resmi tidak tersedia';
            classMappingSource = undefined;
          }
        }

        return {
          layerName: rawLayerName,
          serviceUrl: rawServiceUrl,
          rawValue,
          classificationLayerName: classLayerName,
          classificationServiceUrl: classServiceUrl,
          classificationRawValue,
          classificationStatus,
          classificationError,
          officialClass,
          classMappingSource,
          pixelType: classRes.pixelType || rawRes.pixelType,
          status: 'success'
        };
      };

      // Execute all priority ImageServer & spatial MapServer queries concurrently
      const [
        floodLayer,
        floodRiskLayer,
        quakeLayer,
        pgaLayer,
        s1Layer,
        ssLayer,
        liqLayer,
        landslideHazardLayer,
        landslideRiskLayer,
        droughtLayer,
        weatherHazardLayer,
        weatherRiskLayer,
        wildfireLayer,
        tsunamiLayer,
        multiHazardLayer,
        multiRiskLayer,
        evacuationRouteLayer,
        adminBoundaryLayer,
        faultLayer,
        hazardClassSdkLayer,
        riskClassSdkLayer
      ] = await Promise.all([
        queryFloodLayer(),
        queryGenericRaster('layer_risiko_banjir'),
        queryEarthquakeLayer(),
        queryGenericRaster('PGA_MCEG_100'),
        queryGenericRaster('PGA_MCER_S1_100'),
        queryGenericRaster('PGA_MCER_Ss_100'),
        queryGenericRaster('INDEKS_BAHAYA_LIKUEFAKSI'),
        queryGenericRaster('INDEKS_BAHAYA_TANAHLONGSOR'),
        queryGenericRaster('layer_risiko_tanah_longsor'),
        queryGenericRaster('INDEKS_BAHAYA_KEKERINGAN'),
        queryGenericRaster('INDEKS_BAHAYA_CUACAEKSTRIM'),
        queryGenericRaster('layer_risiko_cuaca_ekstrim'),
        queryGenericRaster('INDEKS_BAHAYA_KEBAKARAN_HUTAN_DAN_LAHAN'),
        queryGenericRaster('INDEKS_BAHAYA_TSUNAMI'),
        queryGenericRaster('layer_bahaya_multi'),
        queryGenericRaster('layer_risiko_multi'),
        queryMapServerLayer('Arah_jalur_evakuasi'),
        queryMapServerLayer('batas_administrasi'),
        queryMapServerLayer('Faults'),
        queryGenericRaster('LAYER_KELAS_H_SDK'),
        queryGenericRaster('LAYER_KELAS_R_SDK')
      ]);

      const allLayers = [
        floodLayer, floodRiskLayer, quakeLayer, pgaLayer, s1Layer, ssLayer, liqLayer,
        landslideHazardLayer, landslideRiskLayer, droughtLayer, weatherHazardLayer,
        weatherRiskLayer, wildfireLayer, tsunamiLayer, multiHazardLayer, multiRiskLayer,
        evacuationRouteLayer, adminBoundaryLayer, faultLayer, hazardClassSdkLayer, riskClassSdkLayer
      ];

      const successfulLayersCount = allLayers.filter((l) => l.status === 'success').length;
      const anyLayerResponded = allLayers.some((l) => l.status === 'success' || l.status === 'nodata');

      if (!anyLayerResponded && successfulLayersCount === 0) {
        return {
          data: null,
          isFallback: true,
          confidenceLevel: 'low',
          reason: 'All BNPB GIS ImageServer layers unreachable or timed out',
          sourceName: 'BNPB inaRISK GIS Server'
        };
      }

      const floodHazardClass = floodLayer.status === 'success'
        ? (floodLayer.officialClass || 'Teridentifikasi — kelas resmi tidak tersedia')
        : 'Data tidak tersedia';

      const quakeHazardClass = quakeLayer.status === 'success'
        ? (quakeLayer.officialClass || 'Teridentifikasi — kelas resmi tidak tersedia')
        : 'Data tidak tersedia';

      const liquefactionHazardClass = liqLayer.status === 'success'
        ? (liqLayer.officialClass || 'Teridentifikasi — kelas resmi tidak tersedia')
        : 'Data tidak tersedia';

      const payload: InaRiskAssessmentData = {
        floodHazardIndex: floodLayer.rawValue,
        floodHazardClass,
        floodRiskIndex: floodRiskLayer.rawValue,
        quakeHazardIndex: quakeLayer.rawValue,
        quakeHazardClass,
        pgaMcegG: pgaLayer.rawValue,
        pgaMcerS1: s1Layer.rawValue,
        pgaMcerSs: ssLayer.rawValue,
        liquefactionIndex: liqLayer.rawValue,
        liquefactionHazardClass,
        liquefactionRisk: liquefactionHazardClass, // Backward-compatible alias
        landslideHazardIndex: landslideHazardLayer.rawValue,
        landslideRiskIndex: landslideRiskLayer.rawValue,
        droughtHazardIndex: droughtLayer.rawValue,
        extremeWeatherHazardIndex: weatherHazardLayer.rawValue,
        extremeWeatherRiskIndex: weatherRiskLayer.rawValue,
        wildfireHazardIndex: wildfireLayer.rawValue,
        tsunamiHazardIndex: tsunamiLayer.rawValue,
        multiHazardIndex: multiHazardLayer.rawValue,
        multiHazardRiskIndex: multiRiskLayer.rawValue,
        evacuationRoutesIdentified: evacuationRouteLayer.status === 'success',
        adminBoundaryIdentified: adminBoundaryLayer.status === 'success',
        activeFaultIdentified: faultLayer.status === 'success',
        hazardClassSdk: hazardClassSdkLayer.status === 'success' ? (hazardClassSdkLayer.officialClass || null) : null,
        riskClassSdk: riskClassSdkLayer.status === 'success' ? (riskClassSdkLayer.officialClass || null) : null,
        isOfficialBnpbSource: successfulLayersCount > 0,
        layers: {
          flood: floodLayer,
          floodRisk: floodRiskLayer,
          earthquake: quakeLayer,
          pgaMceg: pgaLayer,
          pgaMcerS1: s1Layer,
          pgaMcerSs: ssLayer,
          liquefaction: liqLayer,
          landslideHazard: landslideHazardLayer,
          landslideRisk: landslideRiskLayer,
          drought: droughtLayer,
          extremeWeatherHazard: weatherHazardLayer,
          extremeWeatherRisk: weatherRiskLayer,
          wildfire: wildfireLayer,
          tsunami: tsunamiLayer,
          multiHazard: multiHazardLayer,
          multiRisk: multiRiskLayer,
          evacuationRoutes: evacuationRouteLayer,
          adminBoundary: adminBoundaryLayer,
          faults: faultLayer,
          hazardClassSdk: hazardClassSdkLayer,
          riskClassSdk: riskClassSdkLayer
        }
      };

      const confidenceLevel: 'high' | 'medium' | 'low' =
        successfulLayersCount >= 6 ? 'high' : successfulLayersCount >= 1 ? 'medium' : 'low';

      const result: ApiResult<InaRiskAssessmentData> = {
        data: payload,
        isFallback: successfulLayersCount === 0,
        confidenceLevel,
        sourceName: 'BNPB inaRISK GIS Server'
      };

      LocalApiCache.set(cacheKey, result, 86400); // 24 hours cache
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network failure';
      return {
        data: null,
        isFallback: true,
        confidenceLevel: 'low',
        reason: errorMsg,
        sourceName: 'BNPB inaRISK GIS Server'
      };
    }
  }
}
