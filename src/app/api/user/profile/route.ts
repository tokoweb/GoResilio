import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '../../../../infrastructure/database/connection/mysql.connection';
import { AuthGuard } from '../../../../infrastructure/auth/authGuard';
import { PasswordService } from '../../../../lib/auth/password';
import { InputValidator } from '../../../../infrastructure/security/inputValidator';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request via session JWT
    const authResult = await AuthGuard.requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult; // 401 Unauthorized
    }

    const { user: authUser } = authResult;
    const body = await req.json();
    const { fullName, phoneNumber, organization, currentPassword, newPassword } = body;

    // 2. Resolve target email strictly from authenticated session unless caller is Super Admin
    let targetEmail = authUser.email;
    if (authUser.role === 'Super Admin (RDI)' && body.email && typeof body.email === 'string') {
      targetEmail = InputValidator.validateEmail(body.email);
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      'SELECT id, email, password_hash as passwordHash, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel FROM users WHERE email = ? LIMIT 1',
      [targetEmail]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = rows[0];

    // 3. If changing password, verify current password first using constant-time comparison
    let newPasswordHash: string | undefined = undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi' },
          { status: 400 }
        );
      }

      const isCurrentValid = PasswordService.verifySync(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi saat ini tidak sesuai dengan catatan sistem' },
          { status: 401 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi baru minimal memiliki panjang 6 karakter' },
          { status: 400 }
        );
      }

      newPasswordHash = PasswordService.hashSync(newPassword);
    }

    // 4. Prepare sanitized update fields
    const fields: string[] = [];
    const values: any[] = [];

    if (fullName) {
      const sanitizedName = InputValidator.sanitizeText(String(fullName));
      fields.push('full_name = ?');
      values.push(sanitizedName);
    }
    if (phoneNumber !== undefined) {
      const sanitizedPhone = InputValidator.sanitizeText(String(phoneNumber));
      fields.push('phone_number = ?');
      values.push(sanitizedPhone);
    }
    if (organization !== undefined) {
      const sanitizedOrg = InputValidator.sanitizeText(String(organization));
      fields.push('organization = ?');
      values.push(sanitizedOrg);
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
      fullName: fullName ? InputValidator.sanitizeText(String(fullName)) : user.fullName,
      role: user.role,
      organization: organization !== undefined ? InputValidator.sanitizeText(String(organization)) : user.organization,
      phoneNumber: phoneNumber !== undefined ? InputValidator.sanitizeText(String(phoneNumber)) : user.phoneNumber,
      tierLevel: user.tierLevel,
      isVerified: true
    };

    return NextResponse.json({
      success: true,
      message: newPassword ? 'Profil dan kata sandi keamanan berhasil diperbarui.' : 'Profil akun berhasil diperbarui.',
      user: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pengaturan akun' },
      { status: 500 }
    );
  }
}
