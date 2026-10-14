import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? true : inject(Router).createUrlTree(['/']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.token) return inject(Router).createUrlTree(['/']);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/cafe/dashboard']);
};

/** Logged-in users skip the landing page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.token ? inject(Router).createUrlTree(['/cafe/dashboard']) : true;
};
