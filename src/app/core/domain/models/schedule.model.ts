import { Entity, Weekday } from './common.model';

/** Horario recurrente semanal: una estimuladora visita a un estudiante. */
export interface Schedule extends Entity {
  staffId: string;
  studentId: string;
  programId: string | null;
  weekday: Weekday;
  /** HH:mm */
  startTime: string;
  /** HH:mm */
  endTime: string;
  notes: string;
  isActive: boolean;
}
