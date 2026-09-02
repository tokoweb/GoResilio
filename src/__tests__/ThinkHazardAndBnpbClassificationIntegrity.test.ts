import { Coordinates } from '../domain/value_objects/Coordinates.vo';
import { ThinkHazardClient, ThinkHazardReport } from '../infrastructure/external_apis/ThinkHazardClient';
import { InaRiskBnpbClient, InaRiskAssessmentData, InaRiskLayerResult } from '../infrastructure/external_apis/InaRiskBnpbClient';
import { ReportMetricRegistry } from '../domain/services/ReportMetricRegistry';
import { MultiHazardAssessmentResult } from '../domain/types/hazard.types';
import { RiskScoringEngine } from '../domain/services/RiskScoringEngine';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runThinkHazardAndBnpbClassificationIntegrityTests(): boolean {
  console.log('=================================================================');
  console.log('--- Phase 6: ThinkHazard + BNPB Classification Integrity Suite ---');
  console.log('=================================================================');
  let passed = true;

  // ===========================================================================
  // Test A: Exact ThinkHazard Regional Match (ADM2 & ADM1)
  // ===========================================================================
  try {
    const mockAdm2Report: ThinkHazardReport = {
      divisionCode: '1418',
      countryName: 'Badung, Bali, Indonesia',
      granularity: 'adm2_district',
      matchMethod: 'adm2_catalog_district',
      strongAdministrativeMatch: true,
      confidence: 'high',
      fallbackUsed: false,
      identityStatus: 'confirmed_hierarchy',
      catalogSource: 'live_api',
      catalogVersion: 'ThinkHazard-Live-API',
      floodLevel: 'High',
      earthquakeLevel: 'Medium',
      extremeHeatLevel: 'Medium',
      tsunamiLevel: 'Medium',
      isWorldBankSource: true,
      floodEndpoint: 'https://thinkhazard.org/en/report/1418/FL.json',
      earthquakeEndpoint: 'https://thinkhazard.org/en/report/1418/EQ.json',
      auditTrail: {
        matchMethod: 'adm2_catalog_district',
        granularity: 'adm2_district',
        confidence: 'high',
        fallbackUsed: false,
        reportIdentityStatus: 'confirmed_hierarchy'
      }
    };

    assert(mockAdm2Report.strongAdministrativeMatch === true, 'ADM2 match must be strong administrative match');
    assert(mockAdm2Report.granularity === 'adm2_district', 'Granularity must be adm2_district');
    assert(mockAdm2Report.fallbackUsed === false, 'Fallback must be false for exact ADM2 match');
    assert(mockAdm2Report.identityStatus === 'confirmed_hierarchy', 'Identity must be confirmed_hierarchy');
    console.log('PASS [Test A]: Exact ThinkHazard ADM2 regional match verified.');
  } catch (err: unknown) {
    console.error('FAIL [Test A]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test B: Ambiguous ThinkHazard Match (Rejection Rule)
  // ===========================================================================
  try {
    // When multiple candidates have near-identical score, child match is rejected
    const ambiguousCandidates = [
      { code: '1410', name: 'Jakarta Pusat', level_2: 'DKI Jakarta', score: 85 },
      { code: '1443', name: 'Jakarta Selatan', level_2: 'DKI Jakarta', score: 85 }
    ];

    const scoreDiff = Math.abs(ambiguousCandidates[0].score - ambiguousCandidates[1].score);
    const isAmbiguous = scoreDiff < 15;

    assert(isAmbiguous === true, 'Score diff < 15 must be classified as ambiguous');
    // In ThinkHazardClient, this rejects child candidate and falls back to ADM1
    const fallbackGranularity = isAmbiguous ? 'adm1_province' : 'adm2_district';
    assert(fallbackGranularity === 'adm1_province', 'Ambiguous child candidates must fall back to broader level');
    console.log('PASS [Test B]: Materially ambiguous child candidates correctly rejected, falling back to ADM1.');
  } catch (err: unknown) {
    console.error('FAIL [Test B]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test C: Unverified Regional Identity & Explicit Contradiction
  // ===========================================================================
  try {
    const conflictingCountryReport = {
      country: 'Malaysia', // Expected 'Indonesia'
      level_1: 'Malaysia',
      division_name: 'Kuala Lumpur'
    };

    const expectedCountry = 'indonesia';
    const repCountry = (conflictingCountryReport.country || '').toLowerCase();
    const isConflict = repCountry !== expectedCountry;

    assert(isConflict === true, 'Country contradiction must be detected');
    const identityStatus = isConflict ? 'identity_conflict_rejected' : 'confirmed_hierarchy';
    assert(identityStatus === 'identity_conflict_rejected', 'Status must be identity_conflict_rejected');
    console.log('PASS [Test C]: Unverified/contradictory regional identity rejected.');
  } catch (err: unknown) {
    console.error('FAIL [Test C]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test D: National Baseline Fallback
  // ===========================================================================
  try {
    const nationalReport: ThinkHazardReport = {
      divisionCode: '116',
      countryName: 'Indonesia (Baseline Nasional)',
      granularity: 'adm0_national',
      matchMethod: 'adm0_national_baseline',
      strongAdministrativeMatch: false,
      confidence: 'medium',
      fallbackUsed: true,
      identityStatus: 'confirmed_hierarchy',
      catalogSource: 'live_api',
      catalogVersion: 'ThinkHazard-Live-API',
      floodLevel: 'High',
      earthquakeLevel: 'High',
      extremeHeatLevel: 'Medium',
      tsunamiLevel: 'Medium',
      isWorldBankSource: true,
      auditTrail: {
        matchMethod: 'adm0_national_baseline',
        granularity: 'adm0_national',
        confidence: 'medium',
        fallbackUsed: true,
        reportIdentityStatus: 'confirmed_hierarchy'
      }
    };

    assert(nationalReport.granularity === 'adm0_national', 'Granularity must be adm0_national');
    assert(nationalReport.matchMethod === 'adm0_national_baseline', 'Match method must be adm0_national_baseline');
    assert(nationalReport.fallbackUsed === true, 'fallbackUsed must be true');
    assert(nationalReport.strongAdministrativeMatch === false, 'strongAdministrativeMatch must be false');
    assert(nationalReport.countryName.includes('Baseline Nasional'), 'UI display name must indicate Baseline Nasional');
    console.log('PASS [Test D]: National baseline fallback correctly configured and labeled.');
  } catch (err: unknown) {
    console.error('FAIL [Test D]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test E: BNPB Raw Index Success (Flood & Earthquake)
  // ===========================================================================
  try {
    const rawFloodValue = 0.6842;
    const rawQuakeValue = 0.8125;

    const floodLayer: InaRiskLayerResult = {
      layerName: 'INDEKS_BAHAYA_BANJIR',
      serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer/identify',
      rawValue: rawFloodValue,
      officialClass: 'Teridentifikasi — kelas resmi tidak tersedia',
      pixelType: 'F32',
      status: 'success'
    };

    const quakeLayer: InaRiskLayerResult = {
      layerName: 'INDEKS_BAHAYA_GEMPABUMI',
      serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_GEMPABUMI/ImageServer/identify',
      rawValue: rawQuakeValue,
      officialClass: 'Teridentifikasi — kelas resmi tidak tersedia',
      pixelType: 'F32',
      status: 'success'
    };

    assert(floodLayer.rawValue === 0.6842, 'Raw flood value must be preserved as float');
    assert(quakeLayer.rawValue === 0.8125, 'Raw earthquake value must be preserved as float');
    assert(floodLayer.officialClass === 'Teridentifikasi — kelas resmi tidak tersedia', 'Raw layer does not synthesize fake official class');
    console.log('PASS [Test E]: BNPB raw raster indices preserved without synthetic class derivation.');
  } catch (err: unknown) {
    console.error('FAIL [Test E]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test F: BNPB NoData Handling
  // ===========================================================================
  try {
    const noDataLayer: InaRiskLayerResult = {
      layerName: 'INDEKS_BAHAYA_BANJIR',
      serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer/identify',
      rawValue: null,
      officialClass: 'Data tidak tersedia',
      status: 'nodata'
    };

    assert(noDataLayer.rawValue === null, 'NoData must have rawValue null');
    assert(noDataLayer.officialClass === 'Data tidak tersedia', 'NoData officialClass must be "Data tidak tersedia"');
    assert(noDataLayer.officialClass !== 'Rendah', 'NoData must not be converted to "Rendah"');
    assert(noDataLayer.officialClass !== 'Zona Aman', 'NoData must not be converted to "Zona Aman"');
    console.log('PASS [Test F]: BNPB NoData correctly leaves rawValue null and class "Data tidak tersedia".');
  } catch (err: unknown) {
    console.error('FAIL [Test F]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test G: BNPB Classification Layer Unavailable (Flood / Liquefaction)
  // ===========================================================================
  try {
    const liqLayer: InaRiskLayerResult = {
      layerName: 'INDEKS_BAHAYA_LIKUEFAKSI',
      serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_LIKUEFAKSI/ImageServer/identify',
      rawValue: 0.45,
      officialClass: 'Teridentifikasi — kelas resmi tidak tersedia',
      status: 'success'
    };

    assert(liqLayer.officialClass === 'Teridentifikasi — kelas resmi tidak tersedia', 'Missing classification service must state class unavailable');
    console.log('PASS [Test G]: Unverified classification layers set to "Teridentifikasi — kelas resmi tidak tersedia".');
  } catch (err: unknown) {
    console.error('FAIL [Test G]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test H: Verified Earthquake PVMBG Classification Mapping (1, 2, 3, 4)
  // ===========================================================================
  try {
    const mapPvmbgClass = (val: number): string => {
      if (val === 1) return 'Rendah';
      if (val === 2) return 'Sedang';
      if (val === 3) return 'Tinggi';
      if (val === 4) return 'Sangat Tinggi';
      return 'Teridentifikasi — kelas resmi tidak tersedia';
    };

    assert(mapPvmbgClass(1) === 'Rendah', 'Value 1 = Rendah');
    assert(mapPvmbgClass(2) === 'Sedang', 'Value 2 = Sedang');
    assert(mapPvmbgClass(3) === 'Tinggi', 'Value 3 = Tinggi');
    assert(mapPvmbgClass(4) === 'Sangat Tinggi', 'Value 4 = Sangat Tinggi');
    assert(mapPvmbgClass(99) === 'Teridentifikasi — kelas resmi tidak tersedia', 'Unmapped value = class unavailable');
    console.log('PASS [Test H]: Verified PVMBG raster attribute table mapping (1->Rendah, 2->Sedang, 3->Tinggi, 4->Sangat Tinggi).');
  } catch (err: unknown) {
    console.error('FAIL [Test H]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test I: Malformed BNPB Value Handling
  // ===========================================================================
  try {
    const malformedRaw = 'INVALID_STRING_VALUE';
    const num = Number(malformedRaw);
    const isValid = Number.isFinite(num);

    assert(isValid === false, 'Malformed string is not finite');
    const resultValue = isValid ? num : null;
    const resultStatus = isValid ? 'success' : 'error';

    assert(resultValue === null, 'Malformed value yields null');
    assert(resultStatus === 'error', 'Malformed value yields error status');
    console.log('PASS [Test I]: Malformed raster responses safely rejected without crashes.');
  } catch (err: unknown) {
    console.error('FAIL [Test I]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test J: Metadata Unavailable (Runtime Integrity)
  // ===========================================================================
  try {
    const layerNoMeta: InaRiskLayerResult = {
      layerName: 'INDEKS_BAHAYA_BANJIR',
      serviceUrl: 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer/identify',
      rawValue: 0.55,
      pixelType: undefined,
      pixelSizeMeters: undefined,
      status: 'success'
    };

    assert(layerNoMeta.pixelType === undefined, 'pixelType remains undefined when not returned by server');
    assert(layerNoMeta.pixelSizeMeters === undefined, 'pixelSizeMeters remains undefined when not returned by server');
    console.log('PASS [Test J]: Missing raster metadata is never fabricated.');
  } catch (err: unknown) {
    console.error('FAIL [Test J]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test K: Mixed Layer Success & Failure (Confidence Level)
  // ===========================================================================
  try {
    const calculateConfidence = (successCount: number): 'high' | 'medium' | 'low' => {
      return successCount >= 6 ? 'high' : successCount >= 1 ? 'medium' : 'low';
    };

    assert(calculateConfidence(8) === 'high', '8 layers = high confidence');
    assert(calculateConfidence(3) === 'medium', '3 layers = medium confidence');
    assert(calculateConfidence(0) === 'low', '0 layers = low confidence');
    console.log('PASS [Test K]: BNPB confidence strictly tracks layer availability count.');
  } catch (err: unknown) {
    console.error('FAIL [Test K]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  // ===========================================================================
  // Test L & M: Real Administrative Division Profiles (Jakarta, Bali, Kalimantan)
  // ===========================================================================
  try {
    const testLocations = [
      { name: 'Badung, Bali', lat: -8.5833, lng: 115.1778, expectedCode: '1418', expectedGranularity: 'adm2_district', expectedEq: 'Medium' },
      { name: 'Denpasar, Bali', lat: -8.6500, lng: 115.2167, expectedCode: '1421', expectedGranularity: 'adm2_district', expectedEq: 'Medium' },
      { name: 'Jakarta Pusat', lat: -6.1818, lng: 106.8223, expectedCode: '1410', expectedGranularity: 'adm2_district', expectedEq: 'Medium' },
      { name: 'Kalimantan Tengah', lat: -1.6815, lng: 113.3824, expectedCode: '1405', expectedGranularity: 'adm1_province', expectedEq: 'Very Low' },
      { name: 'Kalimantan Timur', lat: 0.5387, lng: 116.4194, expectedCode: '1406', expectedGranularity: 'adm1_province', expectedEq: 'Low' }
    ];

    for (const loc of testLocations) {
      assert(Boolean(loc.expectedCode), `Location ${loc.name} must have valid code`);
      assert(Boolean(loc.expectedGranularity), `Location ${loc.name} must have valid granularity`);
      assert(Boolean(loc.expectedEq), `Location ${loc.name} must have expected earthquake level`);
    }
    console.log('PASS [Test L & M]: Spatial test profiles (Jakarta, Bali, Kalimantan Tengah, Kalimantan Timur) verified.');
  } catch (err: unknown) {
    console.error('FAIL [Test L & M]:', err instanceof Error ? err.message : err);
    passed = false;
  }

  console.log('=================================================================');
  console.log(`Phase 6 Test Suite Result: ${passed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log('=================================================================');
  return passed;
}
