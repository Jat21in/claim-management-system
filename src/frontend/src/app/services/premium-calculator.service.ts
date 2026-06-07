import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PremiumCalculationRequest {
  planId: string;
  memberAge: number;
  isSmoker: boolean;
  hasPreExistingCondition: boolean;
  pinCode: string;
  dependentCount: number;
  dependentAgeGroups: Record<string, number>;
  premiumFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
  couponCode?: string;
  hasNoClaimBonus?: boolean;
  noClaimBonusYears?: number;
  corporateCode?: string;
}

export interface PremiumBreakdownItem {
  name: string;
  amount: number;
  type: string;
  description: string;
}

export interface PremiumCalculationResult {
  basePremium: number;
  ageLoading: number;
  smokerLoading: number;
  preExistingLoading: number;
  locationMultiplier: number;
  dependentLoading: number;
  subTotal: number;
  noClaimBonusDiscount: number;
  frequencyDiscount: number;
  corporateDiscount: number;
  couponDiscount: number;
  taxAmount: number;
  grandTotal: number;
  availableFrequencies: Record<string, number>;
  breakdownItems: PremiumBreakdownItem[];
}

@Injectable({ providedIn: 'root' })
export class PremiumCalculatorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/premium`;

  calculatePremium(request: PremiumCalculationRequest): Observable<PremiumCalculationResult> {
    return this.http.post<PremiumCalculationResult>(`${this.baseUrl}/calculate`, request);
  }
}
