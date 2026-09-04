import type { RiskLevel, MultiHazardAssessmentResult } from '../types/hazard.types';

export interface CanonicalRatingResult {
  level: RiskLevel;
  rating: string;      // Canonical short badge label in uppercase: 'RENDAH' | 'SEDANG' | 'TINGGI' | 'EKSTREM' | 'BAIK' | 'TERBATAS'
  label: string;       // Formatted label: 'Rendah' | 'Sedang' | 'Tinggi' | 'Ekstrem' | 'Baik' | 'Terbatas'
  fullLabel: string;   // Full narrative label: 'Risiko Rendah' | 'Risiko Sedang' | etc.
  badgeClass: 'low' | 'medium' | 'high' | 'critical' | 'neutral';
  color: string;
}

export interface CanonicalAccessibilityRatingResult {
  level: 'good' | 'moderate' | 'isolated' | 'critical' | 'unavailable';
  rating: string;      // Canonical short badge label: 'BAIK' | 'SEDANG' | 'TERBATAS' | 'BELUM TERSEDIA'
  label: string;       // Formatted label: 'Baik' | 'Sedang' | 'Terbatas' | 'Belum Tersedia'
  fullLabel: string;   // Full label: 'Aksesibilitas Baik' | 'Aksesibilitas Sedang' | 'Aksesibilitas Terbatas'
  badgeClass: 'low' | 'medium' | 'high' | 'neutral';
  color: string;
}

/**
 * CANONICAL HAZARD THRESHOLDS (SSOT):
 * 0–30   : Rendah / Low
 * 31–60  : Sedang / Moderate (Medium)
 * 61–80  : Tinggi / High
 * 81–100 : Ekstrem / Extreme (Critical)
 */
export const HAZARD_RATING_THRESHOLDS = {
  LOW_MAX: 30,
  MEDIUM_MAX: 60,
  HIGH_MAX: 80
} as const;

/**
 * CANONICAL ACCESSIBILITY THRESHOLDS (SSOT):
 * Note: Accessibility/Transport is physical egress & infrastructure connectivity,
 * NOT a primary natural hazard. Lower impedance/distance score (0-35) means better accessibility.
 * 0–35  : Baik / Good (Excellent/Adequate Egress)
 * 36–65 : Sedang / Moderate (Average Connectivity)
 * > 65  : Terbatas / Limited (Constrained/Isolated Access)
 */
export const ACCESSIBILITY_RATING_THRESHOLDS = {
  GOOD_MAX: 35,
  MODERATE_MAX: 65
} as const;

export class CanonicalRatingResolver {
  /**
   * Resolves canonical hazard risk rating for flood, earthquake, heat, and composite overall.
   */
  public static getHazardRating(
    score: number | null | undefined,
    lang: 'id' | 'en' = 'id'
  ): CanonicalRatingResult {
    if (score === null || score === undefined || isNaN(score) || score < 0) {
      return {
        level: 'insufficient_data',
        rating: lang === 'id' ? 'BELUM TERDATA' : 'NO DATA',
        label: lang === 'id' ? 'Belum Terdata' : 'No Data',
        fullLabel: lang === 'id' ? 'Data Tidak Tersedia' : 'Insufficient Data',
        badgeClass: 'neutral',
        color: '#94a3b8'
      };
    }

    const rounded = Math.round(score);

    if (rounded <= HAZARD_RATING_THRESHOLDS.LOW_MAX) {
      return {
        level: 'low',
        rating: lang === 'id' ? 'RENDAH' : 'LOW',
        label: lang === 'id' ? 'Rendah' : 'Low Risk',
        fullLabel: lang === 'id' ? 'Risiko Rendah' : 'Low Risk',
        badgeClass: 'low',
        color: '#15803d'
      };
    }

    if (rounded <= HAZARD_RATING_THRESHOLDS.MEDIUM_MAX) {
      return {
        level: 'medium',
        rating: lang === 'id' ? 'SEDANG' : 'MEDIUM',
        label: lang === 'id' ? 'Sedang' : 'Moderate',
        fullLabel: lang === 'id' ? 'Risiko Sedang' : 'Moderate Risk',
        badgeClass: 'medium',
        color: '#d97706'
      };
    }

    if (rounded <= HAZARD_RATING_THRESHOLDS.HIGH_MAX) {
      return {
        level: 'high',
        rating: lang === 'id' ? 'TINGGI' : 'HIGH',
        label: lang === 'id' ? 'Tinggi' : 'High Risk',
        fullLabel: lang === 'id' ? 'Risiko Tinggi' : 'High Risk',
        badgeClass: 'high',
        color: '#ea580c'
      };
    }

    return {
      level: 'extreme',
      rating: lang === 'id' ? 'EKSTREM' : 'EXTREME',
      label: lang === 'id' ? 'Ekstrem' : 'Extreme',
      fullLabel: lang === 'id' ? 'Risiko Ekstrem' : 'Extreme Risk',
      badgeClass: 'critical',
      color: '#dc2626'
    };
  }

  /**
   * Resolves canonical accessibility / transit rating.
   * Uses accessibility-specific terminology without conflating with natural hazard risk.
   */
  public static getAccessibilityRating(
    score: number | null | undefined,
    lang: 'id' | 'en' = 'id'
  ): CanonicalAccessibilityRatingResult {
    if (score === null || score === undefined || isNaN(score) || score < 0) {
      return {
        level: 'unavailable',
        rating: lang === 'id' ? 'BELUM TERSEDIA' : 'UNAVAILABLE',
        label: lang === 'id' ? 'Belum Tersedia' : 'Unavailable',
        fullLabel: lang === 'id' ? 'Data Aksesibilitas Belum Tersedia' : 'Accessibility Data Unavailable',
        badgeClass: 'neutral',
        color: '#94a3b8'
      };
    }

    const rounded = Math.round(score);

    if (rounded <= ACCESSIBILITY_RATING_THRESHOLDS.GOOD_MAX) {
      return {
        level: 'good',
        rating: lang === 'id' ? 'BAIK' : 'GOOD',
        label: lang === 'id' ? 'Baik' : 'Good',
        fullLabel: lang === 'id' ? 'Aksesibilitas Sangat Baik' : 'Excellent Accessibility',
        badgeClass: 'low', // maps to green badge
        color: '#15803d'
      };
    }

    if (rounded <= ACCESSIBILITY_RATING_THRESHOLDS.MODERATE_MAX) {
      return {
        level: 'moderate',
        rating: lang === 'id' ? 'SEDANG' : 'MODERATE',
        label: lang === 'id' ? 'Sedang' : 'Moderate',
        fullLabel: lang === 'id' ? 'Aksesibilitas Sedang' : 'Moderate Accessibility',
        badgeClass: 'medium', // maps to amber badge
        color: '#d97706'
      };
    }

    return {
      level: 'isolated',
      rating: lang === 'id' ? 'TERBATAS' : 'LIMITED',
      label: lang === 'id' ? 'Terbatas' : 'Limited',
      fullLabel: lang === 'id' ? 'Aksesibilitas Terbatas' : 'Limited Accessibility',
      badgeClass: 'high', // maps to high/warning badge
      color: '#ea580c'
    };
  }

  /**
   * Unified dispatcher for any hazard or accessibility category.
   */
  public static getCanonicalRating(
    category: 'flood' | 'earthquake' | 'quake' | 'heat' | 'overall' | 'accessibility' | 'transport',
    score: number | null | undefined,
    lang: 'id' | 'en' = 'id'
  ): CanonicalRatingResult | CanonicalAccessibilityRatingResult {
    if (category === 'accessibility' || category === 'transport') {
      return this.getAccessibilityRating(score, lang);
    }
    return this.getHazardRating(score, lang);
  }

  /**
   * Injects canonical ratings onto a MultiHazardAssessmentResult object so all consumers
   * (Hero, Dashboard, Property Detail, Reports, PDF) read consistent properties directly.
   */
  public static attachCanonicalRatings(
    assessment: MultiHazardAssessmentResult | null | undefined,
    lang: 'id' | 'en' = 'id'
  ): MultiHazardAssessmentResult | null | undefined {
    if (!assessment) return assessment;

    // Flood
    if (assessment.flood) {
      const floodRating = this.getHazardRating(assessment.flood.score, lang);
      assessment.flood.rating = floodRating.rating;
      assessment.flood.badgeClass = floodRating.badgeClass;
      if (!assessment.flood.level || assessment.flood.level === 'insufficient_data') {
        assessment.flood.level = floodRating.level;
      }
    }

    // Quake
    if (assessment.quake) {
      const quakeRating = this.getHazardRating(assessment.quake.score, lang);
      assessment.quake.rating = quakeRating.rating;
      assessment.quake.badgeClass = quakeRating.badgeClass;
      if (!assessment.quake.level || assessment.quake.level === 'insufficient_data') {
        assessment.quake.level = quakeRating.level;
      }
    }
    // Alias earthquake -> quake
    if (!assessment.earthquake && assessment.quake) {
      assessment.earthquake = assessment.quake;
    }

    // Heat
    if (assessment.heat) {
      const heatRating = this.getHazardRating(assessment.heat.score, lang);
      assessment.heat.rating = heatRating.rating;
      assessment.heat.badgeClass = heatRating.badgeClass;
      if (!assessment.heat.level || assessment.heat.level === 'insufficient_data') {
        assessment.heat.level = heatRating.level;
      }
    }

    // Transport / Accessibility
    if (assessment.transport) {
      const transportRating = this.getAccessibilityRating(assessment.transport.score, lang);
      assessment.transport.rating = transportRating.rating;
      assessment.transport.badgeClass = transportRating.badgeClass;
      if (!assessment.transport.level || assessment.transport.level === 'unavailable') {
        assessment.transport.level = transportRating.level;
      }
    }
    // Alias accessibility -> transport
    if (!assessment.accessibility && assessment.transport) {
      assessment.accessibility = assessment.transport;
    }

    // Overall composite
    const overallScore = assessment.overallScore ?? null;
    const overallRating = this.getHazardRating(overallScore, lang);
    assessment.overall = {
      score: overallScore,
      rating: overallRating.rating,
      level: assessment.overallLevel || overallRating.level,
      badgeClass: overallRating.badgeClass,
      color: overallRating.color
    };

    return assessment;
  }
}
