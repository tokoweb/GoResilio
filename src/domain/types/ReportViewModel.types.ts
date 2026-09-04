/**
 * Dedicated Report View Model Definitions
 * Strictly aligned with client master template "Simple Report - BangunTangguh" (11 sections)
 */

export interface DonutChartViewModel {
  id: 'overall' | 'quake' | 'flood' | 'heat';
  label: string;
  score: number | null;
  scoreDisplay: string;
  level: string;
  color: string;
  reliability: string;
}

export interface SeismicTimelinePoint {
  year: number;
  count: number;
  maxMagnitude: number;
}

export interface TechnicalAuditItem {
  key: string;
  label: string;
  value: string;
  source: string;
  status: 'verified' | 'reanalysis' | 'fallback' | 'not_applicable' | 'no_data';
}

export interface CoverViewModel {
  title: string;
  subtitle: string;
  tagline: string;
  reportType: string;
  referenceNumber: string;
  assessmentDate: string;
  propertyAddress: string;
  coordinates: string;
  propertyType: string;
  ownerName: string;
  isSample: boolean;
  watermarkText?: string;
}

export interface ExecutiveSummaryViewModel {
  sectionNumber: string;
  title: string;
  overallScore: number | null;
  overallScoreText: string;
  overallLevelText: string;
  overallColor: string;
  dominantHazardTitle: string;
  dominantHazardName: string;
  dominantHazardLevel: string;
  dominantHazardIntro: string;
  generalOverviewTitle: string;
  topRecommendationsTitle: string;
  hazardDonuts: DonutChartViewModel[];
  generalOverview: string;
  topRecommendations: string[];
}

export interface PropertyProfileViewModel {
  sectionNumber: string;
  title: string;
  overlayMapSubtitle: string;
  cityRegency: string;
  areaCharacteristic: string;
  buildingType: string;
  floorCount: string;
  buildingAge: string;
  distanceToWaterway: string;
  buildingDensity: string;
  accessibility: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface AssessmentMethodologyViewModel {
  sectionNumber: string;
  title: string;
  howAssessmentConductedTitle: string;
  introBody: string;
  tableHeaders: {
    aspect: string;
    explanation: string;
  };
  aspectRows: Array<{
    aspect: string;
    explanation: string;
  }>;
  layExplanationTitle: string;
  layExplanationBody: string;
}

export interface EarthquakeSectionViewModel {
  sectionNumber: string;
  title: string;
  hazardLevelTitle: string;
  groundShakingTitle: string;
  historicalTimelineTitle: string;
  timelineSubtitle: string;
  strongestQuakeTitle: string;
  frequencyTitle: string;
  potentialImpactTitle: string;
  recommendationsTitle: string;
  primaryPriorityLabel: string;
  suggestedLabel: string;
  conclusionTitle: string;
  donut: DonutChartViewModel;
  pgaDisplay: string;
  faultDistanceDisplay: string;
  faultNameDisplay: string;
  historicalCount10Yr: string;
  strongestQuakeText: string;
  liquefactionStatus: string;
  frequencyText: string;
  impactText: string;
  primaryRecommendation: string;
  suggestedRecommendation: string;
  conclusionText: string;
  timelineData: SeismicTimelinePoint[];
  technicalAudits: TechnicalAuditItem[];
}

export interface FloodSectionViewModel {
  sectionNumber: string;
  title: string;
  floodAssessmentTitle: string;
  siteElevationTitle: string;
  peakRainfallTitle: string;
  waterProximityTitle: string;
  terrainLandformTitle: string;
  historicalEventsTitle: string;
  inundationDepthTitle: string;
  frequencyTitle: string;
  potentialImpactTitle: string;
  recommendationsTitle: string;
  primaryPriorityLabel: string;
  suggestedLabel: string;
  conclusionTitle: string;
  donut: DonutChartViewModel;
  elevationDisplay: string;
  rainfall24hDisplay: string;
  waterwayDistanceDisplay: string;
  terrainLandformDisplay: string;
  historicalInundationDisplay: string;
  floodDepthDisplay: string;
  frequencyText: string;
  impactText: string;
  primaryRecommendation: string;
  suggestedRecommendation: string;
  conclusionText: string;
  technicalAudits: TechnicalAuditItem[];
}

export interface HeatSectionViewModel {
  sectionNumber: string;
  title: string;
  forecastTempTitle: string;
  historicalPeakTempTitle: string;
  climateProjectionTitle: string;
  airQualityTitle: string;
  heatExposureTitle: string;
  historicalTrendTitle: string;
  frequencyTitle: string;
  potentialImpactTitle: string;
  recommendationsTitle: string;
  primaryPriorityLabel: string;
  suggestedLabel: string;
  conclusionTitle: string;
  donut: DonutChartViewModel;
  forecastPeakTempDisplay: string;
  historicalPeakTempDisplay: string;
  projectedTempRise2050Display: string;
  airQualityDisplay: string;
  heatExposureLevelDisplay: string;
  historicalTrendText: string;
  frequencyText: string;
  impactText: string;
  primaryRecommendation: string;
  suggestedRecommendation: string;
  conclusionText: string;
  technicalAudits: TechnicalAuditItem[];
}

export interface FacilityAccessibilityRow {
  type: string;
  name: string;
  distance: string;
  travelTime: string;
  category: string;
}

export interface AccessibilitySectionViewModel {
  sectionNumber: string;
  title: string;
  networkMapSubtitle: string;
  tableHeaders: {
    facilityType: string;
    facilityName: string;
    distance: string;
    travelTime: string;
    category: string;
  };
  facilities: FacilityAccessibilityRow[];
  interpretationTitle: string;
  interpretationText: string;
  riskNotesTitle: string;
  riskNotesText: string;
  recommendationsTitle: string;
  fastestRouteLabel: string;
  fastestRouteText: string;
  alternativeRouteLabel: string;
  alternativeRouteText: string;
  technicalAudits: TechnicalAuditItem[];
}

export interface RiskComparisonRow {
  hazardId: 'quake' | 'flood' | 'heat';
  hazardName: string;
  levelName: string;
  scoreText: string;
  scoreNum: number | null;
  reliability: string;
  color: string;
}

export interface RiskComparisonViewModel {
  sectionNumber: string;
  title: string;
  tableTitle: string;
  tableHeaders: {
    hazardType: string;
    riskLevel: string;
    score: string;
    reliability: string;
  };
  rows: RiskComparisonRow[];
  insightTitle: string;
  insightText: string;
}

export interface ActionPlanViewModel {
  sectionNumber: string;
  title: string;
  subtitle: string;
  priority1Title: string;
  priority1List: string[];
  priority2Title: string;
  priority2List: string[];
  priority3Title: string;
  priority3List: string[];
  notesBody: string;
}

export interface ClosingViewModel {
  sectionNumber: string;
  title: string;
  conclusionTitle: string;
  conclusionSummary: string;
  disclaimerTitle: string;
  disclaimerText: string;
  nextStepsTitle: string;
  nextSteps: string[];
  reportReference: string;
  dateGenerated: string;
}

export interface ReportViewModel {
  meta: {
    language: 'id' | 'en';
    isSample: boolean;
    referenceNumber: string;
    evaluatedAt: string;
    platformName: string;
    poweredBy: string;
    totalPages: number;
  };
  cover: CoverViewModel;
  executiveSummary: ExecutiveSummaryViewModel;
  propertyProfile: PropertyProfileViewModel;
  methodology: AssessmentMethodologyViewModel;
  earthquakeSection: EarthquakeSectionViewModel;
  floodSection: FloodSectionViewModel;
  heatSection: HeatSectionViewModel;
  accessibilitySection: AccessibilitySectionViewModel;
  riskComparison: RiskComparisonViewModel;
  actionPlan: ActionPlanViewModel;
  closing: ClosingViewModel;
}
