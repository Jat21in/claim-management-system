import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

interface DocumentType {
  id: number;
  name: string;
  code: string;
  description: string;
  validationPattern: RegExp;
  example: string;
  minLength: number;
  maxLength: number;
}

@Component({
  selector: 'app-kyc-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kyc-upload.component.html',
  styleUrls: ['./kyc-upload.component.scss'],
})
export class KycUploadComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  error = '';
  Math = Math;

  documentTypes: DocumentType[] = [
    {
      id: 0,
      name: 'Aadhaar Card',
      code: 'AADHAAR',
      description: 'Government-issued identity proof',
      validationPattern: /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/,
      example: 'Example: 1234 5678 9012',
      minLength: 12,
      maxLength: 12,
    },
    {
      id: 1,
      name: 'PAN Card',
      code: 'PAN',
      description: 'Permanent Account Number',
      validationPattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      example: 'Example: ABCDE1234F',
      minLength: 10,
      maxLength: 10,
    },
    {
      id: 2,
      name: 'Passport',
      code: 'PASSPORT',
      description: 'International travel document',
      validationPattern: /^[A-Z]{1}[0-9]{7}$/,
      example: 'Example: A1234567',
      minLength: 8,
      maxLength: 8,
    },
  ];

  selectedDocId = 0;
  selectedDocument: DocumentType | null = null;
  uploadedFile: File | null = null;
  isDragging = false;
  isSubmitting = false;
  isOtpLoading = false;

  // OTP States
  phoneNumber: string = '';
  otpCode: string = '';
  isOtpSent: boolean = false;
  isOtpVerified: boolean = false;
  otpTimer: number = 0;
  private destroyed$ = new Subject<void>();
  private otpSub?: Subscription;

  kycForm: FormGroup = this.fb.group({
    documentNumber: ['', Validators.required],
  });

  ngOnInit() {
    this.selectDocument(0);
  }

  ngOnDestroy() {
    if (this.otpSub) {
      this.otpSub.unsubscribe();
    }
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get isPhoneNumberValid(): boolean {
    return !!(this.phoneNumber && this.phoneNumber.length === 10 && /^\d{10}$/.test(this.phoneNumber));
  }

  onPhoneNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    this.phoneNumber = value;
    input.value = value;
    this.cdr.markForCheck();
  }

  selectDocument(docId: number) {
    this.selectedDocId = docId;
    this.selectedDocument = this.documentTypes.find((d) => d.id === docId) || null;

    if (this.selectedDocument) {
      const validators = [
        Validators.required,
        Validators.minLength(this.selectedDocument.minLength),
        Validators.maxLength(this.selectedDocument.maxLength),
        Validators.pattern(this.selectedDocument.validationPattern),
      ];
      this.kycForm.get('documentNumber')?.setValidators(validators);
      this.kycForm.get('documentNumber')?.updateValueAndValidity();
    }
    this.cdr.markForCheck();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  validateAndSetFile(file: File) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, JPG, or PNG files only');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    this.uploadedFile = file;
    this.cdr.markForCheck();
  }

  removeFile() {
    this.uploadedFile = null;
    const fileInput = document.getElementById('documentFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.cdr.markForCheck();
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
    if (files && files[0]) {
      this.validateAndSetFile(files[0]);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  sendOtp() {
    if (!this.phoneNumber || this.phoneNumber.length !== 10) {
      this.error = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.isOtpLoading = true;
    this.error = '';

    this.http
      .post(`${environment.apiBaseUrl}/v1/verification/send-otp`, {
        phoneNumber: this.phoneNumber,
      })
      .pipe(
        takeUntil(this.destroyed$),
        finalize(() => {
          this.isOtpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.isOtpSent = true;
          this.startOtpTimer();
        },
        error: (err) => {
          this.error = err.error?.error || err.message || 'Failed to send OTP';
        },
      });
  }

  startOtpTimer() {
    this.otpTimer = 300;
    if (this.otpSub) {
      this.otpSub.unsubscribe();
    }
    this.otpSub = interval(1000)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (this.otpTimer > 0) {
          this.otpTimer--;
        } else {
          if (this.otpSub) {
            this.otpSub.unsubscribe();
            this.otpSub = undefined;
          }
        }
        this.cdr.markForCheck();
      });
  }

  verifyOtp() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.error = 'Please enter the 6-digit verification code';
      return;
    }

    this.isOtpLoading = true;
    this.error = '';

    this.http
      .post(`${environment.apiBaseUrl}/v1/verification/verify-otp`, {
        phoneNumber: this.phoneNumber,
        otp: this.otpCode,
      })
      .pipe(
        takeUntil(this.destroyed$),
        finalize(() => {
          this.isOtpLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res.isValid === true) {
            this.isOtpVerified = true;
            this.error = '';
            if (this.otpSub) {
              this.otpSub.unsubscribe();
              this.otpSub = undefined;
            }
          } else {
            this.error = 'Invalid OTP. Please try again.';
            this.isOtpVerified = false;
          }
        },
        error: (err) => {
          this.error = err.error?.error || 'OTP verification failed';
          this.isOtpVerified = false;
        },
      });
  }

  onSubmit() {
    if (this.kycForm.invalid || !this.uploadedFile || !this.selectedDocument) {
      this.error = 'Please complete all fields';
      return;
    }

    if (!this.isOtpVerified) {
      this.error = 'Please verify your mobile number first';
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('DocumentType', this.selectedDocId.toString());
    formData.append('DocumentNumber', this.kycForm.get('documentNumber')?.value);
    formData.append('PhoneNumber', this.phoneNumber);
    formData.append('OtpCode', this.otpCode);
    formData.append('file', this.uploadedFile);
    this.http
      .post(`${environment.apiBaseUrl}/v1/kyc/upload`, formData)
      .pipe(
        takeUntil(this.destroyed$),
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/app/kyc/pending']);
        },
        error: (err) => {
          this.error = err.error?.error || err.message || 'Upload failed';
        },
      });
  }
}
