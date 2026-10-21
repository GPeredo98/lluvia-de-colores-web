import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgendaStatus, AuthFacade, DashboardFacade } from '../../../core/application';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { DayPipe } from '../../shared/pipes';
import { VisitsChart } from '../components/visits-chart';

const STATUS: Record<AgendaStatus, { label: string; color: string }> = {
  completada: { label: 'Completada', color: 'green' },
  en_curso: { label: 'En curso', color: 'blue' },
  por_llegar: { label: 'Por llegar', color: 'sky' },
  sin_registro: { label: 'Sin registro', color: 'red' },
};

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, Icon, Avatar, DayPipe, CurrencyPipe, VisitsChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let k = dash.kpis();
    <header class="page-head">
      <div>
        <h1>{{ greeting() }}, {{ firstName() }}</h1>
        <p>{{ dash.today() | day: 'long' }}</p>
      </div>
      <button class="btn" (click)="dash.refreshAttendance()">
        <app-icon name="refresh" [size]="18" /> Actualizar
      </button>
    </header>

    <section class="stat-grid">
      <article class="card stat" data-color="blue">
        <span class="stat-label">Visitas hoy</span>
        <span class="stat-value"
          >{{ k.visitsToday }}<small> / {{ k.scheduledToday }}</small></span
        >
        <span class="stat-hint">{{ k.inProgress }} en curso ahora</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Estudiantes activos</span>
        <span class="stat-value">{{ k.activeStudents }}</span>
        <span class="stat-hint">en {{ k.activePrograms }} programas</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Estimuladoras activas</span>
        <span class="stat-value">{{ k.activeStaff }}</span>
        <span class="stat-hint"><a routerLink="/admin/horarios">Ver horarios</a></span>
      </article>
      <article class="card stat">
        <span class="stat-label">Por cobrar este mes</span>
        <span class="stat-value">{{ k.pendingAmount | currency: 'BOB' : 'symbol' : '1.0-0' }}</span>
        <span class="stat-hint">
          @if (k.overdueCount) {
            <span class="badge" data-color="red">{{ k.overdueCount }} vencidas</span>
          } @else {
            Cobrado {{ k.collectionRate }}%
          }
        </span>
      </article>
    </section>

    <div class="cols">
      <section class="card card-pad">
        <div class="card-title">
          <h2>Agenda de hoy</h2>
          <a routerLink="/admin/asistencia" class="btn btn-ghost btn-sm"
            >Ver asistencia <app-icon name="arrow-right" [size]="16"
          /></a>
        </div>
        @if (dash.loading() && !dash.agenda().length) {
          @for (s of [1, 2, 3]; track s) {
            <div class="skeleton" style="height: 58px; margin-bottom: 8px"></div>
          }
        } @else {
          <ol class="agenda">
            @for (a of dash.agenda(); track a.scheduleId) {
              <li>
                <span class="time"
                  >{{ a.startTime }}<small>{{ a.endTime }}</small></span
                >
                <span class="rail" [attr.data-color]="a.staffColor"></span>
                <div class="who">
                  <strong>{{ a.studentName }}</strong>
                  <small>{{ a.staffName }} · {{ a.programName }}</small>
                </div>
                <div class="state">
                  <span class="badge" [attr.data-color]="status[a.status].color">{{
                    status[a.status].label
                  }}</span>
                  @if (a.checkIn) {
                    <small>{{ a.checkIn }}{{ a.checkOut ? ' – ' + a.checkOut : '' }}</small>
                  }
                </div>
              </li>
            } @empty {
              <li class="empty">
                <app-icon name="calendar" [size]="36" /><strong>Sin visitas programadas hoy</strong>
              </li>
            }
          </ol>
        }
      </section>

      <div class="side">
        <section class="card card-pad">
          <div class="card-title"><h2>Visitas de los últimos 14 días</h2></div>
          <app-visits-chart [data]="dash.series()" />
        </section>

        <section class="card card-pad">
          <div class="card-title"><h2>Actividad reciente</h2></div>
          <ul class="recent">
            @for (r of dash.recent(); track r.id) {
              <li>
                <app-avatar [name]="r.staffName" [color]="r.staffColor" [size]="34" />
                <div>
                  <strong>{{ r.staffName }}</strong> visitó a {{ r.studentName }}
                  <small
                    >{{ r.date | day: 'short' }} · {{ r.checkIn
                    }}{{ r.checkOut ? ' – ' + r.checkOut : ' · en curso' }}</small
                  >
                </div>
              </li>
            } @empty {
              <li class="muted">Aún no hay visitas registradas.</li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: `
    .stat-value small {
      font-size: 1rem;
      color: var(--muted);
    }
    .stat[data-color='blue'] {
      background: var(--brand-gradient);
      border: 0;
      * {
        color: #fff !important;
      }
      .stat-hint {
        opacity: 0.85;
      }
    }
    .cols {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 1.25rem;
      align-items: start;
    }
    .side {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.25rem;
    }
    .agenda {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }
    .agenda li:not(.empty) {
      display: grid;
      grid-template-columns: 52px 4px minmax(0, 1fr) auto;
      gap: 0.85rem;
      align-items: center;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--surface-2);
    }
    .time {
      display: grid;
      font-weight: 800;
      color: var(--ink);
      font-variant-numeric: tabular-nums;
      small {
        font-weight: 600;
        color: var(--muted);
      }
    }
    .rail {
      align-self: stretch;
      border-radius: 4px;
      background: var(--accent);
    }
    .who {
      display: grid;
      min-width: 0;
      strong {
        color: var(--ink);
      }
      small {
        color: var(--muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .state {
      display: grid;
      justify-items: end;
      gap: 0.2rem;
      small {
        color: var(--muted);
        font-size: 0.78rem;
        font-variant-numeric: tabular-nums;
      }
    }
    .recent {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.85rem;
      li {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        font-size: 0.92rem;
      }
      strong {
        color: var(--ink);
      }
      small {
        display: block;
        color: var(--muted);
      }
    }
    .muted {
      color: var(--muted);
    }
    @media (max-width: 1100px) {
      .cols {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class DashboardPage implements OnDestroy {
  protected readonly dash = inject(DashboardFacade);
  private readonly auth = inject(AuthFacade);
  protected readonly status = STATUS;

  protected readonly firstName = computed(() => (this.auth.user()?.fullName ?? '').split(' ')[0]);
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  constructor() {
    void this.dash.init();
  }

  ngOnDestroy() {
    this.dash.destroy();
  }
}
