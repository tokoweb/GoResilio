import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../../infrastructure/auth/authGuard';
import { MySQLReportRepository } from '../../../../../infrastructure/database/repositories/MySQLReportRepository';
import { MasterReportGenerator } from '../../../../../domain/services/MasterReportGenerator';
import type { MultiHazardAssessmentResult } from '../../../../../domain/types/hazard.types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    const reportId = params.id;

    const report = await MySQLReportRepository.getById(reportId);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    if (user.role !== 'Super Admin (RDI)' && report.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki izin mengunduh laporan ini.' },
        { status: 403 }
      );
    }

    const data = report.reportData as MultiHazardAssessmentResult;
    if (!data) {
      return NextResponse.json({ success: false, error: 'Data laporan kosong.' }, { status: 500 });
    }

    const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'id';

    // Generate Master 11-Section printable report HTML
    const html = MasterReportGenerator.generateMasterReportHtml({
      assessment: data,
      lang,
      ownerName: user.fullName || user.email,
      isSample: false
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="laporan-${report.refNumber}-${lang}.html"`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunduh dokumen laporan.' },
      { status: 500 }
    );
  }
}
