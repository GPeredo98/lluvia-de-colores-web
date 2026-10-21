import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-about',
  imports: [Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let about = landing.content().about;
    <section id="nosotros" class="section about">
      <div class="container grid">
        <div class="copy" appReveal>
          <span class="eyebrow" data-color="green"
            ><app-icon name="heart" [size]="16" /> Quiénes somos</span
          >
          <h2>{{ about.title }}</h2>
          <p>{{ about.body }}</p>
          <dl class="stats">
            @for (s of about.stats; track s.label) {
              <div>
                <dt>{{ s.label }}</dt>
                <dd>{{ s.value }}</dd>
              </div>
            }
          </dl>
        </div>

        <div class="values">
          @for (v of about.values; track v.title; let i = $index) {
            <article class="value" [attr.data-color]="v.color" [appReveal]="i * 90">
              <span class="drop" style="--s: 18px"></span>
              <div>
                <h3>{{ v.title }}</h3>
                <p>{{ v.text }}</p>
              </div>
            </article>
          }
          <article class="value qr" data-color="blue" [appReveal]="about.values.length * 90">
            <app-icon name="qr" [size]="26" />
            <div>
              <h3>Cada visita queda registrada</h3>
              <p>
                La estimuladora escanea un código QR al llegar y al salir. Tú ves los horarios desde
                tu cuenta.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: `
    .about {
      background: var(--bg);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(2rem, 6vw, 5rem);
      align-items: center;
    }
    h2 {
      font-size: clamp(2rem, 4vw, 2.8rem);
    }
    .copy > p {
      margin-top: 1rem;
      font-size: 1.1rem;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin: 2rem 0 0;
      div {
        display: flex;
        flex-direction: column-reverse;
      }
      dd {
        margin: 0;
        font-family: var(--font-display);
        font-size: 2.6rem;
        font-weight: 800;
        line-height: 1;
      }
      div:nth-child(1) dd {
        color: var(--c-blue);
      }
      div:nth-child(2) dd {
        color: var(--c-pink);
      }
      div:nth-child(3) dd {
        color: var(--c-green);
      }
      dt {
        font-weight: 700;
        color: var(--muted);
        font-size: 0.9rem;
      }
    }
    .values {
      display: grid;
      gap: 1rem;
    }
    .value {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1.25rem 1.4rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--line);
      transition: transform 0.3s var(--ease);
      &:hover {
        transform: translateX(6px);
      }
      .drop {
        margin-top: 0.4rem;
        flex: none;
      }
      h3 {
        font-size: 1.15rem;
      }
      p {
        color: var(--muted);
        font-size: 0.95rem;
      }
    }
    .qr {
      background: var(--brand-gradient);
      border: 0;
      app-icon {
        color: #fff;
      }
      h3,
      p {
        color: #fff;
      }
      p {
        opacity: 0.9;
      }
    }
    @media (max-width: 880px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AboutSection {
  protected readonly landing = inject(LandingFacade);
}
