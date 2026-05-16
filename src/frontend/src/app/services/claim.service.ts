import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, Observable } from 'rxjs';

import { Claim } from '../claims/models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {

  private readonly baseUrl =
    `${environment.apiBaseUrl}/v1/claims`;

  // ✅ REFRESH STREAM (STANDARD NAME)
  private refreshSubject = new Subject<void>();

  // ✅ Expose as read‑only observable
  get refreshClaims$(): Observable<void> {
    return this.refreshSubject.asObservable();
  }

  constructor(private http: HttpClient) {}

  // ✅ GET claims
  getMyClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(this.baseUrl);
  }

  // ✅ POST claim
  submitClaim(payload: {
    claimDate: string;
    amount: number;
    description?: string;
  }) {
    return this.http.post<{ claimId: string }>(
      this.baseUrl,
      payload
    );
  }

  // ✅ Trigger refresh after submit
  triggerRefresh(): void {
    this.refreshSubject.next();
  }
}
