import { getDbPool } from '../db/connection';
import { Booking } from '../models/Booking';

/**
 * BookingRepository — The exclusive data-access gateway for Consultation Bookings in MySQL
 */
export class BookingRepository {
  static async getAll(): Promise<Booking[]> {
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

      return (rows as Booking[]) || [];
    } catch (error) {
      console.warn('[BookingRepository.getAll] Fallback:', error);
      return [];
    }
  }

  static async create(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
    const id = `bk_${Date.now()}`;
    try {
      const pool = getDbPool();
      await pool.query(
        `INSERT INTO consultation_bookings 
          (id, voucher_code, client_name, client_email, client_phone, target_location, package_type, assigned_expert, scheduled_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          booking.voucherCode,
          booking.clientName,
          booking.clientEmail,
          booking.clientPhone,
          booking.targetLocation,
          booking.packageType,
          booking.assignedExpert,
          booking.scheduledDate,
          booking.status,
          booking.notes || null
        ]
      );
      return id;
    } catch (error) {
      console.warn('[BookingRepository.create] Fallback:', error);
      return id;
    }
  }
}
