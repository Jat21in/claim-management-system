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

  login(credentials: { email: string; password: string }, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('token', response.token);
          storage.setItem('tokenExpiry', response.expiresAt);

          // Decode and store user info
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

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('selectedPlanId');

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('selectedPlanId');

    this.authStatusSubject.next(false);
    this.router.navigate(['/']);
  }

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

  setSelectedPlanId(planId: string): void {
    const storage = this.isAuthenticated() ?
      (localStorage.getItem('token') ? localStorage : sessionStorage) : sessionStorage;
    storage.setItem('selectedPlanId', planId);
  }

  getSelectedPlanId(): string | null {
    return localStorage.getItem('selectedPlanId') || sessionStorage.getItem('selectedPlanId');
  }

  clearSelectedPlanId(): void {
    localStorage.removeItem('selectedPlanId');
    sessionStorage.removeItem('selectedPlanId');
  }
}
