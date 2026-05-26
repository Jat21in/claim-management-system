import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-claims',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Pending Claims</h1>
      <button (click)="loadPending()" class="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700">
        🔄 Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div *ngIf="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p class="mt-2">Loading claims...</p>
    </div>

    <!-- Claims Table -->
    <div *ngIf="!loading" class="overflow-x-auto">
      <div *ngIf="pendingClaims.length === 0" class="bg-gray-800 p-8 rounded-lg text-center">
        <svg class="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-gray-400">No pending claims found</p>
        <p class="text-gray-500 text-sm mt-2">All claims have been processed</p>
      </div>

      <table *ngIf="pendingClaims.length > 0" class="min-w-full bg-gray-800 rounded-lg overflow-hidden">
        <thead class="bg-gray-900">
          <tr>
            <th class="p-3 text-left text-gray-300">Claim ID</th>
            <th class="p-3 text-left text-gray-300">Member</th>
            <th class="p-3 text-left text-gray-300">Date</th>
            <th class="p-3 text-left text-gray-300">Amount</th>
            <th class="p-3 text-left text-gray-300">Description</th>
            <th class="p-3 text-left text-gray-300">Actions</th>
           </tr>
        </thead>
        <tbody>
          <tr *ngFor="let claim of pendingClaims" class="border-t border-gray-700 hover:bg-gray-750">
            <td class="p-3 font-mono text-sm">{{ (claim.claimId || claim.ClaimId) | slice:0:8 }}...</td>
            <td class="p-3 font-medium">{{ claim.memberName || claim.MemberName || claim.member?.fullName || 'Unknown' }}</td>
            <td class="p-3">{{ (claim.claimDate || claim.ClaimDate) | date:'MMM d, yyyy' }}</td>
            <td class="p-3 font-semibold text-green-400">
              ₹{{ (claim.amount || claim.Amount || claim.claimAmount?.amount) | number:'1.2-2' }}
            </td>
            <td class="p-3 text-gray-300 max-w-xs truncate">{{ claim.description || claim.Description || 'No description' }}</td>
            <td class="p-3 space-x-2">
              <button (click)="approve(claim.claimId || claim.ClaimId)"
                      class="bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-sm"
                      [disabled]="processing[(claim.claimId || claim.ClaimId)]">
                {{ processing[(claim.claimId || claim.ClaimId)] ? '...' : '✅ Approve' }}
              </button>
              <button (click)="reject(claim.claimId || claim.ClaimId)"
                      class="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm"
                      [disabled]="processing[(claim.claimId || claim.ClaimId)]">
                {{ processing[(claim.claimId || claim.ClaimId)] ? '...' : '❌ Reject' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Success/Error Messages -->
    <div *ngIf="message" class="fixed bottom-4 right-4 p-3 rounded shadow-lg z-50"
         [class.bg-green-600]="messageType === 'success'"
         [class.bg-red-600]="messageType === 'error'">
      {{ message }}
    </div>
  `
})
export class AdminClaimsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  pendingClaims: any[] = [];
  processing: { [key: string]: boolean } = {};
  message: string | null = null;
  messageType: 'success' | 'error' = 'success';

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.loading = true;
    console.log('Fetching pending claims...');

    this.http.get(`${environment.apiBaseUrl}/admin/claims/pending`).subscribe({
      next: (res: any) => {
        console.log('Pending claims response:', res);

        // Handle different response structures
        let claims = res;
        if (res && res.data) claims = res.data;
        if (res && res.$values) claims = res.$values;

        this.pendingClaims = Array.isArray(claims) ? claims : [];
        console.log(`Loaded ${this.pendingClaims.length} pending claims`);
        console.log('First claim sample:', this.pendingClaims[0]);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load pending claims:', err);
        this.showMessage('Failed to load pending claims', 'error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approve(claimId: string) {
    if (!claimId) {
      this.showMessage('Invalid claim ID', 'error');
      return;
    }

    this.processing[claimId] = true;
    this.cdr.detectChanges();

    this.http.post(`${environment.apiBaseUrl}/admin/claims/${claimId}/approve`, {
      comments: "Approved by admin"
    }).subscribe({
      next: () => {
        this.showMessage('Claim approved successfully!', 'success');
        this.loadPending();
        delete this.processing[claimId];
      },
      error: (err) => {
        console.error('Approve failed:', err);
        this.showMessage(err.error?.message || 'Failed to approve claim', 'error');
        delete this.processing[claimId];
        this.cdr.detectChanges();
      }
    });
  }

  reject(claimId: string) {
    if (!claimId) {
      this.showMessage('Invalid claim ID', 'error');
      return;
    }

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    this.processing[claimId] = true;
    this.cdr.detectChanges();

    this.http.post(`${environment.apiBaseUrl}/admin/claims/${claimId}/reject`, {
      reason: reason
    }).subscribe({
      next: () => {
        this.showMessage('Claim rejected successfully!', 'success');
        this.loadPending();
        delete this.processing[claimId];
      },
      error: (err) => {
        console.error('Reject failed:', err);
        this.showMessage(err.error?.message || 'Failed to reject claim', 'error');
        delete this.processing[claimId];
        this.cdr.detectChanges();
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = null;
      this.cdr.detectChanges();
    }, 3000);
  }
}
