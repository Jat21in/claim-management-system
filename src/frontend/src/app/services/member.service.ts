import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
export interface MemberDashboardResponse {
  fullName: string;
  email: string;
  activePlan: {
    id: string;
    name: string;
    insuredAmount: number;
    startDate: string;
    endDate: string;
  } | null;
}

// NEW: Policy Summary from new system
export interface PolicySummary {
  hasActivePolicy: boolean;
  policyNumber?: string;
  planName?: string;
  sumInsured?: number;
  utilizedAmount?: number;
  nextPremiumDueDate?: string;
  nextPremiumAmount?: number;
  dependentsCount?: number;
  nomineesCount?: number;
}

export interface UpdateProfileRequest {
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactNumber: string;
}

@Injectable({ providedIn: 'root' })
export class MemberService {
  private http = inject(HttpClient);

  // Existing endpoint (for backward compatibility)
  getDashboard(): Observable<MemberDashboardResponse> {
    console.log('📡 API CALL: getDashboard');
    return this.http.get<MemberDashboardResponse>(
      `${environment.apiBaseUrl}/v1/members/me`
    );
  }
  // NEW: Get enhanced dashboard with policy data
  getEnhancedDashboard(): Observable<any> {
  // Try to get enhanced data, fallback gracefully
  return forkJoin({
    member: this.getDashboard(),
    policySummary: this.http.get(`${environment.apiBaseUrl}/v1/policies/summary`).pipe(
      catchError(() => of(null))
    ),
    dependents: this.http.get(`${environment.apiBaseUrl}/v1/policies/dependents`).pipe(
      catchError(() => of([]))
    ),
    nominees: this.http.get(`${environment.apiBaseUrl}/v1/policies/nominees`).pipe(
      catchError(() => of([]))
    ),
    kycStatus: this.http.get(`${environment.apiBaseUrl}/v1/kyc/status`).pipe(
      catchError(() => of(null))
    )
  });

  }
  updateProfile(payload: UpdateProfileRequest) {
    return this.http.put(
      `${environment.apiBaseUrl}/v1/members/profile`,
      payload
    );
  }
}
