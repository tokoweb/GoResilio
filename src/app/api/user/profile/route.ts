import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';
import { PasswordHelper } from '../../../../infrastructure/database/repositories/MySQLUserRepository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, phoneNumber, organization, currentPassword, newPassword } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email wajib diisi' }, { status: 400 });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      'SELECT id, email, password_hash as passwordHash, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = rows[0];

    // If changing password, verify current password first and then hash new password
    let newPasswordHash = undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi' }, { status: 400 });
      }

      const isCurrentValid = PasswordHelper.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ success: false, error: 'Kata sandi saat ini tidak sesuai dengan catatan sistem' }, { status: 401 });
      }

      newPasswordHash = PasswordHelper.hashPassword(newPassword);
    }

    // Prepare update fields
    const fields: string[] = [];
    const values: any[] = [];

    if (fullName) {
      fields.push('full_name = ?');
      values.push(fullName);
    }
    if (phoneNumber !== undefined) {
      fields.push('phone_number = ?');
      values.push(phoneNumber);
    }
    if (organization !== undefined) {
      fields.push('organization = ?');
      values.push(organization);
    }
    if (newPasswordHash) {
      fields.push('password_hash = ?');
      values.push(newPasswordHash);
    }

    if (fields.length > 0) {
      values.push(user.id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const updatedUser = {
      id: user.id,
      email: user.email,
      fullName: fullName || user.fullName,
      role: user.role,
      organization: organization !== undefined ? organization : user.organization,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      tierLevel: user.tierLevel,
      isVerified: true
    };

    return NextResponse.json({
      success: true,
      message: newPassword ? 'Profil dan kata sandi keamanan berhasil diperbarui.' : 'Profil akun berhasil diperbarui.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('[Update Profile Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pengaturan akun' },
      { status: 500 }
    );
  }
}
