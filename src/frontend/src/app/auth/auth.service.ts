import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  expiresAt: string; // ISO timestamp
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'cms_token';
  private readonly EXPIRY_KEY = 'cms_expiry';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // =====================
  // ✅ LOGIN
  // =====================
  login(
    payload: { email: string; password: string },
    rememberMe: boolean
  ) {
    return this.http
      .post<LoginResponse>(
        `${environment.apiBaseUrl}/auth/login`,
        payload
      )
      .pipe(
        tap(res => {
          const storage = rememberMe ? localStorage : sessionStorage;

          storage.setItem(this.TOKEN_KEY, res.token);
          storage.setItem(this.EXPIRY_KEY, res.expiresAt);

          // ✅ optional but recommended
          this.startExpiryWatcher(res.expiresAt);
        })
      );
  }

  // =====================
  // ✅ REGISTER
  // =====================
  // /src/frontend/src/app/auth/auth.service.ts

register(payload: {
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    selectedPlanId?: string;
}) {
    console.log('🚀 AuthService.register called with:', payload);

    // ✅ Don't modify the payload - send as is
    // The backend will handle null/undefined appropriately

    console.log('📤 Sending to backend:', payload);

    return this.http.post(
        `${environment.apiBaseUrl}/auth/register`,
        payload
    );
}

  // =====================
  // ✅ AUTH STATE
  // =====================
  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ??
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expiry =
      localStorage.getItem(this.EXPIRY_KEY) ??
      sessionStorage.getItem(this.EXPIRY_KEY);

    if (!expiry) return false;

    return new Date(expiry).getTime() > Date.now();
  }

  // =====================
  // ✅ LOGOUT
  // =====================
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRY_KEY);

    // this.router.navigate(['/auth/login']);
    this.router.navigate(['/auth'], {
  queryParams: { mode: 'login' },
  replaceUrl: true,
});
  }

  // =====================
  // ✅ EXPIRY HANDLING
  // =====================
  private startExpiryWatcher(expiresAt: string): void {
    const expiryTime = new Date(expiresAt).getTime();
    const timeout = expiryTime - Date.now();

    if (timeout <= 0) {
      this.logout();
      return;
    }

    setTimeout(() => {
      this.logout();
    }, timeout);
  }
}
