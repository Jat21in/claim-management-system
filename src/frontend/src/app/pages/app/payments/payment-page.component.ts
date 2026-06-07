import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { PolicyService } from '../../../services/policy.service';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div class="max-w-4xl mx-auto px-6 py-8">

        <!-- Header -->
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <a routerLink="/app/dashboard" class="hover:text-cyan-400 transition-colors">Dashboard</a>
          <span>/</span>
          <a routerLink="/app/payments" class="hover:text-cyan-400 transition-colors">Payments</a>
          <span>/</span>
          <span class="text-cyan-400">Pay Now</span>
        </div>

        <!-- Success Message (after payment) -->
        <div *ngIf="paymentSuccess" class="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 text-center">
          <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Payment Successful!</h2>
          <p class="text-slate-300">Your premium payment of {{ formatCurrency(amount) }} has been received.</p>
          <p class="text-slate-400 text-sm mt-1">A confirmation email has been sent to your registered email.</p>
          <div class="flex gap-4 justify-center mt-6">
            <button (click)="goToDashboard()" class="px-6 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400">Go to Dashboard</button>
            <button (click)="goToPaymentHistory()" class="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">View History</button>
          </div>
        </div>

        <!-- Payment Form (shown only when not success) -->
        <div *ngIf="!paymentSuccess" class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Payment Form -->
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
            <h2 class="text-xl font-semibold text-white mb-4">Make Payment</h2>

            <div class="space-y-4">
              <div class="bg-slate-700/50 rounded-lg p-4">
                <p class="text-slate-400 text-sm">Amount Due</p>
                <p class="text-3xl font-bold text-cyan-400">{{ formatCurrency(amount) }}</p>
                <p class="text-slate-500 text-xs" *ngIf="dueDate">Due by: {{ dueDate | date:'dd MMM yyyy' }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <div class="space-y-2">
                  <label class="flex items-center p-3 bg-slate-700/30 rounded-lg cursor-pointer border border-slate-600 hover:border-cyan-500 transition-colors"
                         [class.border-cyan-500]="paymentMethod === 'CARD'">
                    <input type="radio" [(ngModel)]="paymentMethod" value="CARD" class="mr-3 accent-cyan-500">
                    <span class="text-white">💳 Credit/Debit Card</span>
                  </label>
                  <label class="flex items-center p-3 bg-slate-700/30 rounded-lg cursor-pointer border border-slate-600 hover:border-cyan-500 transition-colors"
                         [class.border-cyan-500]="paymentMethod === 'UPI'">
                    <input type="radio" [(ngModel)]="paymentMethod" value="UPI" class="mr-3 accent-cyan-500">
                    <span class="text-white">📱 UPI (Google Pay, PhonePe, etc.)</span>
                  </label>
                  <label class="flex items-center p-3 bg-slate-700/30 rounded-lg cursor-pointer border border-slate-600 hover:border-cyan-500 transition-colors"
                         [class.border-cyan-500]="paymentMethod === 'NETBANKING'">
                    <input type="radio" [(ngModel)]="paymentMethod" value="NETBANKING" class="mr-3 accent-cyan-500">
                    <span class="text-white">🏦 Net Banking</span>
                  </label>
                </div>
              </div>

              <div *ngIf="paymentMethod === 'UPI'">
                <label class="block text-sm font-medium text-slate-300 mb-2">UPI ID</label>
                <input type="text" [(ngModel)]="upiId" placeholder="username@bank"
                       class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white">
              </div>

              <div *ngIf="paymentMethod === 'CARD'" class="space-y-3">
                <input type="text" placeholder="Card Number"
                       class="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white">
                <div class="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM/YY" class="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white">
                  <input type="text" placeholder="CVV" class="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-cyan-500 text-white">
                </div>
              </div>

              <div *ngIf="errorMessage" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {{ errorMessage }}
              </div>

              <button (click)="processPayment()" [disabled]="isProcessing"
                      class="w-full py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-all disabled:opacity-50">
                {{ isProcessing ? 'Processing...' : 'Pay ' + formatCurrency(amount) }}
              </button>

              <p class="text-center text-slate-500 text-xs mt-4">
                🔒 Secure payment powered by Razorpay. Your information is safe.
              </p>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 h-fit">
            <h3 class="text-lg font-semibold text-white mb-4">Payment Summary</h3>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-400">Premium Amount</span>
                <span class="text-white">{{ formatCurrency(amount) }}</span>
              </div>
              <div class="flex justify-between text-sm" *ngIf="lateFee > 0">
                <span class="text-slate-400">Late Fee</span>
                <span class="text-red-400">+ {{ formatCurrency(lateFee) }}</span>
              </div>
              <div class="border-t border-slate-700 my-2"></div>
              <div class="flex justify-between font-semibold">
                <span class="text-white">Total</span>
                <span class="text-cyan-400">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-700">
              <div class="flex items-start gap-3 text-xs text-slate-500">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <span>Payment is processed securely. You will receive a confirmation email once completed.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentPageComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  amount = 0;
  dueDate: Date | null = null;
  lateFee = 0;
  totalAmount = 0;
  paymentMethod = 'CARD';
  upiId = '';
  isProcessing = false;
  errorMessage = '';
  paymentSuccess = false;

  ngOnInit() {
    this.loadPaymentDetails();
  }

  private loadPaymentDetails() {
    this.policyService.getPolicySummary().subscribe({
      next: (summary) => {
        if (summary.nextPremiumAmount && summary.nextPremiumAmount > 0) {
          this.amount = summary.nextPremiumAmount;
          this.totalAmount = this.amount;
          if (summary.nextPremiumDueDate) {
            this.dueDate = new Date(summary.nextPremiumDueDate);
            const daysOverdue = Math.ceil((new Date().getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysOverdue > 0) {
              this.lateFee = this.amount * 0.05;
              this.totalAmount = this.amount + this.lateFee;
            }
          }
        } else {
          // No payment due - redirect to history
          this.router.navigate(['/app/payments']);
        }
      },
      error: (error) => {
        console.error('Failed to load payment details:', error);
        this.router.navigate(['/app/payments']);
      }
    });
  }

  processPayment() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.errorMessage = '';

    this.paymentService.initiatePayment(this.paymentMethod).subscribe({
      next: (response) => {
        this.paymentService.processMockPayment(response.paymentId).subscribe({
          next: (result) => {
            this.isProcessing = false;
            this.paymentSuccess = true;

            // Clear cache and refresh policy data
            this.policyService.clearCache();

            // Auto-redirect after 3 seconds
            setTimeout(() => {
              this.goToDashboard();
            }, 3000);
          },
          error: (error) => {
            this.errorMessage = 'Payment failed. Please try again.';
            this.isProcessing = false;
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to initiate payment. Please try again.';
        this.isProcessing = false;
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/app/dashboard'], {
      queryParams: { paymentSuccess: true, amount: this.amount }
    });
  }

  goToPaymentHistory() {
    this.router.navigate(['/app/payments']);
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
