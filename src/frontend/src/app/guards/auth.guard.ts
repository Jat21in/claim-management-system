import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = auth.isAuthenticated();

  if (!isLoggedIn) {
    console.warn('[AuthGuard] Not authenticated, redirecting to login');

    router.navigate(['/auth/login'], {
  queryParams: { redirect: state.url }
});

    return false;
  }

  console.log('[AuthGuard] Authenticated, access granted');
  return true;
};
