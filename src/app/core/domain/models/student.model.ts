import { Entity } from './common.model';

export interface Student extends Entity {
  fullName: string;
  /** yyyy-MM-dd */
  birthDate: string;
  programId: string | null;
  guardianName: string;
  /** El padre/madre inicia sesión con este correo para ver asistencia y pagos. */
  guardianEmail: string;
  guardianPhone: string;
  address: string;
  notes: string;
  /** Token único impreso en el QR de la visita. */
  qrToken: string;
  isActive: boolean;
}

/** Contenido que codifica el QR; la app móvil lo lee y llama a `register_attendance`. */
export function studentQrPayload(student: Pick<Student, 'qrToken'>): string {
  return `ldc:attendance:${student.qrToken}`;
}
