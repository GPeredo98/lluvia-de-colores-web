import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { MODALITY_LABELS, PRICE_PERIOD_LABELS } from '../../../core/domain/models';
import { ageRangeLabel } from '../../../core/domain/time';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-programs',
  imports: [Icon, Modal, Reveal, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="servicios" class="section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="eyebrow" data-color="sky"
            ><app-icon name="star" [size]="16" /> Nuestros servicios</span
          >
          <h2>Un programa para cada etapa</h2>
          <p>Elige la edad de tu hijo y descubre cómo lo acompañamos.</p>
        </header>

        <div class="filters" role="group" aria-label="Filtrar por edad">
          <button
            class="chip"
            [attr.aria-pressed]="landing.ageGroup() === null"
            (click)="landing.selectAgeGroup(null)"
          >
            Todas las edades
          </button>
          @for (g of landing.ageGroups; track g.id) {
            <button
              class="chip"
              [attr.aria-pressed]="landing.ageGroup() === g.id"
              (click)="landing.selectAgeGroup(g.id)"
            >
              {{ g.label }} <small>· {{ g.hint }}</small>
            </button>
          }
        </div>

        <div class="grid">
          @for (p of landing.filteredPrograms(); track p.id; let i = $index) {
            <article class="program" [attr.data-color]="p.color" [appReveal]="i * 70">
              <div class="badge-icon"><app-icon [name]="p.icon" [size]="30" /></div>
              <h3>{{ p.name }}</h3>
              <p>{{ p.summary }}</p>
              <ul class="meta">
                <li>
                  <app-icon name="baby" [size]="16" />
                  {{ ageRange(p.ageMinMonths, p.ageMaxMonths) }}
                </li>
                <li><app-icon name="home" [size]="16" /> {{ modality[p.modality] }}</li>
                <li>
                  <app-icon name="clock" [size]="16" /> {{ p.sessionsPerWeek }}× semana ·
                  {{ p.sessionMinutes }} min
                </li>
              </ul>
              <button class="more" (click)="landing.openProgram(p.id)">
                Ver detalle <app-icon name="arrow-right" [size]="16" />
              </button>
            </article>
          } @empty {
            @if (landing.loaded()) {
              <div class="empty span-all">
                <app-icon name="search" [size]="40" />
                <strong>Pronto tendremos un programa para esta edad</strong>
                <span>Escríbenos y te orientamos.</span>
              </div>
            } @else {
              @for (s of [1, 2, 3]; track s) {
                <div class="skeleton" style="height: 300px"></div>
              }
            }
          }
        </div>
      </div>
    </section>

    @if (landing.selectedProgram(); as p) {
      <app-modal
        [open]="true"
        [title]="p.name"
        [subtitle]="p.summary"
        (closed)="landing.closeProgram()"
      >
        <div class="detail" [attr.data-color]="p.color">
          <p>{{ p.description }}</p>
          <div class="facts">
            <div>
              <span>Edad</span><strong>{{ ageRange(p.ageMinMonths, p.ageMaxMonths) }}</strong>
            </div>
            <div>
              <span>Modalidad</span><strong>{{ modality[p.modality] }}</strong>
            </div>
            <div>
              <span>Frecuencia</span><strong>{{ p.sessionsPerWeek }} por semana</strong>
            </div>
            <div>
              <span>Duración</span><strong>{{ p.sessionMinutes }} min</strong>
            </div>
          </div>
          @if (p.features.length) {
            <h4>Incluye</h4>
            <ul class="features">
              @for (f of p.features; track f) {
                <li><app-icon name="check" [size]="18" /> {{ f }}</li>
              }
            </ul>
          }
          <div class="price">
            <strong>{{ p.price | currency: p.currency : 'symbol' : '1.0-0' }}</strong>
            <span>{{ period[p.pricePeriod] }}</span>
          </div>
        </div>
        <div modal-footer>
          <a href="#precios" class="btn btn-ghost" (click)="landing.closeProgram()"
            >Comparar precios</a
          >
          <a
            class="btn btn-primary"
            target="_blank"
            rel="noopener"
            [href]="
              landing.whatsappLink(
                '¡Hola! Me interesa el programa ' + p.name + '. ¿Tienen cupos disponibles?'
              )
            "
          >
            <app-icon name="message" [size]="18" /> Quiero inscribirlo
          </a>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2.5rem;
    }
    .chip small {
      font-weight: 600;
      opacity: 0.75;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.25rem;
      > * {
        flex: 1 1 260px;
        max-width: 360px;
      }
    }
    .span-all {
      flex-basis: 100%;
      max-width: none;
    }
    .program {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 1.6rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      border: 1.5px solid var(--line);
      overflow: hidden;
      transition:
        transform 0.35s var(--ease),
        box-shadow 0.35s var(--ease),
        border-color 0.35s;
      &::after {
        content: '';
        position: absolute;
        right: -50px;
        top: -50px;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: var(--accent-soft);
        transition: transform 0.5s var(--ease);
      }
      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-lg);
        border-color: var(--accent);
        &::after {
          transform: scale(1.5);
        }
      }
      > * {
        position: relative;
        z-index: 1;
      }
      h3 {
        font-size: 1.4rem;
      }
      > p {
        color: var(--muted);
      }
    }
    .badge-icon {
      display: grid;
      place-items: center;
      width: 60px;
      height: 60px;
      border-radius: 0 50% 50% 50%;
      transform: rotate(45deg);
      background: var(--accent);
      color: #fff;
      margin: 0.4rem 0 0.6rem 0.4rem;
      app-icon {
        transform: rotate(-45deg);
      }
    }
    .meta {
      list-style: none;
      padding: 0;
      margin: 0.4rem 0 0;
      display: grid;
      gap: 0.35rem;
      font-size: 0.9rem;
      font-weight: 600;
      li {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      app-icon {
        color: var(--accent);
      }
    }
    .more {
      margin-top: auto;
      padding-top: 0.8rem;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 0;
      background: none;
      font-weight: 800;
      color: var(--accent-ink, var(--accent));
      cursor: pointer;
      &:hover app-icon {
        transform: translateX(3px);
      }
      app-icon {
        transition: transform 0.2s;
      }
    }
    .detail {
      display: grid;
      gap: 1rem;
      h4 {
        font-size: 1rem;
      }
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.6rem;
      div {
        padding: 0.75rem;
        border-radius: var(--radius-sm);
        background: var(--accent-soft);
        display: grid;
      }
      span {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--muted);
      }
      strong {
        color: var(--ink);
      }
    }
    .features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.4rem;
      li {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        font-weight: 600;
      }
      app-icon {
        color: var(--accent);
      }
    }
    .price {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      strong {
        font-family: var(--font-display);
        font-size: 2rem;
        color: var(--ink);
      }
      span {
        color: var(--muted);
        font-weight: 700;
      }
    }
  `,
})
export class ProgramsSection {
  protected readonly landing = inject(LandingFacade);
  protected readonly modality = MODALITY_LABELS;
  protected readonly period = PRICE_PERIOD_LABELS;
  protected readonly ageRange = ageRangeLabel;
}
