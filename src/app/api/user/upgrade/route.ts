import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';
import { InputValidator } from '../../../../infrastructure/security/inputValidator';

export async function POST(req: NextRequest) {
  // Only Super Admin can manually upgrade user tiers
  const authResult = await AuthGuard.requireRole(req, ['Super Admin (RDI)']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const email = InputValidator.validateEmail(body.email);
    const tierLevel = InputValidator.validateString(body.tierLevel, 'tingkat tier', 3, 80);

    const user = await MySQLUserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    await MySQLUserRepository.update(user.id, {
      tierLevel
    });

    const updatedUser = await MySQLUserRepository.findByEmail(email);

    return NextResponse.json({
      success: true,
      message: `Tier akun pengguna ${email} berhasil diperbarui ke ${tierLevel}.`,
      user: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal upgrade akun.' },
      { status: 400 }
    );
  }
}
