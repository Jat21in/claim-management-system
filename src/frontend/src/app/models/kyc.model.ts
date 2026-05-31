export interface KycStatus {
  status: number; // 0=Pending, 1=Verified, 2=Rejected
  hasSubmittedDocuments: boolean;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  documents: KycDocument[];
}

export interface KycDocument {
  documentId: string;
  documentType: string;
  documentNumber: string;
  isVerified: boolean;
  rejectionReason: string | null;
  uploadedAt: string;
  fileUrl: string;
}
