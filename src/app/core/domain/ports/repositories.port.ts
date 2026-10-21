import {
  Attendance,
  AttendanceFilter,
  CalendarEvent,
  Charge,
  Draft,
  LandingContent,
  LandingSectionKey,
  Payment,
  Program,
  Schedule,
  Staff,
  Student,
  UserProfile,
  UserRole,
} from '../models';
import { CrudRepository } from './crud.port';

export abstract class ProgramRepository extends CrudRepository<Program> {
  /** Programas activos, visibles en la landing. */
  abstract listPublic(): Promise<Program[]>;
}

export abstract class StaffRepository extends CrudRepository<Staff> {
  /** Personal activo marcado para mostrarse en la landing. */
  abstract listPublic(): Promise<Staff[]>;
}

export abstract class StudentRepository extends CrudRepository<Student> {
  /** Invalida el QR anterior generando un token nuevo. */
  abstract regenerateQr(id: string): Promise<Student>;
}

export abstract class ScheduleRepository extends CrudRepository<Schedule> {}

export abstract class CalendarRepository extends CrudRepository<CalendarEvent> {
  abstract listPublic(from: string, to: string): Promise<CalendarEvent[]>;
}

export abstract class AttendanceRepository {
  abstract list(filter: AttendanceFilter): Promise<Attendance[]>;
  /** Registro manual por un admin (correcciones). */
  abstract create(draft: Draft<Attendance>): Promise<Attendance>;
  abstract update(id: string, patch: Partial<Draft<Attendance>>): Promise<Attendance>;
  abstract remove(id: string): Promise<void>;
}

export abstract class LandingRepository {
  abstract get(): Promise<LandingContent>;
  abstract save<K extends LandingSectionKey>(key: K, value: LandingContent[K]): Promise<void>;
}

export abstract class ChargeRepository extends CrudRepository<Charge> {}

export abstract class PaymentRepository {
  abstract list(): Promise<Payment[]>;
  abstract create(draft: Draft<Payment>): Promise<Payment>;
}

export abstract class ProfileRepository {
  abstract list(): Promise<UserProfile[]>;
  abstract updateRole(id: string, role: UserRole): Promise<UserProfile>;
}

export abstract class MediaStorage {
  /** Sube un archivo y devuelve su URL pública. */
  abstract upload(folder: string, file: File): Promise<string>;
}
