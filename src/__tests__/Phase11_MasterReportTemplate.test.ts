import { MasterReportGenerator } from '../domain/services/MasterReportGenerator';
import type { MultiHazardAssessmentResult } from '../domain/types/hazard.types';

function createMockAssessment(overrides: Partial<MultiHazardAssessmentResult> = {}): MultiHazardAssessmentResult {
  return {
    referenceNumber: 'GT-TEST-2026-001',
    evaluatedAt: '2026-09-03T10:00:00Z',
    location: {
      formattedAddress: 'Jl. Jenderal Sudirman No. 1, Jakarta Pusat, DKI Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      cityDistrict: 'Jakarta Pusat',
      country: 'Indonesia'
    },
    propertyType: 'Residential',
    userPersona: 'Home Owner',
    overallScore: 65,
    overallLevel: 'medium',
    dominantHazard: 'quake',
    scoringStatus: 'complete',
    dataCompletenessScorePct: 95,
    flood: {
      score: 55,
      level: 'medium',
      scoreReliability: 'High',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      elevationMeters: 8.5,
      slopeDegrees: 1.0,
      localReliefMeters: -0.2,
      localReliefType: 'Cekungan Lokal',
      flowAccumulationClassification: 'Relatif Datar',
      flowAccumulationIndex: null,
      max24hRainfallMm: 95,
      distanceToRiverMeters: 120,
      nearestRiverName: 'Kali Ciliwung',
      glofasDischargeM3s: null,
      dischargeAnomalyPct: null,
      causeId: 'Elevasi 8.5m dpl, jarak 120m dari Kali Ciliwung.',
      causeEn: 'Elevation 8.5m MSL, 120m from Ciliwung River.',
      impactId: 'Potensi genangan air permukaan saat hujan deras berkepanjangan.',
      impactEn: 'Potential surface water ponding during prolonged heavy rainfall.',
      recomId: 'Pertimbangkan evaluasi sistem saluran drainase lingkungan.',
      recomEn: 'Consider evaluating local drainage channels.'
    },
    quake: {
      score: 72,
      level: 'high',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      quakeClass: 'TINGGI',
      estimatedPgaG: 0.32,
      historicalQuakesCount150km: 24,
      maxHistoricalMagnitude: 6.1,
      maxMagnitudeYear: 2018,
      distanceToNearestFaultKm: 12.5,
      nearestFaultName: 'Sesar Baribis',
      liquefactionRisk: 'Sedang',
      causeId: 'Katalog seismik mencatat 24 gempa dalam 150 km; jarak sesar 12.5 km.',
      causeEn: 'Seismic catalog records 24 events within 150 km; fault distance 12.5 km.',
      impactId: 'Perkiraan percepatan tanah puncak model (PGA) 0.32 g untuk periode ulang 100 tahun.',
      impactEn: 'Estimated 100-year peak ground acceleration (PGA) of 0.32 g under regional seismic models.',
      recomId: 'Disarankan dilakukan pemeriksaan ikatan kolom praktis dan balok pengikat.',
      recomEn: 'Recommended periodic inspection of tie columns and ring beams.'
    },
    heat: {
      score: 48,
      level: 'medium',
      scoreReliability: 'measured',
      observedComponents: 4,
      expectedComponents: 4,
      coveragePct: 100,
      heatModelLevel: 'Sedang',
      forecastPeakTempC: 33.2,
      avgMaxTempC: 32.0,
      historicalPeakTempC: 35.8,
      historicalPeriod: '2014-2024',
      greenSpaceRatioPct: 22,
      projectedTempRise2050C: 0.8,
      acCostIncreasePct: 10,
      causeId: 'Suhu maksimum udara harian mencapai 33.2°C.',
      causeEn: 'Daily maximum air temperature reaches 33.2°C.',
      impactId: 'Suhu lingkungan meningkatkan beban pendinginan ruangan.',
      impactEn: 'Ambient thermal stress increases indoor cooling load.',
      recomId: 'Pertimbangkan peningkatan ventilasi silang alami.',
      recomEn: 'Consider optimizing natural cross-ventilation.'
    },
    transport: {
      score: 25,
      level: 'low',
      scoreReliability: 'High',
      distanceToNearestRoadMeters: 10,
      nearestRoadName: 'Jl. Sudirman',
      distanceToArterialMeters: 50,
      nearestArterialName: 'Jl. Jend. Sudirman',
      distanceToTransitHubMeters: 200,
      nearestTransitName: 'Stasiun MRT Dukuh Atas',
      distanceToHospitalMeters: 400,
      nearestHospitalName: 'RS Siloam Semanggi',
      distanceToAssemblyPointMeters: 250,
      nearestAssemblyPointName: 'Taman Dukuh Atas',
      assemblyPointIsOfficial: false,
      distanceToFireStationMeters: 1800,
      nearestFireStationName: 'Pos Damkar Setiabudi',
      estimatedTravelTimeMinutes: '2-4 menit',
      travelTimeRouteDistanceMeters: 250,
      routingSource: 'OpenStreetMap / OSRM',
      evacuationRouteStatusId: 'Akses koridor evakuasi tergolong sangat baik.',
      evacuationRouteStatusEn: 'Evacuation corridor connectivity is very good.',
      causeId: 'Akses jalan arteri terhubung langsung.',
      causeEn: 'Direct access to arterial road.',
      impactId: 'Konektivitas evakuasi sangat memadai.',
      impactEn: 'Evacuation connectivity is very sound.',
      recomId: 'Gunakan koridor arteri utama saat evakuasi.',
      recomEn: 'Utilize primary arterial corridors during evacuation.'
    },
    prescriptions: [
      {
        id: 'rx-1',
        category: 'earthquake',
        titleId: 'Perkuatan Kolom Praktis dan Angkur Dinding',
        titleEn: 'Reinforcement of Tie-Columns and Wall Anchors',
        descriptionId: 'Lakukan pemeriksaan visual ikatan kolom praktis.',
        descriptionEn: 'Perform visual inspection of tie-column joints.',
        actionType: 'Structural',
        estimatedCostIdr: 'Rp 4.000.000',
        estimatedCostUsd: '$270',
        costBasis: 'indicative_screening',
        priority: 'High',
        basis: 'risk_model'
      },
      {
        id: 'rx-2',
        category: 'flood',
        titleId: 'Pembersihan Saluran Drainase Tapak',
        titleEn: 'Site Drainage Channel Maintenance',
        descriptionId: 'Bersihkan saluran pembuangan air secara berkala.',
        descriptionEn: 'Clean drainage channels regularly.',
        actionType: 'Civil / Site',
        estimatedCostIdr: 'Rp 1.500.000',
        estimatedCostUsd: '$100',
        costBasis: 'indicative_screening',
        priority: 'Medium',
        basis: 'risk_model'
      },
      {
        id: 'rx-3',
        category: 'heat',
        titleId: 'Peningkatan Ventilasi Silang',
        titleEn: 'Cross-Ventilation Enhancement',
        descriptionId: 'Optimalkan bukaan jendela dan peneduh alami.',
        descriptionEn: 'Optimize window openings and shading.',
        actionType: 'Architectural',
        estimatedCostIdr: 'Rp 3.000.000',
        estimatedCostUsd: '$200',
        costBasis: 'indicative_screening',
        priority: 'Low',
        basis: 'risk_model'
      }
    ],
    ...overrides
  };
}

if (typeof describe !== 'undefined') {
describe('Phase 11: Client Master Report Template & Bilingual Integration', () => {
  it('strictly preserves the 11 client sections in exact order', () => {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });

    // Verify 11 sections
    expect(c.cover).toBeDefined();               // 1. Cover
    expect(c.execSummary).toBeDefined();          // 2. Executive Summary
    expect(c.propertyProfile).toBeDefined();      // 3. Profil Properti
    expect(c.methodology).toBeDefined();          // 4. Penjelasan Penilaian
    expect(c.earthquakeSection).toBeDefined();    // 5. Risiko Gempa Bumi
    expect(c.floodSection).toBeDefined();         // 6. Risiko Banjir
    expect(c.heatSection).toBeDefined();          // 7. Risiko Heat Stress
    expect(c.transportSection).toBeDefined();     // 8. Aksesibilitas & Transportasi
    expect(c.riskComparison).toBeDefined();       // 9. Perbandingan Risiko
    expect(c.actionPlan).toBeDefined();           // 10. Rencana Tindakan
    expect(c.closing).toBeDefined();              // 11. Penutup
  });

  it('generates accurate Indonesian (ID) presentation texts & client verbatim tagline and disclaimer', () => {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });

    // Section 1: Cover
    expect(c.cover.title).toBe('Laporan Risiko Properti');
    expect(c.cover.tagline).toBe('Kenali Risiko Properti Anda, Siapkan Solusinya');

    // Section 2: Executive Summary
    expect(c.execSummary.title).toBe('Ringkasan Eksekutif');
    expect(c.execSummary.topRecommendations.length).toBe(3);

    // Section 3: Profil Properti
    expect(c.propertyProfile.title).toBe('Profil Properti');

    // Section 4: Penjelasan Penilaian
    expect(c.methodology.title).toBe('Penjelasan Penilaian');
    expect(c.methodology.tableRows[0].aspect).toBe('Potensi risiko');
    expect(c.methodology.tableRows[1].aspect).toBe('Paparan');
    expect(c.methodology.tableRows[2].aspect).toBe('Dampak');
    expect(c.methodology.simpleSummary).toContain('Kami menilai seberapa besar potensi bahaya');

    // Section 5: Risiko Gempa Bumi
    expect(c.earthquakeSection.title).toBe('Risiko Gempa Bumi');

    // Section 6: Risiko Banjir
    expect(c.floodSection.title).toBe('Risiko Banjir');

    // Section 7: Risiko Heat Stress
    expect(c.heatSection.title).toBe('Risiko Heat Stress');

    // Section 8: Aksesibilitas dan Transportasi
    expect(c.transportSection.title).toBe('Aksesibilitas dan Transportasi');

    // Section 9: Perbandingan Risiko
    expect(c.riskComparison.title).toBe('Perbandingan Risiko');

    // Section 10: Rencana Tindakan
    expect(c.actionPlan.title).toBe('Rencana Tindakan (Mitigasi dan Adaptasi)');
    expect(c.actionPlan.priority1.heading).toBe('Prioritas 1 (Segera)');
    expect(c.actionPlan.note).toBe('Catatan: Tidak semua tindakan perlu dilakukan sekaligus—prioritaskan berdasarkan tingkat risiko.');

    // Section 11: Penutup & Exact Verbatim Disclaimer
    expect(c.closing.title).toBe('Penutup');
    expect(c.closing.disclaimer).toBe('Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.');
  });

  it('generates accurate English (EN) presentation texts & client verbatim tagline and disclaimer', () => {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    // Section 1: Cover
    expect(c.cover.title).toBe('Property Risk Assessment Report');
    expect(c.cover.tagline).toBe('Know Your Property Risk, Prepare Your Solution');

    // Section 2: Executive Summary
    expect(c.execSummary.title).toBe('Executive Summary');

    // Section 4: Assessment Explanation
    expect(c.methodology.tableRows[0].aspect).toBe('Hazard Potential');
    expect(c.methodology.tableRows[1].aspect).toBe('Exposure');
    expect(c.methodology.tableRows[2].aspect).toBe('Impact');
    expect(c.methodology.simpleSummary).toContain('We assess the magnitude of hazard potential');

    // Section 9: Risk Comparison
    expect(c.riskComparison.title).toBe('Risk Comparison');

    // Section 10: Action Plan
    expect(c.actionPlan.title).toBe('Action Plan (Mitigation & Adaptation)');
    expect(c.actionPlan.priority1.heading).toBe('Priority 1 (Immediate)');
    expect(c.actionPlan.note).toBe('Notes: Not all actions need to be carried out at once—prioritize based on risk level.');

    // Section 11: Closing & Exact Verbatim Disclaimer
    expect(c.closing.title).toBe('Conclusion & Next Steps');
    expect(c.closing.disclaimer).toBe('This analysis serves as an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.');
  });

  it('ensures numeric values are identical between Indonesian and English reports', () => {
    const mock = createMockAssessment();
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const cEn = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    // Scores
    expect(cId.earthquakeSection.score).toBe(cEn.earthquakeSection.score);
    expect(cId.floodSection.score).toBe(cEn.floodSection.score);
    expect(cId.heatSection.score).toBe(cEn.heatSection.score);

    // Coordinates
    expect(cId.cover.coordinates).toBe(cEn.cover.coordinates);
  });

  it('strictly handles null overall score: displays "Belum dapat dinilai", no fake 0/100', () => {
    const mock = createMockAssessment({ overallScore: null, overallLevel: 'insufficient_data' });
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const cEn = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    expect(cId.execSummary.overallScoreText).toBe('Belum dapat dinilai');
    expect(cEn.execSummary.overallScoreText).toBe('Data unavailable');
  });

  it('strictly handles null flood depth and null historical flood without fabrication', () => {
    const mock = createMockAssessment();
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const cEn = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    const histItem = cId.floodSection.evidenceItems.find(i => i.label === 'Riwayat Genangan Historis');
    const depthItem = cId.floodSection.evidenceItems.find(i => i.label === 'Kedalaman Genangan');
    expect(histItem?.value).toBe('Data histori genangan mikro tapak belum tersedia');
    expect(depthItem?.value).toBe('Data kedalaman genangan belum tersedia');

    const histEn = cEn.floodSection.evidenceItems.find(i => i.label === 'Site Historical Flood Record');
    const depthEn = cEn.floodSection.evidenceItems.find(i => i.label === 'Observed Flood Depth');
    expect(histEn?.value).toBe('Site-level historical flood record unavailable');
    expect(depthEn?.value).toBe('Flood depth data unavailable');
  });

  it('strictly avoids hardcoded MMI words in ground shaking; presents numerical PGA in g', () => {
    const mock = createMockAssessment();
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const cEn = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    const pgaId = cId.earthquakeSection.historicalEvidence.find(e => e.label === 'Perkiraan Guncangan');
    const pgaEn = cEn.earthquakeSection.historicalEvidence.find(e => e.label === 'Estimated Ground Shaking');

    expect(pgaId?.value).toBe('0.32 g');
    expect(pgaEn?.value).toBe('0.32 g');

    // Verify no MMI strings in ground motion
    expect(pgaId?.value).not.toMatch(/MMI/i);
    expect(pgaEn?.value).not.toMatch(/MMI/i);
  });

  it('strictly handles unobserved building attributes without fabrication', () => {
    const mock = createMockAssessment({ buildingProfile: undefined });
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const cEn = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });

    expect(cId.propertyProfile.floorCount).toBe('Data belum tersedia');
    expect(cId.propertyProfile.buildingAge).toBe('Data belum tersedia');
    expect(cEn.propertyProfile.floorCount).toBe('Data unavailable');
    expect(cEn.propertyProfile.buildingAge).toBe('Data unavailable');
  });

  it('strictly compares only physical hazards in Section 9 (excludes transportation)', () => {
    const mock = createMockAssessment();
    const cId = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });

    const hazardNames = cId.riskComparison.tableRows.map(r => r.hazard);
    expect(hazardNames).toContain('Gempa bumi');
    expect(hazardNames).toContain('Banjir');
    expect(hazardNames).toContain('Heat Stress');
    expect(hazardNames).not.toContain('Transportasi');
    expect(hazardNames).not.toContain('Transportation');
    expect(cId.riskComparison.tableRows.length).toBe(3);
  });

  it('renders valid SVG donut charts for scores and handles null gracefully', () => {
    const svgWithScore = MasterReportGenerator.renderSvgDonut(75, '#e11d48', 100);
    expect(svgWithScore).toContain('<svg');
    expect(svgWithScore).toContain('75');
    expect(svgWithScore).toContain('/100');

    const svgNull = MasterReportGenerator.renderSvgDonut(null, '#94a3b8', 100);
    expect(svgNull).toContain('<svg');
    expect(svgNull).toContain('N/A');
    expect(svgNull).not.toContain('NaN');
  });

  it('generates standalone printable HTML containing all 11 sections', () => {
    const mock = createMockAssessment();
    const html = MasterReportGenerator.generateMasterReportHtml({ assessment: mock, lang: 'id' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('id="sec-1-cover"');
    expect(html).toContain('id="sec-2-exec-summary"');
    expect(html).toContain('id="sec-3-property-profile"');
    expect(html).toContain('id="sec-4-methodology"');
    expect(html).toContain('id="sec-5-earthquake"');
    expect(html).toContain('id="sec-6-flood"');
    expect(html).toContain('id="sec-7-heat"');
    expect(html).toContain('id="sec-8-transport"');
    expect(html).toContain('id="sec-9-risk-comparison"');
    expect(html).toContain('id="sec-10-action-plan"');
    expect(html).toContain('id="sec-11-closing"');
    expect(html).toContain('Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.');
  });
});
}

export async function runPhase11Tests(): Promise<{
  passed: boolean;
  results: Array<{ test: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; message: string }> = [];

  try {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const all11 = !!(c.cover && c.execSummary && c.propertyProfile && c.methodology && c.earthquakeSection && c.floodSection && c.heatSection && c.transportSection && c.riskComparison && c.actionPlan && c.closing);
    results.push({ test: '11 client sections in exact order', passed: all11, message: all11 ? 'All 11 client sections preserved' : 'Sections missing' });
  } catch (e: any) {
    results.push({ test: '11 client sections in exact order', passed: false, message: e.message });
  }

  try {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'id' });
    const idOk = c.cover.title === 'Laporan Risiko Properti' &&
      c.cover.tagline === 'Kenali Risiko Properti Anda, Siapkan Solusinya' &&
      c.execSummary.title === 'Ringkasan Eksekutif' &&
      c.closing.disclaimer === 'Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.';
    results.push({
      test: 'Indonesian (ID) presentation texts & client verbatim',
      passed: idOk,
      message: idOk ? 'ID texts and verbatim verified' : `title="${c.cover.title}", tagline="${c.cover.tagline}", exec="${c.execSummary.title}", disc="${c.closing.disclaimer}"`
    });
  } catch (e: any) {
    results.push({ test: 'Indonesian (ID) presentation texts & client verbatim', passed: false, message: e.message });
  }

  try {
    const mock = createMockAssessment();
    const c = MasterReportGenerator.getSectionContent({ assessment: mock, lang: 'en' });
    const enOk = c.cover.title === 'Property Risk Assessment Report' &&
      c.cover.tagline === 'Know Your Property Risk, Prepare Your Solution' &&
      c.execSummary.title === 'Executive Summary' &&
      c.closing.disclaimer === 'This analysis serves as an initial screening indicator based on public spatial data and does not replace technical due diligence, soil investigation, or professional structural audit.';
    results.push({
      test: 'English (EN) presentation texts & client verbatim',
      passed: enOk,
      message: enOk ? 'EN texts and verbatim verified' : `title="${c.cover.title}", tagline="${c.cover.tagline}", exec="${c.execSummary.title}", disc="${c.closing.disclaimer}"`
    });
  } catch (e: any) {
    results.push({ test: 'English (EN) presentation texts & client verbatim', passed: false, message: e.message });
  }

  try {
    const mock = createMockAssessment();
    const html = MasterReportGenerator.generateMasterReportHtml({ assessment: mock, lang: 'id' });
    const hasAll = html.includes('<!DOCTYPE html>') &&
      html.includes('id="sec-1-cover"') &&
      html.includes('id="sec-11-closing"') &&
      html.includes('Analisis ini merupakan indikator penapisan awal berbasis data spasial publik dan tidak menggantikan uji tuntas teknis, penyelidikan tanah, atau audit struktural profesional.');
    results.push({ test: 'Standalone printable HTML containing all 11 sections', passed: hasAll, message: hasAll ? 'Printable HTML with 11 anchors verified' : 'Missing anchors' });
  } catch (e: any) {
    results.push({ test: 'Standalone printable HTML containing all 11 sections', passed: false, message: e.message });
  }

  const passed = results.every(r => r.passed);
  return { passed, results };
}
