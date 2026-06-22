import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PublicPlan {
  planId: string;
  name: string;
  description: string;
  insuredAmount: number;
  durationInMonths: number;
  features: string[];
  isFeatured: boolean;
  // ✅ ADD THESE FIELDS FROM BACKEND
  basePremiumAnnual: number;
  dependentLoadingPercentage: number;
  maxDependentsAllowed: number;
  maxNomineesAllowed: number;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private base = `${environment.apiBaseUrl}/v1/plans`;

  constructor(private http: HttpClient) {
    console.log('[PlanService] Base URL:', this.base);
  }

  getPublicPlans(): Observable<PublicPlan[]> {
    return this.http.get<PublicPlan[]>(`${environment.apiBaseUrl}/v1/public/plans`);
  }

  getPlanById(planId: string): Observable<PublicPlan> {
    return this.http.get<PublicPlan>(`${environment.apiBaseUrl}/v1/public/plans/${planId}`);
  }

  assignPlan(planId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/assign`, { planId });
  }

  updatePlan(payload: { endDate: string; insuredAmount: number }): Observable<void> {
    return this.http.put<void>(`${this.base}/update`, payload);
  }
}