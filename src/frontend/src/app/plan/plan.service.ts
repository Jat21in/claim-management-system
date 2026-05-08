import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {

  private base = `${environment.apiBaseUrl}/api/v1/plans`;

  constructor(private http: HttpClient) {}

  // ✅ FIRST-TIME PLAN ASSIGNMENT
 assignPlan(planId: string): Observable<void> {
  return this.http.post<void>(`${this.base}/assign`, {
    planId
  });
}


  // ✅ UPDATE EXISTING ACTIVE PLAN
  updatePlan(payload: any): Observable<void> {
    return this.http.put<void>(`${this.base}/update`, payload);
  }
}
