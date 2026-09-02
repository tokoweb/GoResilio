import type { MultiHazardAssessmentResult, PropertyType, UserPersona } from '../types/hazard.types';
import { LocationEntity } from './Location.entity';

export class AssessmentEntity {
  public readonly id: string;
  public readonly referenceNumber: string;
  public readonly location: LocationEntity;
  public readonly propertyType: PropertyType;
  public readonly userPersona: UserPersona;
  public readonly assessmentResult: MultiHazardAssessmentResult;
  public readonly createdAt: Date;

  constructor(params: {
    id?: string;
    referenceNumber: string;
    location: LocationEntity;
    propertyType: PropertyType;
    userPersona: UserPersona;
    assessmentResult: MultiHazardAssessmentResult;
    createdAt?: Date;
  }) {
    this.id = params.id || `asm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.referenceNumber = params.referenceNumber;
    this.location = params.location;
    this.propertyType = params.propertyType;
    this.userPersona = params.userPersona;
    this.assessmentResult = params.assessmentResult;
    this.createdAt = params.createdAt || new Date();
  }
}
