import type { MultiHazardAssessmentResult, PropertyType, UserPersona } from './hazard.types';

export type ReportTier = 'free' | 'instant_pdf' | 'consultation_lite' | 'b2b_gold';

export interface PricingPlan {
  id: ReportTier;
  badge?: string;
  isPopular?: boolean;
  nameId: string;
  nameEn: string;
  descriptionId: string;
  descriptionEn: string;
  priceIdr: string;
  priceUsd: string;
  pricePeriodId: string;
  pricePeriodEn: string;
  featuresId: string[];
  featuresEn: string[];
  ctaTextId: string;
  ctaTextEn: string;
  actionType: 'scroll_dashboard' | 'open_report' | 'open_demo';
}

export interface GroundsureReportData {
  meta: {
    reportReference: string;
    inspectionDate: string;
    gridReference: string;
    preparedFor: string;
    propertyType: PropertyType;
    userPersona: UserPersona;
    assessmentResult: MultiHazardAssessmentResult;
  };
  executiveOpinion: {
    badgeTextId: string;
    badgeTextEn: string;
    badgeLevel: 'low' | 'medium' | 'high' | 'extreme';
    summaryTextId: string;
    summaryTextEn: string;
  };
}
