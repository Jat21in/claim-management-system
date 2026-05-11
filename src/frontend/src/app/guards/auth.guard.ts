import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');

  if (!token) {
    console.warn('[AuthGuard] Not authenticated, redirecting to login');

    router.navigate(['/auth/login'], {
      queryParams: {
        redirect: state.url   // ✅ THIS IS THE KEY
      }
    });

    return false;
  }

  console.log('[AuthGuard] Authenticated, access granted');
  return true;
};
