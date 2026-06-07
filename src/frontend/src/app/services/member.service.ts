import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

      policySummary: this.http
        .get<PolicySummary>(
          `${environment.apiBaseUrl}/v1/policies/summary`
        )
        .pipe(
          catchError((error) => {
            console.warn('⚠️ Policy summary API failed:', error);
            return of(null);
          })
        ),

      dependents: this.http
        .get<any[]>(
          `${environment.apiBaseUrl}/v1/policies/dependents`
        )
        .pipe(
          catchError((error) => {
            console.warn('⚠️ Dependents API failed:', error);
            return of([]);
          })
        ),

      nominees: this.http
        .get<any[]>(
          `${environment.apiBaseUrl}/v1/policies/nominees`
        )
        .pipe(
          catchError((error) => {
            console.warn('⚠️ Nominees API failed:', error);
            return of([]);
          })
        ),

      kycStatus: this.http
        .get<any>(
          `${environment.apiBaseUrl}/v1/kyc/status`
        )
        .pipe(
          catchError((error) => {
            console.warn('⚠️ KYC status API failed:', error);
            return of(null);
          })
        )
    }).pipe(
      map((data) => {
        return {
          ...data,

          // Easy access helpers for UI
          hasPolicy:
            data.policySummary?.hasActivePolicy ?? false,

          activePlanName:
            data.policySummary?.planName ||
            data.member?.activePlan?.name ||
            'No Active Plan',

          insuredAmount:
            data.policySummary?.sumInsured ||
            data.member?.activePlan?.insuredAmount ||
            0,

          dependentsCount:
            data.dependents?.length || 0,

          nomineesCount:
            data.nominees?.length || 0
        };
      })
    );
  }

  updateProfile(payload: UpdateProfileRequest) {
    return this.http.put(
      `${environment.apiBaseUrl}/v1/members/profile`,
      payload
    );
  }
}
