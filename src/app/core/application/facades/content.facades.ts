import { Injectable, computed, inject, signal } from '@angular/core';
import {
  DEFAULT_LANDING_CONTENT,
  LandingContent,
  LandingSectionKey,
  UserProfile,
  UserRole,
} from '../../domain/models';
import { LandingRepository, ProfileRepository } from '../../domain/ports';
import { NotificationFacade, errorMessage } from './notification.facade';

/** Edición del contenido de la landing desde el admin. */
@Injectable({ providedIn: 'root' })
export class LandingContentFacade {
  private readonly repo = inject(LandingRepository);
  private readonly notify = inject(NotificationFacade);

  private readonly _content = signal<LandingContent>(structuredClone(DEFAULT_LANDING_CONTENT));
  private readonly _loading = signal(false);
  private readonly _saving = signal<LandingSectionKey | null>(null);

  readonly content = this._content.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly savingSection = this._saving.asReadonly();

  async load() {
    this._loading.set(true);
    try {
      this._content.set(await this.repo.get());
    } catch (e) {
      this.notify.error(errorMessage(e));
    } finally {
      this._loading.set(false);
    }
  }

  async save<K extends LandingSectionKey>(key: K, value: LandingContent[K]): Promise<boolean> {
    this._saving.set(key);
    try {
      await this.repo.save(key, value);
      this._content.update((c) => ({ ...c, [key]: structuredClone(value) }));
      this.notify.success('Contenido publicado en la página');
      return true;
    } catch (e) {
      this.notify.error(errorMessage(e));
      return false;
    } finally {
      this._saving.set(null);
    }
  }
}

/** Gestión de cuentas y roles. */
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly repo = inject(ProfileRepository);
  private readonly notify = inject(NotificationFacade);

  private readonly _users = signal<UserProfile[]>([]);
  private readonly _loading = signal(false);
  private readonly _query = signal('');

  readonly loading = this._loading.asReadonly();
  readonly query = this._query.asReadonly();
  readonly users = computed(() => {
    const q = this._query().trim().toLowerCase();
    return this._users().filter(
      (u) => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  });
  readonly counts = computed(() => {
    const c: Record<UserRole, number> = { admin: 0, teacher: 0, parent: 0 };
    for (const u of this._users()) c[u.role]++;
    return c;
  });

  setQuery(q: string) {
    this._query.set(q);
  }

  async load() {
    this._loading.set(true);
    try {
      this._users.set(await this.repo.list());
    } catch (e) {
      this.notify.error(errorMessage(e));
    } finally {
      this._loading.set(false);
    }
  }

  async changeRole(user: UserProfile, role: UserRole) {
    if (user.role === role) return;
    try {
      const updated = await this.repo.updateRole(user.id, role);
      this._users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      this.notify.success(`Rol de ${user.fullName || user.email} actualizado`);
    } catch (e) {
      this.notify.error(errorMessage(e));
    }
  }
}
