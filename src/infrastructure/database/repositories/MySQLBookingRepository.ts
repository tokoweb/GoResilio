import { getDbPool } from '../connection/mysql.connection';
import type { ConsultationBookingEntity } from '../../../domain/entities/ConsultationBooking.entity';

export class MySQLBookingRepository {
  static async getAll(): Promise<ConsultationBookingEntity[]> {
    try {
      const pool = getDbPool();
      const [rows]: any = await pool.query(
        `SELECT 
          id, 
          voucher_code as voucherCode, 
          client_name as clientName, 
          client_email as clientEmail, 
          client_phone as clientPhone, 
          target_location as targetLocation, 
          package_type as packageType, 
          assigned_expert as assignedExpert, 
          scheduled_date as scheduledDate, 
          status, 
          notes,
          created_at as createdAt
        FROM consultation_bookings 
        ORDER BY created_at DESC`
      );

      return (rows as ConsultationBookingEntity[]) || [];
    } catch (error) {
      console.warn('[MySQLBookingRepository] Query fallback:', error);
      return [];
    }
  }

  static async create(booking: Partial<ConsultationBookingEntity>): Promise<string> {
    if (!booking.clientName || !booking.clientName.trim()) {
      throw new Error('Nama klien wajib disertakan untuk pendaftaran konsultasi.');
    }
    if (!booking.clientEmail || !booking.clientEmail.trim()) {
      throw new Error('Email klien wajib disertakan untuk pendaftaran konsultasi.');
    }

    const id = booking.id || `bk_${Date.now()}`;
    const voucherCode = booking.voucherCode || `BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedExpert = booking.assignedExpert || 'Tim Peneliti RDI & BGP Consultant';
    const status = booking.status || 'MENUNGGU DISPATCH';

    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO consultation_bookings 
          (id, voucher_code, client_name, client_email, client_phone, target_location, package_type, assigned_expert, scheduled_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          voucherCode,
          booking.clientName.trim(),
          booking.clientEmail.trim(),
          booking.clientPhone ?? null,
          booking.targetLocation ?? null,
          booking.packageType || 'Konsultasi Lite / Basic',
          assignedExpert,
          booking.scheduledDate || 'Segera Dikonfirmasi',
          status,
          booking.notes || null
        ]
      );
      return id;
    } catch (error) {
      console.error('[MySQLBookingRepository] Save error:', error);
      throw new Error(`Gagal menyimpan pendaftaran konsultasi ke basis data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async updateStatusAndNotes(id: string, status?: string, notes?: string, assignedExpert?: string): Promise<boolean> {
    try {
      const pool = getDbPool();
      const fields: string[] = [];
      const values: any[] = [];

      if (status) {
        fields.push('status = ?');
        values.push(status);
      }
      if (notes !== undefined) {
        fields.push('notes = ?');
        values.push(notes);
      }
      if (assignedExpert) {
        fields.push('assigned_expert = ?');
        values.push(assignedExpert);
      }

      if (fields.length === 0) return true;

      values.push(id);
      await pool.query(`UPDATE consultation_bookings SET ${fields.join(', ')} WHERE id = ?`, values);
      return true;
    } catch (error) {
      console.warn('[MySQLBookingRepository] update error:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const pool = getDbPool();
      await pool.query('DELETE FROM consultation_bookings WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.warn('[MySQLBookingRepository] delete error:', error);
      return false;
    }
  }
}
