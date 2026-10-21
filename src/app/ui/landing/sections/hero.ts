import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';

/** Posiciones fijas (no aleatorias) para que SSR e hidratación coincidan. */
const RAIN = [
  { x: 6, d: 0, t: 5.5, c: 'red', s: 14 },
  { x: 16, d: 2.1, t: 6.5, c: 'yellow', s: 10 },
  { x: 27, d: 1.2, t: 5.8, c: 'green', s: 16 },
  { x: 38, d: 3.4, t: 7, c: 'pink', s: 11 },
  { x: 49, d: 0.6, t: 6.2, c: 'purple', s: 14 },
  { x: 61, d: 2.8, t: 5.4, c: 'sky', s: 12 },
  { x: 72, d: 1.6, t: 6.8, c: 'red', s: 10 },
  { x: 83, d: 3.9, t: 5.9, c: 'yellow', s: 15 },
  { x: 92, d: 0.9, t: 6.6, c: 'green', s: 11 },
];

@Component({
  selector: 'app-hero',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let hero = landing.content().hero;
    <section id="inicio" class="hero">
      <div class="rain" aria-hidden="true">
        @for (r of rain; track $index) {
          <span
            class="drop"
            [attr.data-color]="r.c"
            [style.left.%]="r.x"
            [style.--s]="r.s + 'px'"
            [style.animation-delay.s]="r.d"
            [style.animation-duration.s]="r.t"
          ></span>
        }
      </div>

      <div class="container grid">
        <div class="copy">
          <span class="eyebrow" data-color="pink"
            ><app-icon name="sparkles" [size]="16" /> {{ hero.eyebrow }}</span
          >
          <h1>
            {{ hero.title }}
            <span class="text-gradient">{{ hero.highlight }}</span>
          </h1>
          <p class="lead">{{ hero.subtitle }}</p>

          <div class="ctas">
            <a href="#servicios" class="btn btn-primary btn-lg">
              {{ hero.ctaPrimary }} <app-icon name="arrow-right" [size]="18" />
            </a>
            <a
              class="btn btn-lg"
              target="_blank"
              rel="noopener"
              [href]="
                landing.whatsappLink(
                  '¡Hola! Quiero información sobre los servicios de Lluvia de Colores.'
                )
              "
            >
              <app-icon name="message" [size]="18" /> {{ hero.ctaSecondary }}
            </a>
          </div>

          <div class="age-pick">
            <span>¿Qué edad tiene tu hijo?</span>
            <div class="chips">
              @for (g of landing.ageGroups; track g.id; let i = $index) {
                <a
                  href="#servicios"
                  class="chip"
                  [attr.data-color]="chipColors[i]"
                  (click)="landing.selectAgeGroup(g.id)"
                >
                  {{ g.label }}
                </a>
              }
            </div>
          </div>
        </div>

        <div class="art" aria-hidden="true">
          <div class="blob"></div>
          <img class="cloud" src="images/kid-paint-photo.jpg" alt="" width="300" height="300" />
          @for (s of landing.content().about.stats.slice(0, 3); track s.label; let i = $index) {
            <div [class]="'float-card f' + i" [attr.data-color]="cardColors[i]">
              <strong>{{ s.value }}</strong>
              <span>{{ s.label }}</span>
            </div>
          }
        </div>
      </div>
      <div class="rainbow-line"></div>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      overflow: hidden;
      padding-block: clamp(3rem, 7vw, 6rem) clamp(4rem, 8vw, 6.5rem);
      background:
        radial-gradient(60% 60% at 85% 20%, var(--c-sky-soft) 0%, transparent 70%),
        radial-gradient(50% 50% at 5% 90%, var(--c-pink-soft) 0%, transparent 70%), var(--surface);
    }
    .rain {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .rain .drop {
      position: absolute;
      top: -30px;
      opacity: 0.55;
      animation: fall linear infinite;
    }
    @keyframes fall {
      from {
        transform: translateY(-40px) rotate(45deg);
      }
      to {
        transform: translateY(110vh) rotate(45deg);
      }
    }
    .grid {
      position: relative;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: center;
      gap: 3rem;
    }
    h1 {
      font-size: clamp(2.4rem, 5.6vw, 4.2rem);
      font-weight: 800;
      letter-spacing: -0.01em;
      span {
        display: block;
      }
    }
    .lead {
      margin-top: 1.25rem;
      font-size: clamp(1.05rem, 1.6vw, 1.22rem);
      max-width: 560px;
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      margin-top: 2rem;
    }
    .age-pick {
      margin-top: 2.25rem;
      > span {
        display: block;
        font-weight: 800;
        color: var(--ink);
        margin-bottom: 0.6rem;
      }
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      text-decoration: none;
      color: var(--ink);
      &:hover {
        background: var(--accent-soft);
      }
    }
    .art {
      position: relative;
      aspect-ratio: 1;
      max-width: 460px;
      justify-self: center;
      width: 100%;
    }
    .blob {
      position: absolute;
      inset: 8%;
      border-radius: 42% 58% 55% 45% / 48% 42% 58% 52%;
      background: linear-gradient(
        140deg,
        var(--c-sky-soft),
        var(--c-blue-soft) 60%,
        var(--c-purple-soft)
      );
      animation: morph 12s ease-in-out infinite alternate;
    }
    @keyframes morph {
      to {
        border-radius: 58% 42% 45% 55% / 42% 58% 42% 58%;
        transform: rotate(8deg);
      }
    }
    .cloud {
      border-radius: 50%;
      position: absolute;
      inset: 13%;
      width: 85%;
      height: auto;
      filter: drop-shadow(0 24px 30px rgb(21 101 216 / 22%));
      animation: bob 5s ease-in-out infinite;
    }
    @keyframes bob {
      50% {
        transform: translateY(-14px);
      }
    }
    .float-card {
      position: absolute;
      display: grid;
      padding: 0.7rem 1rem;
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border-left: 4px solid var(--accent);
      animation: bob 6s ease-in-out infinite;
      strong {
        font-family: var(--font-display);
        font-size: 1.5rem;
        line-height: 1;
        color: var(--ink);
      }
      span {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--muted);
      }
    }
    .f0 {
      top: 6%;
      left: -4%;
    }
    .f1 {
      top: 44%;
      right: -6%;
      animation-delay: -2s;
    }
    .f2 {
      bottom: 4%;
      left: 8%;
      animation-delay: -4s;
    }
    .rainbow-line {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: var(--rain-gradient);
    }
    @media (max-width: 880px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .art {
        max-width: 340px;
        order: -1;
      }
      .f1 {
        right: 0;
      }
      .f0 {
        left: 0;
      }
    }
  `,
})
export class HeroSection {
  protected readonly landing = inject(LandingFacade);
  protected readonly rain = RAIN;
  protected readonly chipColors = ['sky', 'yellow', 'pink', 'green'];
  protected readonly cardColors = ['yellow', 'green', 'pink'];
}
