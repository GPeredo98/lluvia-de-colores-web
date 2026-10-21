import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AttendanceFacade,
  ManualAttendanceInput,
  StaffFacade,
  StudentsFacade,
} from '../../../core/application';
import { today } from '../../../core/domain/time';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { DayPipe, DurationPipe } from '../../shared/pipes';

@Component({
  selector: 'app-attendance-page',
  imports: [FormsModule, Icon, Modal, Avatar, DayPipe, DurationPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let f = att.filter();
    @let s = att.summary();
    <header class="page-head">
      <div>
        <h1>Reporte de asistencia</h1>
        <p>Visitas registradas con QR por las estimuladoras. Tolerancia de llegada: 10 min.</p>
      </div>
      <div class="toolbar">
        <button class="btn" (click)="download()" [disabled]="!att.rows().length">
          <app-icon name="download" [size]="18" /> Exportar CSV
        </button>
        <button class="btn btn-primary" (click)="openManual()">
          <app-icon name="plus" [size]="18" /> Registro manual
        </button>
      </div>
    </header>

    <section class="card card-pad filters">
      <div class="segmented" role="group" aria-label="Rango rápido">
        @for (r of ranges; track r.days) {
          <button (click)="att.setRange(r.days)">{{ r.label }}</button>
        }
      </div>
      <label class="field"
        ><span>Desde</span
        ><input
          class="input"
          type="date"
          [value]="f.from"
          [max]="todayStr"
          (change)="att.setFilter({ from: $any($event.target).value })"
      /></label>
      <label class="field"
        ><span>Hasta</span
        ><input
          class="input"
          type="date"
          [value]="f.to"
          [max]="todayStr"
          (change)="att.setFilter({ to: $any($event.target).value })"
      /></label>
      <label class="field">
        <span>Estimuladora</span>
        <select
          class="input"
          (change)="att.setFilter({ staffId: $any($event.target).value || null })"
        >
          <option value="">Todas</option>
          @for (p of staff.items(); track p.id) {
            <option [value]="p.id" [selected]="f.staffId === p.id">{{ p.fullName }}</option>
          }
        </select>
      </label>
      <label class="field">
        <span>Estudiante</span>
        <select
          class="input"
          (change)="att.setFilter({ studentId: $any($event.target).value || null })"
        >
          <option value="">Todos</option>
          @for (p of students.items(); track p.id) {
            <option [value]="p.id" [selected]="f.studentId === p.id">{{ p.fullName }}</option>
          }
        </select>
      </label>
    </section>

    <section class="stat-grid">
      <article class="card stat">
        <span class="stat-label">Visitas</span><span class="stat-value">{{ s.visits }}</span
        ><span class="stat-hint">{{ s.inProgress }} en curso</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Horas de atención</span
        ><span class="stat-value">{{ s.hours | number: '1.0-1' }}</span
        ><span class="stat-hint">Promedio {{ s.avgMinutes | duration }} por visita</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Puntualidad</span
        ><span class="stat-value">{{ s.punctuality }}%</span
        ><span class="stat-hint">{{ s.late }} llegadas tarde</span>
      </article>
    </section>

    <div class="cols">
      <div class="card table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estimuladora</th>
              <th>Estudiante</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th class="num">Duración</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of att.rows(); track r.record.id) {
              <tr>
                <td class="nowrap">{{ r.date | day: 'medium' }}</td>
                <td>
                  <div class="who">
                    <app-avatar [name]="r.staffName" [color]="r.staffColor" [size]="28" />
                    {{ r.staffName }}
                  </div>
                </td>
                <td>{{ r.studentName }}</td>
                <td>
                  <div class="cell-main">{{ r.checkIn }}</div>
                  @if (r.scheduledStart) {
                    @if (r.isLate) {
                      <span class="badge" data-color="red">+{{ r.delayMin }} min</span>
                    } @else {
                      <span class="cell-sub">Horario {{ r.scheduledStart }}</span>
                    }
                  } @else {
                    <span class="cell-sub">Fuera de horario</span>
                  }
                </td>
                <td>
                  @if (r.checkOut) {
                    <div class="cell-main">{{ r.checkOut }}</div>
                  } @else {
                    <span class="badge" data-color="blue">En curso</span>
                  }
                </td>
                <td class="num">{{ r.durationMin | duration }}</td>
                <td class="actions">
                  @if (r.record.source === 'manual') {
                    <span
                      class="badge plain"
                      data-color="purple"
                      title="Registrado por un administrador"
                      >Manual</span
                    >
                  }
                  @if (!r.checkOut) {
                    <button class="btn btn-sm" (click)="att.closeNow(r)" [disabled]="att.saving()">
                      Marcar salida
                    </button>
                  }
                  <button class="icon-btn danger" (click)="att.remove(r)" aria-label="Eliminar">
                    <app-icon name="trash" [size]="17" />
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7">
                  <div class="empty">
                    @if (att.loading()) {
                      Cargando…
                    } @else {
                      <app-icon name="clipboard" [size]="40" /><strong
                        >No hay visitas en este rango</strong
                      >
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <aside class="card card-pad">
        <div class="card-title"><h2>Por estimuladora</h2></div>
        <ul class="by-staff">
          @for (b of att.byStaff(); track b.staffId) {
            <li [attr.data-color]="b.color">
              <div class="row">
                <strong>{{ b.staffName }}</strong
                ><span>{{ b.visits }} {{ b.visits === 1 ? 'visita' : 'visitas' }}</span>
              </div>
              <div class="meter"><i [style.width.%]="(b.visits / maxVisits()) * 100"></i></div>
              <small>{{ b.minutes | duration }} · {{ b.late }} tarde</small>
            </li>
          } @empty {
            <li class="cell-sub">Sin datos</li>
          }
        </ul>
      </aside>
    </div>

    @if (manual(); as m) {
      <app-modal
        [open]="true"
        title="Registro manual de asistencia"
        subtitle="Úsalo solo para corregir visitas que no se marcaron con QR."
        (closed)="manual.set(null)"
      >
        <form id="manual-form" #mf="ngForm" class="form-grid" (ngSubmit)="saveManual()">
          <label class="field">
            <span>Estimuladora</span>
            <select class="input" name="staff" [(ngModel)]="m.staffId" required>
              @for (p of staff.active(); track p.id) {
                <option [value]="p.id">{{ p.fullName }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Estudiante</span>
            <select class="input" name="student" [(ngModel)]="m.studentId" required>
              @for (p of students.active(); track p.id) {
                <option [value]="p.id">{{ p.fullName }}</option>
              }
            </select>
          </label>
          <label class="field span-2"
            ><span>Fecha</span
            ><input
              class="input"
              type="date"
              name="date"
              [(ngModel)]="m.date"
              [max]="todayStr"
              required
          /></label>
          <label class="field"
            ><span>Entrada</span
            ><input class="input" type="time" name="in" [(ngModel)]="m.checkIn" required
          /></label>
          <label class="field"
            ><span>Salida</span
            ><input class="input" type="time" name="out" [(ngModel)]="m.checkOut"
          /></label>
          <label class="field span-2"
            ><span>Motivo / notas</span
            ><textarea
              class="input"
              name="notes"
              [(ngModel)]="m.notes"
              rows="2"
              required
              placeholder="Ej. la app no tenía conexión"
            ></textarea>
          </label>
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="manual.set(null)">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="manual-form"
            [disabled]="mf.invalid || att.saving()"
          >
            Registrar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.25rem;
      .field {
        min-width: 160px;
        flex: 1;
      }
      .segmented {
        align-self: center;
      }
    }
    .cols {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 1.25rem;
      align-items: start;
    }
    .nowrap {
      white-space: nowrap;
    }
    .who {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.35rem;
    }
    .by-staff {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 1rem;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.9rem;
      strong {
        color: var(--ink);
      }
      span {
        font-variant-numeric: tabular-nums;
      }
    }
    .meter {
      height: 8px;
      border-radius: 4px;
      background: var(--surface-2);
      margin: 0.35rem 0 0.2rem;
      i {
        display: block;
        height: 100%;
        border-radius: 4px;
        background: var(--accent);
      }
    }
    small {
      color: var(--muted);
      font-size: 0.8rem;
    }
    @media (max-width: 1100px) {
      .cols {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class AttendancePage {
  protected readonly att = inject(AttendanceFacade);
  protected readonly staff = inject(StaffFacade);
  protected readonly students = inject(StudentsFacade);
  protected readonly todayStr = today();
  protected readonly manual = signal<ManualAttendanceInput | null>(null);
  protected readonly ranges = [
    { days: 1, label: 'Hoy' },
    { days: 7, label: '7 días' },
    { days: 30, label: '30 días' },
  ];

  constructor() {
    void this.att.init();
  }

  protected maxVisits() {
    return Math.max(1, ...this.att.byStaff().map((b) => b.visits));
  }

  protected openManual() {
    this.manual.set({
      staffId: this.staff.active()[0]?.id ?? '',
      studentId: this.students.active()[0]?.id ?? '',
      date: today(),
      checkIn: '09:00',
      checkOut: '10:00',
      notes: '',
    });
  }

  protected async saveManual() {
    const m = this.manual();
    if (m && (await this.att.registerManual({ ...m, checkOut: m.checkOut || null }))) {
      this.manual.set(null);
    }
  }

  protected download() {
    const blob = new Blob([this.att.toCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const f = this.att.filter();
    a.href = url;
    a.download = `asistencia_${f.from}_${f.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
