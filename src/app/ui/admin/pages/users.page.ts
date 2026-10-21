import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthFacade, UsersFacade } from '../../../core/application';
import { ROLE_LABELS, UserProfile, UserRole } from '../../../core/domain/models';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-users-page',
  imports: [Icon, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = users.counts();
    <header class="page-head">
      <div>
        <h1>Usuarios</h1>
        <p>Cuentas que ingresan a la plataforma. El rol se asigna solo al registrarse.</p>
      </div>
    </header>

    <div class="info card card-pad">
      <app-icon name="info" [size]="20" />
      <div>
        <strong>¿Cómo se crean las cuentas?</strong>
        <p>
          Cada persona se registra con su correo. Si el correo coincide con una estimuladora queda
          como
          <b>Estimuladora</b> (y puede marcar asistencia en la app); si no, como
          <b>Padre / madre</b> y ve a los estudiantes registrados con ese correo. Aquí puedes
          cambiar el rol, por ejemplo para dar acceso de administrador.
        </p>
      </div>
    </div>

    <section class="stat-grid">
      @for (r of roles; track r) {
        <article class="card stat">
          <span class="stat-label">{{ labels[r] }}</span
          ><span class="stat-value">{{ c[r] }}</span>
        </article>
      }
    </section>

    <div class="toolbar" style="margin-bottom: 1rem">
      <input
        class="input"
        style="max-width: 360px"
        placeholder="Buscar por nombre o correo"
        [value]="users.query()"
        (input)="users.setQuery($any($event.target).value)"
      />
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users.users(); track u.id) {
            <tr>
              <td>
                <div class="who">
                  <app-avatar
                    [name]="u.fullName || u.email"
                    [color]="colors[u.role]"
                    [size]="34"
                  /><span class="cell-main">{{ u.fullName || '—' }}</span>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <select
                  class="input role"
                  [value]="u.role"
                  (change)="change(u, $any($event.target).value)"
                  [disabled]="u.id === auth.user()?.id"
                  [title]="u.id === auth.user()?.id ? 'No puedes cambiar tu propio rol' : ''"
                >
                  @for (r of roles; track r) {
                    <option [value]="r" [selected]="u.role === r">{{ labels[r] }}</option>
                  }
                </select>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="3">
                <div class="empty">
                  @if (users.loading()) {
                    Cargando…
                  } @else {
                    <strong>Sin usuarios</strong>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .info {
      display: flex;
      gap: 0.85rem;
      margin-bottom: 1.25rem;
      background: var(--c-blue-soft);
      border: 0;
      app-icon {
        color: var(--c-blue);
        margin-top: 2px;
      }
      strong {
        color: var(--ink);
      }
      p {
        font-size: 0.92rem;
        margin-top: 0.2rem;
      }
    }
    .who {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .role {
      width: auto;
      min-width: 180px;
      min-height: 36px;
      padding-block: 0.3rem;
    }
  `,
})
export class UsersPage {
  protected readonly users = inject(UsersFacade);
  protected readonly auth = inject(AuthFacade);
  protected readonly labels = ROLE_LABELS;
  protected readonly roles = Object.keys(ROLE_LABELS) as UserRole[];
  protected readonly colors: Record<UserRole, string> = {
    admin: 'purple',
    teacher: 'green',
    parent: 'sky',
  };

  constructor() {
    void this.users.load();
  }

  protected change(user: UserProfile, role: UserRole) {
    void this.users.changeRole(user, role);
  }
}
