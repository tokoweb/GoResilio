import { getDbPool } from '../db/connection';
import { User, AccountRole } from '../models/User';

/**
 * UserRepository — The exclusive data-access gateway for Users in MySQL
 */
export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          email, 
          full_name as fullName, 
          role, 
          organization, 
          phone_number as phoneNumber, 
          tier_level as tierLevel, 
          is_verified as isVerified, 
          created_at as createdAt 
        FROM users 
        WHERE email = ? LIMIT 1`,
        [email]
      );

      if (rows && rows.length > 0) {
        return rows[0] as User;
      }
      return null;
    } catch (error) {
      console.warn('[UserRepository.findByEmail] Fallback:', error);
      return null;
    }
  }

  static async findByRole(role: AccountRole): Promise<User | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          email, 
          full_name as fullName, 
          role, 
          organization, 
          phone_number as phoneNumber, 
          tier_level as tierLevel, 
          is_verified as isVerified, 
          created_at as createdAt 
        FROM users 
        WHERE role = ? LIMIT 1`,
        [role]
      );

      if (rows && rows.length > 0) {
        return rows[0] as User;
      }
      return null;
    } catch (error) {
      console.warn('[UserRepository.findByRole] Fallback:', error);
      return null;
    }
  }
}
