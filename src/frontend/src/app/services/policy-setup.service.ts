import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { PolicySetupRequest, PolicySetupResponse, PremiumCalculation } from '../models/policy-setup.model';
import { PublicPlan } from './plan.service';

@Injectable({ providedIn: 'root' })
export class PolicySetupService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/v1/policies`;

  setupPolicyWithPayment(request: PolicySetupRequest): Observable<PolicySetupResponse> {
    return this.http.post<PolicySetupResponse>(`${this.baseUrl}/setup-with-payment`, request);
  }

  calculatePremiumPreview(
    plan: PublicPlan,
    dependentCount: number,
    frequency: string,
    couponCode?: string
  ): Observable<PremiumCalculation> {
    // Get plan properties that may not be in PublicPlan interface
    const planAny = plan as any;
    const basePremium = planAny.basePremiumAnnual || 45000;
    const dependentLoadingPercentage = planAny.dependentLoadingPercentage || 25;

    // Calculate dependent loading
    const dependentLoading = (basePremium * dependentLoadingPercentage / 100) * dependentCount;
    let subtotal = basePremium + dependentLoading;

    // Frequency discounts
    const frequencyDiscounts: Record<string, number> = {
      'MONTHLY': 0,
      'QUARTERLY': 0.03,
      'HALF_YEARLY': 0.08,
      'YEARLY': 0.12
    };

    const frequencyDiscount = subtotal * (frequencyDiscounts[frequency] || 0);
    subtotal -= frequencyDiscount;

    // Coupon discounts
    let couponDiscount = 0;
    if (couponCode) {
      const upperCode = couponCode.toUpperCase();
      if (upperCode === 'WELCOME20') {
        couponDiscount = subtotal * 0.20;
      } else if (upperCode === 'FIRST10') {
        couponDiscount = subtotal * 0.10;
      } else if (upperCode === 'HEALTH15') {
        couponDiscount = subtotal * 0.15;
      }
    }

    subtotal -= couponDiscount;
    const taxAmount = subtotal * 0.18;
    const grandTotal = subtotal + taxAmount;

    // Calculate available frequencies
    const availableFrequencies: Record<string, number> = {};
    for (const [freq, discount] of Object.entries(frequencyDiscounts)) {
      let amount = basePremium + dependentLoading;
      amount = amount * (1 - discount);
      if (couponCode) {
        const upperCode = couponCode.toUpperCase();
        if (upperCode === 'WELCOME20') amount = amount * 0.80;
        else if (upperCode === 'FIRST10') amount = amount * 0.90;
        else if (upperCode === 'HEALTH15') amount = amount * 0.85;
      }
      amount = amount + (amount * 0.18);
      availableFrequencies[freq] = amount;
    }

    return of({
      basePremium,
      dependentLoading,
      frequencyDiscount,
      couponDiscount,
      subTotal: subtotal,
      taxAmount,
      grandTotal,
      availableFrequencies
    });
  }
}
