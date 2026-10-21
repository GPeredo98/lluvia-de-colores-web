import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../core/application';
import { Icon } from '../shared/icon';

/**
 * Portal de familias — próxima entrega de la etapa 1
 * (asistencia de sus hijos y estado de cuotas). Las políticas RLS ya
 * restringen los datos al correo del padre/madre.
 */
@Component({
  selector: 'app-portal-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <div class="card box">
        <img src="resources/icon.png" alt="" width="96" height="96" />
        <h1>Hola, {{ auth.user()?.fullName || auth.user()?.email }}</h1>
        @if (auth.role() === 'teacher') {
          <p>
            Tus horarios y el registro de visitas con QR están en la
            <strong>app móvil de Lluvia de Colores</strong>.
          </p>
        } @else {
          <p>Muy pronto podrás ver aquí la asistencia de tus hijos y gestionar tus pagos.</p>
        }
        <div class="actions">
          <a routerLink="/" class="btn"><app-icon name="home" [size]="18" /> Ir al inicio</a>
          <button class="btn btn-ghost" (click)="logout()">
            <app-icon name="logout" [size]="18" /> Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  `,
  styles: `
    .wrap {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: var(--bg);
    }
    .box {
      max-width: 480px;
      padding: 2.5rem 2rem;
      text-align: center;
      display: grid;
      gap: 1rem;
      justify-items: center;
      border-radius: var(--radius-lg);
    }
    h1 {
      font-size: 1.8rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
  `,
})
export class PortalPage {
  protected readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  protected async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
