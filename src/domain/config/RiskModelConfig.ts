/**
 * GoTangguh Centralized Risk Model Configuration
 * 
 * Central registry of all internal mathematical coefficients, statistical thresholds,
 * scoring baselines, and parametric exponents used by the GoTangguh Multi-Hazard Engine.
 * 
 * DISCLAIMER & PROVENANCE:
 * These parameters are INTERNAL GoTangguh mathematical models and screening heuristic thresholds.
 * They are NOT official BNPB, BMKG, USGS, SNI, or World Bank regulatory tiers.
 */

export const RISK_MODEL_CONFIG = {
  METADATA: {
    modelName: 'GoTangguh Multi-Hazard Physical Risk Engine',
    modelVersion: '2.4.0',
    overallFormula: '70% max hazard score + 30% mean hazard score across available physical hazards (flood, earthquake, heat)',
    missingDataPolicy: 'Missing physical observations remain strictly null without synthetic zero-risk imputation. Where sufficient evidence exists to activate the GoTangguh screening model, documented internal baseline scores are labeled as imputed_model_baseline when applicable.'
  },

  OVERALL: {
    dominantHazardWeight: 0.70,
    meanHazardsWeight: 0.30,
    totalCategories: 3
  },

  FLOOD: {
    modelName: 'GoTangguh Parametric Flood Risk Model',
    baseTiers: {
      high: 70, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard High classification
      medium: 45, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard Medium classification
      low: 20, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard Low classification
      physicalOnlyBaseline: 25,
      defaultBase: 20
    },
    // Conservative site-scale micro topographic adjustments (avoids heavy double-counting over BNPB macro raster)
    elevationAdjustments: [
      { maxMeters: 3, scoreDelta: 12 },
      { maxMeters: 8, scoreDelta: 6 },
      { maxMeters: 15, scoreDelta: 3 },
      { minMeters: 35, scoreDelta: -4 } // Conservative high-ground discount (avoids assuming mountain terrain is flood-immune)
    ],
    // Conservative site-scale waterway proximity adjustments (OSM vector geometry)
    riverDistanceAdjustments: [
      { maxDistanceMeters: 200, scoreDelta: 10 },
      { maxDistanceMeters: 500, scoreDelta: 5 },
      { maxDistanceMeters: 1000, scoreDelta: 2 }
    ],
    maxActiveRiverRadiusMeters: 2500,
    // Pluvial screening triggers (Internal GoTangguh rule based on ECMWF ERA5 2020–2024 peak 24h precipitation)
    precipitationAdjustments: [
      { minMm: 150, scoreDelta: 8 },
      { minMm: 90, scoreDelta: 4 }
    ],
    // GloFAS macro river discharge is kept as context only (score delta = 0)
    dischargeAdjustments: [
      { minM3s: 50, scoreDelta: 0 }
    ],
    tierThresholds: {
      highExposure: 70,
      moderateExposure: 40
    }
  },

  SEISMIC: {
    modelName: 'GoTangguh Seismic & Liquefaction Screening Model',
    baseTiers: {
      high: 65, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard High classification
      medium: 40, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard Medium classification
      lowOrVeryLow: 15, // Internal GoTangguh screening score mapped from BNPB/ThinkHazard Low/Very Low classification
      historicalOnlyBaseline: 20,
      defaultBase: 15
    },
    // Direct verified Peak Ground Acceleration (PGA_MCEG_100 in g) physical modifier
    pgaAdjustments: [
      { minG: 0.40, scoreDelta: 8 },
      { minG: 0.25, scoreDelta: 4 },
      { minG: 0.10, scoreDelta: 2 }
    ],
    // Consolidated 10-Year Seismicity Catalog Modifier (USGS/EMSC M>=4.0 within 150 km)
    // Avoids double-counting event frequency and peak magnitude as independent additive penalties
    historicalSeismicityAdjustments: [
      { minEvents: 15, minMag: 6.5, scoreDelta: 6 },
      { minEvents: 5, minMag: 5.0, scoreDelta: 3 },
      { minEvents: 1, minMag: 4.0, scoreDelta: 1 }
    ],
    // Conservative Liquefaction Geotechnical Modifier (BNPB INDEKS_BAHAYA_LIKUEFAKSI)
    liquefactionModifiers: {
      high: 6,
      medium: 3,
      low: 0
    }
  },

  HEAT: {
    modelName: 'GoTangguh Urban Heat Stress Model',
    baseTier: 20,
    avgMaxTempAdjustments: [
      { minC: 34, scoreDelta: 35 },
      { minC: 31, scoreDelta: 22 },
      { minC: 28, scoreDelta: 10 }
    ],
    peakTempAdjustments: [
      { minC: 38, scoreDelta: 25 },
      { minC: 35, scoreDelta: 15 }
    ],
    thinkHazardModifier: 15,
    greenSpaceRatioThresholdPct: 15,
    lowGreenSpaceModifier: 8,
    tierThresholds: {
      severe: 75,
      high: 60,
      moderate: 40
    }
  },

  TRANSPORT: {
    modelName: 'GoTangguh Dynamic Accessibility Model',
    weights: {
      road: 0.25,
      arterial: 0.25,
      hospital: 0.30,
      transit: 0.20
    },
    roadBrackets: [
      { maxMeters: 50, score: 10 },
      { maxMeters: 150, score: 20 },
      { fallbackScore: 35 }
    ],
    arterialBrackets: [
      { maxMeters: 500, score: 10 },
      { maxMeters: 1500, score: 20 },
      { maxMeters: 3000, score: 35 },
      { fallbackScore: 55 }
    ],
    hospitalBrackets: [
      { maxMeters: 2000, score: 10 },
      { maxMeters: 4500, score: 25 },
      { maxMeters: 7500, score: 40 },
      { fallbackScore: 55 }
    ],
    transitBrackets: [
      { maxMeters: 500, score: 10 },
      { maxMeters: 1200, score: 20 },
      { fallbackScore: 35 }
    ],
    levelThresholds: {
      goodMax: 35,
      moderateMax: 65
    }
  },

  FINANCIAL: {
    floodExponent: 1.4,
    floodScale: 0.024,
    seismicExponent: 1.6,
    seismicScale: 0.018,
    heatExponent: 1.2,
    heatScale: 0.008,
    pmlExponent: 1.35,
    pmlScale: 35
  },

  PRESCRIPTION: {
    floodTriggerThreshold: 60,
    quakeTriggerThreshold: 55,
    heatTriggerThreshold: 50,
    transportTriggerThreshold: 45
  }
} as const;

export type RiskModelConfigType = typeof RISK_MODEL_CONFIG;
