import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NetworkHospital {
  hospitalId: string;
  hospitalName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  contactNumber: string;
  email: string;
  cashlessLimit: number;
  consultationFee: number;
  specializations: string[];
  roomRates: Record<string, number>;
  isCashlessAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/hospitals`;

  searchNetworkHospitals(city?: string, specialization?: string): Observable<NetworkHospital[]> {
    let url = `${this.baseUrl}/network`;
    const params: string[] = [];
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (specialization) params.push(`specialization=${encodeURIComponent(specialization)}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get<NetworkHospital[]>(url);
  }

  getHospitalById(hospitalId: string): Observable<NetworkHospital> {
    return this.http.get<NetworkHospital>(`${this.baseUrl}/network/${hospitalId}`);
  }
}
