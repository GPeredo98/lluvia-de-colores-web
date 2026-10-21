import { Injectable } from '@angular/core';
import {
  Attendance,
  AttendanceFilter,
  CalendarEvent,
  Charge,
  Credentials,
  DEFAULT_LANDING_CONTENT,
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
} from '../../../domain/models';
import {
  AttendanceRepository,
  AuthGateway,
  CalendarRepository,
  ChargeRepository,
  LandingRepository,
  MediaStorage,
  PaymentRepository,
  ProfileRepository,
  ProgramRepository,
  ScheduleRepository,
  StaffRepository,
  StudentRepository,
} from '../../../domain/ports';
import { toLocalDate } from '../../../domain/time';
import * as seed from './demo-seed';
import { MemoryCrudAdapter, latency, memoryStorage, newId, sharedCollection } from './memory-store';

const byOrder = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

@Injectable()
export class MemoryProgramAdapter extends MemoryCrudAdapter<Program> implements ProgramRepository {
  protected readonly collection = sharedCollection('programs', seed.seedPrograms);
  protected override sort = (items: Program[]) => items.sort(byOrder);
  listPublic() {
    return latency(this.sort(this.collection.all().filter((p) => p.isActive)));
  }
}

@Injectable()
export class MemoryStaffAdapter extends MemoryCrudAdapter<Staff> implements StaffRepository {
  protected readonly collection = sharedCollection('staff', seed.seedStaff);
  protected override sort = (items: Staff[]) => items.sort(byOrder);
  listPublic() {
    return latency(
      this.sort(
        this.collection
          .all()
          .filter((s) => s.isActive && s.showOnLanding)
          .map((s) => ({ ...s, email: '', phone: '' })),
      ),
    );
  }
}

@Injectable()
export class MemoryStudentAdapter extends MemoryCrudAdapter<Student> implements StudentRepository {
  protected readonly collection = sharedCollection('students', seed.seedStudents);
  protected override sort = (items: Student[]) =>
    items.sort((a, b) => a.fullName.localeCompare(b.fullName));
  override create(draft: Draft<Student>) {
    return super.create({ ...draft, qrToken: newId() });
  }
  regenerateQr(id: string) {
    return latency(this.collection.patch(id, { qrToken: newId() }));
  }
}

@Injectable()
export class MemoryScheduleAdapter
  extends MemoryCrudAdapter<Schedule>
  implements ScheduleRepository
{
  protected readonly collection = sharedCollection('schedules', seed.seedSchedules);
}

@Injectable()
export class MemoryCalendarAdapter
  extends MemoryCrudAdapter<CalendarEvent>
  implements CalendarRepository
{
  protected readonly collection = sharedCollection('events', seed.seedEvents);
  protected override sort = (items: CalendarEvent[]) =>
    items.sort((a, b) => a.startDate.localeCompare(b.startDate));
  listPublic(from: string, to: string) {
    return latency(
      this.sort(
        this.collection
          .all()
          .filter((e) => e.isPublic && e.startDate <= to && (e.endDate ?? e.startDate) >= from),
      ),
    );
  }
}

@Injectable()
export class MemoryChargeAdapter extends MemoryCrudAdapter<Charge> implements ChargeRepository {
  protected readonly collection = sharedCollection('charges', seed.seedCharges);
  protected override sort = (items: Charge[]) =>
    items.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

@Injectable()
export class MemoryAttendanceAdapter implements AttendanceRepository {
  private readonly collection = sharedCollection('attendances', seed.seedAttendances);

  list(filter: AttendanceFilter) {
    const items = this.collection
      .all()
      .filter((a) => {
        const day = toLocalDate(a.checkInAt);
        return (
          day >= filter.from &&
          day <= filter.to &&
          (!filter.staffId || a.staffId === filter.staffId) &&
          (!filter.studentId || a.studentId === filter.studentId)
        );
      })
      .sort((a, b) => b.checkInAt.localeCompare(a.checkInAt));
    return latency(items);
  }
  create(draft: Draft<Attendance>) {
    return latency(this.collection.insert(draft));
  }
  update(id: string, patch: Partial<Draft<Attendance>>) {
    return latency(this.collection.patch(id, patch));
  }
  async remove(id: string) {
    this.collection.delete(id);
  }
}

@Injectable()
export class MemoryPaymentAdapter implements PaymentRepository {
  private readonly collection = sharedCollection('payments', seed.seedPayments);
  private readonly charges = sharedCollection('charges', seed.seedCharges);

  list() {
    return latency([...this.collection.all()].sort((a, b) => b.paidAt.localeCompare(a.paidAt)));
  }
  create(draft: Draft<Payment>) {
    const payment = this.collection.insert(draft);
    // Equivalente al trigger `payments_mark_charge_paid` de Supabase.
    if (payment.status === 'aprobado') {
      this.charges.patch(payment.chargeId, { status: 'pagado', paidAt: payment.paidAt });
    }
    return latency(payment);
  }
}

@Injectable()
export class MemoryLandingAdapter implements LandingRepository {
  get(): Promise<LandingContent> {
    const stored = memoryStorage.read<Partial<LandingContent>>('landing') ?? {};
    return latency({ ...DEFAULT_LANDING_CONTENT, ...stored });
  }
  async save<K extends LandingSectionKey>(key: K, value: LandingContent[K]) {
    const stored = memoryStorage.read<Partial<LandingContent>>('landing') ?? {};
    memoryStorage.write('landing', { ...stored, [key]: value });
    await latency(null);
  }
}

@Injectable()
export class MemoryProfileAdapter implements ProfileRepository {
  private readonly collection = sharedCollection('profiles', seed.seedProfiles);
  list() {
    return latency(this.collection.all());
  }
  updateRole(id: string, role: UserRole) {
    return latency(this.collection.patch(id, { role }));
  }
}

export const DEMO_PASSWORD = 'demo1234';

@Injectable()
export class MemoryAuthAdapter implements AuthGateway {
  private readonly profiles = sharedCollection('profiles', seed.seedProfiles);
  private listeners = new Set<(u: UserProfile | null) => void>();

  currentUser() {
    const id = memoryStorage.read<string>('session');
    return latency(this.profiles.all().find((p) => p.id === id) ?? null, 0);
  }

  async signIn({ email, password }: Credentials) {
    await latency(null, 400);
    const user = this.profiles.all().find((p) => p.email === email.trim().toLowerCase());
    if (!user || password !== DEMO_PASSWORD) throw new Error('Correo o contraseña incorrectos');
    memoryStorage.write('session', user.id);
    return user;
  }

  async signOut() {
    memoryStorage.write('session', null);
    this.listeners.forEach((l) => l(null));
  }

  async sendPasswordReset() {
    await latency(null, 300);
  }

  onChange(callback: (u: UserProfile | null) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

@Injectable()
export class MemoryMediaStorage implements MediaStorage {
  /** En la demo la imagen se guarda como data URL. */
  upload(_folder: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(file);
    });
  }
}
