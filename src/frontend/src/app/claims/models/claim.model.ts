export interface Claim {
  claimId: string;
  memberId?: string;
  planId?: string;
  claimDate: string;     // ISO string
  claimAmount?: number;  // Some backends use claimAmount
  amount: number;        // For compatibility
  status: string;
  description?: string;
  aiConfidenceScore?: number;
  aiDecision?: string;
  aiReasoning?: string;
  aiVerifiedAt?: string;
  medicalReportFileName?: string;
  medicalReportPath?: string;
  medicalReportSize?: number;
  medicalReportContentType?: string;
  createdAt?: string;
  updatedAt?: string;

  // Hospitalization / Pre-Authorization fields
  isPreAuthorization?: boolean;
  hospitalId?: string;
  hospitalName?: string;
  admissionDate?: string;
  dischargeDate?: string;
  doctorName?: string;
  diagnosis?: string;
  treatmentType?: string;
  estimatedAmount?: number;
  isCashless?: boolean;
  cashlessLimit?: number;
}
