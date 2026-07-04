import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';
import { HospitalService, NetworkHospital } from '../../../../services/hospital.service';
import { NetworkHospitalSearchComponent } from '../../../../components/network-hospital-search/network-hospital-search.component';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NetworkHospitalSearchComponent],
  templateUrl: './submit-claim.component.html',
  styleUrls: ['./submit-claim.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitClaimComponent {
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private hospitalService = inject(HospitalService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  success: string | null = null;
  maxDate = new Date().toISOString().split('T')[0];

  // Claim type toggle
  claimType: 'regular' | 'hospitalization' = 'regular';

  // Hospital search modal
  showHospitalModal = false;
  selectedHospital: NetworkHospital | null = null;

  // Pre-authorization response
  preAuthResponse: any = null;

  // File upload properties
  selectedFile: File | null = null;
  fileError: string | null = null;
  isDragging = false;
  uploadProgress = 0;

  form = this.fb.group({
    // Regular claim fields
    claimDate: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],

    // Hospitalization fields (initially not required)
    admissionDate: [''],
    hospitalId: [''],
    hospitalName: [''],
    doctorName: [''],
    diagnosis: [''],
    treatmentType: [''],
    estimatedAmount: [null]
  });

  // Helper for template
  Math = Math;

  setClaimType(type: 'regular' | 'hospitalization') {
    this.claimType = type;
    this.error = null;
    this.selectedHospital = null;
    this.preAuthResponse = null;

    // Update validators based on type
    if (type === 'hospitalization') {
      this.form.get('admissionDate')?.setValidators([Validators.required]);
      this.form.get('doctorName')?.setValidators([Validators.required]);
      this.form.get('diagnosis')?.setValidators([Validators.required]);
      this.form.get('estimatedAmount')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('amount')?.clearValidators();
      this.form.get('claimDate')?.clearValidators();
    } else {
      this.form.get('admissionDate')?.clearValidators();
      this.form.get('doctorName')?.clearValidators();
      this.form.get('diagnosis')?.clearValidators();
      this.form.get('estimatedAmount')?.clearValidators();
      this.form.get('amount')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('claimDate')?.setValidators([Validators.required]);
    }

    this.form.updateValueAndValidity();
  }

  openHospitalModal() {
    this.showHospitalModal = true;
  }

  closeHospitalModal() {
    this.showHospitalModal = false;
  }

  onHospitalSelected(hospital: NetworkHospital) {
    this.selectedHospital = hospital;
    this.form.patchValue({
      hospitalId: hospital.hospitalId,
      hospitalName: hospital.hospitalName
    });
    this.closeHospitalModal();
    this.cdr.markForCheck();
  }

  getCashlessStatus(): { eligible: boolean; limit: number; message: string } {
    const estimatedAmount = this.form.get('estimatedAmount')?.value || 0;
    const cashlessLimit = this.selectedHospital?.cashlessLimit || 0;

    if (!this.selectedHospital) {
      return { eligible: false, limit: 0, message: 'Select a hospital first' };
    }

    if (estimatedAmount <= cashlessLimit) {
      return {
        eligible: true,
        limit: cashlessLimit,
        message: `✅ Cashless Available up to ₹${cashlessLimit.toLocaleString()}`
      };
    }

    return {
      eligible: false,
      limit: cashlessLimit,
      message: `⚠️ Amount exceeds cashless limit of ₹${cashlessLimit.toLocaleString()}. Reimbursement claim.`
    };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  validateAndSetFile(file: File) {
    this.fileError = null;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.fileError = 'Invalid file type. Please upload PDF, JPG, or PNG files only.';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.fileError = 'File size exceeds 10MB limit.';
      return;
    }

    this.selectedFile = file;
    this.cdr.detectChanges();
  }

  removeFile() {
    this.selectedFile = null;
    this.fileError = null;
    this.uploadProgress = 0;
    this.cdr.detectChanges();
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  submit(): void {
    if (this.claimType === 'hospitalization') {
      this.submitPreAuthorization();
    } else {
      this.submitRegularClaim();
    }
  }

  submitRegularClaim(): void {
    if (this.form.invalid || this.loading || !this.selectedFile) {
      this.form.markAllAsTouched();
      if (!this.selectedFile) {
        this.fileError = 'Please upload a medical report';
      }
      return;
    }

    const selectedDate = new Date(this.form.value.claimDate!);
    if (selectedDate > new Date()) {
      this.error = 'Claim date cannot be in the future';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.uploadProgress = 0;
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('ClaimDate', this.form.value.claimDate!);
    formData.append('Amount', String(this.form.value.amount));
    formData.append('Description', this.form.value.description!);
    formData.append('MedicalReport', this.selectedFile);

    const interval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
        this.cdr.detectChanges();
      }
    }, 200);

    this.claimService
      .submitClaimWithFile(formData)
      .pipe(finalize(() => {
        clearInterval(interval);
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response: any) => {
          this.uploadProgress = 100;
          this.success = response.message || 'Claim submitted successfully! Your medical report is being processed. Redirecting...';
          this.claimService.triggerRefresh();
          setTimeout(() => {
            this.router.navigate(['/app/claims'], { replaceUrl: true });
          }, 2000);
        },
        error: (err) => {
          console.error('Claim submission error:', err);
          let errorMessage = 'Failed to submit claim. Please try again.';
          if (err.error) {
            if (typeof err.error === 'string') errorMessage = err.error;
            else if (err.error.message) errorMessage = err.error.message;
            else if (err.error.title) errorMessage = err.error.title;
          }
          this.error = errorMessage;
          this.uploadProgress = 0;
          this.cdr.markForCheck();
        },
      });
  }

  submitPreAuthorization(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const admissionDate = this.form.get('admissionDate')?.value as string;
    const hospitalId = this.form.get('hospitalId')?.value as string;
    const hospitalName = this.form.get('hospitalName')?.value as string;
    const doctorName = this.form.get('doctorName')?.value as string;
    const diagnosis = this.form.get('diagnosis')?.value as string;
    const treatmentType = (this.form.get('treatmentType')?.value || 'General') as string;
    const estimatedAmount = Number(this.form.get('estimatedAmount')?.value);
    const description = this.form.get('description')?.value as string;

    const payload = {
      admissionDate,
      hospitalId,
      hospitalName,
      doctorName,
      diagnosis,
      treatmentType,
      estimatedAmount,
      description
    };

    this.claimService.submitPreAuthorization(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.preAuthResponse = response;
        this.success = `Pre-authorization submitted successfully! Reference: ${response.claimId}`;
        this.claimService.triggerRefresh();
        setTimeout(() => {
          this.router.navigate(['/app/claims'], { replaceUrl: true });
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        let errorMessage = 'Failed to submit pre-authorization. Please try again.';
        if (err.error) {
          if (typeof err.error === 'string') errorMessage = err.error;
          else if (err.error.message) errorMessage = err.error.message;
        }
        this.error = errorMessage;
        this.cdr.markForCheck();
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
