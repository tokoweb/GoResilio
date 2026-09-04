import { NextRequest, NextResponse } from 'next/server';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';
import { JwtHelper } from '../../../../infrastructure/auth/jwt';
import { RateLimiter } from '../../../../infrastructure/security/rateLimiter';
import { InputValidator } from '../../../../infrastructure/security/inputValidator';

export async function POST(req: NextRequest) {
  // 1. Enforce rate limiting: 10 attempts per minute per IP
  const rateLimitResponse = RateLimiter.enforce(req, 'auth_register', 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const email = InputValidator.validateEmail(body.email);
    const fullName = InputValidator.validateString(body.fullName, 'nama lengkap', 2, 100);
    const password = InputValidator.validateString(body.password, 'kata sandi', 6, 100);

    // Prevent privilege escalation: public registration cannot assign Super Admin
    let requestedRole = body.role || 'Home Buyer';
    if (requestedRole === 'Super Admin (RDI)' || requestedRole === 'Consultant / Auditor') {
      requestedRole = 'Home Buyer';
    }

    // Check if user already exists
    const existing = await MySQLUserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk.' },
        { status: 409 }
      );
    }

    const defaultTier = 'Free Tier (Skrining Dasar)';

    const newUser = await MySQLUserRepository.create({
      email,
      password,
      fullName,
      role: requestedRole,
      organization: body.organization ? InputValidator.sanitizeText(String(body.organization)) : '-',
      phoneNumber: body.phoneNumber ? InputValidator.sanitizeText(String(body.phoneNumber)) : '-',
      tierLevel: defaultTier
    });

    // Generate persistent session JWT token
    const token = await JwtHelper.signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      tierLevel: newUser.tierLevel
    });

    const response = NextResponse.json({
      success: true,
      message: 'Pendaftaran akun berhasil. Selamat datang di GoTangguh!',
      user: newUser
    });

    // Set secure HttpOnly session cookie
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
      { success: false, error: error.message || 'Gagal mendaftarkan akun baru.' },
      { status: 400 }
    );
  }
}
