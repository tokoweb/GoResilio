import type { FinancialScreeningMetrics } from '../types/financial.types';
import { RISK_MODEL_CONFIG } from '../config/RiskModelConfig';

/**
 * GoTangguh Parametric Financial Screening Engine
 * 
 * Computes indicative financial loss screening from multi-hazard physical risk scores.
 * 
 * DISCLAIMER & SCIENTIFIC INTEGRITY:
 * This engine provides indicative screening estimates based on parametric damage functions.
 * It is NOT a formal property valuation, actuarial pricing model, structural engineering assessment,
 * contractor quotation, or direct execution of the ETH Zürich CLIMADA code package.
 */
export class GoTangguhFinancialScreeningEngine {
  /**
   * Calculate indicative financial screening metrics based on parametric damage functions.
   * 
   * @param floodScore 0-100 or null
   * @param quakeScore 0-100 or null
   * @param heatScore 0-100 or null
   * @param propertyValueIdr Baseline asset valuation in IDR (strictly null if unsupplied)
   * @param fxRateUsdIdr Live FX rate for USD conversion (strictly null if unsupplied)
   */
  public static calculateLossMetrics(
    floodScore: number | null,
    quakeScore: number | null,
    heatScore: number | null,
    propertyValueIdr: number | null = null,
    fxRateUsdIdr: number | null = null
  ): FinancialScreeningMetrics {
    const hasFlood = floodScore !== null;
    const hasQuake = quakeScore !== null;
    const hasHeat = heatScore !== null;

    const methodologyNote =
      'GoTangguh Parametric Financial Screening. Indicative screening estimate; not a direct CLIMADA model run, formal valuation, or contractor quotation.';

    if (!hasFlood && !hasQuake && !hasHeat) {
      return {
        indicativeAnnualizedDamagePct: null,
        expectedAnnualDamagePct: null,
        indicativeAnnualLossIdr: null,
        expectedAnnualLossIdr: null,
        indicativeAnnualLossUsd: null,
        expectedAnnualLossUsd: null,
        scenarioLossPct: null,
        probableMaximumLoss100YrPct: null,
        scenarioLossIdr: null,
        probableMaximumLoss100YrIdr: null,
        scenarioLossUsd: null,
        probableMaximumLoss100YrUsd: null,
        truePml100YrPct: null,
        climateVaR2050Pct: null,
        adaptationBcr: null,
        methodologyNote,
        status: 'insufficient_data'
      };
    }

    const { FINANCIAL } = RISK_MODEL_CONFIG;
    const activeScores: number[] = [];
    let floodDamageRatio = 0;
    let seismicDamageRatio = 0;
    let heatDamageRatio = 0;

    if (hasFlood) {
      floodDamageRatio = Math.pow(Math.min(100, Math.max(0, floodScore!)) / 100, FINANCIAL.floodExponent) * FINANCIAL.floodScale;
      activeScores.push(floodScore!);
    }
    if (hasQuake) {
      seismicDamageRatio = Math.pow(Math.min(100, Math.max(0, quakeScore!)) / 100, FINANCIAL.seismicExponent) * FINANCIAL.seismicScale;
      activeScores.push(quakeScore!);
    }
    if (hasHeat) {
      heatDamageRatio = Math.pow(Math.min(100, Math.max(0, heatScore!)) / 100, FINANCIAL.heatExponent) * FINANCIAL.heatScale;
      activeScores.push(heatScore!);
    }

    // Combined indicative annualized damage ratio (% of asset value)
    const indicativeDamagePct = +(floodDamageRatio + seismicDamageRatio + heatDamageRatio).toFixed(2);

    // Parametric scenario loss screening (% of asset value)
    const maxActiveScore = Math.max(...activeScores);
    const scenarioLossPct = +(Math.pow(maxActiveScore / 100, FINANCIAL.pmlExponent) * FINANCIAL.pmlScale).toFixed(1);

    const formatIdr = (val: number): string => {
      if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} Miliar`;
      if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Juta`;
      return `Rp ${val.toLocaleString('id-ID')}`;
    };

    const formatUsd = (val: number): string => {
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
      return `$${val.toLocaleString('en-US')}`;
    };

    let lossValueIdrStr: string | null = null;
    let lossValueUsdStr: string | null = null;
    let scenarioValueIdrStr: string | null = null;
    let scenarioValueUsdStr: string | null = null;

    if (propertyValueIdr !== null && propertyValueIdr > 0) {
      const lossValueIdr = Math.round(propertyValueIdr * (indicativeDamagePct / 100));
      const scenarioValueIdr = Math.round(propertyValueIdr * (scenarioLossPct / 100));
      lossValueIdrStr = formatIdr(lossValueIdr);
      scenarioValueIdrStr = formatIdr(scenarioValueIdr);

      if (fxRateUsdIdr !== null && fxRateUsdIdr > 0) {
        const lossValueUsd = Math.round(lossValueIdr / fxRateUsdIdr);
        const scenarioValueUsd = Math.round(scenarioValueIdr / fxRateUsdIdr);
        lossValueUsdStr = formatUsd(lossValueUsd);
        scenarioValueUsdStr = formatUsd(scenarioValueUsd);
      }
    }

    const isComplete = hasFlood && hasQuake && hasHeat;

    return {
      indicativeAnnualizedDamagePct: indicativeDamagePct,
      expectedAnnualDamagePct: indicativeDamagePct,
      indicativeAnnualLossIdr: lossValueIdrStr,
      expectedAnnualLossIdr: lossValueIdrStr,
      indicativeAnnualLossUsd: lossValueUsdStr,
      expectedAnnualLossUsd: lossValueUsdStr,
      scenarioLossPct,
      probableMaximumLoss100YrPct: scenarioLossPct,
      scenarioLossIdr: scenarioValueIdrStr,
      probableMaximumLoss100YrIdr: scenarioValueIdrStr,
      scenarioLossUsd: scenarioValueUsdStr,
      probableMaximumLoss100YrUsd: scenarioValueUsdStr,
      truePml100YrPct: null,   // Strictly null: Requires formal exceedance probability loss distribution modeling
      climateVaR2050Pct: null, // Strictly null: Requires formal forward-looking IPCC SSP trajectory & asset discounting
      adaptationBcr: null,     // Strictly null: Requires itemized intervention capex and site-specific avoided loss models
      methodologyNote,
      status: isComplete ? 'screening_only' : 'partial'
    };
  }
}

/**
 * @deprecated Legacy compatibility alias. Use GoTangguhFinancialScreeningEngine.
 */
export const ClimadaFinancialEngine = GoTangguhFinancialScreeningEngine;
