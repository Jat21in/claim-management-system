import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isAuthenticated();
  const token = authService.getToken();

  console.log('[AuthGuard] Checking authentication:', {
    isLoggedIn,
    hasToken: !!token,
    role: authService.getUserRole(),
    url: state.url
  });

  if (!isLoggedIn || !token) {
    console.warn('[AuthGuard] Not authenticated, redirecting to login');

    router.navigate(['/auth'], {
      queryParams: {
        mode: 'login',
        redirect: state.url
      }
    });

    return false;
  }

  console.log('[AuthGuard] Authenticated, access granted');
  return true;
};
