/**
 * Financial Screening Domain Types
 * 
 * Canonical data structures for parametric financial screening of multi-hazard physical risk.
 * NOTE: These are indicative GoTangguh screening estimates, NOT formal real estate valuations,
 * actuarial pricing models, or direct executions of the ETH Zürich CLIMADA code package.
 */

export interface FinancialScreeningMetrics {
  /**
   * Indicative annualized physical damage screening ratio (% of asset value).
   * Null if required hazard parameters are unmeasured.
   */
  indicativeAnnualizedDamagePct: number | null;
  /**
   * Backward-compatible alias for indicativeAnnualizedDamagePct.
   */
  expectedAnnualDamagePct: number | null;

  /**
   * Indicative annualized direct loss in IDR.
   * Null if propertyValueIdr is not supplied.
   */
  indicativeAnnualLossIdr: string | null;
  /**
   * Backward-compatible alias for indicativeAnnualLossIdr.
   */
  expectedAnnualLossIdr: string | null;

  /**
   * Indicative annualized direct loss in USD.
   * Null if verified FX rate or property value is not supplied.
   */
  indicativeAnnualLossUsd: string | null;
  /**
   * Backward-compatible alias for indicativeAnnualLossUsd.
   */
  expectedAnnualLossUsd: string | null;

  /**
   * Parametric scenario loss screening (% of asset value).
   * Null if hazard data is incomplete.
   */
  scenarioLossPct: number | null;
  /**
   * Backward-compatible alias for scenarioLossPct.
   */
  probableMaximumLoss100YrPct: number | null;

  /**
   * Parametric scenario loss screening in IDR.
   * Null if propertyValueIdr is not supplied.
   */
  scenarioLossIdr: string | null;
  /**
   * Backward-compatible alias for scenarioLossIdr.
   */
  probableMaximumLoss100YrIdr: string | null;

  /**
   * Parametric scenario loss screening in USD.
   * Null if FX rate or property value is not supplied.
   */
  scenarioLossUsd: string | null;
  /**
   * Backward-compatible alias for scenarioLossUsd.
   */
  probableMaximumLoss100YrUsd: string | null;

  /**
   * True return-period Probable Maximum Loss (PML 1-in-100 year).
   * Strictly null without an explicit exceedance probability loss distribution model.
   */
  truePml100YrPct?: number | null;

  /**
   * Long-term Climate Value at Risk projection.
   * Strictly null unless formal SSP trajectory and asset depreciation discounting are modeled.
   */
  climateVaR2050Pct: number | null;

  /**
   * Adaptation Benefit-Cost Ratio.
   * Strictly null unless itemized intervention capex and avoided physical losses are modeled.
   */
  adaptationBcr: number | null;

  /**
   * Model provenance and methodology disclaimer note.
   */
  methodologyNote: string;

  /**
   * Screening calculation data status.
   */
  status: 'available' | 'partial' | 'insufficient_data' | 'screening_only';
}

/**
 * @deprecated Legacy type alias. Use FinancialScreeningMetrics instead.
 */
export type ClimadaFinancialMetrics = FinancialScreeningMetrics;
