import { Draft, Entity } from '../models';

/**
 * Contrato CRUD genérico. Los puertos son clases abstractas para poder usarlos
 * directamente como tokens de inyección.
 */
export abstract class CrudRepository<T extends Entity> {
  abstract list(): Promise<T[]>;
  abstract create(draft: Draft<T>): Promise<T>;
  abstract update(id: string, patch: Partial<Draft<T>>): Promise<T>;
  abstract remove(id: string): Promise<void>;
}
