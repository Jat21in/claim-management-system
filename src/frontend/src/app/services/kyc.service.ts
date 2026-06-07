import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { KycStatus } from '../models/kyc.model';

@Injectable({ providedIn: 'root' })
export class KycService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/kyc`;

  getStatus(): Observable<KycStatus> {
    return this.http.get<KycStatus>(`${this.baseUrl}/status`).pipe(
      catchError((error) => {
        console.error('Error fetching KYC status:', error);
        // Return default pending status
        return of({
          status: 0,
          hasSubmittedDocuments: false,
          submittedAt: null,
          verifiedAt: null,
          rejectionReason: null,
          documents: []
        });
      })
    );
  }

  uploadDocument(documentType: number, documentNumber: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('DocumentType', documentType.toString());
    formData.append('DocumentNumber', documentNumber);
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/upload`, formData);
  }
}
