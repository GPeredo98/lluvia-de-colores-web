import { inject } from '@angular/core';
import { Draft, Entity } from '../../../domain/models';
import { CrudRepository } from '../../../domain/ports';
import { RowMapper, caseMapper } from '../../supabase/row-mapper';
import { SupabaseClientProvider, unwrap, unwrapList } from '../../supabase/supabase-client';

export interface TableOptions<T> {
  table: string;
  orderBy?: { column: string; ascending?: boolean }[];
  mapper?: RowMapper<T>;
}

/** Adapter CRUD genérico sobre una tabla de Supabase. */
export abstract class SupabaseCrudAdapter<T extends Entity> implements CrudRepository<T> {
  protected readonly supabase = inject(SupabaseClientProvider).client;
  protected readonly mapper: RowMapper<T>;

  protected constructor(protected readonly options: TableOptions<T>) {
    this.mapper = options.mapper ?? caseMapper<T>();
  }

  protected query() {
    let q = this.supabase.from(this.options.table).select('*');
    for (const o of this.options.orderBy ?? []) {
      q = q.order(o.column, { ascending: o.ascending ?? true });
    }
    return q;
  }

  async list(): Promise<T[]> {
    const rows = unwrapList(await this.query());
    return rows.map((r) => this.mapper.toDomain(r));
  }

  async create(draft: Draft<T>): Promise<T> {
    const row = unwrap(
      await this.supabase
        .from(this.options.table)
        .insert(this.mapper.toRow(draft as Partial<T>))
        .select()
        .single(),
    );
    return this.mapper.toDomain(row);
  }

  async update(id: string, patch: Partial<Draft<T>>): Promise<T> {
    const row = unwrap(
      await this.supabase
        .from(this.options.table)
        .update(this.mapper.toRow(patch as Partial<T>))
        .eq('id', id)
        .select()
        .single(),
    );
    return this.mapper.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    unwrap(await this.supabase.from(this.options.table).delete().eq('id', id));
  }
}
