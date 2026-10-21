import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarFacade } from '../../../core/application';
import {
  BRAND_COLORS,
  CalendarEvent,
  CalendarEventKind,
  Draft,
  EVENT_KIND_LABELS,
} from '../../../core/domain/models';
import { today } from '../../../core/domain/time';
import { Editor, withoutId } from '../../shared/editor';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { DayPipe } from '../../shared/pipes';

const KIND_COLORS: Record<CalendarEventKind, Draft<CalendarEvent>['color']> = {
  evento: 'yellow',
  taller: 'pink',
  inscripcion: 'green',
  feriado: 'red',
  vacaciones: 'sky',
};

@Component({
  selector: 'app-calendar-page',
  imports: [FormsModule, Icon, Modal, DayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Calendario</h1>
        <p>Eventos, talleres y feriados que se muestran en la página pública.</p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">
        <app-icon name="plus" [size]="18" /> Nuevo evento
      </button>
    </header>

    <div class="toolbar" style="margin-bottom: 1rem">
      <div class="segmented">
        <button [attr.aria-pressed]="!showPast()" (click)="showPast.set(false)">Próximos</button>
        <button [attr.aria-pressed]="showPast()" (click)="showPast.set(true)">Todos</button>
      </div>
    </div>

    <div class="list">
      @for (ev of visible(); track ev.id) {
        <article
          class="card event"
          [attr.data-color]="ev.color"
          [class.past]="(ev.endDate ?? ev.startDate) < todayStr"
        >
          <div class="date">
            <strong>{{ ev.startDate.slice(8) }}</strong>
            <span>{{ ev.startDate | day: 'month' }}</span>
          </div>
          <div class="body">
            <div class="title-row">
              <h3>{{ ev.title }}</h3>
              <span class="badge">{{ kinds[ev.kind] }}</span>
              @if (!ev.isPublic) {
                <span class="badge plain" data-color="purple">Privado</span>
              }
            </div>
            <p class="when">
              {{ ev.startDate | day: 'long' }}
              @if (ev.endDate && ev.endDate !== ev.startDate) {
                → {{ ev.endDate | day: 'long' }}
              }
            </p>
            @if (ev.description) {
              <p class="desc">{{ ev.description }}</p>
            }
          </div>
          <div class="actions">
            <button class="icon-btn" (click)="openEdit(ev)" aria-label="Editar">
              <app-icon name="edit" [size]="18" />
            </button>
            <button
              class="icon-btn danger"
              (click)="calendar.remove(ev.id, ev.title)"
              aria-label="Eliminar"
            >
              <app-icon name="trash" [size]="18" />
            </button>
          </div>
        </article>
      } @empty {
        <div class="card empty">
          <app-icon name="calendar" [size]="40" /><strong>No hay eventos próximos</strong>
        </div>
      }
    </div>

    @if (editor.current(); as e) {
      <app-modal
        [open]="true"
        [title]="e.id ? 'Editar evento' : 'Nuevo evento'"
        (closed)="editor.close()"
      >
        <form id="event-form" #f="ngForm" class="form-grid" (ngSubmit)="save()">
          <label class="field span-2"
            ><span>Título</span
            ><input class="input" name="title" [(ngModel)]="e.draft.title" required
          /></label>
          <label class="field">
            <span>Tipo</span>
            <select
              class="input"
              name="kind"
              [(ngModel)]="e.draft.kind"
              (ngModelChange)="onKind(e.draft, $event)"
            >
              @for (k of kindKeys; track k) {
                <option [value]="k">{{ kinds[k] }}</option>
              }
            </select>
          </label>
          <div class="field">
            <span>Color</span>
            <div class="color-picker">
              @for (c of colors; track c) {
                <button
                  type="button"
                  [attr.data-color]="c"
                  [attr.aria-pressed]="e.draft.color === c"
                  (click)="e.draft.color = c"
                  [attr.aria-label]="c"
                ></button>
              }
            </div>
          </div>
          <label class="field"
            ><span>Desde</span
            ><input class="input" type="date" name="start" [(ngModel)]="e.draft.startDate" required
          /></label>
          <label class="field"
            ><span>Hasta (opcional)</span
            ><input
              class="input"
              type="date"
              name="end"
              [(ngModel)]="e.draft.endDate"
              [min]="e.draft.startDate"
          /></label>
          <label class="field span-2"
            ><span>Descripción</span
            ><textarea
              class="input"
              name="desc"
              [(ngModel)]="e.draft.description"
              rows="3"
            ></textarea>
          </label>
          <label class="check span-2"
            ><input type="checkbox" name="public" [(ngModel)]="e.draft.isPublic" /> Mostrar en la
            página pública</label
          >
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="event-form"
            [disabled]="f.invalid || calendar.saving()"
          >
            Guardar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .list {
      display: grid;
      gap: 0.75rem;
    }
    .event {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem 1.1rem;
      border-left: 5px solid var(--accent);
    }
    .past {
      opacity: 0.55;
    }
    .date {
      display: grid;
      justify-items: center;
      width: 56px;
      padding: 0.4rem 0;
      border-radius: 12px;
      background: var(--accent-soft);
      strong {
        font-family: var(--font-display);
        font-size: 1.5rem;
        line-height: 1;
        color: var(--ink);
      }
      span {
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--muted);
      }
    }
    .body {
      flex: 1;
      min-width: 0;
    }
    .title-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      h3 {
        font-size: 1.1rem;
      }
    }
    .when {
      font-size: 0.85rem;
      color: var(--muted);
      font-weight: 700;
      margin-top: 0.2rem;
    }
    .desc {
      font-size: 0.92rem;
      margin-top: 0.35rem;
    }
    .actions {
      display: flex;
    }
  `,
})
export class CalendarPage {
  protected readonly calendar = inject(CalendarFacade);
  protected readonly editor = new Editor<Draft<CalendarEvent>>();
  protected readonly showPast = signal(false);
  protected readonly todayStr = today();
  protected readonly kinds = EVENT_KIND_LABELS;
  protected readonly kindKeys = Object.keys(EVENT_KIND_LABELS) as CalendarEventKind[];
  protected readonly colors = BRAND_COLORS;

  protected readonly visible = computed(() =>
    this.calendar
      .items()
      .filter((e) => this.showPast() || (e.endDate ?? e.startDate) >= this.todayStr),
  );

  constructor() {
    void this.calendar.load();
  }

  protected openNew() {
    this.editor.create({
      title: '',
      description: '',
      kind: 'evento',
      startDate: today(),
      endDate: null,
      color: 'yellow',
      isPublic: true,
    });
  }

  protected onKind(draft: Draft<CalendarEvent>, kind: CalendarEventKind) {
    draft.color = KIND_COLORS[kind];
  }

  protected openEdit(ev: CalendarEvent) {
    this.editor.edit(ev, withoutId);
  }

  protected async save() {
    const e = this.editor.current();
    if (!e) return;
    const draft = { ...e.draft, endDate: e.draft.endDate || null };
    if (await this.calendar.save(e.id, draft)) this.editor.close();
  }
}
