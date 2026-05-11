import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

interface JwtPayload {
  email?: string;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private base = `${environment.apiBaseUrl}/api/auth`;
  private tokenKey = 'token';

  constructor(private http: HttpClient) {}

  // =====================
  // ✅ API CALLS
  // =====================

  login(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.base}/login`, payload);
  }

  register(payload: any) {
  return this.http.post(
    `${environment.apiBaseUrl}/v1/auth/register`,
    payload
  );
}
  // =====================
  // ✅ TOKEN MANAGEMENT
  // =====================

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // =====================
  // ✅ JWT HELPERS (NEW)
  // =====================

  getUserEmail(): string | null {
    const payload = this.getJwtPayload();
    return payload?.email ?? null;
  }

  isTokenExpired(): boolean {
    const payload = this.getJwtPayload();
    if (!payload?.exp) return true;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp < nowInSeconds;
  }

  startTokenExpiryWatcher(): void {
  const payload = this.getJwtPayload();
  if (!payload?.exp) return;

  const expiresInMs = (payload.exp * 1000) - Date.now();

  if (expiresInMs <= 0) {
    this.logout();
    return;
  }

  setTimeout(() => {
    this.logout();
    location.href = '/login';
  }, expiresInMs);
}

  // =====================
  // ✅ PRIVATE UTILS
  // =====================

  private getJwtPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }
}
