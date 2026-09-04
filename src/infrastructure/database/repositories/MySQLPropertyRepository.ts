import { getDbPool } from '../connection/mysql.connection';
import type { PropertyEntity } from '../../../domain/entities/Property.entity';

export class MySQLPropertyRepository {
  /**
   * Get all saved properties
   */
  static async getAll(): Promise<PropertyEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          user_id as userId, 
          ref_number as refNumber, 
          property_name as propertyName, 
          address, 
          property_type as propertyType, 
          latitude, 
          longitude, 
          overall_score as overallScore, 
          risk_level as riskLevel, 
          flood_score as floodScore, 
          quake_score as quakeScore, 
          heat_score as heatScore, 
          elevation_meters as elevationMeters, 
          fault_distance_km as faultDistanceKm, 
          last_updated_str as lastUpdatedStr 
        FROM saved_properties 
        ORDER BY created_at DESC`
      );

      return (rows as PropertyEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLPropertyRepository] Query fallback:', error);
      return [];
    }
  }

  /**
   * Get properties by user ID
   */
  static async getByUserId(userId: string): Promise<PropertyEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          user_id as userId, 
          ref_number as refNumber, 
          property_name as propertyName, 
          address, 
          property_type as propertyType, 
          latitude, 
          longitude, 
          overall_score as overallScore, 
          risk_level as riskLevel, 
          flood_score as floodScore, 
          quake_score as quakeScore, 
          heat_score as heatScore, 
          elevation_meters as elevationMeters, 
          fault_distance_km as faultDistanceKm, 
          last_updated_str as lastUpdatedStr 
        FROM saved_properties 
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [userId]
      );

      return (rows as PropertyEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLPropertyRepository] Query fallback:', error);
      return [];
    }
  }

  /**
   * Get properties by user Email or user ID
   */
  static async getByUserEmail(email: string): Promise<PropertyEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          p.id, 
          p.user_id as userId, 
          p.ref_number as refNumber, 
          p.property_name as propertyName, 
          p.address, 
          p.property_type as propertyType, 
          p.latitude, 
          p.longitude, 
          p.overall_score as overallScore, 
          p.risk_level as riskLevel, 
          p.flood_score as floodScore, 
          p.quake_score as quakeScore, 
          p.heat_score as heatScore, 
          p.elevation_meters as elevationMeters, 
          p.fault_distance_km as faultDistanceKm, 
          p.last_updated_str as lastUpdatedStr 
        FROM saved_properties p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE u.email = ? OR p.user_id = ?
        ORDER BY p.created_at DESC`,
        [email, email]
      );

      return (rows as PropertyEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLPropertyRepository] getByUserEmail fallback:', error);
      return [];
    }
  }

  /**
   * Save a newly evaluated property
   */
  static async save(prop: Omit<PropertyEntity, 'id' | 'createdAt'> & { userEmail?: string }): Promise<string> {
    if (!prop.propertyName || typeof prop.propertyName !== 'string' || !prop.propertyName.trim()) {
      throw new Error('Nama properti wajib diisi untuk menyimpan properti.');
    }
    if (!prop.address || typeof prop.address !== 'string' || !prop.address.trim()) {
      throw new Error('Alamat properti wajib diisi untuk menyimpan properti.');
    }
    if (typeof prop.latitude !== 'number' || isNaN(prop.latitude) || typeof prop.longitude !== 'number' || isNaN(prop.longitude)) {
      throw new Error('Koordinat geografis (latitude dan longitude) valid wajib diisi untuk menyimpan properti.');
    }

    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      const pool = getDbPool();

      let finalUserId = prop.userId;
      if (prop.userEmail && !finalUserId) {
        const [uRows]: any = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [prop.userEmail]);
        if (uRows && uRows.length > 0) {
          finalUserId = uRows[0].id;
        }
      }

      if (!finalUserId) {
        throw new Error('Identitas pengguna (userId atau userEmail terdaftar) wajib disertakan untuk menyimpan properti.');
      }

      await pool.query(
        `INSERT INTO saved_properties 
          (id, user_id, ref_number, property_name, address, property_type, latitude, longitude, overall_score, risk_level, flood_score, quake_score, heat_score, elevation_meters, fault_distance_km, last_updated_str)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          finalUserId,
          prop.refNumber || `GT-${Date.now().toString(36).toUpperCase()}`,
          prop.propertyName.trim(),
          prop.address.trim(),
          prop.propertyType ?? null,
          prop.latitude,
          prop.longitude,
          prop.overallScore ?? null,
          prop.riskLevel ?? null,
          prop.floodScore ?? null,
          prop.quakeScore ?? null,
          prop.heatScore ?? null,
          prop.elevationMeters ?? null,
          prop.faultDistanceKm ?? null,
          prop.lastUpdatedStr ?? new Date().toISOString()
        ]
      );
      return id;
    } catch (error) {
      console.error('[MySQLPropertyRepository] Save error:', error);
      throw new Error(`Gagal menyimpan data properti ke basis data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get single property by ID
   */
  static async getById(id: string): Promise<PropertyEntity | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          user_id as userId, 
          ref_number as refNumber, 
          property_name as propertyName, 
          address, 
          property_type as propertyType, 
          latitude, 
          longitude, 
          overall_score as overallScore, 
          risk_level as riskLevel, 
          flood_score as floodScore, 
          quake_score as quakeScore, 
          heat_score as heatScore, 
          elevation_meters as elevationMeters, 
          fault_distance_km as faultDistanceKm, 
          last_updated_str as lastUpdatedStr 
        FROM saved_properties 
        WHERE id = ? 
        LIMIT 1`,
        [id]
      );

      if (rows && rows.length > 0) {
        return rows[0] as PropertyEntity;
      }
      return null;
    } catch (error) {
      console.warn('[MySQLPropertyRepository] getById error:', error);
      return null;
    }
  }

  /**
   * Delete property by ID with optional ownership restriction
   */
  static async delete(id: string, userId?: string): Promise<boolean> {
    try {
      const pool = getDbPool();
      if (userId) {
        const [res]: any = await pool.query('DELETE FROM saved_properties WHERE id = ? AND user_id = ?', [id, userId]);
        return res && res.affectedRows > 0;
      } else {
        const [res]: any = await pool.query('DELETE FROM saved_properties WHERE id = ?', [id]);
        return res && res.affectedRows > 0;
      }
    } catch (error) {
      console.warn('[MySQLPropertyRepository] delete error:', error);
      return false;
    }
  }
}
