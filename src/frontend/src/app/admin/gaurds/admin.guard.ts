import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

export const adminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ✅ FIX: check both storages via AuthService
  const role = auth.getUserRole();

  console.log('AdminGuard role:', role);
  console.log('isAuthenticated:', auth.isAuthenticated());

  if (
    auth.isAuthenticated() &&
    (role === 'Admin' || role === 'ClaimsProcessor')
  ) {
    return true;
  }

  // ✅ FIX: correct route
  router.navigate(['/auth'], {
    queryParams: { mode: 'login' },
    replaceUrl: true
  });

  return false;
};
