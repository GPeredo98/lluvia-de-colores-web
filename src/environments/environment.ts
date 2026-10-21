/**
 * Configuración de Supabase.
 *
 * Si `url` o `anonKey` están vacíos la app corre en MODO DEMO con datos en
 * memoria (persistidos en localStorage), útil para desarrollar la UI sin backend.
 * La anon key es pública por diseño; la seguridad la dan las políticas RLS.
 */
export const environment = {
  supabase: {
    url: '',
    anonKey: '',
    mediaBucket: 'media',
  },
  timeZone: 'America/La_Paz',
  currency: 'BOB',
};
