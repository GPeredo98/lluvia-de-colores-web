import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../core/application';
import { Icon } from '../shared/icon';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.nav-open]="navOpen()">
      <aside class="sidebar no-print">
        <a routerLink="/admin" class="brand">
          <img src="resources/logo.png" alt="Lluvia de Colores" width="170" height="60" />
        </a>
        <nav>
          @for (group of groups; track group.title) {
            <p class="group">{{ group.title }}</p>
            @for (item of group.items; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                (click)="navOpen.set(false)"
              >
                <app-icon [name]="item.icon" [size]="19" />
                {{ item.label }}
              </a>
            }
          }
        </nav>
        <a routerLink="/" class="site" target="_blank">
          <app-icon name="external" [size]="16" /> Ver página pública
        </a>
      </aside>
      <div class="scrim" (click)="navOpen.set(false)"></div>

      <div class="main">
        <header class="topbar no-print">
          <button class="icon-btn menu" (click)="navOpen.set(true)" aria-label="Abrir menú">
            <app-icon name="menu" [size]="22" />
          </button>
          @if (auth.demoMode) {
            <span class="demo" data-color="yellow">
              <app-icon name="info" [size]="16" /> Modo demo · datos de ejemplo guardados en este
              navegador
            </span>
          }
          <div class="grow"></div>
          <div class="user">
            <span class="avatar">{{ auth.initials() }}</span>
            <div class="who">
              <strong>{{ auth.user()?.fullName }}</strong>
              <small>{{ auth.user()?.email }}</small>
            </div>
            <button
              class="icon-btn"
              (click)="logout()"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <app-icon name="logout" [size]="19" />
            </button>
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      min-height: 100dvh;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1.25rem 0.9rem;
      background: var(--surface);
      border-right: 1px solid var(--line);
      overflow-y: auto;
    }
    .brand {
      padding: 0 0.5rem 0.75rem;
      img {
        height: 48px;
        width: auto;
      }
    }
    nav {
      display: grid;
      gap: 2px;
    }
    .group {
      margin: 1rem 0.75rem 0.35rem;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.6rem 0.75rem;
      border-radius: 12px;
      color: var(--text);
      font-weight: 700;
      text-decoration: none;
      transition:
        background 0.15s,
        color 0.15s;
      &:hover {
        background: var(--surface-2);
        color: var(--ink);
      }
      &.active {
        background: var(--c-blue-soft);
        color: var(--c-blue);
      }
    }
    .site {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
      color: var(--muted);
    }
    .scrim {
      display: none;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      height: 64px;
      padding: 0 clamp(1rem, 3vw, 2rem);
      background: rgb(246 248 252 / 85%);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--line);
    }
    .grow {
      flex: 1;
    }
    .demo {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent-ink);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .user {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--brand-gradient);
      color: #fff;
      font-weight: 800;
      font-size: 0.85rem;
    }
    .who {
      display: grid;
      line-height: 1.2;
      strong {
        color: var(--ink);
        font-size: 0.9rem;
      }
      small {
        color: var(--muted);
        font-size: 0.78rem;
      }
    }
    .content {
      padding: clamp(1rem, 3vw, 2rem);
      max-width: 1400px;
    }
    .menu {
      display: none;
    }
    @media (max-width: 1024px) {
      .shell {
        grid-template-columns: minmax(0, 1fr);
      }
      .sidebar {
        position: fixed;
        z-index: 60;
        left: 0;
        width: 270px;
        transform: translateX(-100%);
        transition: transform 0.3s var(--ease);
        box-shadow: var(--shadow-lg);
      }
      .nav-open .sidebar {
        transform: none;
      }
      .nav-open .scrim {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 55;
        background: rgb(19 33 63 / 40%);
      }
      .menu {
        display: inline-grid;
      }
      .who,
      .demo {
        display: none;
      }
    }
    @media print {
      .shell {
        display: block;
      }
      .content {
        padding: 0;
      }
    }
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  protected readonly navOpen = signal(false);

  protected readonly groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Operación',
      items: [
        { path: '/admin', label: 'Resumen', icon: 'grid', exact: true },
        { path: '/admin/asistencia', label: 'Asistencia', icon: 'clipboard' },
        { path: '/admin/horarios', label: 'Horarios', icon: 'clock' },
        { path: '/admin/pagos', label: 'Pagos', icon: 'card' },
      ],
    },
    {
      title: 'Gestión',
      items: [
        { path: '/admin/estudiantes', label: 'Estudiantes', icon: 'school' },
        { path: '/admin/estimuladoras', label: 'Estimuladoras', icon: 'users' },
        { path: '/admin/programas', label: 'Programas', icon: 'puzzle' },
        { path: '/admin/usuarios', label: 'Usuarios', icon: 'shield' },
      ],
    },
    {
      title: 'Página web',
      items: [
        { path: '/admin/contenido', label: 'Contenido', icon: 'layout' },
        { path: '/admin/calendario', label: 'Calendario', icon: 'calendar' },
      ],
    },
  ];

  protected async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
