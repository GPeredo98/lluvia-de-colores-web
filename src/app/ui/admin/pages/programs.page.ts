import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationFacade, ProgramsFacade } from '../../../core/application';
import {
  BRAND_COLORS,
  Draft,
  MODALITY_LABELS,
  PRICE_PERIOD_LABELS,
  Program,
} from '../../../core/domain/models';
import { ageRangeLabel } from '../../../core/domain/time';
import { Editor, withoutId } from '../../shared/editor';
import { Icon, PROGRAM_ICONS } from '../../shared/icon';
import { Modal } from '../../shared/modal';

type ProgramForm = Draft<Program> & {
  featuresText: string;
  ageMinYears: number;
  ageMaxYears: number;
};

const toForm = (p: Draft<Program>): ProgramForm => ({
  ...p,
  featuresText: p.features.join('\n'),
  ageMinYears: +(p.ageMinMonths / 12).toFixed(2),
  ageMaxYears: +(p.ageMaxMonths / 12).toFixed(2),
});

@Component({
  selector: 'app-programs-page',
  imports: [FormsModule, Icon, Modal, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Programas</h1>
        <p>Servicios que se muestran en la página y se asignan a cada estudiante.</p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">
        <app-icon name="plus" [size]="18" /> Nuevo programa
      </button>
    </header>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Programa</th>
            <th>Edad</th>
            <th>Modalidad</th>
            <th>Frecuencia</th>
            <th class="num">Precio</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (p of programs.items(); track p.id) {
            <tr>
              <td>
                <div class="name" [attr.data-color]="p.color">
                  <span class="ic"><app-icon [name]="p.icon" [size]="18" /></span>
                  <div>
                    <div class="cell-main">
                      {{ p.name }}
                      @if (p.isFeatured) {
                        <span class="badge plain" data-color="yellow">Destacado</span>
                      }
                    </div>
                    <div class="cell-sub">{{ p.summary }}</div>
                  </div>
                </div>
              </td>
              <td>{{ ageRange(p.ageMinMonths, p.ageMaxMonths) }}</td>
              <td>{{ modality[p.modality] }}</td>
              <td>{{ p.sessionsPerWeek }}×/sem · {{ p.sessionMinutes }} min</td>
              <td class="num">
                <strong>{{ p.price | currency: p.currency : 'symbol' : '1.0-0' }}</strong>
                <div class="cell-sub">{{ period[p.pricePeriod] }}</div>
              </td>
              <td>
                <button
                  class="badge"
                  [attr.data-color]="p.isActive ? 'green' : 'red'"
                  (click)="programs.toggleActive(p)"
                  title="Cambiar estado"
                >
                  {{ p.isActive ? 'Publicado' : 'Oculto' }}
                </button>
              </td>
              <td class="actions">
                <button class="icon-btn" (click)="openEdit(p)" aria-label="Editar">
                  <app-icon name="edit" [size]="18" />
                </button>
                <button
                  class="icon-btn danger"
                  (click)="programs.remove(p.id, p.name)"
                  aria-label="Eliminar"
                >
                  <app-icon name="trash" [size]="18" />
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <div class="empty">
                  @if (programs.loading()) {
                    Cargando…
                  } @else {
                    <strong>Aún no hay programas</strong>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (editor.current(); as e) {
      <app-modal
        [open]="true"
        [title]="e.id ? 'Editar programa' : 'Nuevo programa'"
        size="lg"
        (closed)="editor.close()"
      >
        <form id="program-form" #f="ngForm" class="form-grid" (ngSubmit)="save()">
          <label class="field"
            ><span>Nombre</span
            ><input
              class="input"
              name="name"
              [(ngModel)]="e.draft.name"
              required
              (input)="autoSlug()"
          /></label>
          <label class="field"
            ><span>Identificador (URL)</span
            ><input
              class="input"
              name="slug"
              [(ngModel)]="e.draft.slug"
              required
              pattern="[a-z0-9-]+"
          /></label>
          <label class="field span-2"
            ><span>Resumen</span
            ><input
              class="input"
              name="summary"
              [(ngModel)]="e.draft.summary"
              required
              maxlength="120"
          /></label>
          <label class="field span-2"
            ><span>Descripción</span
            ><textarea
              class="input"
              name="description"
              [(ngModel)]="e.draft.description"
              rows="3"
            ></textarea>
          </label>
          <label class="field"
            ><span>Edad mínima (años)</span
            ><input
              class="input"
              type="number"
              min="0"
              step="0.25"
              name="ageMin"
              [(ngModel)]="e.draft.ageMinYears"
              required
            /><small>0.25 = 3 meses</small></label
          >
          <label class="field"
            ><span>Edad máxima (años)</span
            ><input
              class="input"
              type="number"
              min="0"
              step="0.25"
              name="ageMax"
              [(ngModel)]="e.draft.ageMaxYears"
              required
          /></label>
          <label class="field">
            <span>Modalidad</span>
            <select class="input" name="modality" [(ngModel)]="e.draft.modality">
              @for (m of modalityKeys; track m) {
                <option [value]="m">{{ modality[m] }}</option>
              }
            </select>
          </label>
          <div class="form-grid inner">
            <label class="field"
              ><span>Sesiones/semana</span
              ><input
                class="input"
                type="number"
                min="1"
                max="7"
                name="spw"
                [(ngModel)]="e.draft.sessionsPerWeek"
                required
            /></label>
            <label class="field"
              ><span>Minutos</span
              ><input
                class="input"
                type="number"
                min="15"
                step="5"
                name="min"
                [(ngModel)]="e.draft.sessionMinutes"
                required
            /></label>
          </div>
          <label class="field"
            ><span>Precio (Bs)</span
            ><input
              class="input"
              type="number"
              min="0"
              name="price"
              [(ngModel)]="e.draft.price"
              required
          /></label>
          <label class="field">
            <span>Cobro</span>
            <select class="input" name="period" [(ngModel)]="e.draft.pricePeriod">
              @for (k of periodKeys; track k) {
                <option [value]="k">{{ period[k] }}</option>
              }
            </select>
          </label>
          <label class="field span-2"
            ><span>Qué incluye (una línea por ítem)</span
            ><textarea
              class="input"
              name="features"
              [(ngModel)]="e.draft.featuresText"
              rows="3"
            ></textarea>
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
          <div class="field">
            <span>Ícono</span>
            <div class="icons" [attr.data-color]="e.draft.color">
              @for (i of icons; track i) {
                <button
                  type="button"
                  [attr.aria-pressed]="e.draft.icon === i"
                  (click)="e.draft.icon = i"
                  [attr.aria-label]="i"
                >
                  <app-icon [name]="i" [size]="18" />
                </button>
              }
            </div>
          </div>
          <label class="field"
            ><span>Orden</span
            ><input class="input" type="number" name="order" [(ngModel)]="e.draft.sortOrder"
          /></label>
          <div class="field checks">
            <label class="check"
              ><input type="checkbox" name="active" [(ngModel)]="e.draft.isActive" /> Publicado en
              la página</label
            >
            <label class="check"
              ><input type="checkbox" name="featured" [(ngModel)]="e.draft.isFeatured" /> Marcar
              como “Más elegido”</label
            >
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="program-form"
            [disabled]="f.invalid || programs.saving()"
          >
            Guardar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .name {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      .cell-main {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        flex-wrap: wrap;
      }
    }
    .ic {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--accent-soft);
      color: var(--accent);
      flex: none;
    }
    button.badge {
      border: 0;
      cursor: pointer;
    }
    .inner {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .checks {
      align-content: center;
    }
    .icons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      button {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1.5px solid var(--line-strong);
        background: var(--surface);
        cursor: pointer;
        color: var(--muted);
      }
      button[aria-pressed='true'] {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
      }
    }
  `,
})
export class ProgramsPage {
  protected readonly programs = inject(ProgramsFacade);
  private readonly notify = inject(NotificationFacade);
  protected readonly editor = new Editor<ProgramForm>();
  protected readonly modality = MODALITY_LABELS;
  protected readonly modalityKeys = Object.keys(
    MODALITY_LABELS,
  ) as (keyof typeof MODALITY_LABELS)[];
  protected readonly period = PRICE_PERIOD_LABELS;
  protected readonly periodKeys = Object.keys(
    PRICE_PERIOD_LABELS,
  ) as (keyof typeof PRICE_PERIOD_LABELS)[];
  protected readonly colors = BRAND_COLORS;
  protected readonly icons = PROGRAM_ICONS;
  protected readonly ageRange = ageRangeLabel;

  constructor() {
    void this.programs.load();
  }

  protected openNew() {
    this.editor.create(
      toForm({
        name: '',
        slug: '',
        summary: '',
        description: '',
        ageMinMonths: 12,
        ageMaxMonths: 36,
        modality: 'domicilio',
        price: 0,
        currency: 'BOB',
        pricePeriod: 'mensual',
        sessionsPerWeek: 2,
        sessionMinutes: 45,
        color: 'sky',
        icon: 'star',
        features: [],
        isFeatured: false,
        isActive: true,
        sortOrder: this.programs.items().length + 1,
      }),
    );
  }

  protected openEdit(p: Program) {
    this.editor.edit(p, (x) => toForm(withoutId(x)));
  }

  protected autoSlug() {
    const e = this.editor.current();
    if (!e || e.id) return;
    e.draft.slug = e.draft.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  protected async save() {
    const e = this.editor.current();
    if (!e) return;
    const { featuresText, ageMinYears, ageMaxYears, ...rest } = e.draft;
    const draft: Draft<Program> = {
      ...rest,
      ageMinMonths: Math.round(ageMinYears * 12),
      ageMaxMonths: Math.round(ageMaxYears * 12),
      price: Number(rest.price),
      sessionsPerWeek: Number(rest.sessionsPerWeek),
      sessionMinutes: Number(rest.sessionMinutes),
      sortOrder: Number(rest.sortOrder),
      features: featuresText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    };
    if (draft.ageMaxMonths <= draft.ageMinMonths) {
      this.notify.error('La edad máxima debe ser mayor a la mínima');
      return;
    }
    if (await this.programs.save(e.id, draft)) this.editor.close();
  }
}
