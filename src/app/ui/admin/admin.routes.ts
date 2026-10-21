import { Routes } from '@angular/router';
import { AdminLayout } from './admin-layout';

const page = (title: string) => `${title} · Admin LDC`;

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        title: page('Resumen'),
        loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'asistencia',
        title: page('Asistencia'),
        loadComponent: () => import('./pages/attendance.page').then((m) => m.AttendancePage),
      },
      {
        path: 'horarios',
        title: page('Horarios'),
        loadComponent: () => import('./pages/schedules.page').then((m) => m.SchedulesPage),
      },
      {
        path: 'estudiantes',
        title: page('Estudiantes'),
        loadComponent: () => import('./pages/students.page').then((m) => m.StudentsPage),
      },
      {
        path: 'estimuladoras',
        title: page('Estimuladoras'),
        loadComponent: () => import('./pages/staff.page').then((m) => m.StaffPage),
      },
      {
        path: 'programas',
        title: page('Programas'),
        loadComponent: () => import('./pages/programs.page').then((m) => m.ProgramsPage),
      },
      {
        path: 'pagos',
        title: page('Pagos'),
        loadComponent: () => import('./pages/billing.page').then((m) => m.BillingPage),
      },
      {
        path: 'calendario',
        title: page('Calendario'),
        loadComponent: () => import('./pages/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'contenido',
        title: page('Contenido web'),
        loadComponent: () => import('./pages/content.page').then((m) => m.ContentPage),
      },
      {
        path: 'usuarios',
        title: page('Usuarios'),
        loadComponent: () => import('./pages/users.page').then((m) => m.UsersPage),
      },
    ],
  },
];
