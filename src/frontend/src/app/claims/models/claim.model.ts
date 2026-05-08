export interface Claim {
  claimId: string;
  claimDate: string;   // ISO date from API
  amount: number;      // maps to claimamount
  status: string;
}
