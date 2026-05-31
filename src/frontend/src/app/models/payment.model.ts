export interface PaymentHistory {
  payments: PaymentRecord[];
  summary: PaymentSummary;
}

export interface PaymentRecord {
  paymentId: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  receiptUrl: string | null;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmountPaid: number;
  pendingPayments: number;
  nextPremiumAmount: number;
  nextDueDate: string | null;
}
