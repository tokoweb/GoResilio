import { MultiHazardAssessmentResult } from '../../domain/types/hazard.types';

export interface ConsultationBookingRecord {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  roleTitle: string;
  packageInterest: string;
  targetLocation: string;
  preferredDate: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  createdAt: string;
}

export class IndexedDbRepository {
  private static DB_NAME = 'GoTangguh_DB';
  private static DB_VERSION = 1;

  private static async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('assessments')) {
          db.createObjectStore('assessments', { keyPath: 'referenceNumber' });
        }
        if (!db.objectStoreNames.contains('bookings')) {
          db.createObjectStore('bookings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public static async saveAssessment(assessment: MultiHazardAssessmentResult): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('assessments', 'readwrite');
      const store = tx.objectStore('assessments');
      store.put(assessment);
    } catch {
      // Local storage fallback if indexedDB is disabled
      try {
        localStorage.setItem(`gt_asm_${assessment.referenceNumber}`, JSON.stringify(assessment));
      } catch {
        // Ignore
      }
    }
  }

  public static async getAssessmentByRef(refNumber: string): Promise<MultiHazardAssessmentResult | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction('assessments', 'readonly');
        const store = tx.objectStore('assessments');
        const request = store.get(refNumber);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      const item = localStorage.getItem(`gt_asm_${refNumber}`);
      return item ? JSON.parse(item) : null;
    }
  }

  public static async saveBooking(booking: ConsultationBookingRecord): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction('bookings', 'readwrite');
      const store = tx.objectStore('bookings');
      store.put(booking);
    } catch {
      localStorage.setItem(`gt_bk_${booking.id}`, JSON.stringify(booking));
    }
  }
}
