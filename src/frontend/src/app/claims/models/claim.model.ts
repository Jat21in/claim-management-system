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
}
