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

export interface SearchResult {
  type: string;
  title: string;
  link: string;
  id: string;
  subtitle?: string;
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
        totalMembers: 0,
        pendingTasks: pendingKyc + pendingClaims
      }))
    );
  }

  searchGlobal(query: string): Observable<SearchResult[]> {
    if (!query || query.length < 2) {
      return of([]);
    }

    const members$ = this.http.get<any[]>(`${environment.apiBaseUrl}/admin/members/all`).pipe(
      map(members => {
        const filtered = members.filter(m => 
          m.fullName?.toLowerCase().includes(query.toLowerCase()) ||
          m.email?.toLowerCase().includes(query.toLowerCase()) ||
          m.phoneNumber?.includes(query)
        );
        return filtered.slice(0, 3).map(m => ({
          type: 'Member',
          title: m.fullName,
          link: `/admin/members`,
          id: m.memberId,
          subtitle: m.email
        }));
      })
    );

    const claims$ = this.http.get<any[]>(`${environment.apiBaseUrl}/admin/claims/all`).pipe(
      map(claims => {
        const filtered = claims.filter(c => 
          c.claimId?.toLowerCase().includes(query.toLowerCase()) ||
          c.memberName?.toLowerCase().includes(query.toLowerCase())
        );
        return filtered.slice(0, 3).map(c => ({
          type: 'Claim',
          title: `Claim #${c.claimId.slice(0, 8)}`,
          link: `/admin/claims`,
          id: c.claimId,
          subtitle: `${c.memberName} - ${c.status}`
        }));
      })
    );

    return combineLatest([members$, claims$]).pipe(
      map(([members, claims]) => [...members, ...claims])
    );
  }
}