import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './ui/shared/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./ui/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Ingresar · Lluvia de Colores',
    loadComponent: () => import('./ui/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'portal',
    canActivate: [roleGuard('parent', 'teacher')],
    title: 'Mi cuenta · Lluvia de Colores',
    loadComponent: () => import('./ui/portal/portal.page').then((m) => m.PortalPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadChildren: () => import('./ui/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
