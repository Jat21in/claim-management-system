import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KycService } from '../../../services/kyc.service';
import { KycStatus } from '../../../models/kyc.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-kyc-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="kyc-status-container">
      <div class="breadcrumb">
        <a routerLink="/">Home</a>
        <span class="separator">/</span>
        <span class="current">KYC Status</span>
      </div>

      <!-- Pending State -->
      <div *ngIf="status?.status === 0" class="status-card pending">
        <div class="status-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <h2>Verification In Progress</h2>
        <p>Our compliance team is reviewing your documents. This typically takes 1-2 business days.</p>

        <div class="timeline">
          <div class="timeline-item completed">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">Documents Submitted</div>
              <div class="timeline-date">{{ status?.submittedAt | date:'medium' }}</div>
            </div>
          </div>
          <div class="timeline-item active">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">Under Review</div>
              <div class="timeline-date">Estimated completion: 1-2 business days</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">Verification Complete</div>
              <div class="timeline-date">Pending</div>
            </div>
          </div>
        </div>

        <div class="documents-section">
          <h3>Submitted Documents</h3>
          <div class="documents-table">
            <div class="table-header">
              <span>Document Type</span>
              <span>Document Number</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            <div class="table-row" *ngFor="let doc of status?.documents">
              <span>{{ doc.documentType }}</span>
              <span>{{ doc.documentNumber }}</span>
              <span class="status-badge pending">Pending</span>
              <span><a [href]="doc.fileUrl" target="_blank">View</a></span>
            </div>
          </div>
        </div>

        <div class="info-box">
          <strong>Next Steps</strong>
          <p>You will receive an email notification once your verification is complete. You can also check back here for updates.</p>
        </div>
      </div>

      <!-- Verified State -->
      <div *ngIf="status?.status === 1" class="status-card verified">
        <div class="status-icon verified">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2>Verification Complete</h2>
        <p>Your identity has been successfully verified. You now have full access to all features.</p>

        <div class="verified-info">
          <div class="info-card">
            <div class="info-icon">✅</div>
            <div class="info-text">
              <strong>Verified on</strong>
              <span>{{ status?.verifiedAt | date:'medium' }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon">🛡️</div>
            <div class="info-text">
              <strong>Verification ID</strong>
              <span>KYC-{{ status?.verifiedAt | date:'yyyyMMdd' }}-{{ getDocumentSuffix() }}</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button routerLink="/app/dashboard" class="btn-primary">Go to Dashboard</button>
          <button routerLink="/plans" class="btn-secondary">Browse Plans</button>
        </div>
      </div>

      <!-- Rejected State -->
      <div *ngIf="status?.status === 2" class="status-card rejected">
        <div class="status-icon rejected">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h2>Verification Failed</h2>
        <p>Your submitted documents could not be verified. Please review the reason and resubmit.</p>

        <div class="rejection-reason">
          <strong>Reason for Rejection</strong>
          <p>{{ status?.rejectionReason }}</p>
        </div>

        <div class="documents-section">
          <h3>Submitted Documents</h3>
          <div class="documents-table">
            <div class="table-header">
              <span>Document Type</span>
              <span>Document Number</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            <div class="table-row" *ngFor="let doc of status?.documents">
              <span>{{ doc.documentType }}</span>
              <span>{{ doc.documentNumber }}</span>
              <span class="status-badge rejected">Rejected</span>
              <span><a [href]="doc.fileUrl" target="_blank">View</a></span>
            </div>
          </div>
        </div>

        <div class="guidelines">
          <h4>Document Guidelines</h4>
          <ul>
            <li>Ensure document is clear and readable</li>
            <li>Document should be valid and not expired</li>
            <li>Upload the entire document (both sides if applicable)</li>
            <li>File size should not exceed 5MB</li>
            <li>Accepted formats: PDF, JPG, PNG</li>
          </ul>
        </div>

        <button routerLink="/app/kyc/upload" class="btn-primary">Re-upload Documents</button>
      </div>
    </div>
  `,
  styleUrls: ['./kyc-status.component.scss']
})
export class KycStatusComponent implements OnInit {
  private kycService = inject(KycService);
  status: KycStatus | null = null;

  ngOnInit() {
    this.loadStatus();
    // Auto-refresh every 30 seconds
    setInterval(() => this.loadStatus(), 30000);
  }



loadStatus() {
  this.kycService.getStatus().subscribe({
    next: (status) => {

      this.status = {
        ...status,

        // ✅ FIX: attach uploadBaseUrl (SAME as Admin Panel)
        documents: (status.documents || []).map(doc => ({
          ...doc,
          fileUrl: `${environment.uploadBaseUrl}${doc.fileUrl}`
        }))
      };

    },
    error: (err) => console.error('Failed to load KYC status', err)
  });
}

  getDocumentSuffix(): string {
    const id = this.status?.documents?.[0]?.documentId;
    return id ? id.slice(-6) : '';
  }
}
