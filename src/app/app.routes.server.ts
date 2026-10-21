import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // La landing se renderiza en el servidor en cada request: SEO y contenido siempre actualizado.
  { path: '', renderMode: RenderMode.Server },
  // Áreas privadas: dependen de la sesión del navegador.
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'portal', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
