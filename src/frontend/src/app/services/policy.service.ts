import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Policy, PolicySummary, Dependent, Nominee } from '../models/policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/policies`;

  createPolicyFromPlan(planId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-from-plan/${planId}`, {});
  }

  getMyPolicy(): Observable<Policy> {
    return this.http.get<Policy>(`${this.baseUrl}/my-policy`);
  }

  getPolicySummary(): Observable<PolicySummary> {
    return this.http.get<PolicySummary>(`${this.baseUrl}/summary`);
  }

  addDependent(dependent: { fullName: string; relationship: string; dateOfBirth: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dependents`, dependent);
  }

  getDependents(): Observable<Dependent[]> {
    return this.http.get<Dependent[]>(`${this.baseUrl}/dependents`);
  }

  addNominee(nominee: { fullName: string; relationship: string; percentageAllocation: number; guardianName?: string; isPrimary: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/nominees`, nominee);
  }

  getNominees(): Observable<Nominee[]> {
    return this.http.get<Nominee[]>(`${this.baseUrl}/nominees`);
  }
}
