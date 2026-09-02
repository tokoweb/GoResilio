import { NextRequest, NextResponse } from 'next/server';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';
import { JwtHelper } from '../../../../infrastructure/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, role, organization, phoneNumber } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await MySQLUserRepository.findByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Alamat email ini sudah terdaftar. Silakan gunakan menu Masuk.' },
        { status: 409 }
      );
    }

    // Default to Free Tier for new users, except Super Admin
    const defaultTier = role === 'Super Admin (RDI)' ? 'Platform Master Authority' : 'Free Tier (Skrining Dasar)';

    const newUser = await MySQLUserRepository.create({
      email: normalizedEmail,
      password: password || 'default123',
      fullName,
      role: role || 'Home Buyer',
      organization: organization || '-',
      phoneNumber: phoneNumber || '-',
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
      token,
      user: newUser
    });

    // Set secure cookie
    response.cookies.set('gotangguh_session_token', token, {
      httpOnly: false, // Accessible to client context sync
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mendaftarkan pengguna baru.' },
      { status: 500 }
    );
  }
}
