import { runSoilGridsClientTests } from './SoilGridsClient.test';
import { runOpenMeteoAirQualityClientTests } from './OpenMeteoAirQualityClient.test';
import { runWorldPopClientTests } from './WorldPopClient.test';
import { runNasaFirmsClientTests } from './NasaFirmsClient.test';
import { runFeatureStoreIntegrityTests } from './FeatureStoreIntegrity.test';
import { runDataLineageTests } from './DataLineage.test';
import { runTampelasRegressionTest } from './runTampelasRegression';
import { runOverpassOsmCoverageTests } from './OverpassOsmCoverage.test';
import { runSeismicSemanticsTests } from './SeismicSemantics.test';
import { runFinancialScreeningEngineTests } from './FinancialScreeningEngine.test';
import { runPrescriptionEngineTests } from './PrescriptionEngine.test';
import { runMapSpatialReassessmentTests } from './MapSpatialReassessment.test';
import { runEndToEndDataFidelityTests } from './EndToEndDataFidelity.test';
import { runThinkHazardAccuracyPatchTests } from './ThinkHazardAccuracyPatch.test';
import { runInitialAssessmentStateTests } from './InitialAssessmentState.test';
import { runDataCoverageGovernanceTests } from './DataCoverageGovernance.test';
import { runSpatialDistanceSemanticsTests } from './SpatialDistanceSemantics.test';

import { runEndToEndFidelityVerificationTests } from './EndToEndFidelityVerification.test';
import { runMapboxSpatialClientTests } from './MapboxSpatialClient.test';
import { runTransportProviderNeutralNormalizationTests } from './TransportProviderNeutralNormalization.test';
import { runTransportOpenSourceFirstPipelineTests } from './TransportOpenSourceFirstPipeline.test';
import { runFinalRiskScoringHardeningTests } from './FinalRiskScoringHardening.test';
import { runFloodCoverageAndSemanticsTests } from './FloodCoverageAndSemantics.test';
import { runHeatRiskAndEnvironmentalHardeningTests } from './HeatRiskAndEnvironmentalHardening.test';
import { runThinkHazardAndBnpbClassificationIntegrityTests } from './ThinkHazardAndBnpbClassificationIntegrity.test';
import { runPerformSiteAssessmentPipelineIntegrityTests } from './PerformSiteAssessmentPipelineIntegrity.test';
import { runThinkHazardBaliIntegrityTests } from './ThinkHazardBaliIntegrity.test';
import { runSeismicCoverageAndSemanticsTests } from './SeismicCoverageAndSemantics.test';
import { runHazardCardSimplificationTests } from './HazardCardSimplification.test';
import { runPhase8_8Tests } from './Phase8_8_ZeroSyntheticData.test';

export function runAllTests() {
  console.log('================================================================');
  console.log('GOTANGGUH FULL DATA PIPELINE & INTEGRATION TEST SUITE RUNNER');
  console.log('================================================================\n');

  let allPassed = true;

  try {
    const results = [
      { name: 'SoilGridsClient', pass: runSoilGridsClientTests() },
      { name: 'OpenMeteoAirQualityClient', pass: runOpenMeteoAirQualityClientTests() },
      { name: 'WorldPopClient', pass: runWorldPopClientTests() },
      { name: 'NasaFirmsClient', pass: runNasaFirmsClientTests() },
      { name: 'MapboxSpatialClient', pass: runMapboxSpatialClientTests() },
      { name: 'TransportProviderNeutralNormalization', pass: runTransportProviderNeutralNormalizationTests() },
      { name: 'TransportOpenSourceFirstPipeline', pass: runTransportOpenSourceFirstPipelineTests() },
      { name: 'FinalRiskScoringHardening', pass: runFinalRiskScoringHardeningTests() },
      { name: 'OverpassOsmCoverage', pass: runOverpassOsmCoverageTests() },
      { name: 'SeismicSemantics', pass: runSeismicSemanticsTests() },
      { name: 'FinancialScreeningEngine', pass: runFinancialScreeningEngineTests() },
      { name: 'PrescriptionEngine', pass: runPrescriptionEngineTests() },
      { name: 'MapSpatialReassessment', pass: runMapSpatialReassessmentTests() },
      { name: 'ThinkHazardAccuracyPatch', pass: runThinkHazardAccuracyPatchTests() },
      { name: 'InitialAssessmentState', pass: runInitialAssessmentStateTests() },
      { name: 'DataCoverageGovernance', pass: runDataCoverageGovernanceTests() },
      { name: 'SpatialDistanceSemantics', pass: runSpatialDistanceSemanticsTests() },
      { name: 'FeatureStoreIntegrity', pass: runFeatureStoreIntegrityTests() },
      { name: 'DataLineage', pass: runDataLineageTests() },
      { name: 'runTampelasRegression', pass: runTampelasRegressionTest() },
      { name: 'EndToEndDataFidelity', pass: runEndToEndDataFidelityTests() },
      { name: 'EndToEndFidelityVerification', pass: runEndToEndFidelityVerificationTests() },
      { name: 'FloodCoverageAndSemantics', pass: runFloodCoverageAndSemanticsTests() },
      { name: 'HeatRiskAndEnvironmentalHardening', pass: runHeatRiskAndEnvironmentalHardeningTests() },
      { name: 'ThinkHazardAndBnpbClassificationIntegrity', pass: runThinkHazardAndBnpbClassificationIntegrityTests() },
      { name: 'PerformSiteAssessmentPipelineIntegrity', pass: runPerformSiteAssessmentPipelineIntegrityTests() },
      { name: 'ThinkHazardBaliIntegrity', pass: runThinkHazardBaliIntegrityTests() },
      { name: 'SeismicCoverageAndSemantics', pass: runSeismicCoverageAndSemanticsTests() },
      { name: 'HazardCardSimplification', pass: runHazardCardSimplificationTests() },
      { name: 'Phase8_8_ZeroSyntheticData', pass: runPhase8_8Tests() }
    ];

    for (const r of results) {
      if (!r.pass) {
        console.error(`FAILED SUITE: ${r.name}`);
        allPassed = false;
      }
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n================================================================');
    console.log('ALL 27 INTEGRATION, SPATIAL, AUDIT & ACCURACY TEST SUITES PASSED (100%)');
    console.log('================================================================');
  } else {
    console.error('\nSOME TEST SUITES FAILED!');
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}


