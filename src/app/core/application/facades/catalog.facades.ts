import { Injectable, computed, inject } from '@angular/core';
import { CalendarEvent, Program, Schedule, Staff, Student } from '../../domain/models';
import {
  CalendarRepository,
  MediaStorage,
  ProgramRepository,
  ScheduleRepository,
  StaffRepository,
  StudentRepository,
} from '../../domain/ports';
import { minutesOf } from '../../domain/time';
import { CrudFacade } from '../base/crud.facade';
import { errorMessage } from './notification.facade';

const bySortOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

@Injectable({ providedIn: 'root' })
export class ProgramsFacade extends CrudFacade<Program> {
  protected readonly repo = inject(ProgramRepository);
  protected readonly label = 'Programa';

  readonly active = computed(() => this.items().filter((p) => p.isActive));

  protected override sort(items: Program[]) {
    return bySortOrder(items);
  }

  toggleActive(program: Program) {
    return this.update(program.id, { isActive: !program.isActive });
  }
}

@Injectable({ providedIn: 'root' })
export class StaffFacade extends CrudFacade<Staff> {
  protected readonly repo = inject(StaffRepository);
  private readonly media = inject(MediaStorage);
  protected readonly label = 'Estimuladora';
  protected override readonly feminine = true;

  readonly active = computed(() => this.items().filter((s) => s.isActive));

  protected override sort(items: Staff[]) {
    return bySortOrder(items);
  }

  /** Sube la foto y devuelve la URL para guardarla en el formulario. */
  async uploadPhoto(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      this.notify.error('El archivo debe ser una imagen');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error('La imagen no debe superar 2 MB');
      return null;
    }
    try {
      return await this.media.upload('staff', file);
    } catch (e) {
      this.notify.error(errorMessage(e));
      return null;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class StudentsFacade extends CrudFacade<Student> {
  protected readonly repo = inject(StudentRepository);
  protected readonly label = 'Estudiante';

  readonly active = computed(() => this.items().filter((s) => s.isActive));

  protected override sort(items: Student[]) {
    return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async regenerateQr(student: Student): Promise<Student | null> {
    const ok = await this.notify.confirm({
      title: 'Generar nuevo QR',
      message: `El QR actual de ${student.fullName} dejará de funcionar. Deberás imprimir y entregar el nuevo.`,
      confirmLabel: 'Generar nuevo',
    });
    if (!ok) return null;
    return this.mutate(async () => {
      const updated = await this.repo.regenerateQr(student.id);
      this.replace(updated);
      this.notify.success('Nuevo QR generado');
      return updated;
    });
  }
}

@Injectable({ providedIn: 'root' })
export class CalendarFacade extends CrudFacade<CalendarEvent> {
  protected readonly repo = inject(CalendarRepository);
  protected readonly label = 'Evento';

  protected override sort(items: CalendarEvent[]) {
    return [...items].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
}

export interface ScheduleConflict {
  a: Schedule;
  b: Schedule;
  reason: 'staff' | 'student';
}

@Injectable({ providedIn: 'root' })
export class SchedulesFacade extends CrudFacade<Schedule> {
  protected readonly repo = inject(ScheduleRepository);
  protected readonly label = 'Horario';

  readonly active = computed(() => this.items().filter((s) => s.isActive));

  protected override sort(items: Schedule[]) {
    return [...items].sort(
      (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
    );
  }

  /** Horarios que se solapan para la misma estimuladora o el mismo estudiante. */
  findConflicts(candidate: Omit<Schedule, 'id'> & { id?: string | null }): ScheduleConflict[] {
    const start = minutesOf(candidate.startTime);
    const end = minutesOf(candidate.endTime);
    return this.active()
      .filter(
        (s) =>
          s.id !== candidate.id &&
          s.weekday === candidate.weekday &&
          minutesOf(s.startTime) < end &&
          start < minutesOf(s.endTime),
      )
      .flatMap((s): ScheduleConflict[] => {
        const c = { ...candidate, id: candidate.id ?? '' } as Schedule;
        if (s.staffId === candidate.staffId) return [{ a: c, b: s, reason: 'staff' }];
        if (s.studentId === candidate.studentId) return [{ a: c, b: s, reason: 'student' }];
        return [];
      });
  }
}
