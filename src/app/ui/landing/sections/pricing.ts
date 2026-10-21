import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-pricing',
  imports: [Icon, Reveal, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="precios" class="section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="eyebrow" data-color="yellow"
            ><app-icon name="card" [size]="16" /> Precios claros</span
          >
          <h2>Invierte en sus primeros años</h2>
          <p>
            Sin matrícula escondida. Puedes ver el costo mensual o lo que representa cada sesión.
          </p>
        </header>

        <div class="toggle">
          <div class="segmented" role="group" aria-label="Ver precio">
            <button
              [attr.aria-pressed]="landing.priceMode() === 'mensual'"
              (click)="landing.setPriceMode('mensual')"
            >
              Por mes
            </button>
            <button
              [attr.aria-pressed]="landing.priceMode() === 'sesion'"
              (click)="landing.setPriceMode('sesion')"
            >
              Por sesión
            </button>
          </div>
        </div>

        <div class="plans">
          @for (item of landing.pricedPrograms(); track item.program.id; let i = $index) {
            @let p = item.program;
            <article
              class="plan"
              [class.featured]="p.isFeatured"
              [attr.data-color]="p.color"
              [appReveal]="i * 70"
            >
              @if (p.isFeatured) {
                <span class="ribbon">Más elegido</span>
              }
              <h3>{{ p.name }}</h3>
              <div class="amount">
                <strong>
                  {{
                    (landing.priceMode() === 'mensual' ? item.monthly : item.perSession)
                      | currency: p.currency : 'symbol' : '1.0-0'
                  }}
                </strong>
                <span>/ {{ landing.priceMode() === 'mensual' ? 'mes' : 'sesión' }}</span>
              </div>
              <p class="calc">
                {{ item.sessionsPerMonth }} sesiones al mes de {{ p.sessionMinutes }} min
              </p>
              <ul>
                @for (f of p.features; track f) {
                  <li><app-icon name="check" [size]="18" /> {{ f }}</li>
                }
              </ul>
              <a
                class="btn"
                [class.btn-primary]="p.isFeatured"
                target="_blank"
                rel="noopener"
                [href]="
                  landing.whatsappLink('¡Hola! Quiero inscribir a mi hijo en ' + p.name + '.')
                "
              >
                Reservar cupo
              </a>
            </article>
          }
        </div>

        <p class="note">
          <app-icon name="shield" [size]="18" />
          Muy pronto podrás pagar las mensualidades directamente desde tu cuenta, sin transferir a
          la profesora.
        </p>
      </div>
    </section>
  `,
  styles: `
    .toggle {
      display: flex;
      justify-content: center;
      margin: -1rem 0 2.5rem;
    }
    .plans {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.25rem;
      > * {
        flex: 1 1 210px;
        max-width: 280px;
      }
    }
    .plan {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.75rem 1.4rem 1.4rem;
      border-radius: var(--radius-lg);
      border: 1.5px solid var(--line);
      background: var(--surface);
      border-top: 6px solid var(--accent);
      transition:
        transform 0.3s var(--ease),
        box-shadow 0.3s var(--ease);
      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow);
      }
      h3 {
        font-size: 1.2rem;
      }
      ul {
        list-style: none;
        margin: 0.25rem 0 0.5rem;
        padding: 0;
        display: grid;
        gap: 0.45rem;
        font-size: 0.92rem;
      }
      li {
        display: flex;
        gap: 0.45rem;
        align-items: flex-start;
      }
      li app-icon {
        color: var(--accent);
        margin-top: 2px;
      }
      .btn {
        margin-top: auto;
      }
    }
    .featured {
      box-shadow: var(--shadow-lg);
      border-color: var(--accent);
      background: linear-gradient(180deg, var(--accent-soft), var(--surface) 45%);
    }
    .ribbon {
      position: absolute;
      top: -14px;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .amount {
      display: flex;
      align-items: baseline;
      gap: 0.3rem;
      strong {
        font-family: var(--font-display);
        font-size: 2.3rem;
        color: var(--ink);
        line-height: 1;
      }
      span {
        color: var(--muted);
        font-weight: 700;
      }
    }
    .calc {
      font-size: 0.85rem;
      color: var(--muted);
      font-weight: 600;
    }
    .note {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      color: var(--muted);
      font-weight: 600;
      text-align: center;
      app-icon {
        color: var(--c-green);
      }
    }
  `,
})
export class PricingSection {
  protected readonly landing = inject(LandingFacade);
}
