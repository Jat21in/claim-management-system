import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { KycStatus } from '../models/kyc.model';

@Injectable({ providedIn: 'root' })
export class KycService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/kyc`;

  getStatus(): Observable<KycStatus> {
    return this.http.get<KycStatus>(`${this.baseUrl}/status`);
  }

  uploadDocument(documentType: number, documentNumber: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('DocumentType', documentType.toString());
    formData.append('DocumentNumber', documentNumber);
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/upload`, formData);
  }
}
