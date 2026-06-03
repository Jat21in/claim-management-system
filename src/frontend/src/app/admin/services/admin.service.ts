import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, combineLatest, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  pendingKyc: number;
  pendingClaims: number;
  totalMembers: number;
  pendingTasks: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getPendingKycCount(): Observable<number> {
    return this.http.get<any>(`${environment.apiBaseUrl}/admin/kyc/stats`).pipe(
      map(stats => stats.pending || 0)
    );
  }

  getPendingClaimsCount(): Observable<number> {
    return this.http.get<any>(`${environment.apiBaseUrl}/admin/claims/pending`).pipe(
      map(claims => claims.length || 0)
    );
  }

  getAdminStats(): Observable<AdminStats> {
    return combineLatest({
      pendingKyc: this.getPendingKycCount(),
      pendingClaims: this.getPendingClaimsCount(),
    }).pipe(
      map(({ pendingKyc, pendingClaims }) => ({
        pendingKyc,
        pendingClaims,
        totalMembers: 0, // can be fetched from members endpoint
        pendingTasks: pendingKyc + pendingClaims
      }))
    );
  }

  // Global search
  searchGlobal(query: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/search?q=${encodeURIComponent(query)}`);
  }
}
