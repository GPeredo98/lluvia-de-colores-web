import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Credentials, UserProfile, UserRole } from '../../domain/models';
import { AuthGateway, DEMO_MODE } from '../../domain/ports';
import { NotificationFacade, errorMessage } from './notification.facade';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly gateway = inject(AuthGateway);
  private readonly notify = inject(NotificationFacade);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private restoring: Promise<void> | null = null;

  private readonly _user = signal<UserProfile | null>(null);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly demoMode = inject(DEMO_MODE);
  readonly user = this._user.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly initials = computed(() =>
    (this._user()?.fullName || this._user()?.email || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join(''),
  );
  /** Ruta de inicio según el rol. */
  readonly homeRoute = computed(() => (this.role() === 'admin' ? '/admin' : '/portal'));

  /** Restaura la sesión una sola vez; los guards esperan esta promesa. */
  whenReady(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    this.restoring ??= (async () => {
      try {
        this._user.set(await this.gateway.currentUser());
      } catch {
        this._user.set(null);
      }
      this.gateway.onChange((user) => this._user.set(user));
    })();
    return this.restoring;
  }

  hasRole(...roles: UserRole[]) {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  async signIn(credentials: Credentials): Promise<boolean> {
    this._busy.set(true);
    this._error.set(null);
    try {
      this._user.set(await this.gateway.signIn(credentials));
      return true;
    } catch (e) {
      this._error.set(errorMessage(e));
      return false;
    } finally {
      this._busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this._user.set(null);
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!email) {
      this._error.set('Escribe tu correo para recuperar la contraseña');
      return;
    }
    try {
      await this.gateway.sendPasswordReset(email);
      this.notify.success('Te enviamos un correo para restablecer tu contraseña');
    } catch (e) {
      this._error.set(errorMessage(e));
    }
  }

  clearError() {
    this._error.set(null);
  }
}
