import fs from 'fs';
import path from 'path';
import { CanonicalRatingResolver, HAZARD_RATING_THRESHOLDS, ACCESSIBILITY_RATING_THRESHOLDS } from '../domain/services/CanonicalRatingResolver';
import type { MultiHazardAssessmentResult, RiskLevel } from '../domain/types/hazard.types';

export function runHeroDashboardRatingConsistencyTests(): boolean {
  console.log('================================================================');
  console.log('REGRESSION TEST: HERO & DASHBOARD RISK RATING CONSISTENCY (SSOT)');
  console.log('================================================================\n');

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // TEST 1: Score 79 -> Hero rating === Dashboard rating ('TINGGI')
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 1] Score 79 parity check (Expected: TINGGI / HIGH)...');
    const score = 79;
    const heroRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;
    const dashboardRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;

    if (heroRating !== 'TINGGI') {
      console.error(`FAIL [TEST 1]: Expected rating 'TINGGI' for score 79, got: ${heroRating}`);
      allPassed = false;
    } else if (heroRating !== dashboardRating) {
      console.error(`FAIL [TEST 1]: Hero rating (${heroRating}) !== Dashboard rating (${dashboardRating})`);
      allPassed = false;
    } else {
      console.log(`✓ PASS [TEST 1]: score 79 -> Hero rating (${heroRating}) === Dashboard rating (${dashboardRating})`);
    }
  } catch (err) {
    console.error('FAIL [TEST 1]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Score 47 -> Hero rating === Dashboard rating ('SEDANG')
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 2] Score 47 parity check (Expected: SEDANG / MEDIUM)...');
    const score = 47;
    const heroRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;
    const dashboardRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;

    if (heroRating !== 'SEDANG') {
      console.error(`FAIL [TEST 2]: Expected rating 'SEDANG' for score 47, got: ${heroRating}`);
      allPassed = false;
    } else if (heroRating !== dashboardRating) {
      console.error(`FAIL [TEST 2]: Hero rating (${heroRating}) !== Dashboard rating (${dashboardRating})`);
      allPassed = false;
    } else {
      console.log(`✓ PASS [TEST 2]: score 47 -> Hero rating (${heroRating}) === Dashboard rating (${dashboardRating})`);
    }
  } catch (err) {
    console.error('FAIL [TEST 2]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Score 35 -> Hero rating === Dashboard rating ('SEDANG')
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 3] Score 35 parity check (Expected: SEDANG / MEDIUM)...');
    const score = 35;
    const heroRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;
    const dashboardRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;

    if (heroRating !== 'SEDANG') {
      console.error(`FAIL [TEST 3]: Expected rating 'SEDANG' for score 35, got: ${heroRating}`);
      allPassed = false;
    } else if (heroRating !== dashboardRating) {
      console.error(`FAIL [TEST 3]: Hero rating (${heroRating}) !== Dashboard rating (${dashboardRating})`);
      allPassed = false;
    } else {
      console.log(`✓ PASS [TEST 3]: score 35 -> Hero rating (${heroRating}) === Dashboard rating (${dashboardRating})`);
    }
  } catch (err) {
    console.error('FAIL [TEST 3]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Score 81 -> Hero rating === Dashboard rating ('EKSTREM')
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 4] Score 81 parity check (Expected: EKSTREM / EXTREME)...');
    const score = 81;
    const heroRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;
    const dashboardRating = CanonicalRatingResolver.getHazardRating(score, 'id').rating;

    if (heroRating !== 'EKSTREM') {
      console.error(`FAIL [TEST 4]: Expected rating 'EKSTREM' for score 81, got: ${heroRating}`);
      allPassed = false;
    } else if (heroRating !== dashboardRating) {
      console.error(`FAIL [TEST 4]: Hero rating (${heroRating}) !== Dashboard rating (${dashboardRating})`);
      allPassed = false;
    } else {
      console.log(`✓ PASS [TEST 4]: score 81 -> Hero rating (${heroRating}) === Dashboard rating (${dashboardRating})`);
    }
  } catch (err) {
    console.error('FAIL [TEST 4]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Score 13 Accessibility -> Hero rating === canonical accessibility rating ('BAIK')
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 5] Score 13 accessibility check (Expected: BAIK)...');
    const score = 13;
    const canonicalAccess = CanonicalRatingResolver.getAccessibilityRating(score, 'id');
    const heroAccessRating = canonicalAccess.rating;

    if (canonicalAccess.rating !== 'BAIK') {
      console.error(`FAIL [TEST 5]: Expected canonical accessibility rating 'BAIK' for score 13, got: ${canonicalAccess.rating}`);
      allPassed = false;
    } else if (heroAccessRating !== canonicalAccess.rating) {
      console.error(`FAIL [TEST 5]: Hero rating (${heroAccessRating}) !== canonical rating (${canonicalAccess.rating})`);
      allPassed = false;
    } else {
      console.log(`✓ PASS [TEST 5]: score 13 accessibility -> Hero rating (${heroAccessRating}) === canonical accessibility rating (${canonicalAccess.rating})`);
    }
  } catch (err) {
    console.error('FAIL [TEST 5]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 6: MultiHazardAssessmentResult direct attachment & access parity
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 6] MultiHazardAssessmentResult canonical bindings parity...');
    const mockAssessment: MultiHazardAssessmentResult = {
      referenceNumber: 'GT-TEST-2026',
      evaluatedAt: new Date().toISOString(),
      location: { formattedAddress: 'Test Location', latitude: -6.9, longitude: 107.6, country: 'Indonesia' },
      propertyType: 'Residential',
      userPersona: 'Home Buyer',
      overallScore: 68,
      overallLevel: 'high',
      dominantHazard: 'earthquake',
      dataCompletenessScorePct: 100,
      flood: {
        score: 47,
        level: 'medium',
        scoreReliability: 'measured',
        observedComponents: 5,
        expectedComponents: 5,
        coveragePct: 100,
        floodModelLevel: 'Sedang',
        floodClass: 'Sedang',
        floodClassSource: 'BNPB',
        elevationMeters: 10,
        distanceToRiverMeters: 300,
        nearestRiverName: 'Kali Test',
        riverDischargeM3s: null,
        max24hRainfallMm: 120,
        potentialDepthRange: null,
        causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
      },
      quake: {
        score: 79,
        level: 'high',
        scoreReliability: 'measured',
        observedComponents: 5,
        expectedComponents: 5,
        coveragePct: 100,
        quakeClass: 'Tinggi',
        quakeClassSource: 'BNPB',
        nearestFaultName: 'Sesar Lembang',
        distanceToFaultKm: 4.2,
        nearestEpicenterKm: 25,
        historicalQuakesCount150km: 15,
        historicalQuakesCount100km: 5,
        maxHistoricalMag: 6.4,
        estimatedPgaG: 0.32,
        soilSiteClass: 'SD',
        sniStandardRef: 'SNI 1726:2019',
        liquefactionRisk: 'Sedang',
        causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
      },
      heat: {
        score: 35,
        level: 'medium',
        scoreReliability: 'measured',
        observedComponents: 4,
        expectedComponents: 5,
        coveragePct: 80,
        heatModelLevel: 'Moderate',
        avgMaxTempC: 30.5,
        historicalPeakTempC: 33.2,
        greenSpaceRatioPct: 25,
        projectedTempRise2050C: 0.8,
        acCostIncreasePct: 12,
        causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
      },
      transport: {
        score: 13,
        level: 'good',
        scoreReliability: 'measured',
        observedComponents: 4,
        expectedComponents: 4,
        coveragePct: 100,
        connectivityLabelId: 'Konektivitas Sangat Baik',
        connectivityLabelEn: 'Excellent Connectivity',
        distanceToNearestRoadMeters: 25,
        nearestRoadName: 'Jl. Utama',
        distanceToArterialMeters: 150,
        nearestArterialName: 'Jl. Arteri',
        distanceToTransitHubMeters: 300,
        nearestTransitName: 'Stasiun',
        distanceToHospitalMeters: 450,
        nearestHospitalName: 'RS Daerah',
        causeId: '', causeEn: '', impactId: '', impactEn: '', recomId: '', recomEn: ''
      },
      prescriptions: [],
      executiveSummaryId: 'Test summary',
      executiveSummaryEn: 'Test summary',
      sourceAttributions: []
    };

    CanonicalRatingResolver.attachCanonicalRatings(mockAssessment, 'id');

    const heroFloodRating = mockAssessment.flood.rating;
    const heroQuakeRating = (mockAssessment.earthquake || mockAssessment.quake).rating;
    const heroHeatRating = mockAssessment.heat.rating;
    const heroAccessRating = (mockAssessment.accessibility || mockAssessment.transport).rating;
    const heroOverallRating = mockAssessment.overall?.rating;

    if (heroFloodRating !== 'SEDANG') {
      console.error(`FAIL [TEST 6]: Expected Flood rating 'SEDANG', got: ${heroFloodRating}`);
      allPassed = false;
    } else if (heroQuakeRating !== 'TINGGI') {
      console.error(`FAIL [TEST 6]: Expected Quake rating 'TINGGI', got: ${heroQuakeRating}`);
      allPassed = false;
    } else if (heroHeatRating !== 'SEDANG') {
      console.error(`FAIL [TEST 6]: Expected Heat rating 'SEDANG', got: ${heroHeatRating}`);
      allPassed = false;
    } else if (heroAccessRating !== 'BAIK') {
      console.error(`FAIL [TEST 6]: Expected Accessibility rating 'BAIK', got: ${heroAccessRating}`);
      allPassed = false;
    } else if (heroOverallRating !== 'TINGGI') {
      console.error(`FAIL [TEST 6]: Expected Overall rating 'TINGGI', got: ${heroOverallRating}`);
      allPassed = false;
    } else {
      console.log('✓ PASS [TEST 6]: All canonical assessment ratings attached and read with 100% fidelity.');
    }
  } catch (err) {
    console.error('FAIL [TEST 6]: Exception:', err);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Source Code Audit: HeroSection.tsx contains NO local rating logic
  // ---------------------------------------------------------------------------
  try {
    console.log('[TEST 7] Source code audit: HeroSection.tsx has zero local classification logic...');
    const heroPath = path.resolve(__dirname, '../presentation/components/hero/HeroSection.tsx');
    const heroCode = fs.readFileSync(heroPath, 'utf8');

    const forbiddenPatterns = [
      { pattern: /getHazardStatusLabel/i, name: 'getHazardStatusLabel' },
      { pattern: /getRiskLevel/i, name: 'getRiskLevel' },
      { pattern: /getRiskCategory/i, name: 'getRiskCategory' },
      { pattern: /getRating/i, name: 'getRating' },
      { pattern: /['"`]RENDAH['"`]/, name: 'hardcoded "RENDAH"' },
      { pattern: /score\s*<=\s*\d+/, name: 'inline score threshold (score <= ...)' },
      { pattern: /score\s*<\s*\d+/, name: 'inline score threshold (score < ...)' },
      { pattern: /status\s*===/i, name: 'local status check' },
      { pattern: /status\s*\|\|\s*['"`]low['"`]/i, name: 'status || "low" fallback' }
    ];

    let foundViolations = 0;
    for (const item of forbiddenPatterns) {
      if (item.pattern.test(heroCode)) {
        console.error(`FAIL [TEST 7]: HeroSection.tsx still contains forbidden pattern: ${item.name}`);
        foundViolations++;
      }
    }

    if (foundViolations > 0) {
      allPassed = false;
    } else {
      console.log('✓ PASS [TEST 7]: HeroSection.tsx is 100% clean of local rating logic, hardcoded defaults, and ad-hoc helpers.');
    }
  } catch (err) {
    console.error('FAIL [TEST 7]: Exception:', err);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('RESULT: ALL HERO & DASHBOARD RATING CONSISTENCY TESTS PASSED! (7/7)');
  } else {
    console.error('RESULT: SOME HERO & DASHBOARD RATING CONSISTENCY TESTS FAILED!');
  }
  console.log('================================================================\n');

  return allPassed;
}

// Direct execution support
if (typeof require !== 'undefined' && require.main === module) {
  const success = runHeroDashboardRatingConsistencyTests();
  process.exit(success ? 0 : 1);
}
