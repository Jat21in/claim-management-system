export interface Policy {
  policyId: string;
  policyNumber: string;
  status: number;
  startDate: string;
  endDate: string;
  monthlyPremium: number;
  sumInsured: number;
  utilizedAmount: number;
  remainingAmount: number;
  planName: string;
  dependents: Dependent[];
  nominees: Nominee[];
}

export interface Dependent {
  dependentId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  isActive: boolean;
}

export interface Nominee {
  nomineeId: string;
  fullName: string;
  relationship: string;
  percentageAllocation: number;
  guardianName: string | null;
  isPrimary: boolean;
}

export interface PolicySummary {
  hasActivePolicy: boolean;
  policyNumber?: string;
  planName?: string;
  sumInsured?: number;
  utilizedAmount?: number;
  nextPremiumDueDate?: string;
  nextPremiumAmount?: number;
  dependentsCount?: number;
  nomineesCount?: number;
  isPremiumPaidForCurrentMonth?: boolean;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}
