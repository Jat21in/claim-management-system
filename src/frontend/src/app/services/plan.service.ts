import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getPublicPlans(): Observable<PublicPlan[]> {
    console.log('[PlanService] Fetching all plans');
    return this.http.get<PublicPlan[]>(this.baseUrl);
  }

  getPlanById(planId: string): Observable<PublicPlan> {
    const url = `${this.baseUrl}/${planId}`;
    console.log('[PlanService] Fetching plan by ID:', url);
    return this.http.get<PublicPlan>(url);
  }
}
