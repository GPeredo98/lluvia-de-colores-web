import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { CalendarEventKind, EVENT_KIND_LABELS, WEEKDAYS } from '../../../core/domain/models';
import { Icon } from '../../shared/icon';
import { DayPipe } from '../../shared/pipes';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-calendar',
  imports: [Icon, Reveal, DayPipe, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="calendario" class="section cal-section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="eyebrow" data-color="purple"
            ><app-icon name="calendar" [size]="16" /> Calendario</span
          >
          <h2>Talleres, eventos y fechas importantes</h2>
          <p>Toca un día para ver qué está pasando en Lluvia de Colores.</p>
        </header>

        <div class="layout" appReveal>
          <div class="card cal">
            <div class="cal-head">
              <button
                class="icon-btn"
                (click)="landing.prevMonth()"
                [disabled]="!landing.canGoPrev()"
                aria-label="Mes anterior"
              >
                <app-icon name="chevron-left" />
              </button>
              <h3 aria-live="polite">{{ landing.monthLabel() }}</h3>
              <button
                class="icon-btn"
                (click)="landing.nextMonth()"
                [disabled]="!landing.canGoNext()"
                aria-label="Mes siguiente"
              >
                <app-icon name="chevron-right" />
              </button>
            </div>
            <div class="weekdays">
              @for (w of weekdays; track w.value) {
                <span>{{ w.short }}</span>
              }
            </div>
            <div class="days">
              @for (c of landing.calendarCells(); track c.date) {
                <button
                  class="day"
                  [class.out]="!c.inMonth"
                  [class.today]="c.isToday"
                  [class.weekend]="c.isWeekend"
                  [class.has]="c.events.length"
                  [attr.aria-pressed]="landing.selectedDate() === c.date"
                  [attr.aria-label]="
                    (c.date | day: 'long') +
                    (c.events.length ? ', ' + c.events.length + ' eventos' : '')
                  "
                  (click)="landing.selectDate(c.date)"
                >
                  <span class="num">{{ c.day }}</span>
                  <span class="dots">
                    @for (e of c.events.slice(0, 3); track e.id) {
                      <i class="dot" [attr.data-color]="e.color"></i>
                    }
                  </span>
                </button>
              }
            </div>
          </div>

          <aside class="card side">
            @if (landing.selectedDate(); as date) {
              <h3>{{ date | day: 'long' }}</h3>
              @for (e of landing.selectedDayEvents(); track e.id) {
                <ng-container *ngTemplateOutlet="event; context: { $implicit: e }" />
              } @empty {
                <p class="muted">
                  No hay eventos este día. Las sesiones regulares siguen su horario.
                </p>
              }
              <button class="btn btn-ghost btn-sm" (click)="landing.selectDate(null)">
                Ver próximos eventos
              </button>
            } @else {
              <h3>Próximos eventos</h3>
              @for (e of landing.upcomingEvents(); track e.id) {
                <ng-container *ngTemplateOutlet="event; context: { $implicit: e }" />
              } @empty {
                <p class="muted">Pronto publicaremos nuevas actividades.</p>
              }
            }
          </aside>
        </div>
      </div>
    </section>

    <ng-template #event let-e>
      <article class="event" [attr.data-color]="e.color">
        <span class="badge">{{ kindLabel(e.kind) }}</span>
        <h4>{{ e.title }}</h4>
        <p class="when">
          <app-icon name="calendar" [size]="14" />
          {{ e.startDate | day: 'medium' }}
          @if (e.endDate && e.endDate !== e.startDate) {
            – {{ e.endDate | day: 'medium' }}
          }
        </p>
        @if (e.description) {
          <p class="muted">{{ e.description }}</p>
        }
      </article>
    </ng-template>
  `,
  styles: `
    .cal-section {
      background: linear-gradient(180deg, var(--surface), var(--c-purple-soft) 160%);
    }
    .layout {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }
    .cal {
      padding: 1.25rem;
      border-radius: var(--radius-lg);
    }
    .cal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      h3 {
        font-size: 1.35rem;
      }
      .icon-btn:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }
    .weekdays,
    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .weekdays span {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--muted);
      padding: 0.3rem 0;
    }
    .day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      border-radius: 12px;
      border: 0;
      background: transparent;
      cursor: pointer;
      font-weight: 700;
      color: var(--ink);
      transition:
        background 0.15s,
        transform 0.15s;
      &:hover {
        background: var(--surface-2);
      }
      &.weekend {
        color: var(--muted);
      }
      &.out {
        opacity: 0.35;
      }
      &.has {
        background: var(--c-blue-soft);
      }
      &.today .num {
        background: var(--c-blue);
        color: #fff;
      }
      &[aria-pressed='true'] {
        background: var(--ink);
        color: #fff;
        transform: scale(1.04);
      }
    }
    .num {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .dots {
      display: flex;
      gap: 3px;
      height: 6px;
      .dot {
        width: 6px;
        height: 6px;
      }
    }
    .side {
      padding: 1.4rem;
      border-radius: var(--radius-lg);
      display: grid;
      gap: 1rem;
      h3 {
        font-size: 1.2rem;
      }
      .btn {
        justify-self: start;
      }
    }
    .event {
      display: grid;
      gap: 0.3rem;
      padding: 0.9rem 1rem;
      border-radius: var(--radius);
      border-left: 4px solid var(--accent);
      background: var(--accent-soft);
      .badge {
        justify-self: start;
        background: var(--surface);
      }
      h4 {
        font-size: 1.05rem;
      }
    }
    .when {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ink);
    }
    .muted {
      color: var(--muted);
      font-size: 0.92rem;
    }
    @media (max-width: 880px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CalendarSection {
  protected readonly landing = inject(LandingFacade);
  protected readonly weekdays = WEEKDAYS;
  protected kindLabel(kind: CalendarEventKind) {
    return EVENT_KIND_LABELS[kind];
  }
}
