import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLReportRepository } from '../../../../infrastructure/database/repositories/MySQLReportRepository';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'ID laporan wajib disertakan.' }, { status: 400 });
    }

    const report = await MySQLReportRepository.getById(reportId);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Laporan tidak ditemukan.' }, { status: 404 });
    }

    // Enforce ownership: only the owner or Super Admin can access the report dossier
    if (user.role !== 'Super Admin (RDI)' && report.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat laporan milik akun lain.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil dokumen laporan.' },
      { status: 500 }
    );
  }
}
