import { NextRequest, NextResponse } from 'next/server';
import { JwtHelper } from '../../../../infrastructure/auth/jwt';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';

export async function GET(req: NextRequest) {
  try {
    // 1. Check cookie or Authorization header
    const cookieToken = req.cookies.get('gotangguh_session_token')?.value;
    const authHeader = req.headers.get('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = cookieToken || headerToken;

    let emailToFind: string | null = null;

    if (token) {
      const decoded = await JwtHelper.verifyToken(token);
      if (decoded && decoded.email) {
        emailToFind = decoded.email;
      }
    }

    // Fallback: check query parameter
    if (!emailToFind) {
      const { searchParams } = new URL(req.url);
      emailToFind = searchParams.get('email');
    }

    if (!emailToFind) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada sesi login aktif.' },
        { status: 401 }
      );
    }

    // Fetch fresh user record from MySQL
    const user = await MySQLUserRepository.findByEmail(emailToFind);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memverifikasi sesi.' },
      { status: 500 }
    );
  }
}
