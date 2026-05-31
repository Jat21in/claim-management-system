import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KycService } from '../../../services/kyc.service';

@Component({
  selector: 'app-kyc-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kyc-container">
      <div class="kyc-card">
        <h2>Complete KYC Verification</h2>
        <p>Please upload your documents to activate your account</p>

        <div class="form-group">
          <label>Document Type</label>
          <select [(ngModel)]="documentType" class="form-control">
            <option [value]="0">Aadhaar Card</option>
            <option [value]="1">PAN Card</option>
            <option [value]="2">Passport</option>
          </select>
        </div>

        <div class="form-group">
          <label>Document Number</label>
          <input type="text" [(ngModel)]="documentNumber" class="form-control" placeholder="Enter document number" />
        </div>

        <div class="form-group">
          <label>Upload Document</label>
          <input type="file" (change)="onFileSelected($event)" class="form-control" accept=".pdf,.jpg,.jpeg,.png" />
          <small>Supported formats: PDF, JPG, PNG (Max 5MB)</small>
        </div>

        <div *ngIf="error" class="error-message">{{ error }}</div>
        <div *ngIf="success" class="success-message">{{ success }}</div>

        <button (click)="upload()" [disabled]="loading || !selectedFile" class="btn-primary">
          {{ loading ? 'Uploading...' : 'Submit KYC' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .kyc-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
    .kyc-card { background: #1a1a2e; padding: 2rem; border-radius: 1rem; width: 100%; max-width: 500px; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #ccc; }
    .form-control { width: 100%; padding: 0.75rem; background: #2a2a3e; border: 1px solid #3a3a4e; border-radius: 0.5rem; color: white; }
    .btn-primary { width: 100%; padding: 0.75rem; background: #22D3EE; color: black; font-weight: bold; border: none; border-radius: 0.5rem; cursor: pointer; }
    .error-message { color: #ef4444; margin: 1rem 0; }
    .success-message { color: #10b981; margin: 1rem 0; }
  `]
})
export class KycUploadComponent {
  private kycService = inject(KycService);
  private router = inject(Router);

  documentType = 0;
  documentNumber = '';
  selectedFile: File | null = null;
  loading = false;
  error = '';
  success = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      this.selectedFile = file;
      this.error = '';
    } else {
      this.error = 'File size must be less than 5MB';
    }
  }

  upload() {
    if (!this.selectedFile || !this.documentNumber) {
      this.error = 'Please fill all fields and select a file';
      return;
    }

    this.loading = true;
    this.error = '';

    this.kycService.uploadDocument(this.documentType, this.documentNumber, this.selectedFile)
      .subscribe({
        next: () => {
          this.success = 'KYC documents submitted successfully! Awaiting verification.';
          setTimeout(() => this.router.navigate(['/app/kyc/pending']), 2000);
        },
        error: (err) => {
          this.error = err.error?.error || 'Upload failed';
          this.loading = false;
        }
      });
  }
}
