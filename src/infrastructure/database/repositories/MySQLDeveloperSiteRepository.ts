import { getDbPool } from '../connection/mysql.connection';
import type { DeveloperSiteEntity } from '../../../domain/entities/DeveloperSite.entity';

export class MySQLDeveloperSiteRepository {
  static async getAll(): Promise<DeveloperSiteEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          user_id as userId, 
          project_name as projectName, 
          location_desc as locationDesc, 
          land_area_ha as landAreaHa, 
          dominant_hazard as dominantHazard, 
          status_text as statusText, 
          kdb_rating as kdbRating, 
          kdh_pct as kdhPct, 
          compliance_status as complianceStatus 
        FROM developer_landbanks 
        ORDER BY created_at DESC`
      );

      return (rows as DeveloperSiteEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLDeveloperSiteRepository] Query fallback:', error);
      return [];
    }
  }
}
