import { PerformSiteAssessmentUseCase } from '../application/use_cases/PerformSiteAssessment.usecase';
import { MasterReportGenerator } from '../domain/services/MasterReportGenerator';
import { ReportViewModelBuilder } from '../domain/services/ReportViewModelBuilder';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

/**
 * Phase 11.3: Formal Real-Data Report + Zero Synthetic Report Data
 * Rigorous integration test verifying real assessment pipeline execution,
 * 100% score/coordinate parity, zero synthetic spatial curves, and strict null semantics.
 */
let cachedRealScanResult: MultiHazardAssessmentResult | null = null;

export async function runPhase11_3Tests(): Promise<{
  passed: boolean;
  results: Array<{ test: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; message: string }> = [];

  // =========================================================================
  // TEST 1: Strict Coordinate Requirement (Zero Jakarta Fallback)
  // =========================================================================
  try {
    const invalidAssessment = {
      overallScore: 70,
      overallLevel: 'medium',
      location: { latitude: null as any, longitude: null as any, formattedAddress: 'Unknown Site' },
      seismic: { score: 70, level: 'medium' },
      flood: { score: 50, level: 'medium' },
      heat: { score: 60, level: 'medium' },
      prescriptions: []
    } as unknown as MultiHazardAssessmentResult;

    let threwGenerator = false;
    try {
      MasterReportGenerator.generateMasterReportHtml({ assessment: invalidAssessment, isSample: false });
    } catch (err: any) {
      if (err.message.includes('Assessment coordinate unavailable')) threwGenerator = true;
    }

    let threwBuilder = false;
    try {
      ReportViewModelBuilder.build(invalidAssessment, { isSample: false });
    } catch (err: any) {
      if (err.message.includes('Assessment coordinate unavailable')) threwBuilder = true;
    }

    const passed1 = threwGenerator && threwBuilder;
    results.push({
      test: 'TEST 1: Strict Coordinate Requirement (Zero Jakarta Fallback)',
      passed: passed1,
      message: passed1
        ? 'Successfully threw explicit "Assessment coordinate unavailable" on missing coordinates (no -6.2, 106.8 fallback)'
        : `Failed: threwGenerator=${threwGenerator}, threwBuilder=${threwBuilder}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 1: Strict Coordinate Requirement', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 2: Real Scan Pipeline Execution (Tabanan, Bali)
  // =========================================================================
  let realScanResult: MultiHazardAssessmentResult | null = cachedRealScanResult;
  try {
    if (!realScanResult) {
      realScanResult = await PerformSiteAssessmentUseCase.execute({
        latitude: -8.4095,
        longitude: 115.1889,
        formattedAddress: 'Kabupaten Tabanan, Bali, Indonesia',
        propertyType: 'Residential',
        userPersona: 'Home Owner'
      });
      cachedRealScanResult = realScanResult;
    }

    const passed2 = !!realScanResult &&
      realScanResult.location.latitude === -8.4095 &&
      realScanResult.location.longitude === 115.1889 &&
      typeof realScanResult.overallScore === 'number' &&
      realScanResult.overallScore >= 0 &&
      realScanResult.overallScore <= 100;

    results.push({
      test: 'TEST 2: Real Scan Pipeline Execution (Tabanan, Bali)',
      passed: passed2,
      message: passed2
        ? `Real scan completed: OverallScore=${realScanResult.overallScore}, Lat=${realScanResult.location.latitude}, Lng=${realScanResult.location.longitude}`
        : 'Failed to execute real assessment'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 2: Real Scan Pipeline Execution', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 3: Score & Hazard Level Mathematical Parity
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const vm = ReportViewModelBuilder.build(realScanResult, { isSample: false, lang: 'id' });

    const parityOverall = vm.executiveSummary.overallScore === realScanResult.overallScore;
    const parityQuake = vm.earthquakeSection.donut.score === ((realScanResult.quake || (realScanResult as any).seismic)?.score ?? null);
    const parityFlood = vm.floodSection.donut.score === (realScanResult.flood?.score ?? null);
    const parityHeat = vm.heatSection.donut.score === (realScanResult.heat?.score ?? null);

    const passed3 = parityOverall && parityQuake && parityFlood && parityHeat;
    results.push({
      test: 'TEST 3: Score & Hazard Level Mathematical Parity',
      passed: passed3,
      message: passed3
        ? `Parity 100%: Overall=${vm.executiveSummary.overallScore}, Quake=${vm.earthquakeSection.donut.score}, Flood=${vm.floodSection.donut.score}, Heat=${vm.heatSection.donut.score}`
        : 'Score discrepancy detected between scan result and report view model'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 3: Score Mathematical Parity', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 4: Exact Coordinate Matching & Provenance in Rendered HTML
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const html = MasterReportGenerator.generateMasterReportHtml({ assessment: realScanResult, isSample: false, lang: 'id' });

    const hasCoords = html.includes('-8.40950°, 115.18890°');
    const hasAddress = html.includes('Kabupaten Tabanan, Bali, Indonesia');

    const passed4 = hasCoords && hasAddress;
    results.push({
      test: 'TEST 4: Exact Coordinate Matching & Provenance in Rendered HTML',
      passed: passed4,
      message: passed4 ? 'Coordinates and address perfectly matched in PDF/HTML' : 'Missing coordinate or address in HTML'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 4: Exact Coordinate Matching', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 5: Real OSM Map Tiles + Zero Synthetic Curves
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const realHtml = MasterReportGenerator.generateMasterReportHtml({ assessment: realScanResult, isSample: false, lang: 'id' });

    const noSyntheticRoad = !realHtml.includes('M 0 130 Q 180 145');
    const noSyntheticRiver = !realHtml.includes('M 40 0 Q 80 110');
    const hasOsmTiles = realHtml.includes('tile.openstreetmap.org');
    const hasOsmAttribution = realHtml.includes('© OpenStreetMap contributors');
    const hasCoords = realHtml.includes('-8.40950°, 115.18890°');
    const hasAuditBlock = realHtml.includes('Nomor Referensi') && realHtml.includes('Penapisan Mandiri Terverifikasi');

    const passed5 = noSyntheticRoad && noSyntheticRiver && hasOsmTiles && hasOsmAttribution && hasCoords && hasAuditBlock;
    results.push({
      test: 'TEST 5: Real OSM Tiles + Zero Synthetic Curves',
      passed: passed5,
      message: passed5
        ? 'Report verified: Real OSM tile URLs present, OSM attribution included, zero synthetic curves, coordinates & audit block verified'
        : `Failed: noSyntheticRoad=${noSyntheticRoad}, noSyntheticRiver=${noSyntheticRiver}, hasOsmTiles=${hasOsmTiles}, hasOsmAttribution=${hasOsmAttribution}, hasCoords=${hasCoords}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 5: Real OSM Tiles + Zero Synthetic Curves', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 6: Zero Speculative Travel Time Divisors (/80, /70)
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const vm = ReportViewModelBuilder.build(realScanResult, { isSample: false, lang: 'id' });
    const transit = vm.accessibilitySection.facilities.find(f => f.category === 'Simpul Transportasi');
    const assembly = vm.accessibilitySection.facilities.find(f => f.category === 'Ruang Terbuka Evakuasi');

    const validTransit = !transit || transit.travelTime === 'Data belum tersedia' || transit.travelTime.startsWith('±');
    const validAssembly = !assembly || assembly.travelTime === 'Data belum tersedia' || assembly.travelTime.startsWith('±');

    const passed6 = validTransit && validAssembly;
    results.push({
      test: 'TEST 6: Zero Speculative Travel Time Divisors (/80, /70)',
      passed: passed6,
      message: passed6
        ? 'Transit and evacuation travel times derived strictly from verified routing or explicit "Data belum tersedia"'
        : 'Failed: Speculative travel time formula detected'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 6: Zero Speculative Travel Time Divisors', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 7: Dynamic Action Plan Formed from Actual Prescriptions
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const vm = ReportViewModelBuilder.build(realScanResult, { isSample: false, lang: 'id' });

    const p1Valid = Array.isArray(vm.actionPlan.priority1List) && vm.actionPlan.priority1List.length > 0;
    const p2Valid = Array.isArray(vm.actionPlan.priority2List) && vm.actionPlan.priority2List.length > 0;
    const p3Valid = Array.isArray(vm.actionPlan.priority3List) && vm.actionPlan.priority3List.length > 0;

    const passed7 = p1Valid && p2Valid && p3Valid;
    results.push({
      test: 'TEST 7: Dynamic Action Plan Formed from Actual Prescriptions',
      passed: passed7,
      message: passed7
        ? `Action Plan dynamically formed: P1=${vm.actionPlan.priority1List.length} items, P2=${vm.actionPlan.priority2List.length} items, P3=${vm.actionPlan.priority3List.length} items`
        : 'Failed: Empty or invalid action plan priorities'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 7: Dynamic Action Plan Formed from Prescriptions', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 8: Alternative Route Honesty (No Boilerplate Narrative)
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const vm = ReportViewModelBuilder.build(realScanResult, { isSample: false, lang: 'id' });

    const notHardcoded = !vm.accessibilitySection.alternativeRouteText.includes('Secondary collector streets provide alternate egress');
    const honestUnavailable = !realScanResult.transport?.alternativeRouteDistanceMeters
      ? vm.accessibilitySection.alternativeRouteText === 'Rute alternatif belum tersedia'
      : true;

    const passed8 = notHardcoded && honestUnavailable;
    results.push({
      test: 'TEST 8: Alternative Route Honesty (No Boilerplate Narrative)',
      passed: passed8,
      message: passed8
        ? 'Alternative route displays honest status: "Rute alternatif belum tersedia" without speculative boilerplate'
        : 'Failed: Found hardcoded narrative in alternative route'
    });
  } catch (err: any) {
    results.push({ test: 'TEST 8: Alternative Route Honesty', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 9: Address State Honesty (No "Selected Coordinate Site")
  // =========================================================================
  try {
    const noAddressAssessment = {
      overallScore: 65,
      overallLevel: 'medium',
      location: { latitude: -8.4095, longitude: 115.1889, formattedAddress: '' },
      prescriptions: []
    } as unknown as MultiHazardAssessmentResult;

    const vmId = ReportViewModelBuilder.build(noAddressAssessment, { isSample: false, lang: 'id' });
    const vmEn = ReportViewModelBuilder.build(noAddressAssessment, { isSample: false, lang: 'en' });

    const passedId = vmId.cover.propertyAddress === 'Alamat tidak tersedia — koordinat terverifikasi';
    const passedEn = vmEn.cover.propertyAddress === 'Address unavailable — verified coordinates';

    const passed9 = passedId && passedEn;
    results.push({
      test: 'TEST 9: Address State Honesty (No "Selected Coordinate Site")',
      passed: passed9,
      message: passed9
        ? 'Unresolved addresses render honest verified coordinates label in ID & EN without fake text'
        : `Failed: vmId="${vmId.cover.propertyAddress}", vmEn="${vmEn.cover.propertyAddress}"`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 9: Address State Honesty', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 10: Strict Sample vs Real Report Isolation
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const realHtml = MasterReportGenerator.generateMasterReportHtml({ assessment: realScanResult, isSample: false, lang: 'id' });
    const sampleHtml = MasterReportGenerator.generateMasterReportHtml({ assessment: realScanResult, isSample: true, lang: 'id' });

    const realClean = !realHtml.includes('<div class="watermark">') && !realHtml.includes('CONTOH LAPORAN RESMI') && realHtml.includes('Penapisan Mandiri Terverifikasi');
    const sampleMarked = !sampleHtml.includes('<div class="watermark">') && sampleHtml.includes('Dokumen Sampel');

    const passed10 = realClean && sampleMarked;
    results.push({
      test: 'TEST 10: Strict Sample vs Real Report Isolation',
      passed: passed10,
      message: passed10
        ? 'Isolation 100% verified: Real report is pristine; Sample report has sample badge without intrusive watermarks'
        : `Failed: realClean=${realClean}, sampleMarked=${sampleMarked}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 10: Strict Sample vs Real Report Isolation', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 11: Zero-Synthetic Incomplete Assessment Audit (Prohibited Literal Scan)
  // =========================================================================
  try {
    const incompleteAssessment = {
      referenceNumber: 'GT-INCOMPLETE-2026-001',
      evaluatedAt: '2026-09-03T12:00:00Z',
      location: {
        latitude: -7.2504,
        longitude: 112.7688,
        formattedAddress: 'Surabaya, Jawa Timur, Indonesia',
        cityDistrict: null,
        country: 'Indonesia'
      },
      propertyType: 'Residential',
      userPersona: 'Home Buyer',
      overallScore: null,
      overallLevel: 'insufficient_data',
      dominantHazard: null,
      scoringStatus: 'insufficient_data',
      dataCompletenessScorePct: 15,
      quake: {
        score: null,
        level: 'insufficient_data',
        scoreReliability: null,
        pgaBmkg: null,
        pgaInaRisk: null,
        quakesCount150km: null,
        maxHistoricalMag: null,
        distanceToFaultKm: null,
        nearestFaultName: null,
        liquefactionRisk: null,
        vs30Mps: null
      },
      flood: {
        score: null,
        level: 'insufficient_data',
        scoreReliability: null,
        elevationMeters: null,
        max24hRainfallMm: null,
        distanceToRiverMeters: null,
        nearestRiverName: null,
        slopeDegrees: null,
        floodDepthMeters: null,
        historicalFloodEventsCount: null
      },
      heat: {
        score: null,
        level: 'insufficient_data',
        scoreReliability: null,
        forecastPeakTempC: null,
        historicalPeakTempC: null,
        projectedTempRise2050C: null,
        thinkHazardExtremeHeatLevel: null
      },
      transport: {
        score: null,
        level: 'unavailable',
        scoreReliability: null,
        distanceToNearestRoadMeters: 25,
        nearestRoadName: 'Jl. Pemuda',
        distanceToArterialMeters: null,
        nearestArterialName: null,
        distanceToHospitalMeters: null,
        nearestHospitalName: null,
        distanceToTransitHubMeters: null,
        nearestTransitName: null,
        distanceToAssemblyPointMeters: null,
        nearestAssemblyPointName: null,
        travelTimeRouteDistanceMeters: null,
        estimatedTravelTimeMinutes: null,
        alternativeRouteDistanceMeters: null,
        alternativeTravelTimeMinutes: null
      },
      prescriptions: [],
      sourceAttributions: ['OpenStreetMap']
    } as unknown as MultiHazardAssessmentResult;

    const htmlId = MasterReportGenerator.generateMasterReportHtml({ assessment: incompleteAssessment, isSample: false, lang: 'id' });
    const htmlEn = MasterReportGenerator.generateMasterReportHtml({ assessment: incompleteAssessment, isSample: false, lang: 'en' });
    const combinedHtml = `${htmlId}\n${htmlEn}`;

    // Forbidden real-report literals (Requirement 28)
    const prohibitedLiterals = [
      'Math.sin',
      'Math.cos',
      '/400',
      '< 1 min',
      'GT-SCAN-REF',
      'Controlled Baseline',
      'Paparan Terkendali',
      'Metropolitan District',
      'Wilayah Perkotaan',
      'High Liquefaction Potential',
      'Regular structural checks',
      'Routine drainage',
      'Proactive mitigation'
    ];

    const detectedForbidden = prohibitedLiterals.filter(lit => combinedHtml.includes(lit));

    // Required honest notices for missing data
    const honestIdChecks = [
      htmlId.includes('Riwayat tahunan tidak tersedia dari dataset yang digunakan'),
      htmlId.includes('Data potensi likuefaksi belum tersedia'),
      htmlId.includes('Data histori genangan mikro tapak belum tersedia'),
      htmlId.includes('Data kedalaman genangan belum tersedia'),
      htmlId.includes('Rute alternatif belum tersedia'),
      htmlId.includes('Data reliabilitas belum tersedia'),
      htmlId.includes('Belum dapat ditentukan'),
      htmlId.includes('Data wilayah administratif belum tersedia'),
      htmlId.includes('Tidak ada rekomendasi tindakan khusus yang dihasilkan dari bukti data yang tersedia')
    ];

    const honestEnChecks = [
      htmlEn.includes('Annual historical timeline unavailable from the dataset used'),
      htmlEn.includes('Liquefaction potential data unavailable'),
      htmlEn.includes('Site-level historical flood record unavailable'),
      htmlEn.includes('Flood depth data unavailable'),
      htmlEn.includes('Alternative route data unavailable'),
      htmlEn.includes('Data reliability unavailable'),
      htmlEn.includes('Undetermined'),
      htmlEn.includes('Administrative area data unavailable'),
      htmlEn.includes('No specific recommendation was generated from the available evidence')
    ];

    const allHonestPresent = honestIdChecks.every(Boolean) && honestEnChecks.every(Boolean);
    const passed11 = detectedForbidden.length === 0 && allHonestPresent;

    results.push({
      test: 'TEST 11: Zero-Synthetic Incomplete Assessment Audit (Prohibited Literal Scan)',
      passed: passed11,
      message: passed11
        ? 'Zero forbidden synthetic patterns detected; all honest missing-data notices verified in ID and EN'
        : `Failed: Detected forbidden [${detectedForbidden.join(', ')}], honestId=[${honestIdChecks.map((c, i) => c ? null : i).filter(x => x !== null).join(',')}], honestEn=[${honestEnChecks.map((c, i) => c ? null : i).filter(x => x !== null).join(',')}]`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 11: Zero-Synthetic Incomplete Assessment Audit', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST 12: Real Scan Metric Parity & Provenance Verification
  // =========================================================================
  try {
    if (!realScanResult) throw new Error('Real scan result unavailable from TEST 2');
    const realHtml = MasterReportGenerator.generateMasterReportHtml({ assessment: realScanResult, isSample: false, lang: 'id' });

    const hasRef = realHtml.includes(realScanResult.referenceNumber);
    const hasLat = realHtml.includes(realScanResult.location.latitude.toFixed(5));
    const hasLng = realHtml.includes(realScanResult.location.longitude.toFixed(5));
    const hasOverall = realHtml.includes(`${realScanResult.overallScore}/100`);
    const noDefaultRef = !realHtml.includes('GT-SCAN-REF');

    const passed12 = hasRef && hasLat && hasLng && hasOverall && noDefaultRef;
    results.push({
      test: 'TEST 12: Real Scan Metric Parity & Provenance Verification',
      passed: passed12,
      message: passed12
        ? `Full parity verified: Reference=${realScanResult.referenceNumber}, Lat=${realScanResult.location.latitude}, Lng=${realScanResult.location.longitude}, Score=${realScanResult.overallScore}/100`
        : `Failed: hasRef=${hasRef}, hasLat=${hasLat}, hasLng=${hasLng}, hasOverall=${hasOverall}, noDefaultRef=${noDefaultRef}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST 12: Real Scan Metric Parity & Provenance Verification', passed: false, message: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
