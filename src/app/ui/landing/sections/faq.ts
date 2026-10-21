import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-faq',
  imports: [Icon, Reveal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container narrow">
        <header class="section-head" appReveal>
          <span class="eyebrow" data-color="sky"
            ><app-icon name="info" [size]="16" /> Preguntas frecuentes</span
          >
          <h2>Resolvemos tus dudas</h2>
        </header>
        <div class="list">
          @for (q of landing.content().faq; track q.question; let i = $index) {
            <details [attr.data-color]="colors[i % colors.length]" [appReveal]="i * 60">
              <summary>
                <span>{{ q.question }}</span>
                <app-icon name="plus" />
              </summary>
              <p>{{ q.answer }}</p>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .narrow {
      width: min(820px, 100% - 2rem);
    }
    .list {
      display: grid;
      gap: 0.75rem;
    }
    details {
      border-radius: var(--radius);
      border: 1.5px solid var(--line);
      background: var(--surface);
      transition:
        border-color 0.2s,
        box-shadow 0.2s;
      &[open] {
        border-color: var(--accent);
        box-shadow: var(--shadow-sm);
      }
      &[open] app-icon {
        transform: rotate(45deg);
        background: var(--accent);
        color: #fff;
      }
    }
    summary {
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      cursor: pointer;
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--ink);
      &::-webkit-details-marker {
        display: none;
      }
      app-icon {
        padding: 4px;
        border-radius: 50%;
        background: var(--accent-soft);
        color: var(--accent);
        transition:
          transform 0.25s var(--ease),
          background 0.2s;
      }
    }
    details p {
      padding: 0 1.25rem 1.2rem;
      color: var(--text);
    }
  `,
})
export class FaqSection {
  protected readonly landing = inject(LandingFacade);
  protected readonly colors = ['sky', 'pink', 'green', 'yellow', 'purple', 'red'];
}
