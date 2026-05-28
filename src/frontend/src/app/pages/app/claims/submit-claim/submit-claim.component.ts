import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './submit-claim.component.html',
  styleUrls: ['./submit-claim.component.scss'],
})
export class SubmitClaimComponent {
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;
  success: string | null = null;
  maxDate = new Date().toISOString().split('T')[0];

  // File upload properties
  selectedFile: File | null = null;
  fileError: string | null = null;
  isDragging = false;
  uploadProgress = 0;

  form = this.fb.group({
    claimDate: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(1)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

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

    // Check file type - support PDF and images as per API spec
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.fileError = 'Invalid file type. Please upload PDF, JPG, or PNG files only.';
      return;
    }

    // Check file size (10MB max)
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

    // Create FormData for multipart file upload - MATCHING YOUR API SPEC EXACTLY
    const formData = new FormData();

    // Your API expects these exact field names (case-sensitive as per your spec)
    formData.append('ClaimDate', this.form.value.claimDate!);
    formData.append('Amount', String(this.form.value.amount));
    formData.append('Description', this.form.value.description!);
    formData.append('MedicalReport', this.selectedFile);  // binary file

    // Log for debugging
    console.log('Submitting claim with FormData:', {
      claimDate: this.form.value.claimDate,
      amount: this.form.value.amount,
      description: this.form.value.description,
      fileName: this.selectedFile.name,
      fileType: this.selectedFile.type,
      fileSize: this.selectedFile.size
    });

    // Simulate upload progress
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

          // Parse error response
          let errorMessage = 'Failed to submit claim. Please try again.';
          if (err.error) {
            if (typeof err.error === 'string') {
              errorMessage = err.error;
            } else if (err.error.message) {
              errorMessage = err.error.message;
            } else if (err.error.title) {
              errorMessage = err.error.title;
            }
          }

          this.error = errorMessage;
          this.uploadProgress = 0;
          this.cdr.markForCheck();
        },
      });
  }
}
