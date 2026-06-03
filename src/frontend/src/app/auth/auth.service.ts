import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface LoginResponse {
  token: string;
  expiresAt: string; // ISO timestamp
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'cms_token';
  private readonly EXPIRY_KEY = 'cms_expiry';
  private readonly ROLE_KEY = 'user_role'; // ✅ added

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

          // ✅ Decode JWT & store role
          try {
            const decoded: any = jwtDecode(res.token);

            const role =
              decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
              decoded['role'] ||
              decoded['Role'] ||
              'Member';

            storage.setItem(this.ROLE_KEY, role);
          } catch (err) {
            console.error('JWT decode failed:', err);
            storage.setItem(this.ROLE_KEY, 'Member');
          }

          // ✅ Start expiry tracking
          this.startExpiryWatcher(res.expiresAt);
        })
      );
  }

  // =====================
  // ✅ REGISTER
  // =====================
  register(payload: {
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    selectedPlanId?: string;
  }) {
    console.log('🚀 AuthService.register called with:', payload);
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

  getUserRole(): string | null {
    return (
      localStorage.getItem(this.ROLE_KEY) ??
      sessionStorage.getItem(this.ROLE_KEY)
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
  // ✅ TOKEN HELPERS
  // =====================
  /**
   * Decode the currently stored JWT token and return the payload.
   * Returns null when no token is available or decoding fails.
   */
  getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode(token) as any;
    } catch (err) {
      console.warn('Failed to decode token', err);
      return null;
    }
  }

  /**
   * Get the current user information from the decoded JWT token.
   * Returns an object with user details (email, fullName, etc.) or null if not authenticated.
   */
  getUser(): { email?: string; fullName?: string; [key: string]: any } | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;

    return {
      email: decoded.email || decoded.sub,
      fullName: decoded.name || decoded.fullName || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      ...decoded
    };
  }

  // =====================
  // ✅ LOGOUT
  // =====================
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
    localStorage.removeItem(this.ROLE_KEY);

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.EXPIRY_KEY);
    sessionStorage.removeItem(this.ROLE_KEY);

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
