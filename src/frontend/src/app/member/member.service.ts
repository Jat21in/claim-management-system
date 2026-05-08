import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface MemberProfile {
  fullName: string;
  email: string;
  dateOfBirth: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactNumber?: string;
  planId?: string;
}

@Injectable({ providedIn: 'root' })
export class MemberService {

  private base = `${environment.apiBaseUrl}/api/v1/members`;

  constructor(private http: HttpClient) {}

  // ✅ Get my profile
  // getMyProfile(): Observable<MemberProfile> {
  //   return this.http.get<MemberProfile>(`${this.base}/me`);
  // }

  // ✅ Update my profile
  updateProfile(payload: any): Observable<void> {
    return this.http.put<void>(`${this.base}/profile`, payload);
  }
}
