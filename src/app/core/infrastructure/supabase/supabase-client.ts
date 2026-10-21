import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export const isSupabaseConfigured = (): boolean =>
  !!environment.supabase.url && !!environment.supabase.anonKey;

/** Único punto donde se crea el cliente de Supabase. Solo lo usan los adapters. */
@Injectable({ providedIn: 'root' })
export class SupabaseClientProvider {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.anonKey,
    {
      auth: {
        // En SSR no hay almacenamiento ni sesión: las lecturas públicas usan la anon key.
        persistSession: this.isBrowser,
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
      },
    },
  );
}

type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

/** Convierte errores de PostgREST en `Error` legibles y devuelve la fila. */
export function unwrap(result: Result): Row {
  if (result.error) throw new Error(result.error.message);
  return result.data as Row;
}

export function unwrapList(result: Result): Row[] {
  if (result.error) throw new Error(result.error.message);
  return (result.data as Row[] | null) ?? [];
}
