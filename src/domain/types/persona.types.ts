import type { UserPersona } from './hazard.types';

export interface PersonaInsightContent {
  persona: UserPersona;
  shortInsightId: string;
  shortInsightEn: string;
  detailedGuidanceId: string;
  detailedGuidanceEn: string;
  actionStepsId: string[];
  actionStepsEn: string[];
}
