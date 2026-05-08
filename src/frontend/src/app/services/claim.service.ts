import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { Claim } from '../claims/models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {

  private baseUrl = `${environment.apiBaseUrl}/api/v1/claims`;

  private refresh$ = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {} // ✅ REQUIRED

  get refreshClaims$() {
    return this.refresh$.asObservable();
  }

  triggerRefresh() {
    this.refresh$.next();
  }

  getMyClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(this.baseUrl);
  }

  submitClaim(payload: {
  claimDate: string;
  amount: number;
  description?: string;
}) {
  return this.http.post(this.baseUrl, payload);
}
}
