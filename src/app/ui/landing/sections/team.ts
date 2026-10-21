import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../../core/application';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-team',
  imports: [Icon, Reveal, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="equipo" class="section">
      <div class="container">
        <header class="section-head" appReveal>
          <span class="eyebrow" data-color="red"
            ><app-icon name="users" [size]="16" /> Nuestro equipo</span
          >
          <h2>Las personas que visitan tu casa</h2>
          <p>Profesionales formadas en desarrollo infantil, con vocación y mucha paciencia.</p>
        </header>

        <div class="grid">
          @for (m of landing.team(); track m.id; let i = $index) {
            <article class="member" [attr.data-color]="m.color" [appReveal]="i * 70">
              <div class="photo">
                <app-avatar
                  [name]="m.fullName"
                  [photo]="m.photoUrl"
                  [color]="m.color"
                  [size]="112"
                />
              </div>
              <h3>{{ m.fullName }}</h3>
              <p class="role">{{ m.roleTitle }}</p>
              <p class="bio">{{ m.bio }}</p>
              <div class="tags">
                @for (s of m.specialties; track s) {
                  <span class="badge plain">{{ s }}</span>
                }
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    }
    .member {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.35rem;
      padding: 1.75rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
      border: 1.5px solid var(--line);
      transition:
        transform 0.3s var(--ease),
        box-shadow 0.3s var(--ease);
      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow);
        .photo {
          transform: rotate(-6deg) scale(1.04);
        }
      }
      h3 {
        font-size: 1.2rem;
        margin-top: 0.6rem;
      }
    }
    .photo {
      padding: 6px;
      border-radius: 50%;
      background: conic-gradient(var(--accent), var(--accent-soft), var(--accent));
      transition: transform 0.4s var(--ease);
      app-avatar {
        border: 4px solid var(--surface);
      }
    }
    .role {
      font-weight: 800;
      color: var(--accent-ink, var(--accent));
      font-size: 0.9rem;
    }
    .bio {
      color: var(--muted);
      font-size: 0.92rem;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }
  `,
})
export class TeamSection {
  protected readonly landing = inject(LandingFacade);
}
