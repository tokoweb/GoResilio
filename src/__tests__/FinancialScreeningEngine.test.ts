import { GoTangguhFinancialScreeningEngine } from '../domain/services/GoTangguhFinancialScreeningEngine';

export function runFinancialScreeningEngineTests(): boolean {
  console.log('--- Financial Screening Engine Scientific Integrity Test Suite ---');
  let passed = true;

  // Test 1: Property Value is Null (No default Rp 1.5 billion assumption)
  try {
    const res = GoTangguhFinancialScreeningEngine.calculateLossMetrics(70, 60, 50, null, null);
    if (!res) {
      console.error('FAIL: Expected FinancialScreeningMetrics object');
      passed = false;
    } else if (res.indicativeAnnualLossIdr !== null || res.expectedAnnualLossIdr !== null) {
      console.error(`FAIL: monetary losses must be null when property value is null, got: ${res.indicativeAnnualLossIdr}`);
      passed = false;
    } else if (res.indicativeAnnualLossUsd !== null || res.expectedAnnualLossUsd !== null) {
      console.error(`FAIL: USD losses must be null when property value is null, got: ${res.indicativeAnnualLossUsd}`);
      passed = false;
    } else if (res.scenarioLossIdr !== null || res.scenarioLossUsd !== null) {
      console.error('FAIL: Scenario loss currency values must be null when property value is null');
      passed = false;
    } else if (res.indicativeAnnualizedDamagePct === null || res.indicativeAnnualizedDamagePct <= 0) {
      console.error(`FAIL: indicativeAnnualizedDamagePct should be calculated from scores, got: ${res.indicativeAnnualizedDamagePct}`);
      passed = false;
    } else if (res.climateVaR2050Pct !== null || res.adaptationBcr !== null) {
      console.error('FAIL: Climate VaR and BCR must be strictly null');
      passed = false;
    } else {
      console.log('PASS: Null property value cleanly yields null currency losses without default Rp 1.5B assumption.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 1:', err);
    passed = false;
  }

  // Test 2: All Hazards Null -> Status insufficient_data
  try {
    const res = GoTangguhFinancialScreeningEngine.calculateLossMetrics(null, null, null, 1_000_000_000, 16_000);
    if (res.status !== 'insufficient_data') {
      console.error(`FAIL: Expected status 'insufficient_data', got: ${res.status}`);
      passed = false;
    } else if (res.indicativeAnnualizedDamagePct !== null || res.scenarioLossPct !== null) {
      console.error('FAIL: Percentage damage ratios must be null when all hazards are null');
      passed = false;
    } else if (res.indicativeAnnualLossIdr !== null || res.indicativeAnnualLossUsd !== null) {
      console.error('FAIL: Loss values must be null when all hazards are null');
      passed = false;
    } else {
      console.log('PASS: All hazards null yields status "insufficient_data" and strict null metrics.');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 2:', err);
    passed = false;
  }

  // Test 3: Partial Hazards (e.g. only flood and heat available, quake null)
  try {
    const res = GoTangguhFinancialScreeningEngine.calculateLossMetrics(80, null, 60, 2_000_000_000, 16_000);
    if (res.status !== 'partial') {
      console.error(`FAIL: Expected status 'partial', got: ${res.status}`);
      passed = false;
    } else if (res.indicativeAnnualizedDamagePct === null || res.indicativeAnnualizedDamagePct <= 0) {
      console.error('FAIL: Damage ratio should be calculated over active components');
      passed = false;
    } else if (res.indicativeAnnualLossIdr === null) {
      console.error('FAIL: IDR loss should be calculated when property value is supplied');
      passed = false;
    } else {
      console.log('PASS: Partial hazard evaluation correctly sets status "partial".');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 3:', err);
    passed = false;
  }

  // Test 4: USD Unavailable (Property value supplied in IDR, but FX rate is null)
  try {
    const res = GoTangguhFinancialScreeningEngine.calculateLossMetrics(70, 60, 50, 2_500_000_000, null);
    if (res.indicativeAnnualLossIdr === null) {
      console.error('FAIL: IDR loss should be present when property value is supplied');
      passed = false;
    } else if (res.indicativeAnnualLossUsd !== null) {
      console.error(`FAIL: USD loss must be null when FX rate is null (no hardcoded FX), got: ${res.indicativeAnnualLossUsd}`);
      passed = false;
    } else if (res.scenarioLossUsd !== null) {
      console.error('FAIL: Scenario loss USD must be null when FX rate is null');
      passed = false;
    } else {
      console.log('PASS: USD loss is strictly null when FX rate is missing (zero hardcoded 15,500 rate).');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 4:', err);
    passed = false;
  }

  // Test 5: True PML, Climate VaR, and BCR Invariant Verification
  try {
    const res = GoTangguhFinancialScreeningEngine.calculateLossMetrics(85, 75, 65, 5_000_000_000, 16_000);
    if (res.truePml100YrPct !== null) {
      console.error('FAIL: truePml100YrPct must remain null without full exceedance probability modeling');
      passed = false;
    } else if (res.climateVaR2050Pct !== null) {
      console.error('FAIL: climateVaR2050Pct must remain null without formal forward-looking discounting');
      passed = false;
    } else if (res.adaptationBcr !== null) {
      console.error('FAIL: adaptationBcr must remain null without itemized capex and avoided losses');
      passed = false;
    } else if ((!res.methodologyNote.includes('GoResilio Parametric Financial Screening') && !res.methodologyNote.includes('GoTangguh Parametric Financial Screening')) || !res.methodologyNote.includes('not a direct CLIMADA model run')) {
      console.error(`FAIL: methodologyNote must state "GoResilio Parametric Financial Screening" and explicitly state "not a direct CLIMADA model run", got: ${res.methodologyNote}`);
      passed = false;
    } else {
      console.log('PASS: True PML, Climate VaR, and BCR remain strictly null, with methodologyNote explicitly labeled "GoResilio Parametric Financial Screening".');
    }
  } catch (err) {
    console.error('FAIL: Exception in Test 5:', err);
    passed = false;
  }

  return passed;
}

