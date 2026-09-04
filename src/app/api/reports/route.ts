import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../infrastructure/auth/authGuard';
import { MySQLReportRepository } from '../../../infrastructure/database/repositories/MySQLReportRepository';
import { RateLimiter } from '../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../infrastructure/security/inputValidator';

export async function GET(req: NextRequest) {
  try {
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;

    let reports = [];
    if (user.role === 'Super Admin (RDI)') {
      reports = await MySQLReportRepository.getAll();
    } else {
      reports = await MySQLReportRepository.getByUserId(user.userId);
    }

    return NextResponse.json({ success: true, count: reports.length, data: reports });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat daftar laporan tersimpan.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const rateLimitRes = RateLimiter.enforce(req, 'report_save', 20, 60000);
  if (rateLimitRes) return rateLimitRes;

  try {
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    const body = await req.json();

    // Reject sample report data from entering the authoritative user report database
    if (
      body.isSample === true ||
      body.reportData?.isSample === true ||
      (typeof body.reportData?.referenceNumber === 'string' && body.reportData.referenceNumber.includes('SAMPLE'))
    ) {
      return NextResponse.json(
        { success: false, error: 'Laporan sampel (sample report) tidak dapat disimpan ke perpustakaan laporan resmi akun.' },
        { status: 400 }
      );
    }

    const rawLat = body.latitude ?? body.reportData?.location?.latitude;
    const rawLng = body.longitude ?? body.reportData?.location?.longitude;
    const { latitude, longitude } = InputValidator.validateCoordinates(rawLat, rawLng);

    const propertyName = InputValidator.validateString(
      body.propertyName || body.reportData?.location?.formattedAddress || 'Properti Asesmen',
      'nama properti',
      2,
      180
    );
    const address = InputValidator.validateString(
      body.address || body.reportData?.location?.formattedAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      'alamat',
      2,
      500
    );

    // Authoritative Server Assessment: Server reruns canonical assessment as the sole source of truth.
    // Client-supplied overallScore / hazard levels are completely ignored to prevent client-side score manipulation.
    const { PerformSiteAssessmentUseCase } = await import('../../../application/use_cases/PerformSiteAssessment.usecase');
    const canonicalAssessment = await PerformSiteAssessmentUseCase.execute({
      latitude,
      longitude,
      formattedAddress: address,
      propertyType: body.propertyType || body.reportData?.propertyType || null,
      userPersona: body.userPersona || body.reportData?.userPersona || null
    });

    const reportId = await MySQLReportRepository.create({
      userId: user.userId,
      userEmail: user.email,
      propertyName,
      address,
      latitude,
      longitude,
      overallScore: canonicalAssessment.overallScore ?? undefined,
      overallLevel: canonicalAssessment.overallLevel,
      packageType: body.packageType || 'Instant (1 Properti)',
      reportData: canonicalAssessment
    });

    return NextResponse.json({
      success: true,
      id: reportId,
      overallScore: canonicalAssessment.overallScore,
      overallLevel: canonicalAssessment.overallLevel,
      message: 'Laporan resmi berhasil diterbitkan secara kanonikal oleh server dan disimpan ke akun Anda.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan laporan resmi.' },
      { status: 400 }
    );
  }
}
