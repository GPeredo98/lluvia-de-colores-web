import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/application';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <section class="panel">
        <a routerLink="/" class="back"
          ><app-icon name="chevron-left" [size]="18" /> Volver al inicio</a
        >
        <img
          src="resources/logo.png"
          alt="Lluvia de Colores"
          class="logo"
          width="230"
          height="80"
        />
        <h1>Bienvenido</h1>
        <p class="muted">Ingresa para ver la asistencia, horarios y pagos.</p>

        <form #f="ngForm" (ngSubmit)="submit()" class="form">
          <label class="field">
            <span>Correo electrónico</span>
            <input
              class="input"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              autocomplete="email"
              (input)="auth.clearError()"
            />
          </label>
          <label class="field">
            <span>Contraseña</span>
            <div class="pass">
              <input
                class="input"
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                autocomplete="current-password"
                (input)="auth.clearError()"
              />
              <button
                type="button"
                class="icon-btn"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18" />
              </button>
            </div>
          </label>

          @if (auth.error()) {
            <p class="error" role="alert">
              <app-icon name="alert" [size]="18" /> {{ auth.error() }}
            </p>
          }

          <button
            class="btn btn-primary btn-lg"
            type="submit"
            [disabled]="f.invalid || auth.busy()"
          >
            {{ auth.busy() ? 'Ingresando…' : 'Ingresar' }}
          </button>
          <button type="button" class="link" (click)="auth.sendPasswordReset(email)">
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        @if (auth.demoMode) {
          <div class="demo">
            <strong><app-icon name="info" [size]="16" /> Modo demo (sin Supabase)</strong>
            <p>Contraseña <code>demo1234</code> para:</p>
            <div class="demo-users">
              @for (u of demoUsers; track u.email) {
                <button type="button" class="chip" (click)="fill(u.email)">{{ u.label }}</button>
              }
            </div>
          </div>
        }
      </section>
      <aside class="art" aria-hidden="true">
        <img src="resources/icon.png" alt="" width="300" height="300" />
        <p>Cada visita, registrada.<br />Cada avance, a la vista.</p>
      </aside>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100dvh;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      background: var(--surface);
    }
    .panel {
      width: min(440px, 100% - 2rem);
      margin: auto;
      padding-block: 2rem;
      display: grid;
      gap: 0.75rem;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 0.2rem;
      font-weight: 700;
      text-decoration: none;
      color: var(--muted);
      justify-self: start;
    }
    .logo {
      height: 70px;
      width: auto;
      margin: 1rem 0 0.5rem;
    }
    h1 {
      font-size: 2.2rem;
    }
    .muted {
      color: var(--muted);
    }
    .form {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }
    .pass {
      position: relative;
      .icon-btn {
        position: absolute;
        right: 4px;
        top: 3px;
      }
      .input {
        padding-right: 2.75rem;
      }
    }
    .error {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-sm);
      background: var(--c-red-soft);
      color: var(--c-red);
      font-weight: 700;
      font-size: 0.92rem;
    }
    .link {
      justify-self: center;
      border: 0;
      background: none;
      color: var(--c-blue);
      font-weight: 700;
      cursor: pointer;
    }
    .demo {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: var(--radius);
      background: var(--c-yellow-soft);
      font-size: 0.9rem;
      display: grid;
      gap: 0.4rem;
      strong {
        display: flex;
        gap: 0.35rem;
        align-items: center;
        color: var(--ink);
      }
    }
    .demo-users {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      .chip {
        font-size: 0.82rem;
        padding: 0.3rem 0.7rem;
      }
    }
    .art {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 2rem;
      background:
        radial-gradient(circle at 30% 20%, rgb(255 255 255 / 25%), transparent 50%),
        var(--brand-gradient);
      color: #fff;
      text-align: center;
      img {
        width: 260px;
        height: auto;
        filter: drop-shadow(0 24px 40px rgb(0 0 0 / 25%));
        animation: bob 5s ease-in-out infinite;
      }
      p {
        font-family: var(--font-display);
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1.2;
      }
    }
    @keyframes bob {
      50% {
        transform: translateY(-12px);
      }
    }
    @media (max-width: 860px) {
      .wrap {
        grid-template-columns: 1fr;
      }
      .art {
        display: none;
      }
    }
  `,
})
export class LoginPage {
  protected readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  /** ?redirect=/admin/asistencia (con withComponentInputBinding). */
  readonly redirect = input<string>();

  protected email = '';
  protected password = '';
  protected readonly showPassword = signal(false);
  protected readonly demoUsers = [
    { label: 'Administrador', email: 'admin@demo.com' },
    { label: 'Padre', email: 'padre@demo.com' },
    { label: 'Estimuladora', email: 'ana@lluviadecolores.com' },
  ];

  protected fill(email: string) {
    this.email = email;
    this.password = 'demo1234';
    this.auth.clearError();
  }

  protected async submit() {
    if (await this.auth.signIn({ email: this.email, password: this.password })) {
      const target = this.redirect();
      await this.router.navigateByUrl(target?.startsWith('/') ? target : this.auth.homeRoute());
    }
  }
}
