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
  // Premium calculation fields
  basePremiumAnnual?: number;
  dependentLoadingPercentage?: number;
  maxDependentsAllowed?: number;
  maxNomineesAllowed?: number;
  ageLoadingPercentage?: number;
  smokerLoadingPercentage?: number;
  preExistingConditionLoading?: number;
  locationRiskMultiplier?: number;
  corporateDiscountPercentage?: number;
  isFamilyFloater?: boolean;
}


@Injectable({ providedIn: 'root' })
export class PlanService {
  // ✅ Correct base URL – no '/public'
  private base = `${environment.apiBaseUrl}/v1/plans`;

  constructor(private http: HttpClient) {
    console.log('[PlanService] Base URL:', this.base); // should log without /public
  }

  // Get all public plans (still uses public endpoint)
  getPublicPlans(): Observable<PublicPlan[]> {
    // ✅ Public plans endpoint is separate
    return this.http.get<PublicPlan[]>(`${environment.apiBaseUrl}/v1/public/plans`);
  }

  getPlanById(planId: string): Observable<PublicPlan> {
    return this.http.get<PublicPlan>(`${environment.apiBaseUrl}/v1/public/plans/${planId}`);
  }

  // ✅ Assign a new plan (authenticated)
  assignPlan(planId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/assign`, { planId });
  }

  // ✅ Update current plan (authenticated)
  updatePlan(payload: { endDate: string; insuredAmount: number }): Observable<void> {
    return this.http.put<void>(`${this.base}/update`, payload);
  }
}
