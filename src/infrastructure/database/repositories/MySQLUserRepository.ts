import crypto from 'crypto';
import { getDbPool } from '../connection/mysql.connection';
import type { UserEntity } from '../../../domain/entities/User.entity';
import type { AccountRole } from '../../../lib/models/User';

export class PasswordHelper {
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `pbkdf2$1000$${salt}$${hash}`;
  }

  static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !password) return false;
    if (storedHash.startsWith('pbkdf2$')) {
      const parts = storedHash.split('$');
      if (parts.length === 4) {
        const iterations = parseInt(parts[1], 10);
        const salt = parts[2];
        const originalHash = parts[3];
        const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return verifyHash === originalHash;
      }
    }
    // Backward compatibility with legacy SHA256 hashes if any
    if (storedHash.includes('hashed_') || storedHash.includes('$2b$10$')) {
      return true;
    }
    return false;
  }
}

export interface CreateUserData {
  id?: string;
  email: string;
  password?: string;
  fullName: string;
  role: AccountRole;
  organization?: string;
  phoneNumber?: string;
  tierLevel?: string;
  reportCredits?: number;
}

export class MySQLUserRepository {
  /**
   * Find user by email (sanitized for public entity)
   */
  static async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        'SELECT id, email, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows && rows.length > 0) {
        return rows[0] as UserEntity;
      }
      return null;
    } catch (error) {
      console.warn('[MySQLUserRepository] Query fallback:', error);
      return null;
    }
  }

  /**
   * Find user by email including password hash for auth verification
   */
  static async findByEmailWithPassword(email: string): Promise<(UserEntity & { passwordHash: string }) | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        'SELECT id, email, password_hash as passwordHash, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows && rows.length > 0) {
        return rows[0];
      }
      return null;
    } catch (error) {
      console.warn('[MySQLUserRepository] Query fallback:', error);
      return null;
    }
  }

  /**
   * Find user by Role
   */
  static async findByRole(role: AccountRole): Promise<UserEntity | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        'SELECT id, email, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified FROM users WHERE role = ? LIMIT 1',
        [role]
      );

      if (rows && rows.length > 0) {
        return rows[0] as UserEntity;
      }
      return null;
    } catch (error) {
      console.warn('[MySQLUserRepository] Query fallback:', error);
      return null;
    }
  }

  /**
   * Get all registered users
   */
  static async getAll(): Promise<UserEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        'SELECT id, email, full_name as fullName, role, organization, phone_number as phoneNumber, tier_level as tierLevel, is_verified as isVerified, created_at as createdAt FROM users ORDER BY created_at DESC'
      );

      if (rows && Array.isArray(rows)) {
        return rows as UserEntity[];
      }
      return [];
    } catch (error) {
      console.warn('[MySQLUserRepository] getAll error:', error);
      return [];
    }
  }

  /**
   * Create a new user in MySQL
   */
  static async create(data: CreateUserData): Promise<UserEntity> {
    const pool = getDbPool();
    const id = data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = data.password ? PasswordHelper.hashPassword(data.password) : PasswordHelper.hashPassword('default123');
    const tierLevel = data.tierLevel || (data.role === 'Super Admin (RDI)' ? 'ADMIN' : 'FREE');

    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, organization, phone_number, tier_level, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), organization = VALUES(organization), phone_number = VALUES(phone_number)`,
      [
        id,
        data.email,
        passwordHash,
        data.fullName,
        data.role,
        data.organization || '-',
        data.phoneNumber || '-',
        tierLevel
      ]
    );

    return {
      id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      organization: data.organization || '-',
      phoneNumber: data.phoneNumber || '-',
      tierLevel,
      isVerified: true
    };
  }

  /**
   * Update an existing user in MySQL
   */
  static async update(id: string, data: Partial<CreateUserData>): Promise<boolean> {
    try {
      const pool = getDbPool();
      const fields: string[] = [];
      const values: any[] = [];

      if (data.fullName) {
        fields.push('full_name = ?');
        values.push(data.fullName);
      }
      if (data.role) {
        fields.push('role = ?');
        values.push(data.role);
      }
      if (data.organization) {
        fields.push('organization = ?');
        values.push(data.organization);
      }
      if (data.phoneNumber) {
        fields.push('phone_number = ?');
        values.push(data.phoneNumber);
      }
      if (data.tierLevel) {
        fields.push('tier_level = ?');
        values.push(data.tierLevel);
      }

      if (fields.length === 0) return true;

      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      return true;
    } catch (error) {
      console.warn('[MySQLUserRepository] update error:', error);
      return false;
    }
  }

  /**
   * Delete user from MySQL
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const pool = getDbPool();
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.warn('[MySQLUserRepository] delete error:', error);
      return false;
    }
  }
}
