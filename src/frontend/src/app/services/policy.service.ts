import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Policy, PolicySummary, Dependent, Nominee } from '../models/policy.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/policies`;

  createPolicyFromPlan(planId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-from-plan/${planId}`, {});
  }

  getMyPolicy(): Observable<Policy | null> {
    return this.http.get<Policy>(`${this.baseUrl}/my-policy`).pipe(
      catchError((error) => {
        console.error('Error fetching policy:', error);
        return of(null);
      })
    );
  }

  getPolicySummary(): Observable<PolicySummary> {
    return this.http.get<PolicySummary>(`${this.baseUrl}/summary`).pipe(
      catchError((error) => {
        console.error('Error fetching policy summary:', error);
        // Return default summary indicating no active policy
        return of({
          hasActivePolicy: false,
          policyNumber: undefined,
          planName: undefined,
          sumInsured: undefined,
          utilizedAmount: undefined,
          nextPremiumDueDate: undefined,
          nextPremiumAmount: undefined,
          dependentsCount: undefined,
          nomineesCount: undefined
        });
      })
    );
  }

  addDependent(dependent: { fullName: string; relationship: string; dateOfBirth: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/dependents`, dependent);
  }

  getDependents(): Observable<Dependent[]> {
    return this.http.get<Dependent[]>(`${this.baseUrl}/dependents`).pipe(
      catchError(() => of([]))
    );
  }

  addNominee(nominee: { fullName: string; relationship: string; percentageAllocation: number; guardianName?: string; isPrimary: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/nominees`, nominee);
  }

  getNominees(): Observable<Nominee[]> {
    return this.http.get<Nominee[]>(`${this.baseUrl}/nominees`).pipe(
      catchError(() => of([]))
    );
  }
}
