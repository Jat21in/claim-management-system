import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-kyc-container">
      <h1 class="page-title">KYC Verification Requests</h1>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading pending requests...</p>
      </div>

      <div *ngIf="!loading && pendingRequests.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>No Pending Requests</h3>
        <p>All KYC requests have been processed.</p>
      </div>

      <div class="requests-grid" *ngIf="!loading && pendingRequests.length > 0">
        <div class="request-card" *ngFor="let request of pendingRequests">
          <div class="request-header">
            <h3>{{ request.fullName }}</h3>
            <span class="submitted-date">{{ request.submittedAt | date:'medium' }}</span>
          </div>

          <div class="request-details">
            <p><strong>Email:</strong> {{ request.email }}</p>
            <p><strong>Member ID:</strong> {{ request.memberId }}</p>
          </div>

          <div class="documents-section">
            <h4>Uploaded Documents</h4>
            <div class="document-list">
              <div class="document-item" *ngFor="let doc of request.documents">
                <span class="doc-type">{{ doc.documentType }}</span>
                <span class="doc-number">{{ doc.documentNumber }}</span>
                <a [href]="doc.fileUrl" target="_blank" class="view-link">View Document →</a>
              </div>
            </div>
          </div>

          <div class="request-actions">
            <textarea
              [(ngModel)]="request.rejectionReason"
              placeholder="Rejection reason (required for rejection)"
              class="rejection-input"
              *ngIf="showRejectInput === request.memberId">
            </textarea>
            <div class="action-buttons">
              <button class="btn-approve" (click)="approve(request.memberId)">✓ Approve KYC</button>
              <button class="btn-reject" (click)="showReject(request.memberId)">✗ Reject KYC</button>
              <button class="btn-confirm-reject" *ngIf="showRejectInput === request.memberId" (click)="reject(request.memberId)">Confirm Rejection</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-kyc-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-title { font-size: 28px; font-weight: 700; margin-bottom: 2rem; color: #22D3EE; }
    .loading-state { text-align: center; padding: 3rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #2a2a3e; border-top-color: #22D3EE; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 3rem; background: #1a1a2e; border-radius: 1rem; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .requests-grid { display: flex; flex-direction: column; gap: 1.5rem; }
    .request-card { background: #1a1a2e; border-radius: 1rem; padding: 1.5rem; border: 1px solid #2a2a3e; }
    .request-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .request-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
    .submitted-date { font-size: 12px; color: #888; }
    .request-details { margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #2a2a3e; }
    .request-details p { margin: 0.25rem 0; font-size: 14px; }
    .documents-section h4 { font-size: 14px; margin-bottom: 0.5rem; color: #22D3EE; }
    .document-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .document-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #0f0f1a; border-radius: 0.5rem; }
    .doc-type { font-weight: 600; font-size: 13px; }
    .doc-number { font-size: 12px; color: #888; }
    .view-link { color: #22D3EE; text-decoration: none; font-size: 12px; }
    .view-link:hover { text-decoration: underline; }
    .request-actions { margin-top: 1rem; }
    .rejection-input { width: 100%; padding: 0.5rem; background: #0f0f1a; border: 1px solid #2a2a3e; border-radius: 0.5rem; color: white; margin-bottom: 0.5rem; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-approve, .btn-reject, .btn-confirm-reject { padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    .btn-approve { background: #10b981; color: white; }
    .btn-approve:hover { background: #059669; }
    .btn-reject { background: #ef4444; color: white; }
    .btn-reject:hover { background: #dc2626; }
    .btn-confirm-reject { background: #f59e0b; color: black; }
  `]
})
export class AdminKycComponent implements OnInit {
  private http = inject(HttpClient);

  loading = true;
  pendingRequests: any[] = [];
  showRejectInput: string | null = null;

  ngOnInit() {
    this.loadPendingRequests();
  }

  loadPendingRequests() {
  this.loading = true;

  this.http.get(`${environment.apiBaseUrl}/admin/kyc/pending`).subscribe({
    next: (res: any) => {

      this.pendingRequests = res.map((request: any) => ({
        ...request,
        documents: request.documents.map((doc: any) => ({
          ...doc,

          // ✅ FIX HERE
          fileUrl: `${environment.apiBaseUrl}${doc.fileUrl}`
        }))
      }));

      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load pending KYC:', err);
      this.loading = false;
    }
  });
}

  showReject(memberId: string) {
    this.showRejectInput = memberId;
  }

  approve(memberId: string) {
    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${memberId}/approve`, {}).subscribe({
      next: () => {
        alert('KYC approved successfully!');
        this.loadPendingRequests();
      },
      error: (err) => {
        console.error('Failed to approve KYC:', err);
        alert('Failed to approve KYC');
      }
    });
  }

  reject(memberId: string) {
    const request = this.pendingRequests.find(r => r.memberId === memberId);
    if (!request?.rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${memberId}/reject`, {
      reason: request.rejectionReason
    }).subscribe({
      next: () => {
        alert('KYC rejected successfully!');
        this.showRejectInput = null;
        this.loadPendingRequests();
      },
      error: (err) => {
        console.error('Failed to reject KYC:', err);
        alert('Failed to reject KYC');
      }
    });
  }
}
