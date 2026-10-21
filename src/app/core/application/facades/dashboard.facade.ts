import { Injectable, computed, inject, signal } from '@angular/core';
import { Attendance, BrandColor, WEEKDAYS } from '../../domain/models';
import { AttendanceRepository } from '../../domain/ports';
import { addDays, minutesOf, toLocalDate, toLocalTime, today, weekdayOf } from '../../domain/time';
import { LATE_TOLERANCE_MIN } from './attendance.facade';
import { BillingFacade } from './billing.facade';
import { ProgramsFacade, SchedulesFacade, StaffFacade, StudentsFacade } from './catalog.facades';
import { NotificationFacade, errorMessage } from './notification.facade';

export type AgendaStatus = 'completada' | 'en_curso' | 'por_llegar' | 'sin_registro';

export interface AgendaItem {
  scheduleId: string;
  startTime: string;
  endTime: string;
  staffName: string;
  staffColor: BrandColor;
  studentName: string;
  programName: string;
  status: AgendaStatus;
  checkIn: string | null;
  checkOut: string | null;
}

export interface DaySeries {
  date: string;
  label: string;
  scheduled: number;
  visits: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly attendanceRepo = inject(AttendanceRepository);
  private readonly notify = inject(NotificationFacade);
  private readonly staff = inject(StaffFacade);
  private readonly students = inject(StudentsFacade);
  private readonly programs = inject(ProgramsFacade);
  private readonly schedules = inject(SchedulesFacade);
  private readonly billing = inject(BillingFacade);

  private readonly _recent = signal<Attendance[]>([]);
  private readonly _loading = signal(false);
  /** Reloj que avanza cada minuto para recalcular "por llegar" / "sin registro". */
  private readonly _now = signal(new Date());

  readonly loading = this._loading.asReadonly();
  readonly today = computed(() => toLocalDate(this._now()));

  readonly kpis = computed(() => {
    const todayAtt = this._recent().filter((a) => toLocalDate(a.checkInAt) === this.today());
    const summary = this.billing.summary();
    return {
      activeStudents: this.students.active().length,
      activeStaff: this.staff.active().length,
      activePrograms: this.programs.active().length,
      visitsToday: todayAtt.length,
      inProgress: todayAtt.filter((a) => !a.checkOutAt).length,
      scheduledToday: this.agenda().length,
      pendingAmount: summary.pending + summary.overdue,
      overdueCount: summary.overdueCount,
      collectionRate: summary.collectionRate,
    };
  });

  readonly agenda = computed<AgendaItem[]>(() => {
    const date = this.today();
    const nowMin = minutesOf(toLocalTime(this._now()));
    const staff = this.staff.byId();
    const students = this.students.byId();
    const programs = this.programs.byId();
    const todays = this._recent().filter((a) => toLocalDate(a.checkInAt) === date);
    return this.schedules
      .active()
      .filter((s) => s.weekday === weekdayOf(date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => {
        const att =
          todays.find((a) => a.scheduleId === s.id) ??
          todays.find((a) => a.staffId === s.staffId && a.studentId === s.studentId);
        let status: AgendaStatus;
        if (att) status = att.checkOutAt ? 'completada' : 'en_curso';
        else
          status =
            nowMin > minutesOf(s.startTime) + LATE_TOLERANCE_MIN ? 'sin_registro' : 'por_llegar';
        const st = staff.get(s.staffId);
        return {
          scheduleId: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          staffName: st?.fullName ?? '—',
          staffColor: st?.color ?? 'blue',
          studentName: students.get(s.studentId)?.fullName ?? '—',
          programName: s.programId ? (programs.get(s.programId)?.name ?? '') : '',
          status,
          checkIn: att ? toLocalTime(att.checkInAt) : null,
          checkOut: att?.checkOutAt ? toLocalTime(att.checkOutAt) : null,
        };
      });
  });

  /** Visitas registradas vs. programadas en los últimos 14 días. */
  readonly series = computed<DaySeries[]>(() => {
    const end = this.today();
    const active = this.schedules.active();
    const counts = new Map<string, number>();
    for (const a of this._recent()) {
      const d = toLocalDate(a.checkInAt);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(end, i - 13);
      const wd = weekdayOf(date);
      return {
        date,
        label: `${WEEKDAYS[wd - 1].short} ${Number(date.slice(8))}`,
        scheduled: active.filter((s) => s.weekday === wd).length,
        visits: counts.get(date) ?? 0,
      };
    });
  });

  readonly recent = computed(() => {
    const staff = this.staff.byId();
    const students = this.students.byId();
    return this._recent()
      .slice(0, 6)
      .map((a) => ({
        id: a.id,
        staffName: staff.get(a.staffId)?.fullName ?? '—',
        staffColor: staff.get(a.staffId)?.color ?? ('blue' as BrandColor),
        studentName: students.get(a.studentId)?.fullName ?? '—',
        date: toLocalDate(a.checkInAt),
        checkIn: toLocalTime(a.checkInAt),
        checkOut: a.checkOutAt ? toLocalTime(a.checkOutAt) : null,
      }));
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  async init() {
    this._loading.set(true);
    this.timer ??= setInterval(() => this._now.set(new Date()), 60_000);
    try {
      await Promise.all([
        this.staff.load(),
        this.students.load(),
        this.programs.load(),
        this.schedules.load(),
        this.billing.init(),
        this.refreshAttendance(),
      ]);
    } finally {
      this._loading.set(false);
    }
  }

  async refreshAttendance() {
    try {
      const to = today();
      this._recent.set(await this.attendanceRepo.list({ from: addDays(to, -13), to }));
      this._now.set(new Date());
    } catch (e) {
      this.notify.error(errorMessage(e));
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
