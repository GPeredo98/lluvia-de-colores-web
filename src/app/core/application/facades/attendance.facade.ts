import { Injectable, computed, inject, signal } from '@angular/core';
import { Attendance, AttendanceFilter, BrandColor, Draft } from '../../domain/models';
import { AttendanceRepository } from '../../domain/ports';
import {
  addDays,
  localDateTimeIso,
  minutesBetween,
  minutesOf,
  toLocalDate,
  toLocalTime,
  today,
  weekdayOf,
} from '../../domain/time';
import { SchedulesFacade, StaffFacade, StudentsFacade } from './catalog.facades';
import { NotificationFacade, errorMessage } from './notification.facade';

/** Minutos de tolerancia antes de considerar una llegada como tardía. */
export const LATE_TOLERANCE_MIN = 10;

export interface AttendanceRow {
  record: Attendance;
  date: string;
  staffName: string;
  staffColor: BrandColor;
  studentName: string;
  checkIn: string;
  checkOut: string | null;
  durationMin: number | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  /** Minutos de retraso respecto al horario (negativo = llegó antes). */
  delayMin: number | null;
  status: 'en_curso' | 'completada';
  isLate: boolean;
}

export interface StaffAttendanceSummary {
  staffId: string;
  staffName: string;
  color: BrandColor;
  visits: number;
  minutes: number;
  late: number;
}

export interface ManualAttendanceInput {
  staffId: string;
  studentId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceFacade {
  private readonly repo = inject(AttendanceRepository);
  private readonly notify = inject(NotificationFacade);
  private readonly staff = inject(StaffFacade);
  private readonly students = inject(StudentsFacade);
  private readonly schedules = inject(SchedulesFacade);

  private readonly _filter = signal<AttendanceFilter>({
    from: addDays(today(), -6),
    to: today(),
    staffId: null,
    studentId: null,
  });
  private readonly _records = signal<Attendance[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly filter = this._filter.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();

  readonly rows = computed<AttendanceRow[]>(() => {
    const staff = this.staff.byId();
    const students = this.students.byId();
    const schedules = this.schedules.byId();
    return this._records().map((r) => {
      const s = staff.get(r.staffId);
      const schedule = r.scheduleId ? schedules.get(r.scheduleId) : undefined;
      const checkIn = toLocalTime(r.checkInAt);
      const delayMin = schedule ? minutesOf(checkIn) - minutesOf(schedule.startTime) : null;
      return {
        record: r,
        date: toLocalDate(r.checkInAt),
        staffName: s?.fullName ?? 'Personal eliminado',
        staffColor: s?.color ?? 'blue',
        studentName: students.get(r.studentId)?.fullName ?? 'Estudiante eliminado',
        checkIn,
        checkOut: r.checkOutAt ? toLocalTime(r.checkOutAt) : null,
        durationMin: r.checkOutAt ? minutesBetween(r.checkInAt, r.checkOutAt) : null,
        scheduledStart: schedule?.startTime ?? null,
        scheduledEnd: schedule?.endTime ?? null,
        delayMin,
        status: r.checkOutAt ? 'completada' : 'en_curso',
        isLate: delayMin !== null && delayMin > LATE_TOLERANCE_MIN,
      };
    });
  });

  readonly summary = computed(() => {
    const rows = this.rows();
    const completed = rows.filter((r) => r.durationMin !== null);
    const minutes = completed.reduce((acc, r) => acc + (r.durationMin ?? 0), 0);
    const withSchedule = rows.filter((r) => r.delayMin !== null);
    const late = withSchedule.filter((r) => r.isLate).length;
    return {
      visits: rows.length,
      inProgress: rows.length - completed.length,
      hours: minutes / 60,
      avgMinutes: completed.length ? Math.round(minutes / completed.length) : 0,
      late,
      punctuality: withSchedule.length
        ? Math.round(((withSchedule.length - late) / withSchedule.length) * 100)
        : 100,
    };
  });

  readonly byStaff = computed<StaffAttendanceSummary[]>(() => {
    const map = new Map<string, StaffAttendanceSummary>();
    for (const r of this.rows()) {
      const entry = map.get(r.record.staffId) ?? {
        staffId: r.record.staffId,
        staffName: r.staffName,
        color: r.staffColor,
        visits: 0,
        minutes: 0,
        late: 0,
      };
      entry.visits++;
      entry.minutes += r.durationMin ?? 0;
      if (r.isLate) entry.late++;
      map.set(r.record.staffId, entry);
    }
    return [...map.values()].sort((a, b) => b.visits - a.visits);
  });

  async init() {
    await Promise.all([this.staff.load(), this.students.load(), this.schedules.load()]);
    await this.refresh();
  }

  setFilter(patch: Partial<AttendanceFilter>) {
    const next = { ...this._filter(), ...patch };
    if (next.from > next.to) next.to = next.from;
    this._filter.set(next);
    void this.refresh();
  }

  setRange(days: number) {
    this.setFilter({ from: addDays(today(), -(days - 1)), to: today() });
  }

  async refresh() {
    this._loading.set(true);
    try {
      this._records.set(await this.repo.list(this._filter()));
    } catch (e) {
      this.notify.error(errorMessage(e));
    } finally {
      this._loading.set(false);
    }
  }

  async registerManual(input: ManualAttendanceInput): Promise<boolean> {
    const checkInAt = localDateTimeIso(input.date, input.checkIn);
    const checkOutAt = input.checkOut ? localDateTimeIso(input.date, input.checkOut) : null;
    if (checkOutAt && checkOutAt <= checkInAt) {
      this.notify.error('La salida debe ser posterior a la entrada');
      return false;
    }
    const weekday = weekdayOf(input.date);
    const schedule = this.schedules
      .active()
      .find(
        (s) =>
          s.staffId === input.staffId && s.studentId === input.studentId && s.weekday === weekday,
      );
    const draft: Draft<Attendance> = {
      staffId: input.staffId,
      studentId: input.studentId,
      scheduleId: schedule?.id ?? null,
      checkInAt,
      checkOutAt,
      source: 'manual',
      notes: input.notes,
    };
    return this.run(async () => {
      await this.repo.create(draft);
      this.notify.success('Asistencia registrada');
      await this.refresh();
    });
  }

  /** Cierra una visita que quedó abierta (la estimuladora olvidó marcar salida). */
  async closeNow(row: AttendanceRow) {
    return this.run(async () => {
      await this.repo.update(row.record.id, { checkOutAt: new Date().toISOString() });
      this.notify.success('Salida registrada');
      await this.refresh();
    });
  }

  async remove(row: AttendanceRow) {
    const ok = await this.notify.confirm({
      title: 'Eliminar registro',
      message: `¿Eliminar la visita de ${row.staffName} a ${row.studentName} del ${row.date}?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return false;
    return this.run(async () => {
      await this.repo.remove(row.record.id);
      this._records.update((list) => list.filter((r) => r.id !== row.record.id));
      this.notify.success('Registro eliminado');
    });
  }

  /** CSV del reporte filtrado (separador `;` para Excel en español). */
  toCsv(): string {
    const header = [
      'Fecha',
      'Estimuladora',
      'Estudiante',
      'Horario',
      'Entrada',
      'Salida',
      'Duración (min)',
      'Retraso (min)',
      'Origen',
      'Notas',
    ];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = this.rows().map((r) =>
      [
        r.date,
        r.staffName,
        r.studentName,
        r.scheduledStart ? `${r.scheduledStart}-${r.scheduledEnd}` : '',
        r.checkIn,
        r.checkOut ?? 'En curso',
        r.durationMin ?? '',
        r.delayMin ?? '',
        r.record.source === 'qr' ? 'QR' : 'Manual',
        r.record.notes,
      ]
        .map(esc)
        .join(';'),
    );
    return '﻿' + [header.map(esc).join(';'), ...lines].join('\r\n');
  }

  private async run(fn: () => Promise<void>): Promise<boolean> {
    this._saving.set(true);
    try {
      await fn();
      return true;
    } catch (e) {
      this.notify.error(errorMessage(e));
      return false;
    } finally {
      this._saving.set(false);
    }
  }
}
