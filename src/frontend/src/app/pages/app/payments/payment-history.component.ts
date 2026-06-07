import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { PaymentHistory, PaymentRecord } from '../../../models/payment.model';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div class="max-w-7xl mx-auto px-6 py-8">

        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <a routerLink="/app/dashboard" class="hover:text-cyan-400 transition-colors">Dashboard</a>
              <span>/</span>
              <span class="text-cyan-400">Payment History</span>
            </div>
            <h1 class="text-2xl font-bold text-white">Payment History</h1>
            <p class="text-slate-400 text-sm mt-1">Track all your premium payments</p>
          </div>
          <a routerLink="/app/dashboard" class="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            ← Back
          </a>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>

        <!-- Summary Cards -->
        <div *ngIf="!isLoading && paymentHistory" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <p class="text-slate-400 text-sm">Total Payments</p>
            <p class="text-2xl font-bold text-white">{{ paymentHistory.summary.totalPayments }}</p>
          </div>
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <p class="text-slate-400 text-sm">Total Amount Paid</p>
            <p class="text-2xl font-bold text-green-400">{{ formatCurrency(paymentHistory.summary.totalAmountPaid) }}</p>
          </div>
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <p class="text-slate-400 text-sm">Pending Payments</p>
            <p class="text-2xl font-bold text-amber-400">{{ paymentHistory.summary.pendingPayments }}</p>
          </div>
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <p class="text-slate-400 text-sm">Next Premium Due</p>
            <p class="text-2xl font-bold text-cyan-400">{{ formatCurrency(paymentHistory.summary.nextPremiumAmount) }}</p>
            <p class="text-slate-500 text-xs" *ngIf="paymentHistory.summary.nextDueDate">
              Due: {{ paymentHistory.summary.nextDueDate | date:'dd MMM yyyy' }}
            </p>
          </div>
        </div>

        <!-- Payment Table -->
        <div *ngIf="!isLoading && paymentHistory?.payments?.length" class="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-700/50 border-b border-slate-600">
                <tr>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Date</th>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Due Date</th>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Amount</th>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Method</th>
                  <th class="text-left py-3 px-4 text-slate-300 font-medium">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of paymentHistory?.payments" class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td class="py-3 px-4 text-white">{{ payment.paymentDate | date:'dd MMM yyyy' }}</td>
                  <td class="py-3 px-4 text-slate-300">{{ payment.dueDate | date:'dd MMM yyyy' }}</td>
                  <td class="py-3 px-4 text-white font-medium">{{ formatCurrency(payment.amount) }}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                          [class.bg-green-500/20]="payment.status === 'Completed'"
                          [class.text-green-400]="payment.status === 'Completed'"
                          [class.bg-yellow-500/20]="payment.status === 'Pending'"
                          [class.text-yellow-400]="payment.status === 'Pending'"
                          [class.bg-red-500/20]="payment.status === 'Failed'"
                          [class.text-red-400]="payment.status === 'Failed'">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class.bg-green-400]="payment.status === 'Completed'"
                            [class.bg-yellow-400]="payment.status === 'Pending'"
                            [class.bg-red-400]="payment.status === 'Failed'"></span>
                      {{ payment.status }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-300">{{ payment.paymentMethod || '-' }}</td>
                  <td class="py-3 px-4 text-slate-400 text-xs font-mono">{{ payment.transactionId || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && (!paymentHistory?.payments?.length)" class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-12 text-center">
          <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-white mb-2">No Payment History</h3>
          <p class="text-slate-400">You haven't made any payments yet.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);

  isLoading = true;
  paymentHistory: PaymentHistory | null = null;

  ngOnInit() {
    this.loadPaymentHistory();
  }

  private loadPaymentHistory() {
    this.paymentService.getPaymentHistory().subscribe({
      next: (history) => {
        this.paymentHistory = history;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load payment history:', error);
        this.isLoading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
