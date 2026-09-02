import { NextRequest, NextResponse } from 'next/server';
import { PerformSiteAssessmentUseCase } from '../../../application/use_cases/PerformSiteAssessment.usecase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, address, formattedAddress, propertyType, userPersona } = body;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return NextResponse.json(
        { success: false, error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude (-90..90) and longitude (-180..180) are required' },
        { status: 400 }
      );
    }

    const result = await PerformSiteAssessmentUseCase.execute({
      latitude: latNum,
      longitude: lngNum,
      formattedAddress: formattedAddress || address,
      propertyType: propertyType || 'Residential',
      userPersona: userPersona || 'Home Buyer'
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API/scan] Assessment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Scan error' },
      { status: 500 }
    );
  }
}
