import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LandingContentFacade } from '../../../core/application';
import { BRAND_COLORS, LandingContent, LandingSectionKey } from '../../../core/domain/models';
import { Icon } from '../../shared/icon';

const TABS: { key: LandingSectionKey; label: string; icon: string }[] = [
  { key: 'hero', label: 'Portada', icon: 'home' },
  { key: 'about', label: 'Nosotros', icon: 'heart' },
  { key: 'testimonials', label: 'Testimonios', icon: 'star' },
  { key: 'faq', label: 'Preguntas', icon: 'info' },
  { key: 'contact', label: 'Contacto', icon: 'phone' },
];

@Component({
  selector: 'app-content-page',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Contenido de la página</h1>
        <p>Programas, equipo, precios y calendario se editan en sus propias secciones.</p>
      </div>
      <a class="btn" href="/" target="_blank"
        ><app-icon name="external" [size]="18" /> Ver página</a
      >
    </header>

    <div class="tabs" role="tablist">
      @for (t of tabs; track t.key) {
        <button role="tab" [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)">
          <app-icon [name]="t.icon" [size]="17" /> {{ t.label }}
        </button>
      }
    </div>

    @if (draft(); as d) {
      <form class="card card-pad" (ngSubmit)="save()" #f="ngForm">
        @switch (tab()) {
          @case ('hero') {
            <div class="form-grid">
              <label class="field span-2"
                ><span>Etiqueta superior</span
                ><input class="input" name="eyebrow" [(ngModel)]="d.hero.eyebrow"
              /></label>
              <label class="field"
                ><span>Título</span
                ><input class="input" name="title" [(ngModel)]="d.hero.title" required
              /></label>
              <label class="field"
                ><span>Título resaltado (degradado)</span
                ><input class="input" name="highlight" [(ngModel)]="d.hero.highlight"
              /></label>
              <label class="field span-2"
                ><span>Subtítulo</span
                ><textarea
                  class="input"
                  name="subtitle"
                  [(ngModel)]="d.hero.subtitle"
                  rows="3"
                ></textarea>
              </label>
              <label class="field"
                ><span>Botón principal</span
                ><input class="input" name="cta1" [(ngModel)]="d.hero.ctaPrimary"
              /></label>
              <label class="field"
                ><span>Botón WhatsApp</span
                ><input class="input" name="cta2" [(ngModel)]="d.hero.ctaSecondary"
              /></label>
            </div>
          }
          @case ('about') {
            <div class="form-grid">
              <label class="field span-2"
                ><span>Título</span
                ><input class="input" name="title" [(ngModel)]="d.about.title" required
              /></label>
              <label class="field span-2"
                ><span>Texto</span
                ><textarea class="input" name="body" [(ngModel)]="d.about.body" rows="4"></textarea>
              </label>
            </div>
            <h3>Cifras</h3>
            @for (s of d.about.stats; track $index; let i = $index) {
              <div class="row">
                <input
                  class="input small"
                  [name]="'sv' + i"
                  [(ngModel)]="s.value"
                  placeholder="+300"
                />
                <input
                  class="input"
                  [name]="'sl' + i"
                  [(ngModel)]="s.label"
                  placeholder="familias acompañadas"
                />
                <button
                  type="button"
                  class="icon-btn danger"
                  (click)="d.about.stats.splice(i, 1)"
                  aria-label="Quitar"
                >
                  <app-icon name="trash" [size]="17" />
                </button>
              </div>
            }
            <button
              type="button"
              class="btn btn-sm"
              (click)="d.about.stats.push({ value: '', label: '' })"
            >
              <app-icon name="plus" [size]="16" /> Agregar cifra
            </button>
            <h3>Valores</h3>
            @for (v of d.about.values; track $index; let i = $index) {
              <div class="item">
                <div class="row">
                  <input
                    class="input"
                    [name]="'vt' + i"
                    [(ngModel)]="v.title"
                    placeholder="Título"
                  />
                  <div class="color-picker">
                    @for (c of colors; track c) {
                      <button
                        type="button"
                        [attr.data-color]="c"
                        [attr.aria-pressed]="v.color === c"
                        (click)="v.color = c"
                        [attr.aria-label]="c"
                      ></button>
                    }
                  </div>
                  <button
                    type="button"
                    class="icon-btn danger"
                    (click)="d.about.values.splice(i, 1)"
                    aria-label="Quitar"
                  >
                    <app-icon name="trash" [size]="17" />
                  </button>
                </div>
                <input
                  class="input"
                  [name]="'vx' + i"
                  [(ngModel)]="v.text"
                  placeholder="Descripción"
                />
              </div>
            }
            <button
              type="button"
              class="btn btn-sm"
              (click)="d.about.values.push({ title: '', text: '', color: 'sky' })"
            >
              <app-icon name="plus" [size]="16" /> Agregar valor
            </button>
          }
          @case ('testimonials') {
            @for (t of d.testimonials; track $index; let i = $index) {
              <div class="item">
                <div class="row">
                  <input
                    class="input"
                    [name]="'tn' + i"
                    [(ngModel)]="t.name"
                    placeholder="Nombre"
                    required
                  />
                  <input
                    class="input"
                    [name]="'tr' + i"
                    [(ngModel)]="t.relation"
                    placeholder="Mamá de Mateo, 2 años"
                  />
                  <button
                    type="button"
                    class="icon-btn danger"
                    (click)="d.testimonials.splice(i, 1)"
                    aria-label="Quitar"
                  >
                    <app-icon name="trash" [size]="17" />
                  </button>
                </div>
                <textarea
                  class="input"
                  [name]="'tq' + i"
                  [(ngModel)]="t.quote"
                  rows="2"
                  placeholder="Testimonio"
                  required
                ></textarea>
              </div>
            }
            <button
              type="button"
              class="btn btn-sm"
              (click)="d.testimonials.push({ name: '', relation: '', quote: '' })"
            >
              <app-icon name="plus" [size]="16" /> Agregar testimonio
            </button>
          }
          @case ('faq') {
            @for (q of d.faq; track $index; let i = $index) {
              <div class="item">
                <div class="row">
                  <input
                    class="input"
                    [name]="'fq' + i"
                    [(ngModel)]="q.question"
                    placeholder="Pregunta"
                    required
                  />
                  <button
                    type="button"
                    class="icon-btn"
                    (click)="move(d.faq, i, -1)"
                    [disabled]="i === 0"
                    aria-label="Subir"
                  >
                    <app-icon name="chevron-down" [size]="17" style="transform: rotate(180deg)" />
                  </button>
                  <button
                    type="button"
                    class="icon-btn danger"
                    (click)="d.faq.splice(i, 1)"
                    aria-label="Quitar"
                  >
                    <app-icon name="trash" [size]="17" />
                  </button>
                </div>
                <textarea
                  class="input"
                  [name]="'fa' + i"
                  [(ngModel)]="q.answer"
                  rows="2"
                  placeholder="Respuesta"
                  required
                ></textarea>
              </div>
            }
            <button
              type="button"
              class="btn btn-sm"
              (click)="d.faq.push({ question: '', answer: '' })"
            >
              <app-icon name="plus" [size]="16" /> Agregar pregunta
            </button>
          }
          @case ('contact') {
            <div class="form-grid">
              <label class="field"
                ><span>Teléfono visible</span
                ><input class="input" name="phone" [(ngModel)]="d.contact.phone"
              /></label>
              <label class="field"
                ><span>WhatsApp (con código de país)</span
                ><input
                  class="input"
                  name="wa"
                  [(ngModel)]="d.contact.whatsapp"
                  required
                  pattern="[0-9+ ]+"
                /><small>Ej. 59170000000</small></label
              >
              <label class="field"
                ><span>Correo</span
                ><input class="input" type="email" name="email" [(ngModel)]="d.contact.email"
              /></label>
              <label class="field"
                ><span>Horario de atención</span
                ><input class="input" name="hours" [(ngModel)]="d.contact.hours"
              /></label>
              <label class="field"
                ><span>Dirección</span
                ><input class="input" name="address" [(ngModel)]="d.contact.address"
              /></label>
              <label class="field"
                ><span>Ciudad</span><input class="input" name="city" [(ngModel)]="d.contact.city"
              /></label>
              <label class="field"
                ><span>Facebook (URL)</span
                ><input class="input" type="url" name="fb" [(ngModel)]="d.contact.facebook"
              /></label>
              <label class="field"
                ><span>Instagram (URL)</span
                ><input class="input" type="url" name="ig" [(ngModel)]="d.contact.instagram"
              /></label>
              <label class="field"
                ><span>TikTok (URL)</span
                ><input class="input" type="url" name="tt" [(ngModel)]="d.contact.tiktok"
              /></label>
            </div>
          }
        }
        <footer class="actions">
          <button type="button" class="btn btn-ghost" (click)="reset()">Descartar cambios</button>
          <button
            class="btn btn-primary"
            type="submit"
            [disabled]="f.invalid || content.savingSection() !== null"
          >
            {{ content.savingSection() ? 'Publicando…' : 'Publicar sección' }}
          </button>
        </footer>
      </form>
    }
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
      overflow-x: auto;
      button {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1rem;
        border: 0;
        border-radius: 12px;
        background: transparent;
        font-weight: 700;
        color: var(--muted);
        cursor: pointer;
        white-space: nowrap;
      }
      button[aria-selected='true'] {
        background: var(--surface);
        color: var(--c-blue);
        box-shadow: var(--shadow-sm);
      }
    }
    form {
      display: grid;
      gap: 1rem;
    }
    h3 {
      font-size: 1.05rem;
      margin-top: 0.75rem;
    }
    .row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
      > .input {
        flex: 1;
        min-width: 160px;
      }
    }
    .small {
      max-width: 120px;
    }
    .item {
      display: grid;
      gap: 0.5rem;
      padding: 0.9rem;
      border-radius: var(--radius);
      background: var(--surface-2);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--line);
    }
  `,
})
export class ContentPage {
  protected readonly content = inject(LandingContentFacade);
  protected readonly tabs = TABS;
  protected readonly colors = BRAND_COLORS;
  protected readonly tab = signal<LandingSectionKey>('hero');
  /** Copia editable; se publica sección por sección. */
  protected readonly draft = signal<LandingContent | null>(null);

  constructor() {
    void this.content.load();
    effect(() => {
      // Solo al terminar la carga inicial: publicar una sección no debe pisar lo editado en otras.
      if (!this.content.loading() && untracked(this.draft) === null) {
        this.draft.set(structuredClone(untracked(this.content.content)));
      }
    });
  }

  protected reset() {
    const key = this.tab();
    const d = this.draft();
    if (d) this.draft.set({ ...d, [key]: structuredClone(this.content.content()[key]) });
  }

  protected move<T>(list: T[], i: number, delta: number) {
    const [item] = list.splice(i, 1);
    list.splice(i + delta, 0, item);
  }

  protected save() {
    const d = this.draft();
    if (!d) return;
    const key = this.tab();
    void this.content.save(key, structuredClone(d[key]));
  }
}
