import { NextRequest, NextResponse } from 'next/server';
import { PerformSiteAssessmentUseCase } from '../../../application/use_cases/PerformSiteAssessment.usecase';
import { RateLimiter } from '../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../infrastructure/security/inputValidator';
import type { PropertyType, UserPersona } from '../../../domain/types/hazard.types';

export async function POST(req: NextRequest) {
  // 1. Enforce rate limiting: 30 scan evaluations per minute per IP
  const rateLimitRes = RateLimiter.enforce(req, 'api_scan', 30, 60000);
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json();
    const { latitude, longitude } = InputValidator.validateCoordinates(body.latitude, body.longitude);

    const rawAddress = body.formattedAddress || body.address || 'Titik Koordinat Terpilih';
    const sanitizedAddress = InputValidator.sanitizeText(String(rawAddress)).substring(0, 300);

    const propertyType: PropertyType = body.propertyType === 'Commercial' ? 'Commercial' : 'Residential';
    const validPersonas: UserPersona[] = ['Home Buyer', 'Home Owner', 'Property Developer', 'Lender / Bank', 'Real Estate Agent'];
    const userPersona: UserPersona = validPersonas.includes(body.userPersona) ? body.userPersona : 'Home Buyer';

    const result = await PerformSiteAssessmentUseCase.execute({
      latitude,
      longitude,
      formattedAddress: sanitizedAddress,
      propertyType,
      userPersona
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API/scan] Assessment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses penilaian risiko spasial' },
      { status: 400 }
    );
  }
}
