import { inject } from '@angular/core';
import {
  HttpInterceptorFn
} from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // ✅ If token exists but is expired → logout immediately
  if (token && auth.isTokenExpired()) {
    auth.logout();
    router.navigate(['/login']);
    return next(req); // do NOT attach token
  }

  // ✅ Attach token only if valid
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
