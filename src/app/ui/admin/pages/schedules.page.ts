import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ProgramsFacade,
  ScheduleConflict,
  SchedulesFacade,
  StaffFacade,
  StudentsFacade,
} from '../../../core/application';
import { BrandColor, Draft, Schedule, WEEKDAYS, Weekday } from '../../../core/domain/models';
import { minutesOf } from '../../../core/domain/time';
import { Editor, withoutId } from '../../shared/editor';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_PX = 54;

interface Block {
  schedule: Schedule;
  top: number;
  height: number;
  lane: number;
  lanes: number;
  color: BrandColor;
  student: string;
  staff: string;
}

@Component({
  selector: 'app-schedules-page',
  imports: [FormsModule, Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Horarios semanales</h1>
        <p>
          Las estimuladoras ven estos horarios en la app móvil.
          {{ schedules.active().length }} visitas por semana.
        </p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">
        <app-icon name="plus" [size]="18" /> Nuevo horario
      </button>
    </header>

    <div class="chips">
      <button
        class="chip"
        [attr.aria-pressed]="staffFilter() === null"
        (click)="staffFilter.set(null)"
      >
        Todas
      </button>
      @for (s of staff.active(); track s.id) {
        <button
          class="chip"
          [attr.data-color]="s.color"
          [attr.aria-pressed]="staffFilter() === s.id"
          (click)="staffFilter.set(staffFilter() === s.id ? null : s.id)"
        >
          <span class="dot"></span> {{ s.fullName }}
        </button>
      }
    </div>

    <div class="card week-wrap">
      <div class="week" [style.--hour]="hourPx + 'px'" [style.--cols]="days().length">
        <div class="corner"></div>
        @for (d of days(); track d.value) {
          <div class="day-head">
            {{ d.label }} <small>{{ countByDay().get(d.value) ?? 0 }}</small>
          </div>
        }
        <div class="hours">
          @for (h of hours; track h) {
            <span [style.top.px]="(h - startHour) * hourPx">{{ h }}:00</span>
          }
        </div>
        @for (d of days(); track d.value) {
          <div
            class="col"
            [style.height.px]="(endHour - startHour) * hourPx"
            (dblclick)="openNew(d.value)"
          >
            @for (b of blocks().get(d.value) ?? []; track b.schedule.id) {
              <button
                class="block"
                [attr.data-color]="b.color"
                [style.top.px]="b.top"
                [style.height.px]="b.height"
                [class.compact]="b.height < 60"
                [style.left.%]="(b.lane / b.lanes) * 100"
                [style.width]="'calc(' + 100 / b.lanes + '% - 4px)'"
                (click)="openEdit(b.schedule)"
                [title]="b.student + ' · ' + b.staff"
              >
                <strong>{{ b.student }}</strong>
                <span>{{ b.schedule.startTime }}–{{ b.schedule.endTime }}</span>
                <span class="staff">{{ b.staff }}</span>
              </button>
            }
          </div>
        }
      </div>
    </div>
    <p class="hint">
      <app-icon name="info" [size]="15" /> Doble clic en un día para crear un horario.
    </p>

    @if (editor.current(); as e) {
      <app-modal
        [open]="true"
        [title]="e.id ? 'Editar horario' : 'Nuevo horario'"
        (closed)="editor.close()"
      >
        <form id="schedule-form" #f="ngForm" class="form-grid" (ngSubmit)="save()">
          <label class="field">
            <span>Estimuladora</span>
            <select class="input" name="staff" [(ngModel)]="e.draft.staffId" required>
              @for (s of staff.active(); track s.id) {
                <option [value]="s.id">{{ s.fullName }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Estudiante</span>
            <select
              class="input"
              name="student"
              [(ngModel)]="e.draft.studentId"
              required
              (ngModelChange)="syncProgram()"
            >
              @for (s of students.active(); track s.id) {
                <option [value]="s.id">{{ s.fullName }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Día</span>
            <select class="input" name="weekday" [(ngModel)]="e.draft.weekday" required>
              @for (d of weekdays; track d.value) {
                <option [ngValue]="d.value">{{ d.label }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Programa</span>
            <select class="input" name="program" [(ngModel)]="e.draft.programId">
              <option [ngValue]="null">—</option>
              @for (p of programs.items(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Inicio</span
            ><input class="input" type="time" name="start" [(ngModel)]="e.draft.startTime" required
          /></label>
          <label class="field"
            ><span>Fin</span
            ><input class="input" type="time" name="end" [(ngModel)]="e.draft.endTime" required
          /></label>
          <label class="field span-2"
            ><span>Notas para la estimuladora</span
            ><textarea class="input" name="notes" [(ngModel)]="e.draft.notes" rows="2"></textarea>
          </label>
          <label class="check span-2"
            ><input type="checkbox" name="active" [(ngModel)]="e.draft.isActive" /> Activo</label
          >

          @if (invalidRange(e.draft)) {
            <p class="warn span-2" data-color="red">
              <app-icon name="alert" [size]="18" /> La hora de fin debe ser posterior a la de
              inicio.
            </p>
          }
          @for (c of conflicts(e.id, e.draft); track c.b.id) {
            <p class="warn span-2" data-color="yellow">
              <app-icon name="alert" [size]="18" />
              {{ c.reason === 'staff' ? 'La estimuladora ya tiene' : 'El estudiante ya tiene' }} una
              visita de {{ c.b.startTime }} a {{ c.b.endTime }} ({{
                students.byId().get(c.b.studentId)?.fullName
              }}
              con {{ staff.byId().get(c.b.staffId)?.fullName }}).
            </p>
          }
        </form>
        <div modal-footer>
          @if (e.id) {
            <button class="btn btn-ghost danger-text" (click)="remove(e.id)">Eliminar</button>
          }
          <span style="flex: 1"></span>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="schedule-form"
            [disabled]="f.invalid || invalidRange(e.draft) || schedules.saving()"
          >
            Guardar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
      .chip[aria-pressed='true'] .dot {
        background: #fff;
      }
    }
    .week-wrap {
      overflow-x: auto;
    }
    .week {
      display: grid;
      grid-template-columns: 56px repeat(var(--cols), minmax(130px, 1fr));
      min-width: 760px;
    }
    .corner,
    .day-head {
      position: sticky;
      top: 0;
      background: var(--surface);
      z-index: 2;
      border-bottom: 1px solid var(--line);
    }
    .day-head {
      padding: 0.75rem;
      font-weight: 800;
      color: var(--ink);
      text-align: center;
      small {
        color: var(--muted);
        font-weight: 700;
        margin-left: 0.25rem;
      }
    }
    .hours {
      position: relative;
      span {
        position: absolute;
        right: 8px;
        transform: translateY(-50%);
        font-size: 0.72rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }
      span:first-child {
        transform: none;
      }
    }
    .col {
      position: relative;
      border-left: 1px solid var(--line);
      background-image: linear-gradient(var(--line) 1px, transparent 1px);
      background-size: 100% var(--hour);
    }
    .block {
      position: absolute;
      margin-left: 2px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1px;
      padding: 0.3rem 0.45rem;
      border: 0;
      border-left: 3px solid var(--accent);
      border-radius: 8px;
      background: var(--accent-soft);
      color: var(--ink);
      text-align: left;
      font-size: 0.74rem;
      line-height: 1.2;
      overflow: hidden;
      cursor: pointer;
      transition:
        box-shadow 0.15s,
        transform 0.15s;
      &:hover {
        box-shadow: var(--shadow);
        transform: scale(1.02);
        z-index: 1;
      }
      strong {
        font-size: 0.8rem;
      }
      span {
        color: var(--text);
        font-variant-numeric: tabular-nums;
      }
      .staff {
        color: var(--muted);
      }
      &.compact .staff {
        display: none;
      }
    }
    .hint {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.75rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .warn {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      padding: 0.65rem 0.8rem;
      border-radius: var(--radius-sm);
      background: var(--accent-soft);
      color: var(--accent-ink, var(--accent));
      font-weight: 600;
      font-size: 0.88rem;
    }
    .danger-text {
      color: var(--c-red);
    }
  `,
})
export class SchedulesPage {
  protected readonly schedules = inject(SchedulesFacade);
  protected readonly staff = inject(StaffFacade);
  protected readonly students = inject(StudentsFacade);
  protected readonly programs = inject(ProgramsFacade);
  protected readonly editor = new Editor<Draft<Schedule>>();
  protected readonly staffFilter = signal<string | null>(null);
  protected readonly weekdays = WEEKDAYS;
  protected readonly hourPx = HOUR_PX;
  protected readonly startHour = START_HOUR;
  protected readonly endHour = END_HOUR;
  protected readonly hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  private readonly visible = computed(() =>
    this.schedules.active().filter((s) => !this.staffFilter() || s.staffId === this.staffFilter()),
  );

  /** Lunes a sábado; el domingo solo aparece si tiene visitas. */
  protected readonly days = computed(() =>
    WEEKDAYS.filter((d) => d.value < 7 || this.visible().some((s) => s.weekday === 7)),
  );

  protected readonly countByDay = computed(() => {
    const map = new Map<Weekday, number>();
    for (const s of this.visible()) map.set(s.weekday, (map.get(s.weekday) ?? 0) + 1);
    return map;
  });

  /** Ubica cada bloque y reparte en carriles los que se solapan. */
  protected readonly blocks = computed(() => {
    const staff = this.staff.byId();
    const students = this.students.byId();
    const result = new Map<Weekday, Block[]>();
    for (const day of WEEKDAYS) {
      const items = this.visible()
        .filter((s) => s.weekday === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const laneEnds: number[] = [];
      const placed = items.map((s) => {
        const start = minutesOf(s.startTime);
        let lane = laneEnds.findIndex((end) => end <= start);
        if (lane === -1) lane = laneEnds.push(0) - 1;
        laneEnds[lane] = minutesOf(s.endTime);
        const st = staff.get(s.staffId);
        return {
          schedule: s,
          top: ((start - START_HOUR * 60) / 60) * HOUR_PX,
          height: Math.max(26, ((minutesOf(s.endTime) - start) / 60) * HOUR_PX - 3),
          lane,
          lanes: 1,
          color: st?.color ?? 'blue',
          staff: st?.fullName ?? '—',
          student: students.get(s.studentId)?.fullName ?? '—',
        };
      });
      for (const b of placed) b.lanes = Math.max(1, laneEnds.length);
      result.set(day.value, placed);
    }
    return result;
  });

  constructor() {
    void this.schedules.load();
    void this.staff.load();
    void this.students.load();
    void this.programs.load();
  }

  protected openNew(weekday: Weekday = 1) {
    const student = this.students.active()[0];
    this.editor.create({
      staffId: this.staffFilter() ?? this.staff.active()[0]?.id ?? '',
      studentId: student?.id ?? '',
      programId: student?.programId ?? null,
      weekday,
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      isActive: true,
    });
  }

  protected openEdit(s: Schedule) {
    this.editor.edit(s, withoutId);
  }

  protected syncProgram() {
    const e = this.editor.current();
    if (e)
      e.draft.programId =
        this.students.byId().get(e.draft.studentId)?.programId ?? e.draft.programId;
  }

  protected invalidRange(d: Draft<Schedule>) {
    return !!d.startTime && !!d.endTime && d.endTime <= d.startTime;
  }

  protected conflicts(id: string | null, d: Draft<Schedule>): ScheduleConflict[] {
    if (!d.startTime || !d.endTime || this.invalidRange(d) || !d.isActive) return [];
    return this.schedules.findConflicts({ ...d, weekday: Number(d.weekday) as Weekday, id });
  }

  protected async save() {
    const e = this.editor.current();
    if (!e) return;
    const draft = { ...e.draft, weekday: Number(e.draft.weekday) as Weekday };
    if (await this.schedules.save(e.id, draft)) this.editor.close();
  }

  protected async remove(id: string) {
    const s = this.schedules.byId().get(id);
    const name = s
      ? `${this.students.byId().get(s.studentId)?.fullName} (${s.startTime})`
      : 'este horario';
    if (await this.schedules.remove(id, name)) this.editor.close();
  }
}
