import { getDbPool } from '../db/connection';
import { Property } from '../models/Property';

/**
 * PropertyRepository — The exclusive data-access gateway for Saved Properties in MySQL
 */
export class PropertyRepository {
  static async getAll(): Promise<Property[]> {
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
          last_updated_str as lastUpdatedStr,
          created_at as createdAt 
        FROM saved_properties 
        ORDER BY created_at DESC`
      );

      return (rows as Property[]) || [];
    } catch (error) {
      console.warn('[PropertyRepository.getAll] Fallback:', error);
      return [];
    }
  }

  static async save(prop: Omit<Property, 'id' | 'createdAt'>): Promise<string> {
    const id = `prop_${Date.now()}`;
    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO saved_properties 
          (id, user_id, ref_number, property_name, address, property_type, latitude, longitude, overall_score, risk_level, flood_score, quake_score, heat_score, elevation_meters, fault_distance_km, last_updated_str)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          prop.userId,
          prop.refNumber,
          prop.propertyName,
          prop.address,
          prop.propertyType,
          prop.latitude,
          prop.longitude,
          prop.overallScore,
          prop.riskLevel,
          prop.floodScore,
          prop.quakeScore,
          prop.heatScore,
          prop.elevationMeters,
          prop.faultDistanceKm,
          prop.lastUpdatedStr
        ]
      );
      return id;
    } catch (error) {
      console.error('[PropertyRepository.save] MySQL Error:', error);
      throw error;
    }
  }
}
