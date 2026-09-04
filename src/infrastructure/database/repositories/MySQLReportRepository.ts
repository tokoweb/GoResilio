import { getDbPool } from '../connection/mysql.connection';
import type { MultiHazardAssessmentResult } from '../../../domain/types/hazard.types';

export interface PersistentReportEntity {
  id: string;
  userId: string;
  userEmail?: string;
  refNumber: string;
  propertyName: string;
  address: string;
  latitude: number;
  longitude: number;
  overallScore: number;
  overallLevel: string;
  packageType: string;
  reportData: MultiHazardAssessmentResult | null;
  status: 'completed' | 'generating' | 'failed';
  createdAt: string;
}

export class MySQLReportRepository {
  /**
   * Save a newly generated report dossier
   */
  static async create(data: {
    userId: string;
    userEmail?: string;
    refNumber?: string;
    propertyName: string;
    address: string;
    latitude: number;
    longitude: number;
    overallScore?: number;
    overallLevel?: string;
    packageType?: string;
    reportData: MultiHazardAssessmentResult;
  }): Promise<string> {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const refNumber = data.refNumber || `RPT-${Date.now().toString(36).toUpperCase()}`;

    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO user_reports 
          (id, user_id, user_email, ref_number, property_name, address, latitude, longitude, overall_score, overall_level, package_type, report_data, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.userId,
          data.userEmail || null,
          refNumber,
          data.propertyName,
          data.address,
          data.latitude,
          data.longitude,
          data.overallScore ?? data.reportData.overallScore ?? null,
          data.overallLevel ?? data.reportData.overallLevel ?? null,
          data.packageType || 'Instant (1 Properti)',
          JSON.stringify(data.reportData),
          'completed'
        ]
      );

      return id;
    } catch (error) {
      console.error('[MySQLReportRepository.create] DB failure:', error);
      throw new Error(`Gagal menyimpan laporan resmi ke basis data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get single report by ID
   */
  static async getById(id: string): Promise<PersistentReportEntity | null> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id,
          user_id as userId,
          user_email as userEmail,
          ref_number as refNumber,
          property_name as propertyName,
          address,
          latitude,
          longitude,
          overall_score as overallScore,
          overall_level as overallLevel,
          package_type as packageType,
          report_data as reportData,
          status,
          created_at as createdAt
         FROM user_reports 
         WHERE id = ? 
         LIMIT 1`,
        [id]
      );

      if (rows && rows.length > 0) {
        const row = rows[0];
        return {
          ...row,
          reportData: typeof row.reportData === 'string' ? JSON.parse(row.reportData) : row.reportData
        };
      }
      return null;
    } catch (error) {
      console.warn('[MySQLReportRepository.getById] error:', error);
      return null;
    }
  }

  /**
   * Get reports by User ID
   */
  static async getByUserId(userId: string): Promise<PersistentReportEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id,
          user_id as userId,
          user_email as userEmail,
          ref_number as refNumber,
          property_name as propertyName,
          address,
          latitude,
          longitude,
          overall_score as overallScore,
          overall_level as overallLevel,
          package_type as packageType,
          report_data as reportData,
          status,
          created_at as createdAt
         FROM user_reports 
         WHERE user_id = ? 
         ORDER BY created_at DESC`,
        [userId]
      );

      return (rows || []).map((row: any) => ({
        ...row,
        reportData: typeof row.reportData === 'string' ? JSON.parse(row.reportData) : row.reportData
      }));
    } catch (error) {
      console.warn('[MySQLReportRepository.getByUserId] error:', error);
      return [];
    }
  }

  /**
   * Get all reports (for Super Admin)
   */
  static async getAll(): Promise<PersistentReportEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id,
          user_id as userId,
          user_email as userEmail,
          ref_number as refNumber,
          property_name as propertyName,
          address,
          latitude,
          longitude,
          overall_score as overallScore,
          overall_level as overallLevel,
          package_type as packageType,
          status,
          created_at as createdAt
         FROM user_reports 
         ORDER BY created_at DESC`
      );

      return rows || [];
    } catch (error) {
      console.warn('[MySQLReportRepository.getAll] error:', error);
      return [];
    }
  }
}
