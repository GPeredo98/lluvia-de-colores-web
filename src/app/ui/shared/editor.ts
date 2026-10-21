import { signal } from '@angular/core';

/** Estado del formulario modal de una página CRUD: qué registro se edita y su borrador. */
export class Editor<D> {
  readonly current = signal<{ id: string | null; draft: D } | null>(null);

  create(draft: D) {
    this.current.set({ id: null, draft });
  }

  edit<T extends { id: string }>(item: T, map: (item: T) => D) {
    this.current.set({ id: item.id, draft: structuredClone(map(item)) });
  }

  close() {
    this.current.set(null);
  }
}

/** Separa un registro en id + resto (el borrador editable). */
export const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) => rest;
