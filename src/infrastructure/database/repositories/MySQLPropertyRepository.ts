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
    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      const pool = getDbPool();

      let finalUserId = prop.userId;
      if (prop.userEmail && (!finalUserId || finalUserId === 'usr_buyer_01')) {
        const [uRows]: any = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [prop.userEmail]);
        if (uRows && uRows.length > 0) {
          finalUserId = uRows[0].id;
        }
      }

      await pool.query(
        `INSERT INTO saved_properties 
          (id, user_id, ref_number, property_name, address, property_type, latitude, longitude, overall_score, risk_level, flood_score, quake_score, heat_score, elevation_meters, fault_distance_km, last_updated_str)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          finalUserId || 'usr_buyer_01',
          prop.refNumber || `MT-${Date.now().toString(36).toUpperCase()}`,
          prop.propertyName,
          prop.address,
          prop.propertyType || 'Residential (Rumah Tapak)',
          prop.latitude || -6.2,
          prop.longitude || 106.8,
          prop.overallScore || 50,
          prop.riskLevel || 'medium',
          prop.floodScore || 30,
          prop.quakeScore || 40,
          prop.heatScore || 35,
          prop.elevationMeters || 15.0,
          prop.faultDistanceKm || 12.5,
          prop.lastUpdatedStr || 'Baru Saja'
        ]
      );
      return id;
    } catch (error) {
      console.warn('[MySQLPropertyRepository] Insert fallback:', error);
      return id;
    }
  }

  /**
   * Delete property by ID
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const pool = getDbPool();
      await pool.query('DELETE FROM saved_properties WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.warn('[MySQLPropertyRepository] delete error:', error);
      return false;
    }
  }
}
