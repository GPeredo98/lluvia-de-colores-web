import { Draft, Entity } from '../../../domain/models';
import { CrudRepository } from '../../../domain/ports';

const PREFIX = 'ldc-demo:';

function readStorage<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la demo sigue funcionando en memoria */
  }
}

/** Simula la latencia de red para que los estados de carga sean visibles en la demo. */
export const latency = <T>(value: T, ms = 150) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Colección en memoria persistida en localStorage (solo navegador). */
export class MemoryCollection<T extends Entity> {
  private items: T[];

  constructor(
    private readonly key: string,
    seed: () => T[],
  ) {
    this.items = readStorage<T[]>(key) ?? seed();
  }

  all(): T[] {
    return this.items;
  }

  insert(draft: Draft<T>): T {
    const item = { ...draft, id: newId() } as T;
    this.items = [...this.items, item];
    this.persist();
    return item;
  }

  patch(id: string, patch: Partial<T>): T {
    const current = this.items.find((i) => i.id === id);
    if (!current) throw new Error('Registro no encontrado');
    const updated = { ...current, ...patch, id };
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    this.persist();
    return updated;
  }

  delete(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    this.persist();
  }

  private persist() {
    writeStorage(this.key, this.items);
  }
}

const registry = new Map<string, MemoryCollection<Entity>>();

/** Colección compartida por todos los adapters que usan la misma clave. */
export function sharedCollection<T extends Entity>(
  key: string,
  seed: () => T[],
): MemoryCollection<T> {
  if (!registry.has(key)) registry.set(key, new MemoryCollection<Entity>(key, seed));
  return registry.get(key) as unknown as MemoryCollection<T>;
}

export abstract class MemoryCrudAdapter<T extends Entity> implements CrudRepository<T> {
  protected abstract readonly collection: MemoryCollection<T>;
  protected sort: (items: T[]) => T[] = (items) => items;

  list(): Promise<T[]> {
    return latency(this.sort([...this.collection.all()]));
  }
  create(draft: Draft<T>): Promise<T> {
    return latency(this.collection.insert(draft));
  }
  update(id: string, patch: Partial<Draft<T>>): Promise<T> {
    return latency(this.collection.patch(id, patch as Partial<T>));
  }
  async remove(id: string): Promise<void> {
    this.collection.delete(id);
    await latency(null);
  }
}

export const memoryStorage = { read: readStorage, write: writeStorage };
