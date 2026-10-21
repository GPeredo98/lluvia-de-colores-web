import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DaySeries } from '../../../core/application';
import { DayPipe } from '../../shared/pipes';

/**
 * Barras de visitas registradas por día. Una sola serie (sin leyenda: el título la nombra);
 * las visitas programadas se marcan con una línea tenue de referencia en cada columna.
 */
@Component({
  selector: 'app-visits-chart',
  imports: [DayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plot" role="img" [attr.aria-label]="summary()" (mouseleave)="hover.set(null)">
      <div class="grid" aria-hidden="true">
        @for (t of ticks(); track t) {
          <span [style.bottom.%]="(t / max()) * 100"
            ><em>{{ t }}</em></span
          >
        }
      </div>
      <div class="cols">
        @for (d of data(); track d.date; let i = $index) {
          <div
            class="col"
            [class.dim]="hover() !== null && hover() !== i"
            (mouseenter)="hover.set(i)"
            (focus)="hover.set(i)"
            (blur)="hover.set(null)"
            tabindex="0"
            [attr.aria-label]="
              (d.date | day: 'medium') +
              ': ' +
              d.visits +
              ' visitas de ' +
              d.scheduled +
              ' programadas'
            "
          >
            <div class="track">
              @if (d.scheduled) {
                <i class="target" [style.bottom.%]="(d.scheduled / max()) * 100"></i>
              }
              <b class="bar" [style.height.%]="(d.visits / max()) * 100"></b>
            </div>
            <span class="label" [class.show]="(data().length - 1 - i) % labelEvery() === 0">{{
              d.label
            }}</span>
            @if (hover() === i) {
              <div class="tip" [class.left]="i > data().length / 2">
                <strong>{{ d.date | day: 'medium' }}</strong>
                <span
                  ><i class="sw"></i> Registradas <b>{{ d.visits }}</b></span
                >
                <span
                  ><i class="sw ref"></i> Programadas <b>{{ d.scheduled }}</b></span
                >
              </div>
            }
          </div>
        }
      </div>
    </div>
    <p class="key">
      <i class="sw"></i> Visitas registradas <i class="sw ref"></i> Programadas según horario
    </p>

    <table class="sr-only">
      <caption>
        Visitas por día
      </caption>
      <thead>
        <tr>
          <th>Día</th>
          <th>Registradas</th>
          <th>Programadas</th>
        </tr>
      </thead>
      <tbody>
        @for (d of data(); track d.date) {
          <tr>
            <td>{{ d.date | day: 'medium' }}</td>
            <td>{{ d.visits }}</td>
            <td>{{ d.scheduled }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }
    .plot {
      position: relative;
      height: 220px;
      padding-left: 28px;
    }
    .grid {
      position: absolute;
      inset: 0 0 24px 28px;
      span {
        position: absolute;
        left: 0;
        right: 0;
        border-top: 1px solid var(--line);
      }
      em {
        position: absolute;
        left: -28px;
        top: -8px;
        width: 22px;
        text-align: right;
        font-style: normal;
        font-size: 0.7rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }
    }
    .cols {
      position: relative;
      display: flex;
      height: 100%;
      gap: 2px;
    }
    .col {
      position: relative;
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      outline: none;
      transition: opacity 0.15s;
    }
    .col.dim {
      opacity: 0.45;
    }
    .track {
      position: relative;
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .bar {
      width: min(70%, 28px);
      min-height: 2px;
      background: var(--c-blue);
      border-radius: 4px 4px 0 0;
      transition: height 0.5s var(--ease);
    }
    .target {
      position: absolute;
      left: 12%;
      right: 12%;
      height: 0;
      border-top: 2px dashed var(--line-strong);
    }
    .label {
      display: flex;
      justify-content: center;
      height: 24px;
      padding-top: 6px;
      font-size: 0.7rem;
      color: var(--muted);
      white-space: nowrap;
      visibility: hidden;
    }
    .label.show {
      visibility: visible;
    }
    .tip {
      position: absolute;
      z-index: 5;
      bottom: 70%;
      left: 50%;
      display: grid;
      gap: 0.2rem;
      min-width: 170px;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--line);
      font-size: 0.8rem;
      color: var(--text);
      pointer-events: none;
      strong {
        color: var(--ink);
      }
      span {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      b {
        margin-left: auto;
        color: var(--ink);
        font-variant-numeric: tabular-nums;
      }
      &.left {
        left: auto;
        right: 50%;
      }
    }
    .sw {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 3px;
      background: var(--c-blue);
    }
    .sw.ref {
      height: 0;
      border-top: 2px dashed var(--line-strong);
      background: none;
      border-radius: 0;
    }
    .key {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: var(--muted);
      .ref {
        margin-left: 0.75rem;
      }
    }
  `,
})
export class VisitsChart {
  readonly data = input.required<DaySeries[]>();
  protected readonly hover = signal<number | null>(null);

  protected readonly max = computed(() => {
    const peak = Math.max(1, ...this.data().map((d) => Math.max(d.visits, d.scheduled)));
    return Math.ceil(peak / 2) * 2;
  });
  protected readonly ticks = computed(() => {
    const m = this.max();
    return [0, m / 2, m];
  });
  protected readonly labelEvery = computed(() => (this.data().length > 10 ? 2 : 1));
  protected readonly summary = computed(() => {
    const total = this.data().reduce((a, d) => a + d.visits, 0);
    const planned = this.data().reduce((a, d) => a + d.scheduled, 0);
    return `${total} visitas registradas de ${planned} programadas en ${this.data().length} días`;
  });
}
