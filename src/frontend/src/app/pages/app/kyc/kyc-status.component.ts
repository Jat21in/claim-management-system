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
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <h2>Verification In Progress</h2>
        <p>
          Our compliance team is reviewing your documents. This typically takes 1-2 business days.
        </p>

        <div class="timeline">
          <div class="timeline-item completed">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-title">Documents Submitted</div>
              <div class="timeline-date">{{ status?.submittedAt | date: 'medium' }}</div>
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
          <p>
            You will receive an email notification once your verification is complete. You can also
            check back here for updates.
          </p>
        </div>
      </div>

      <!-- Verified State -->
      <div *ngIf="status?.status === 1" class="status-card verified enterprise-verified">
        <!-- Background Glow -->
        <div class="verified-glow"></div>

        <!-- Success Badge -->
        <div class="success-pill">
          <span class="pulse-dot"></span>
          VERIFIED ACCOUNT
        </div>

        <!-- Main Icon -->
        <div class="status-icon verified premium">
          <svg width="86" height="86" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12.5L10.8 15.3L16.5 9.5"></path>
          </svg>
        </div>

        <!-- Heading -->
        <h2 class="verified-title">Identity Verification Complete</h2>

        <p class="verified-description">
          Your KYC verification has been successfully completed. You now have secure access to
          policy onboarding and protected platform features.
        </p>

        <!-- Enterprise Verification Panel -->
        <div class="verified-panel">
          <div class="verified-panel-header">
            <div class="header-left">
              <div class="shield-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 3L5 6V11C5 16 8.4 20.4 12 21C15.6 20.4 19 16 19 11V6L12 3Z"></path>
                </svg>
              </div>

              <div>
                <h3>Verification Approved</h3>
                <span>Compliance & Identity Validation Successful</span>
              </div>
            </div>

            <div class="verified-status-chip">Active</div>
          </div>

          <div class="verified-metrics">
            <div class="metric-card">
              <span class="metric-label">Verified On</span>
              <strong>{{ status?.verifiedAt | date: 'medium' }}</strong>
            </div>

            <div class="metric-card">
              <span class="metric-label">Verification ID</span>
              <strong
                >KYC-{{ status?.verifiedAt | date: 'yyyyMMdd' }}-{{ getDocumentSuffix() }}</strong
              >
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="action-buttons enterprise">
          <button routerLink="/app/policy-setup" class="btn-primary enterprise-btn">
            <span>Proceed to Policy Setup</span>

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12H19"></path>
              <path d="M12 5L19 12L12 19"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Rejected State -->
      <div *ngIf="status?.status === 2" class="status-card rejected">
        <div class="status-icon rejected">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h2>Verification Failed</h2>
        <p>
          Your submitted documents could not be verified. Please review the reason and resubmit.
        </p>

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
  styleUrls: ['./kyc-status.component.scss'],
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
          documents: (status.documents || []).map((doc) => ({
            ...doc,
            fileUrl: `${environment.uploadBaseUrl}${doc.fileUrl}`,
          })),
        };
      },
      error: (err) => console.error('Failed to load KYC status', err),
    });
  }

  getDocumentSuffix(): string {
    const id = this.status?.documents?.[0]?.documentId;
    return id ? id.slice(-6) : '';
  }
}
