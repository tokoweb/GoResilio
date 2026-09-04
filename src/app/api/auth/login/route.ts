import { NextRequest, NextResponse } from 'next/server';
import { AuthenticateUserUseCase } from '../../../../application/use_cases/auth/AuthenticateUser.usecase';
import { JwtHelper } from '../../../../infrastructure/auth/jwt';
import { RateLimiter } from '../../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../../infrastructure/security/inputValidator';

export async function POST(req: NextRequest) {
  // 1. Enforce rate limiting: 10 attempts per minute per IP
  const rateLimitResponse = RateLimiter.enforce(req, 'auth_login', 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const email = InputValidator.validateEmail(body.email);
    const password = InputValidator.validateString(body.password, 'kata sandi', 1, 100);

    const user = await AuthenticateUserUseCase.execute(email, password);

    // 2. Sign persistent session JWT
    const token = await JwtHelper.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      tierLevel: user.tierLevel
    });

    const response = NextResponse.json({
      success: true,
      user
    });

    // 3. Set secure HttpOnly session cookie (7 days)
    response.cookies.set('gotangguh_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Autentikasi gagal. Akun tidak ditemukan atau kata sandi tidak sesuai.' },
      { status: 401 }
    );
  }
}
