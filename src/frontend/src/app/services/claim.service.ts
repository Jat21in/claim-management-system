import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subject, Observable, map } from 'rxjs';
import { Claim } from '../claims/models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {

  private readonly baseUrl = `${environment.apiBaseUrl}/v1/claims`;

  // Refresh stream
  private refreshSubject = new Subject<void>();

  // Expose as read‑only observable
  get refreshClaims$(): Observable<void> {
    return this.refreshSubject.asObservable();
  }

  constructor(private http: HttpClient) {}

  // GET claims with field mapping (Updated to include hospitalization fields)
  getMyClaims(): Observable<Claim[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(claims => claims.map(claim => ({
        claimId: claim.claimId || claim.id,
        memberId: claim.memberId,
        planId: claim.planId,
        claimDate: claim.claimDate,
        amount: claim.amount || claim.claimAmount || 0,
        status: claim.status || 'Submitted',
        description: claim.description,
        aiConfidenceScore: claim.aiConfidenceScore,
        aiDecision: claim.aiDecision,
        aiReasoning: claim.aiReasoning,
        aiVerifiedAt: claim.aiVerifiedAt,
        medicalReportFileName: claim.medicalReportFileName,
        medicalReportPath: claim.medicalReportPath,
        medicalReportSize: claim.medicalReportSize,
        medicalReportContentType: claim.medicalReportContentType,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        // Hospitalization fields
        isPreAuthorization: claim.isPreAuthorization,
        hospitalId: claim.hospitalId,
        hospitalName: claim.hospitalName,
        admissionDate: claim.admissionDate,
        dischargeDate: claim.dischargeDate,
        doctorName: claim.doctorName,
        diagnosis: claim.diagnosis,
        treatmentType: claim.treatmentType,
        estimatedAmount: claim.estimatedAmount,
        isCashless: claim.isCashless,
        cashlessLimit: claim.cashlessLimit
      })))
    );
  }

  // POST claim with JSON (without file)
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

  // POST claim with file upload - multipart/form-data
  submitClaimWithFile(formData: FormData): Observable<{ claimId: string; message?: string }> {
    return this.http.post<{ claimId: string; message?: string }>(
      this.baseUrl,
      formData
    );
  }

  // ========== NEW: Pre-Authorization for Hospitalization ==========
  submitPreAuthorization(payload: {
    admissionDate: string;
    hospitalId: string;
    hospitalName: string;
    doctorName: string;
    diagnosis: string;
    treatmentType: string;
    estimatedAmount: number;
    description: string;
  }): Observable<{
    claimId: string;
    status: string;
    message: string;
    cashlessEligible: boolean;
    cashlessLimit: number
  }> {
    return this.http.post<any>(`${this.baseUrl}/pre-authorize`, payload);
  }

  // ========== NEW: Submit final claim with bills after discharge ==========
  submitClaimWithBills(formData: FormData): Observable<{ claimId: string; message?: string }> {
    return this.http.post<{ claimId: string; message?: string }>(
      `${this.baseUrl}/submit-with-bills`,
      formData
    );
  }

  // Get medical report for a claim
  getMedicalReport(claimId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${claimId}/medical-report`, {
      responseType: 'blob'
    });
  }

  // Trigger refresh after submit
  triggerRefresh(): void {
    this.refreshSubject.next();
  }
}
