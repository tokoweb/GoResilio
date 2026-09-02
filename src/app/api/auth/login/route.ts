import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUserUseCase } from '../../../../application/use_cases/auth/AuthenticateUser.usecase';
import { JwtHelper } from '../../../../infrastructure/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await AuthenticateUserUseCase.execute(email, password);

    // Sign persistent session JWT
    const token = await JwtHelper.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      tierLevel: user.tierLevel
    });

    const response = NextResponse.json({
      success: true,
      token,
      user
    });

    // Set persistent session cookie (7 days)
    response.cookies.set('gotangguh_session_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Autentikasi gagal. Akun tidak ditemukan.' },
      { status: 401 }
    );
  }
}
