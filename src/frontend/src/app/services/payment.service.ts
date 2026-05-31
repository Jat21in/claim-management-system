import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentHistory } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/payments`;

  initiatePayment(paymentMethod: string = 'Mock'): Observable<{ paymentId: string; amount: number; dueDate: string }> {
    return this.http.post<{ paymentId: string; amount: number; dueDate: string }>(`${this.baseUrl}/initiate`, { paymentMethod });
  }

  processMockPayment(paymentId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/mock/${paymentId}`, {});
  }

  getPaymentHistory(): Observable<PaymentHistory> {
    return this.http.get<PaymentHistory>(`${this.baseUrl}/history`);
  }
}
