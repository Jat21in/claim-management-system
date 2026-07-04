import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MemberDashboardResponse {
  fullName: string;
  email: string;
  profilePhotoUrl?: string;
  activePlan: {
    id: string;
    name: string;
    insuredAmount: number;
    startDate: string;
    endDate: string;
  } | null;
  activePolicyId?: string;
  activePolicyNumber?: string;
}

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
  isPremiumPaidForCurrentMonth?: boolean;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
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

export interface ProfileResponse {
  memberId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

@Injectable({ providedIn: 'root' })
export class MemberService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/v1/members`;

  // ✅ Get dashboard
  getDashboard(): Observable<MemberDashboardResponse> {
    console.log('📡 API CALL: getDashboard');
    return this.http.get<MemberDashboardResponse>(`${this.base}/me`);
  }

  // ✅ Get full profile (with photo)
  getMyProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(`${this.base}/profile`);
  }

  // ✅ Update profile
  updateProfile(payload: UpdateProfileRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/profile`, payload);
  }

  // ✅ Upload profile photo
  uploadProfilePhoto(file: File): Observable<{ photoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ photoUrl: string; message: string }>(
      `${this.base}/profile-photo`,
      formData
    );
  }

  // ✅ Remove profile photo
  removeProfilePhoto(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/profile-photo`);
  }

  // ✅ Get enhanced dashboard with policy data
  getEnhancedDashboard(): Observable<any> {
    return forkJoin({
      member: this.getDashboard(),
      policySummary: this.http
        .get<PolicySummary>(`${environment.apiBaseUrl}/v1/policies/summary`)
        .pipe(catchError(() => of(null))),
      dependents: this.http
        .get<any[]>(`${environment.apiBaseUrl}/v1/policies/dependents`)
        .pipe(catchError(() => of([]))),
      nominees: this.http
        .get<any[]>(`${environment.apiBaseUrl}/v1/policies/nominees`)
        .pipe(catchError(() => of([]))),
      kycStatus: this.http
        .get<any>(`${environment.apiBaseUrl}/v1/kyc/status`)
        .pipe(catchError(() => of(null)))
    }).pipe(
      map((data) => ({
        ...data,
        hasPolicy: data.policySummary?.hasActivePolicy ?? false,
        activePlanName: data.policySummary?.planName || data.member?.activePlan?.name || 'No Active Plan',
        insuredAmount: data.policySummary?.sumInsured || data.member?.activePlan?.insuredAmount || 0,
        dependentsCount: data.dependents?.length || 0,
        nomineesCount: data.nominees?.length || 0
      }))
    );
  }
}