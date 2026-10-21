import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-landing-nav',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'onScroll()', '[class.scrolled]': 'scrolled()' },
  template: `
    <nav class="container bar" aria-label="Principal">
      <a href="#inicio" class="brand" (click)="open.set(false)">
        <img src="resources/logo.png" alt="Lluvia de Colores" width="176" height="62" />
      </a>

      <ul class="links" [class.open]="open()">
        @for (l of links; track l.href) {
          <li>
            <a [href]="l.href" (click)="open.set(false)">{{ l.label }}</a>
          </li>
        }
        <li class="mobile-only">
          <a
            class="btn btn-primary"
            [routerLink]="auth.isAuthenticated() ? auth.homeRoute() : '/login'"
          >
            <app-icon name="login" [size]="18" /> Ingresar
          </a>
        </li>
      </ul>

      <div class="actions">
        <a
          class="btn btn-primary desktop-only"
          [routerLink]="auth.isAuthenticated() ? auth.homeRoute() : '/login'"
        >
          <app-icon name="user" [size]="18" />
          {{ auth.isAuthenticated() ? 'Mi cuenta' : 'Ingresar' }}
        </a>
        <button
          class="icon-btn menu"
          (click)="open.set(!open())"
          [attr.aria-expanded]="open()"
          aria-label="Abrir menú"
        >
          <app-icon [name]="open() ? 'x' : 'menu'" [size]="24" />
        </button>
      </div>
    </nav>
  `,
  styles: `
    :host {
      position: sticky;
      top: 0;
      z-index: 50;
      display: block;
      background: rgb(255 255 255 / 82%);
      backdrop-filter: saturate(1.6) blur(14px);
      transition: box-shadow 0.3s;
    }
    :host(.scrolled) {
      box-shadow:
        0 1px 0 var(--line),
        0 10px 30px -18px rgb(19 33 63 / 35%);
    }
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      height: 72px;
    }
    .brand img {
      height: 46px;
      width: auto;
    }
    .links {
      display: flex;
      gap: 0.25rem;
      list-style: none;
      margin: 0;
      padding: 0;
      a:not(.btn) {
        display: block;
        padding: 0.5rem 0.8rem;
        border-radius: 999px;
        font-weight: 700;
        color: var(--text);
        text-decoration: none;
        transition:
          background 0.2s,
          color 0.2s;
        &:hover {
          background: var(--c-blue-soft);
          color: var(--c-blue);
        }
      }
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .menu,
    .mobile-only {
      display: none;
    }
    @media (max-width: 960px) {
      .menu {
        display: inline-grid;
      }
      .mobile-only {
        display: block;
        margin-top: 0.5rem;
        .btn {
          width: 100%;
        }
      }
      .desktop-only {
        display: none;
      }
      .links {
        position: absolute;
        inset: 72px 0 auto;
        flex-direction: column;
        padding: 1rem;
        background: var(--surface);
        box-shadow: var(--shadow-lg);
        transform: translateY(-8px);
        opacity: 0;
        pointer-events: none;
        transition: all 0.25s var(--ease);
        &.open {
          transform: none;
          opacity: 1;
          pointer-events: auto;
        }
        a:not(.btn) {
          padding: 0.8rem 1rem;
        }
      }
    }
  `,
})
export class LandingNav {
  protected readonly auth = inject(AuthFacade);
  protected readonly open = signal(false);
  protected readonly scrolled = signal(false);

  protected onScroll() {
    this.scrolled.set(window.scrollY > 12);
  }
  protected readonly links = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#nosotros', label: 'Nosotros' },
    { href: '#precios', label: 'Precios' },
    { href: '#calendario', label: 'Calendario' },
    { href: '#equipo', label: 'Equipo' },
    { href: '#contacto', label: 'Contacto' },
  ];
}
