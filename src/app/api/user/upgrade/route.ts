import { NextRequest, NextResponse } from 'next/server';
import { MySQLUserRepository } from '../../../../infrastructure/database/repositories/MySQLUserRepository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tierLevel, reportCredits } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email wajib disertakan.' }, { status: 400 });
    }

    const user = await MySQLUserRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan.' }, { status: 404 });
    }

    const updatedTier = tierLevel || 'Tier 2 Pro (Rp 45rb)';
    await MySQLUserRepository.update(user.id, {
      tierLevel: updatedTier
    });

    const updatedUser = await MySQLUserRepository.findByEmail(email);

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil di-upgrade ke paket berbayar.',
      user: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal upgrade akun.' },
      { status: 500 }
    );
  }
}
