import { MySQLUserRepository, PasswordHelper } from '../../../infrastructure/database/repositories/MySQLUserRepository';
import { UserEntity } from '../../../domain/entities/User.entity';

export class AuthenticateUserUseCase {
  /**
   * Authenticate user against MySQL database.
   * Verifies email existence and validates password hash.
   * Throws error if user is not found or credentials are invalid.
   */
  static async execute(email: string, password?: string): Promise<UserEntity> {
    if (!email || !email.trim()) {
      throw new Error('Alamat email wajib diisi.');
    }
    if (!password) {
      throw new Error('Kata sandi wajib diisi.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Query user with stored password hash from MySQL
    const userWithPass = await MySQLUserRepository.findByEmailWithPassword(normalizedEmail);

    if (!userWithPass) {
      throw new Error('Akun dengan email ini belum terdaftar di sistem. Silakan periksa kembali atau daftar akun baru.');
    }

    // 2. Validate password hash
    const isPasswordValid = PasswordHelper.verifyPassword(password, userWithPass.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
    }

    // 3. Return authenticated user entity (without password hash)
    const { passwordHash, ...user } = userWithPass;
    return user as UserEntity;
  }
}

export default AuthenticateUserUseCase;
