import { computed, inject, signal } from '@angular/core';
import { Draft, Entity } from '../../domain/models';
import { CrudRepository } from '../../domain/ports';
import { NotificationFacade, errorMessage } from '../facades/notification.facade';

interface CrudState<T> {
  items: T[];
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

/**
 * Facade base: mantiene la colección en signals y expone las operaciones CRUD.
 * La UI solo lee signals y llama métodos; nunca toca el repositorio.
 */
export abstract class CrudFacade<T extends Entity> {
  protected abstract readonly repo: CrudRepository<T>;
  /** Nombre en singular para los mensajes ("Programa guardado"). */
  protected abstract readonly label: string;
  /** true si el sustantivo es femenino ("Estimuladora creada"). */
  protected readonly feminine: boolean = false;
  protected readonly notify = inject(NotificationFacade);

  protected readonly state = signal<CrudState<T>>({
    items: [],
    loaded: false,
    loading: false,
    saving: false,
    error: null,
  });

  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().loading);
  readonly saving = computed(() => this.state().saving);
  readonly error = computed(() => this.state().error);
  readonly byId = computed(() => new Map(this.items().map((i) => [i.id, i])));

  /** Carga la colección; si ya está cargada no vuelve a pedirla salvo `force`. */
  async load(force = false): Promise<void> {
    if (this.state().loading || (this.state().loaded && !force)) return;
    this.patch({ loading: true, error: null });
    try {
      const items = await this.repo.list();
      this.patch({ items, loaded: true });
    } catch (e) {
      this.patch({ error: errorMessage(e) });
      this.notify.error(errorMessage(e));
    } finally {
      this.patch({ loading: false });
    }
  }

  async create(draft: Draft<T>): Promise<T | null> {
    return this.mutate(async () => {
      const created = await this.repo.create(draft);
      this.patch({ items: this.sort([...this.items(), created]) });
      this.notify.success(`${this.label} ${this.agree('creado')}`);
      return created;
    });
  }

  async update(id: string, patch: Partial<Draft<T>>): Promise<T | null> {
    return this.mutate(async () => {
      const updated = await this.repo.update(id, patch);
      this.replace(updated);
      this.notify.success(`${this.label} ${this.agree('actualizado')}`);
      return updated;
    });
  }

  /** Crea o actualiza según exista id. */
  save(id: string | null, draft: Draft<T>): Promise<T | null> {
    return id ? this.update(id, draft) : this.create(draft);
  }

  async remove(id: string, name: string): Promise<boolean> {
    const ok = await this.notify.confirm({
      title: `Eliminar ${this.label.toLowerCase()}`,
      message: `¿Seguro que deseas eliminar "${name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return false;
    const result = await this.mutate(async () => {
      await this.repo.remove(id);
      this.patch({ items: this.items().filter((i) => i.id !== id) });
      this.notify.success(`${this.label} ${this.agree('eliminado')}`);
      return true;
    });
    return result ?? false;
  }

  private agree(word: string) {
    return this.feminine ? word.replace(/o$/, 'a') : word;
  }

  /** Orden local tras crear; las subclases lo redefinen si hace falta. */
  protected sort(items: T[]): T[] {
    return items;
  }

  protected replace(item: T) {
    this.patch({ items: this.items().map((i) => (i.id === item.id ? item : i)) });
  }

  protected patch(partial: Partial<CrudState<T>>) {
    this.state.update((s) => ({ ...s, ...partial }));
  }

  protected async mutate<R>(fn: () => Promise<R>): Promise<R | null> {
    this.patch({ saving: true });
    try {
      return await fn();
    } catch (e) {
      this.notify.error(errorMessage(e));
      return null;
    } finally {
      this.patch({ saving: false });
    }
  }
}
