import { NextRequest, NextResponse } from 'next/server';
import { runPhase8_8Tests } from '../../../__tests__/Phase8_8_ZeroSyntheticData.test';
import { runPhase11Tests } from '../../../__tests__/Phase11_MasterReportTemplate.test';
import { runPhase11_1Tests } from '../../../__tests__/Phase11_1_MasterReportVisual.test';
import { runPhase11_3Tests } from '../../../__tests__/Phase11_3_FormalRealDataReport.test';
import { runPhase11_4Tests } from '../../../__tests__/Phase11_4_RealDataDashboard.test';
import { runPhase8_9Tests } from '../../../__tests__/Phase8_9_SearchGeocodingRebuild.test';
import { runPhase8_11Tests } from '../../../__tests__/Phase8_11_TransportRecovery.test';
import { runPhase8_11_3_Verification } from '../../../__tests__/Phase8_11_3_SpatialAccuracyVerification.test';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const suite = req.nextUrl.searchParams.get('suite');

    if (suite === 'phase8_11_3') {
      const city = req.nextUrl.searchParams.get('city') || undefined;
      const report = await runPhase8_11_3_Verification(city);
      return NextResponse.json(
        {
          success: report.passed,
          suite: 'Phase 8.11.3 Spatial Accuracy Verification',
          timestamp: new Date().toISOString(),
          acceptance: report.acceptance,
          rows: report.rows,
          summary: report.summary
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      );
    }

    if (suite === 'phase8_11') {
      const testRun = await runPhase8_11Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 8.11 Transport Live Coverage Regression Recovery',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    if (suite === 'phase8_9') {
      const testRun = await runPhase8_9Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 8.9 Search and Geocoding Rebuild',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    if (suite === 'phase11_4') {
      const testRun = await runPhase11_4Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 11.4 Real-Data User-Friendly Dashboard + Zero Factual Defaults',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    if (suite === 'phase11') {
      const testRun = await runPhase11Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 11 Client Master Report Template & Bilingual Integration',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    if (suite === 'phase8_8') {
      const testRun = await runPhase8_8Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 8.8 Zero Synthetic Data & API Integrity Hardening',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.ok).length,
        failedCount: testRun.results.filter(r => !r.ok).length,
        results: testRun.results
      });
    }

    if (suite === 'phase11_1') {
      const testRun = await runPhase11_1Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 11.1 Master Client Report Template + Premium PDF Visual Implementation',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    if (suite === 'phase11_3') {
      const testRun = await runPhase11_3Tests();
      return NextResponse.json({
        success: testRun.passed,
        suite: 'Phase 11.3 Formal Real-Data Report + Zero Synthetic Report Data',
        timestamp: new Date().toISOString(),
        testsCount: testRun.results.length,
        passedCount: testRun.results.filter(r => r.passed).length,
        failedCount: testRun.results.filter(r => !r.passed).length,
        results: testRun.results
      });
    }

    // Default: Run all suites (Phase 8.8, Phase 11.1, Phase 11.3)
    const p8Run = await runPhase8_8Tests();
    const p11Run = await runPhase11_1Tests();
    const p11_3Run = await runPhase11_3Tests();

    const combinedResults = [
      ...p8Run.results.map(r => ({ suite: 'Phase 8.8', name: r.name, ok: r.ok, message: r.error || 'Passed' })),
      ...p11Run.results.map(r => ({ suite: 'Phase 11.1', name: r.test, ok: r.passed, message: r.message })),
      ...p11_3Run.results.map(r => ({ suite: 'Phase 11.3', name: r.test, ok: r.passed, message: r.message }))
    ];

    const allPassed = p8Run.passed && p11Run.passed && p11_3Run.passed;

    return NextResponse.json({
      success: allPassed,
      timestamp: new Date().toISOString(),
      testsCount: combinedResults.length,
      passedCount: combinedResults.filter(r => r.ok).length,
      failedCount: combinedResults.filter(r => !r.ok).length,
      phase8_8: { passed: p8Run.passed, count: p8Run.results.length },
      phase11_1: { passed: p11Run.passed, count: p11Run.results.length },
      phase11_3: { passed: p11_3Run.passed, count: p11_3Run.results.length },
      results: combinedResults
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || String(error), stack: error.stack },
      { status: 200 }
    );
  }
}
