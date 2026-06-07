export interface PolicySetupRequest {
  planId: string;
  premiumFrequency: PremiumFrequency;
  couponCode: string | null;
  dependents: DependentInput[];
  nominees: NomineeInput[];
}

export type PremiumFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

export interface DependentInput {
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface NomineeInput {
  fullName: string;
  relationship: string;
  percentageAllocation: number;
  guardianName: string | null;
  isPrimary: boolean;
}

export interface PremiumCalculation {
  basePremium: number;
  dependentLoading: number;
  frequencyDiscount: number;
  couponDiscount: number;
  subTotal: number;
  taxAmount: number;
  grandTotal: number;
  availableFrequencies: Record<string, number>;
}

export interface PolicySetupResponse {
  policy: {
    hasActivePolicy: boolean;
    policyNumber: string;
    planName: string;
    sumInsured: number;
    utilizedAmount: number;
    nextPremiumDueDate: string;
    nextPremiumAmount: number;
    dependentsCount: number;
    nomineesCount: number;
  };
  premiumCalculation: PremiumCalculation;
  payment: {
    paymentId: string;
    paymentUrl: string;
    orderId: string;
    amount: number;
  };
}
