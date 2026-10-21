import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../../core/application';
import { UserRole } from '../../core/domain/models';

/** Permite el acceso solo a los roles indicados; si no hay sesión, envía al login. */
export const roleGuard =
  (...roles: UserRole[]): CanActivateFn =>
  async (_route, state) => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
    await auth.whenReady();
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }
    return auth.hasRole(...roles) ? true : router.parseUrl(auth.homeRoute());
  };

/** Si ya hay sesión, el login redirige al área correspondiente. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthFacade);
  await auth.whenReady();
  return auth.isAuthenticated() ? inject(Router).parseUrl(auth.homeRoute()) : true;
};
