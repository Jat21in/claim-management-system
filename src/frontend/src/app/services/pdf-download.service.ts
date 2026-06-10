import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PdfDownloadService {
  private http = inject(HttpClient);

  downloadPolicyCertificate(policyId: string): Observable<Blob> {
    console.log('Downloading policy certificate for ID:', policyId);
    return this.http.get(`${environment.apiBaseUrl}/v1/policies/${policyId}/certificate`, {
      responseType: 'blob'
    });
  }

  downloadPaymentReceipt(paymentId: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/v1/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });
  }

  downloadClaimSettlement(claimId: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/v1/claims/${claimId}/settlement-letter`, {
      responseType: 'blob'
    });
  }

  downloadGstInvoice(paymentId: string): Observable<Blob> {
    console.log('Downloading GST invoice for payment ID:', paymentId);
    return this.http.get(`${environment.apiBaseUrl}/v1/payments/${paymentId}/gst-invoice`, {
      responseType: 'blob'
    });
  }

  getRecentPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiBaseUrl}/v1/payments/recent`);
  }

  saveAs(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}