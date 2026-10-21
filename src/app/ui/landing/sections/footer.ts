import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-landing-footer',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = landing.content().contact;
    <footer>
      <div class="rainbow"></div>
      <div class="container cols">
        <div class="brand">
          <img
            src="resources/logo-white.png"
            alt="Lluvia de Colores"
            width="200"
            height="70"
            loading="lazy"
          />
          <p>Servicios de estimulación infantil y apoyo escolar.</p>
        </div>
        <nav aria-label="Secciones">
          <h4>Explora</h4>
          <a href="#servicios">Servicios</a>
          <a href="#precios">Precios</a>
          <a href="#calendario">Calendario</a>
          <a href="#equipo">Equipo</a>
        </nav>
        <nav aria-label="Redes y acceso">
          <h4>Síguenos</h4>
          @if (c.facebook) {
            <a [href]="c.facebook" target="_blank" rel="noopener">Facebook</a>
          }
          @if (c.instagram) {
            <a [href]="c.instagram" target="_blank" rel="noopener">Instagram</a>
          }
          @if (c.tiktok) {
            <a [href]="c.tiktok" target="_blank" rel="noopener">TikTok</a>
          }
          <a [href]="landing.whatsappLink('¡Hola!')" target="_blank" rel="noopener">WhatsApp</a>
          <a routerLink="/login"
            ><app-icon name="login" [size]="16" /> Acceso familias y personal</a
          >
        </nav>
      </div>
      <p class="container copy">© {{ year }} Lluvia de Colores · {{ c.city }}</p>
    </footer>
  `,
  styles: `
    footer {
      background: var(--ink);
      color: rgb(255 255 255 / 75%);
      position: relative;
    }
    .rainbow {
      height: 6px;
      background: var(--rain-gradient);
    }
    .cols {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 2rem;
      padding-block: 3.5rem 2rem;
    }
    .brand img {
      height: 82px;
      width: auto;
      border-radius: 16px;
    }
    .brand p {
      margin-top: 1rem;
      max-width: 320px;
    }
    nav {
      display: grid;
      gap: 0.5rem;
      align-content: start;
    }
    h4 {
      color: #fff;
      font-size: 1.05rem;
      margin-bottom: 0.25rem;
    }
    a {
      color: inherit;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      &:hover {
        color: #fff;
      }
    }
    .copy {
      padding-block: 1.25rem;
      border-top: 1px solid rgb(255 255 255 / 10%);
      font-size: 0.88rem;
    }
    @media (max-width: 720px) {
      .cols {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LandingFooter {
  protected readonly landing = inject(LandingFacade);
  protected readonly year = new Date().getFullYear();
}
