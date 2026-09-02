import { getDbPool } from '../connection/mysql.connection';
import type { SystemFeedEntity } from '../../../domain/entities/SystemFeed.entity';

export class MySQLSystemFeedRepository {
  static async getAll(): Promise<SystemFeedEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          feed_name as feedName, 
          provider, 
          resolution, 
          latency_ms as latencyMs, 
          status, 
          last_sync as lastSync 
        FROM system_feeds`
      );

      return (rows as SystemFeedEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLSystemFeedRepository] Query fallback:', error);
      return [];
    }
  }
}
