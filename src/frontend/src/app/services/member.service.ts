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

@Injectable({ providedIn: 'root' })
export class MemberService {
  private http = inject(HttpClient);

  getDashboard(): Observable<MemberDashboardResponse> {
    return this.http.get<MemberDashboardResponse>(
      `${environment.apiBaseUrl}/v1/members/me`
    );
  }
}

