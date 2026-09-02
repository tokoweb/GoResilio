import { getDbPool } from '../connection/mysql.connection';
import type { CollateralUnderwritingEntity } from '../../../domain/entities/CollateralUnderwriting.entity';

export class MySQLCollateralRepository {
  static async getAll(): Promise<CollateralUnderwritingEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          user_id as userId, 
          debtor_name as debtorName, 
          collateral_ref as collateralRef, 
          property_location as propertyLocation, 
          loan_amount_str as loanAmountStr, 
          composite_score as compositeScore, 
          risk_level_desc as riskLevelDesc, 
          ltv_policy as ltvPolicy, 
          esg_category as esgCategory 
        FROM collateral_underwritings 
        ORDER BY created_at DESC`
      );

      return (rows as CollateralUnderwritingEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLCollateralRepository] Query fallback:', error);
      return [];
    }
  }
}
