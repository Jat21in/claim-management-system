import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KycService } from '../../../services/kyc.service';
import { KycStatus } from '../../../models/kyc.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kyc-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="status-container">
      <div class="status-card" [class.verified]="status?.status === 1" [class.pending]="status?.status === 0" [class.rejected]="status?.status === 2">
        <div class="status-icon">
          <span *ngIf="status?.status === 1">✅</span>
          <span *ngIf="status?.status === 0">⏳</span>
          <span *ngIf="status?.status === 2">❌</span>
        </div>

        <h2>KYC Status:
          <span *ngIf="status?.status === 1">Verified</span>
          <span *ngIf="status?.status === 0">Pending Verification</span>
          <span *ngIf="status?.status === 2">Rejected</span>
        </h2>

        <div *ngIf="status?.status === 0" class="info">
          <p>Your documents are under review. You'll receive an email once verified.</p>
          <p *ngIf="status?.submittedAt">Submitted on: {{ status?.submittedAt | date:'medium' }}</p>
        </div>

        <div *ngIf="status?.status === 2" class="error-info">
          <p>Your KYC was rejected.</p>
          <p *ngIf="status?.rejectionReason">Reason: {{ status?.rejectionReason }}</p>
          <button routerLink="/app/kyc/upload" class="btn-retry">Re-upload Documents</button>
        </div>

        <div *ngIf="status?.status === 1" class="success-info">
          <p>Your account is verified! You can now:</p>
          <ul>
            <li>Purchase insurance plans</li>
            <li>Add family members as dependents</li>
            <li>Nominate beneficiaries</li>
            <li>Submit claims</li>
          </ul>
          <button routerLink="/app/dashboard" class="btn-dashboard">Go to Dashboard</button>
        </div>

        <div class="documents" *ngIf="status?.documents?.length">
          <h3>Uploaded Documents</h3>
          <div *ngFor="let doc of status?.documents" class="document-item">
            <span>{{ doc.documentType }}: {{ doc.documentNumber }}</span>
            <!-- ✅ FIX: Show PENDING badge instead of Verified -->
            <span class="status-badge" [class.pending]="!doc.isVerified" [class.verified]="doc.isVerified">
              {{ doc.isVerified ? '✓ Verified' : '⏳ Pending' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 20px; }
    .status-card { background: #1a1a2e; padding: 2rem; border-radius: 1rem; width: 100%; max-width: 600px; text-align: center; }
    .status-icon { font-size: 4rem; margin-bottom: 1rem; }
    .verified { border-left: 4px solid #10b981; }
    .pending { border-left: 4px solid #f59e0b; }
    .rejected { border-left: 4px solid #ef4444; }
    .btn-retry, .btn-dashboard { margin-top: 1rem; padding: 0.75rem 1.5rem; background: #22D3EE; color: black; border: none; border-radius: 0.5rem; cursor: pointer; }
    .documents { margin-top: 2rem; text-align: left; }
    .document-item { display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #2a2a3e; }
    .status-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .status-badge.verified { background: #10b98120; color: #10b981; }
    .status-badge.pending { background: #f59e0b20; color: #f59e0b; }
    .info, .error-info, .success-info { margin: 1rem 0; text-align: left; }
    ul { margin-top: 0.5rem; padding-left: 1.5rem; }
    li { margin: 0.5rem 0; }
  `]
})
export class KycStatusComponent implements OnInit {
  private kycService = inject(KycService);
  status: KycStatus | null = null;

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.kycService.getStatus().subscribe({
      next: (status) => {
        this.status = status;
        console.log('KYC Status loaded:', status);
      },
      error: (err) => console.error('Failed to load KYC status', err)
    });
  }
}
