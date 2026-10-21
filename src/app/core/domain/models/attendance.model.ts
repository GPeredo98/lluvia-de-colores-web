import { Entity } from './common.model';

export type AttendanceSource = 'qr' | 'manual';

/**
 * Visita registrada. La app móvil crea el registro al escanear el QR (entrada)
 * y lo cierra al escanearlo de nuevo (salida).
 */
export interface Attendance extends Entity {
  staffId: string;
  studentId: string;
  scheduleId: string | null;
  /** ISO 8601 */
  checkInAt: string;
  /** ISO 8601, null mientras la visita está en curso. */
  checkOutAt: string | null;
  source: AttendanceSource;
  notes: string;
}

export interface AttendanceFilter {
  /** yyyy-MM-dd inclusive */
  from: string;
  /** yyyy-MM-dd inclusive */
  to: string;
  staffId?: string | null;
  studentId?: string | null;
}
