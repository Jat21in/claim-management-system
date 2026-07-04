import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginResponse {
  token: string;
  expiresAt: string;
}

interface DecodedToken {
  sub: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  email: string;
  exp: number;
  iss: string;
  aud: string;
  name?: string;
  fullName?: string;
}

export interface UserProfile {
  id: string | null;
  email: string | null;
  role: string | null;
  fullName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiBaseUrl;

  private authStatusSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  authStatus$ = this.authStatusSubject.asObservable();

  // UNIFIED PLAN STATE
  private readonly PLAN_STORAGE_KEY = 'claimcore_selected_plan';

  // ✅ LOGIN
  login(credentials: { email: string; password: string }, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('token', response.token);
          storage.setItem('tokenExpiry', response.expiresAt);

          const decoded = this.decodeToken(response.token);
          if (decoded) {
            storage.setItem('userRole', decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
            storage.setItem('userId', decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
            storage.setItem('userEmail', decoded['email']);
          }

          this.authStatusSubject.next(true);
        })
      );
  }

  // ✅ REGISTER
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  // ✅ FORGOT PASSWORD - Request OTP
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  // ✅ VERIFY RESET TOKEN (OTP)
  verifyResetToken(email: string, token: string): Observable<{ isValid: boolean }> {
    return this.http.post<{ isValid: boolean }>(`${this.apiUrl}/auth/verify-reset-token`, { email, token });
  }

  // ✅ RESET PASSWORD
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { email, token, newPassword });
  }

  // ✅ LOGOUT
  logout(): void {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    this.authStatusSubject.next(false);
    this.router.navigate(['/']);
  }

  // ✅ TOKEN MANAGEMENT
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  }

  getUser(): UserProfile {
    const token = this.getToken();
    const decoded = token ? this.decodeToken(token) : null;

    return {
      id: decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || this.getUserId(),
      email: decoded?.email || this.getUserEmail(),
      role: decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || this.getUserRole(),
      fullName: decoded?.fullName || decoded?.name || null
    };
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem('tokenExpiry') || sessionStorage.getItem('tokenExpiry');

    if (!token || !expiry) {
      return false;
    }

    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as DecodedToken;
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // ✅ UNIFIED PLAN STORAGE METHODS
  setSelectedPlan(planId: string, planData?: any): void {
    const planInfo = {
      planId: planId,
      selectedAt: new Date().toISOString(),
      ...planData
    };
    localStorage.setItem(this.PLAN_STORAGE_KEY, JSON.stringify(planInfo));
  }

  getSelectedPlan(): { planId: string; selectedAt: string; [key: string]: any } | null {
    const data = localStorage.getItem(this.PLAN_STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getSelectedPlanId(): string | null {
    const plan = this.getSelectedPlan();
    return plan?.planId || null;
  }

  clearSelectedPlan(): void {
    localStorage.removeItem(this.PLAN_STORAGE_KEY);
  }

  // ✅ BACKWARD COMPATIBILITY: Support old storage keys
  getPlanIdFromLegacyStorage(): string | null {
    const keys = ['selectedPlanId', 'premiumHealthFactors'];
    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.planId) {
            this.setSelectedPlan(parsed.planId, parsed);
            return parsed.planId;
          }
          if (typeof parsed === 'string') {
            this.setSelectedPlan(parsed);
            return parsed;
          }
        } catch (e) {
          if (data) {
            this.setSelectedPlan(data);
            return data;
          }
        }
      }
    }
    return null;
  }
}