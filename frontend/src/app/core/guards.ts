import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Requires a signed-in user; bounces to login with a returnUrl otherwise. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.accessToken || auth.isAuthenticated()) return true;
  if (await auth.tryRefresh()) return true;

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};

/** Requires the Admin role. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) await auth.tryRefresh();
  if (auth.isAdmin()) return true;

  return auth.isAuthenticated()
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
