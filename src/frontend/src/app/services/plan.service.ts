import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PublicPlan {
  planId: string;
  name: string;
  description: string;
  insuredAmount: number;
  durationInMonths: number;
  features: string[];
  isFeatured: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private readonly baseUrl =
    `${environment.apiBaseUrl}/v1/public/plans`;

  constructor(private http: HttpClient) {
    console.log('[PlanService] Base URL:', this.baseUrl);
  }

  // /src/frontend/src/app/services/plan.service.ts

getPublicPlans(): Observable<PublicPlan[]> {
    console.log('[PlanService] Fetching all plans');
    return this.http.get<PublicPlan[]>(this.baseUrl).pipe(
        tap((plans: PublicPlan[]) => {
            console.log('📋 Plans from API:', plans);
            plans.forEach(plan => {
                console.log(`Plan: ${plan.name}, ID: ${plan.planId}, Type: ${typeof plan.planId}`);
            });
        })
    );
}

  getPlanById(planId: string): Observable<PublicPlan> {
    const url = `${this.baseUrl}/${planId}`;
    console.log('[PlanService] Fetching plan by ID:', url);
    return this.http.get<PublicPlan>(url);
  }
}
