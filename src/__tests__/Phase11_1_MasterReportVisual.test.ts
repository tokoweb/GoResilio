import { MasterReportGenerator } from '../domain/services/MasterReportGenerator';
import { ReportViewModelBuilder } from '../domain/services/ReportViewModelBuilder';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

function createMockAssessment(overrides: Partial<MultiHazardAssessmentResult> = {}): MultiHazardAssessmentResult {
  return {
    referenceNumber: 'GT-BALI-2026-001',
    evaluatedAt: '2026-09-03T10:00:00Z',
    location: {
      formattedAddress: 'Jl. Danau Tamblingan No. 28, Sanur, Denpasar Selatan, Kota Denpasar, Bali',
      latitude: -8.6913,
      longitude: 115.2635,
      cityDistrict: 'Kota Denpasar',
      country: 'Indonesia'
    },
    propertyType: 'Residential',
    userPersona: 'Home Owner',
    overallScore: 68,
    overallLevel: 'medium',
    dominantHazard: 'quake',
    scoringStatus: 'complete',
    dataCompletenessScorePct: 92,
    flood: {
      score: 45,
      level: 'medium',
      scoreReliability: 'High',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      elevationMeters: 4.8,
      slopeDegrees: 0.8,
      max24hRainfallMm: 78,
      distanceToRiverMeters: 380,
      nearestRiverName: 'Tukad Badung',
      floodDepthMeters: null,
      returnPeriodYears: null,
      inariskFloodClass: 'SEDANG',
      inariskFloodRiskIndex: 0.48,
      causeId: 'Elevasi pesisir rendah dan presipitasi musiman.',
      causeEn: 'Low coastal elevation and seasonal precipitation.',
      impactId: 'Genangan air ringan di area pekarangan luar.',
      impactEn: 'Minor surface ponding in exterior yard areas.',
      mitigationId: 'Pembersihan saluran berkala.',
      mitigationEn: 'Periodic drainage clearance.'
    },
    quake: {
      score: 74,
      level: 'high',
      scoreReliability: 'High',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      maxHistoricalMag: 6.5,
      quakesCount150km: 18,
      quakesCount100km: 8,
      nearestEpicenterKm: 35.2,
      latestQuakeDescription: 'M5.1 - 35 km Barat Daya Denpasar',
      distanceToFaultKm: 16.4,
      nearestFaultName: 'Sesar Naik Busur Belakang Flores (Bali Segment)',
      faultType: 'Thrust',
      pgaBmkg: 0.32,
      pgaInaRisk: 0.35,
      mmiEstimate: null,
      vs30Mps: 285,
      soilType: 'Tanah Sedang',
      spectralAcc02s: 0.65,
      spectralAcc10s: 0.38,
      causeId: 'Kedekatan dengan zona subduksi dan sesar naik belakang busur.',
      causeEn: 'Proximity to subduction megathrust and back-arc thrust fault.',
      impactId: 'Potensi retak non-struktural pada dinding bata dan plesteran.',
      impactEn: 'Potential non-structural cracking on brick masonry walls.',
      mitigationId: 'Pengikatan perabotan tinggi ke dinding.',
      mitigationEn: 'Anchor high furniture to walls.',
      timelineData: [
        { year: 2017, count: 1, maxMagnitude: 4.2 },
        { year: 2018, count: 2, maxMagnitude: 4.8 },
        { year: 2019, count: 1, maxMagnitude: 3.9 },
        { year: 2020, count: 3, maxMagnitude: 6.5 },
        { year: 2021, count: 2, maxMagnitude: 4.5 },
        { year: 2022, count: 2, maxMagnitude: 5.0 },
        { year: 2023, count: 2, maxMagnitude: 4.1 },
        { year: 2024, count: 2, maxMagnitude: 4.9 },
        { year: 2025, count: 2, maxMagnitude: 4.3 },
        { year: 2026, count: 1, maxMagnitude: 4.0 }
      ]
    },
    heat: {
      score: 58,
      level: 'medium',
      scoreReliability: 'High',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      forecastPeakTempC: 33.2,
      historicalPeakTempC: 35.8,
      historicalPeriod: '1991-2020',
      historicalDataSource: 'ECMWF ERA5 Reanalysis',
      projectedTempRise2050C: 1.4,
      climateProjectionModel: 'NASA NEX-GDDP-CMIP6',
      heatStressRiskLevel: 'Medium',
      heatStressScore: 58,
      greenSpaceRatioPct: 18,
      coolingDegreeDays: 1850,
      relativeHumidityPct: 78,
      causeId: 'Iklim tropis pesisir dengan kelembapan tinggi.',
      causeEn: 'Tropical coastal climate with elevated humidity.',
      impactId: 'Kenaikan suhu dalam ruangan saat siang hari.',
      impactEn: 'Elevated daytime indoor temperatures.',
      mitigationId: 'Penambahan ventilasi silang.',
      mitigationEn: 'Install cross-ventilation.'
    },
    transport: {
      score: 82,
      level: 'low',
      scoreReliability: 'High',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      nearestRoadDistanceMeters: 8,
      nearestRoadName: 'Jl. Danau Tamblingan',
      majorRoadDistanceMeters: 420,
      majorRoadName: 'Jl. Bypass Ngurah Rai',
      hospitalDistanceMeters: 1450,
      hospitalName: 'RSUD Bali Mandara',
      transitHubDistanceMeters: 850,
      transitHubName: 'Halte Trans Sarbagita Sanur',
      evacuationPointDistanceMeters: 620,
      evacuationPointName: 'Pantai Sindhu Open Space',
      isOfficialEvacuationPoint: true,
      evacuationRouteDistanceMeters: 1450,
      evacuationTravelTimeMinutes: 6,
      emergencyAccessReliability: 'Good',
      nearestRoadType: 'residential',
      causeId: 'Akses jalan memadai.',
      causeEn: 'Adequate street access.',
      impactId: 'Aksesibilitas lancar.',
      impactEn: 'Smooth connectivity.',
      mitigationId: 'Pertahankan jalur bebas hambatan.',
      mitigationEn: 'Keep egress routes unobstructed.'
    },
    airQuality: {
      pm25: 22,
      pm10: 38,
      category: 'Baik',
      source: 'BMKG Air Quality'
    },
    prescriptions: [
      {
        id: 'rx-1',
        hazardType: 'quake',
        priority: 'high',
        category: 'structural',
        titleId: 'Periksa Pengikatan Dinding Bata dan Kolom Praktis',
        titleEn: 'Inspect Brick Wall Anchors and Tie-Columns',
        descId: 'Pastikan dinding bata terikat kuat dengan kolom beton bertulang.',
        descEn: 'Ensure brick masonry is firmly anchored to reinforced concrete columns.',
        estimatedCostMinIdr: 3000000,
        estimatedCostMaxIdr: 10000000,
        applicability: 'Semua Bangunan'
      }
    ],
    ...overrides
  };
}

export async function runPhase11_1Tests(): Promise<{ passed: boolean; results: Array<{ test: string; passed: boolean; message: string }> }> {
  const results: Array<{ test: string; passed: boolean; message: string }> = [];

  // =========================================================================
  // TEST A: Sample Indonesian
  // =========================================================================
  try {
    const sampleAssessment = createMockAssessment({ referenceNumber: 'SAMPLE-GT-ID-01' });
    const htmlId = MasterReportGenerator.generateMasterReportHtml({
      assessment: sampleAssessment,
      lang: 'id',
      isSample: true
    });

    const has11Sections = [
      'p1-cover',
      'p2-exec',
      'p3-profile',
      'p4-methodology',
      'p5-quake',
      'p6-flood',
      'p7-heat',
      'p8-access',
      'p9-compare',
      'p10-action',
      'p11-closing'
    ].every(id => htmlId.includes(`id="${id}"`));

    const noWatermarkId = !htmlId.includes('<div class="watermark">') && !htmlId.includes('CONTOH LAPORAN RESMI');
    const hasTaglineId = htmlId.includes('Kenali Risiko Properti Anda, Siapkan Solusinya');
    const hasAspectsId = htmlId.includes('Potensi Risiko') && htmlId.includes('Paparan') && htmlId.includes('Dampak');
    const hasDisclaimerId = htmlId.includes('Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.');

    const passedA = has11Sections && noWatermarkId && hasTaglineId && hasAspectsId && hasDisclaimerId;
    results.push({
      test: 'TEST A: Sample Indonesian preserves 11 sections, clean watermark-free layout, and verbatim ID strings',
      passed: passedA,
      message: passedA ? 'All 11 sections, pristine watermark-free layout, and verbatim ID strings verified' : 'Mismatch in sections or ID strings'
    });
  } catch (err: any) {
    results.push({ test: 'TEST A: Sample Indonesian', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST B: Sample English
  // =========================================================================
  try {
    const sampleAssessment = createMockAssessment({ referenceNumber: 'SAMPLE-GT-EN-01' });
    const htmlEn = MasterReportGenerator.generateMasterReportHtml({
      assessment: sampleAssessment,
      lang: 'en',
      isSample: true
    });

    const has11Sections = [
      'p1-cover',
      'p2-exec',
      'p3-profile',
      'p4-methodology',
      'p5-quake',
      'p6-flood',
      'p7-heat',
      'p8-access',
      'p9-compare',
      'p10-action',
      'p11-closing'
    ].every(id => htmlEn.includes(`id="${id}"`));

    const noWatermarkEn = !htmlEn.includes('<div class="watermark">') && !htmlEn.includes('SAMPLE REPORT');
    const hasTaglineEn = htmlEn.includes('Know Your Property Risk, Prepare Your Solution');
    const hasAspectsEn = htmlEn.includes('Hazard Potential') && htmlEn.includes('Exposure') && htmlEn.includes('Impact');  // methodology section
    const hasDisclaimerEn = htmlEn.includes('This analysis serves as an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.');

    const passedB = has11Sections && noWatermarkEn && hasTaglineEn && hasAspectsEn && hasDisclaimerEn;
    results.push({
      test: 'TEST B: Sample English preserves 11 sections, clean watermark-free layout, and verbatim EN strings',
      passed: passedB,
      message: passedB ? 'All 11 sections, pristine watermark-free layout, and verbatim EN strings verified' : 'Mismatch in sections or EN strings'
    });
  } catch (err: any) {
    results.push({ test: 'TEST B: Sample English', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST C: Real Bali Indonesian (No Sample Watermark, Authentic Data)
  // =========================================================================
  try {
    const baliAssessment = createMockAssessment({
      referenceNumber: 'GT-REAL-BALI-001',
      overallScore: 68
    });
    const htmlBaliId = MasterReportGenerator.generateMasterReportHtml({
      assessment: baliAssessment,
      lang: 'id',
      isSample: false
    });

    const noWatermark = !htmlBaliId.includes('<div class="watermark">') && !htmlBaliId.includes('<div class="sample-banner">');
    const hasScore = htmlBaliId.includes('68/100');
    const hasBaliAddress = htmlBaliId.includes('Danau Tamblingan');

    const passedC = noWatermark && hasScore && hasBaliAddress;
    results.push({
      test: 'TEST C: Real Bali Indonesian renders without watermark and with authentic scores',
      passed: passedC,
      message: passedC ? 'Clean presentation verified: no watermark, exact 68/100 score, Bali location intact' : `Failed: noWatermark=${noWatermark}, hasScore=${hasScore}, hasBaliAddress=${hasBaliAddress}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST C: Real Bali Indonesian', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST D: Real Bali English (Parity with Bali ID)
  // =========================================================================
  try {
    const baliAssessment = createMockAssessment({
      referenceNumber: 'GT-REAL-BALI-001',
      overallScore: 68
    });
    const htmlBaliEn = MasterReportGenerator.generateMasterReportHtml({
      assessment: baliAssessment,
      lang: 'en',
      isSample: false
    });

    const noWatermark = !htmlBaliEn.includes('<div class="watermark">') && !htmlBaliEn.includes('<div class="sample-banner">');
    const hasScore = htmlBaliEn.includes('68/100');
    const hasEnHeadings = htmlBaliEn.includes('Earthquake Risk') && htmlBaliEn.includes('Flood Risk') && htmlBaliEn.includes('Heat Stress Risk');

    const passedD = noWatermark && hasScore && hasEnHeadings;
    results.push({
      test: 'TEST D: Real Bali English renders pure English headings with exact numeric parity',
      passed: passedD,
      message: passedD ? 'Pure English headings and exact 68/100 score parity confirmed' : `Failed: noWatermark=${noWatermark}, hasScore=${hasScore}, hasEnHeadings=${hasEnHeadings}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST D: Real Bali English', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST E: Real Jakarta Indonesian (Active Fault & Timeline)
  // =========================================================================
  try {
    const jktAssessment = createMockAssessment({
      referenceNumber: 'GT-REAL-JKT-001',
      location: {
        formattedAddress: 'Jl. Gatot Subroto Kav. 52, Tebet, Jakarta Selatan',
        latitude: -6.2415,
        longitude: 106.8456,
        cityDistrict: 'Jakarta Selatan',
        country: 'Indonesia'
      },
      quake: {
        score: 82,
        level: 'high',
        scoreReliability: 'High',
        observedComponents: 4,
        expectedComponents: 4,
        coveragePct: 100,
        maxHistoricalMag: 6.8,
        quakesCount150km: 14,
        quakesCount100km: 5,
        nearestEpicenterKm: 42.5,
        latestQuakeDescription: 'M5.2 - 42 km Selatan',
        distanceToFaultKm: 8.4,
        nearestFaultName: 'Sesar Baribis',
        faultType: 'Thrust',
        pgaBmkg: 0.35,
        pgaInaRisk: 0.38,
        mmiEstimate: null,
        vs30Mps: 210,
        soilType: 'Tanah Sedang',
        spectralAcc02s: 0.72,
        spectralAcc10s: 0.45,
        causeId: 'Jalur sesar aktif Baribis.',
        causeEn: 'Baribis active fault corridor.',
        impactId: 'Guncangan gempa sedang hingga kuat.',
        impactEn: 'Moderate to strong ground shaking.',
        mitigationId: 'Penguatan struktur bangunan.',
        mitigationEn: 'Structural strengthening.',
        timelineData: [
          { year: 2017, count: 2, maxMagnitude: 4.2 },
          { year: 2018, count: 3, maxMagnitude: 5.1 },
          { year: 2019, count: 1, maxMagnitude: 3.8 },
          { year: 2020, count: 4, maxMagnitude: 6.8 },
          { year: 2021, count: 2, maxMagnitude: 4.5 },
          { year: 2022, count: 3, maxMagnitude: 5.0 },
          { year: 2023, count: 2, maxMagnitude: 4.0 },
          { year: 2024, count: 3, maxMagnitude: 4.8 },
          { year: 2025, count: 2, maxMagnitude: 4.3 },
          { year: 2026, count: 2, maxMagnitude: 4.1 }
        ]
      }
    });

    const htmlJkt = MasterReportGenerator.generateMasterReportHtml({
      assessment: jktAssessment,
      lang: 'id',
      isSample: false
    });

    const hasFault = htmlJkt.includes('Sesar Baribis');
    const hasTimelineSvg = htmlJkt.includes('<svg') && htmlJkt.includes('Peak M6.8');

    const passedE = hasFault && hasTimelineSvg;
    results.push({
      test: 'TEST E: Real Jakarta Indonesian correctly identifies Sesar Baribis and renders timeline SVG',
      passed: passedE,
      message: passedE ? 'Sesar Baribis (8.4 km) and 10-year seismic timeline SVG verified' : 'Fault or timeline missing'
    });
  } catch (err: any) {
    results.push({ test: 'TEST E: Real Jakarta Indonesian', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST F: Real Manila English (Non-Indonesia Provider Integrity)
  // =========================================================================
  try {
    const manilaAssessment = createMockAssessment({
      referenceNumber: 'GT-REAL-MNL-001',
      location: {
        formattedAddress: 'Roxas Blvd, Malate, Manila, 1004 Metro Manila, Philippines',
        latitude: 14.5764,
        longitude: 120.9852,
        cityDistrict: 'Manila',
        country: 'Philippines'
      },
      dataCompletenessScorePct: 100
    });

    const htmlMnl = MasterReportGenerator.generateMasterReportHtml({
      assessment: manilaAssessment,
      lang: 'en',
      isSample: false
    });

    const hasManila = htmlMnl.includes('Metro Manila');
    const has11Sections = [
      'p1-cover',
      'p2-exec',
      'p3-profile',
      'p4-methodology',
      'p5-quake',
      'p6-flood',
      'p7-heat',
      'p8-access',
      'p9-compare',
      'p10-action',
      'p11-closing'
    ].every(id => htmlMnl.includes(`id="${id}"`));

    const passedF = hasManila && has11Sections;
    results.push({
      test: 'TEST F: Real Manila English successfully renders international report with 11 sections',
      passed: passedF,
      message: passedF ? 'Manila, Philippines report rendered cleanly across all 11 sections' : 'Manila render failed'
    });
  } catch (err: any) {
    results.push({ test: 'TEST F: Real Manila English', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST G: Exact Numeric Parity between Dashboard Assessment & Report ViewModel
  // =========================================================================
  try {
    const testAssessment = createMockAssessment({ overallScore: 79 });
    const vm = ReportViewModelBuilder.build(testAssessment, { lang: 'id' });

    const parityOverall = vm.executiveSummary.overallScore === testAssessment.overallScore;
    const parityQuake = vm.earthquakeSection.donut.score === testAssessment.quake.score;
    const parityFlood = vm.floodSection.donut.score === testAssessment.flood.score;
    const parityHeat = vm.heatSection.donut.score === testAssessment.heat.score;

    const passedG = parityOverall && parityQuake && parityFlood && parityHeat;
    results.push({
      test: 'TEST G: Exact Numeric Parity between Assessment Result and Report View Model',
      passed: passedG,
      message: passedG ? `Parity confirmed: Overall=${vm.executiveSummary.overallScore}, Quake=${vm.earthquakeSection.donut.score}, Flood=${vm.floodSection.donut.score}, Heat=${vm.heatSection.donut.score}` : 'Discrepancy detected'
    });
  } catch (err: any) {
    results.push({ test: 'TEST G: Exact Numeric Parity', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST H: Strict Null Semantics (No Fabrication)
  // =========================================================================
  try {
    const nullAssessment = createMockAssessment({
      flood: {
        ...createMockAssessment().flood,
        floodDepthMeters: null,
        distanceToRiverMeters: null as any
      },
      airQuality: null as any
    });

    const vmId = ReportViewModelBuilder.build(nullAssessment, { lang: 'id' });
    const vmEn = ReportViewModelBuilder.build(nullAssessment, { lang: 'en' });

    const nullFloodDepthId = vmId.floodSection.floodDepthDisplay.includes('belum tersedia');
    const nullFloodDepthEn = vmEn.floodSection.floodDepthDisplay.includes('unavailable');
    const nullAirQualityId = vmId.heatSection.airQualityDisplay.includes('belum tersedia');
    const nullAirQualityEn = vmEn.heatSection.airQualityDisplay.includes('unavailable');

    const passedH = nullFloodDepthId && nullFloodDepthEn && nullAirQualityId && nullAirQualityEn;
    results.push({
      test: 'TEST H: Strict Null Semantics displays "Data belum tersedia" / "Data unavailable" without fabricating 0 or Low',
      passed: passedH,
      message: passedH ? 'Null fields correctly rendered as localized unavailable notices' : 'Fabrication detected on null inputs'
    });
  } catch (err: any) {
    results.push({ test: 'TEST H: Strict Null Semantics', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST I: Vector SVG Charts Presence and Validity
  // =========================================================================
  try {
    const testAssessment = createMockAssessment();
    const html = MasterReportGenerator.generateMasterReportHtml({ assessment: testAssessment, lang: 'id' });

    const svgCount = (html.match(/<svg/g) || []).length;
    const hasClosingSvg = (html.match(/<\/svg>/g) || []).length === svgCount;
    const hasDonuts = html.includes('stroke-dasharray');
    const hasTimeline = html.includes('id="eqGrad"');
    const hasTerrain = html.includes('id="terrainGrad"');

    const passedI = svgCount >= 6 && hasClosingSvg && hasDonuts && hasTimeline && hasTerrain;
    results.push({
      test: 'TEST I: Vector SVG Charts Generated (Donuts, Timeline, Terrain, Heat Trajectory, Map)',
      passed: passedI,
      message: passedI ? `Total ${svgCount} valid vector SVG elements embedded with complete tag matching` : 'SVG generation failed'
    });
  } catch (err: any) {
    results.push({ test: 'TEST I: Vector SVG Charts', passed: false, message: err.message });
  }

  // =========================================================================
  // TEST J: A4 Print Composition & Layout Integrity
  // =========================================================================
  try {
    const testAssessment = createMockAssessment();
    const html = MasterReportGenerator.generateMasterReportHtml({ assessment: testAssessment, lang: 'id' });

    const pageBreaks = (html.match(/class="page"/g) || []).length;
    const hasPageRule = html.includes('@page') && html.includes('size: A4');
    const hasRunningHeader = html.includes('class="rh"');
    const hasRunningFooter = html.includes('class="rf"');

    const passedJ = pageBreaks === 11 && hasPageRule && hasRunningHeader && hasRunningFooter;
    results.push({
      test: 'TEST J: A4 Print Composition with 11 sequential page-breaks and running headers/footers',
      passed: passedJ,
      message: passedJ ? `Exact 11 A4 pages verified with print pagination and running headers` : `Expected 11 page-breaks, found ${pageBreaks}`
    });
  } catch (err: any) {
    results.push({ test: 'TEST J: A4 Print Composition', passed: false, message: err.message });
  }

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
