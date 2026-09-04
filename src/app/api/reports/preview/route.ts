import { NextRequest, NextResponse } from 'next/server';
import { PerformSiteAssessmentUseCase } from '../../../../application/use_cases/PerformSiteAssessment.usecase';
import { MasterReportGenerator } from '../../../../domain/services/MasterReportGenerator';
import { InputValidator } from '../../../../infrastructure/security/inputValidator';
import type { MultiHazardAssessmentResult, PropertyType, UserPersona } from '../../../../domain/types/hazard.types';

export const dynamic = 'force-dynamic';

/**
 * Live Real-Data Report Preview Route
 * Generates an authoritative, publication-ready printable report HTML based strictly on actual scan data.
 * Zero synthetic defaults. No sample watermark.
 */
export async function GET(req: NextRequest) {
  try {
    const latParam = req.nextUrl.searchParams.get('lat');
    const lngParam = req.nextUrl.searchParams.get('lng');
    const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'id';
    const addressParam = req.nextUrl.searchParams.get('address') || '';
    const propTypeParam: PropertyType = req.nextUrl.searchParams.get('type') === 'Commercial' ? 'Commercial' : 'Residential';
    const personaParam: UserPersona = 'Home Owner';

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { success: false, error: 'Assessment coordinate unavailable: Parameter lat and lng are required.' },
        { status: 400 }
      );
    }

    const { latitude, longitude } = InputValidator.validateCoordinates(latParam, lngParam);
    const sanitizedAddress = InputValidator.sanitizeText(addressParam).substring(0, 300);

    // 1. Execute live multi-hazard scan pipeline
    const assessment: MultiHazardAssessmentResult = await PerformSiteAssessmentUseCase.execute({
      latitude,
      longitude,
      formattedAddress: sanitizedAddress || undefined,
      propertyType: propTypeParam,
      userPersona: personaParam
    });

    // 2. Format formal real-data report (isSample: false)
    const html = MasterReportGenerator.generateMasterReportHtml({
      assessment,
      lang,
      isSample: false
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('[API/reports/preview] Error generating real report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan laporan data aktual' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lang = body.lang === 'en' ? 'en' : 'id';

    let assessment: MultiHazardAssessmentResult;

    if (body.assessment) {
      assessment = body.assessment;
    } else {
      const { latitude, longitude } = InputValidator.validateCoordinates(body.latitude, body.longitude);
      const sanitizedAddress = InputValidator.sanitizeText(body.formattedAddress || body.address || '').substring(0, 300);
      const propertyType: PropertyType = body.propertyType === 'Commercial' ? 'Commercial' : 'Residential';
      const userPersona: UserPersona = body.userPersona || 'Home Owner';

      assessment = await PerformSiteAssessmentUseCase.execute({
        latitude,
        longitude,
        formattedAddress: sanitizedAddress || undefined,
        propertyType,
        userPersona
      });
    }

    // Format formal real-data report (isSample: false)
    const html = MasterReportGenerator.generateMasterReportHtml({
      assessment,
      lang,
      isSample: false,
      ownerName: body.ownerName || null
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('[API/reports/preview] Error formatting real report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan laporan data aktual' },
      { status: 400 }
    );
  }
}
