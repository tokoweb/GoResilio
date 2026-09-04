import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';

export async function GET(req: NextRequest) {
  try {
    // 1. Resolve identity strictly from verified server-side JWT
    const payload = await AuthGuard.authenticateRequest(req);
    if (!payload || !payload.email) {
      return NextResponse.json(
        { success: false, error: 'Sesi autentikasi tidak ditemukan atau tidak valid.' },
        { status: 401 }
      );
    }

    // 2. Fetch fresh user record from MySQL
    const user = await MySQLUserRepository.findByEmail(payload.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan di sistem.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memverifikasi sesi autentikasi.' },
      { status: 500 }
    );
  }
}
