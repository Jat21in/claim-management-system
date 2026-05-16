import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

// ✅ ADD THIS
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

  // ✅ GET profile
  getDashboard(): Observable<MemberDashboardResponse> {
    return this.http.get<MemberDashboardResponse>(
      `${environment.apiBaseUrl}/v1/members/me`
    );
  }

  // ✅ UPDATE profile
  updateProfile(payload: UpdateProfileRequest) {
    return this.http.put(
      `${environment.apiBaseUrl}/v1/members/profile`,
      payload
    );
  }
}
