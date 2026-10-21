import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-testimonials',
  imports: [Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (landing.content().testimonials.length) {
      <section class="section band">
        <div class="container">
          <header class="section-head" appReveal>
            <h2>Lo que dicen las familias</h2>
          </header>
          <div class="grid">
            @for (t of landing.content().testimonials; track t.name; let i = $index) {
              <figure class="quote" [appReveal]="i * 90">
                <div class="stars" aria-label="5 estrellas">
                  @for (s of [1, 2, 3, 4, 5]; track s) {
                    <app-icon name="star" [size]="16" />
                  }
                </div>
                <blockquote>“{{ t.quote }}”</blockquote>
                <figcaption>
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.relation }}</span>
                </figcaption>
              </figure>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: `
    .band {
      background: var(--brand-gradient);
      position: relative;
      overflow: hidden;
    }
    .band::before {
      content: '';
      position: absolute;
      inset: auto -10% -60% auto;
      width: 520px;
      height: 520px;
      border-radius: 50%;
      background: rgb(255 255 255 / 7%);
    }
    .section-head h2 {
      color: #fff;
    }
    .grid {
      position: relative;
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    }
    .quote {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: 1.6rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
    }
    .stars {
      display: flex;
      gap: 2px;
      color: var(--c-yellow);
    }
    :host ::ng-deep .stars svg {
      fill: currentColor;
    }
    blockquote {
      margin: 0;
      font-size: 1.05rem;
      color: var(--ink);
      font-weight: 600;
      flex: 1;
    }
    figcaption {
      display: grid;
      strong {
        color: var(--ink);
      }
      span {
        color: var(--muted);
        font-size: 0.88rem;
      }
    }
  `,
})
export class TestimonialsSection {
  protected readonly landing = inject(LandingFacade);
}
