import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
  templateUrl: './kyc-upload.component.html',
  styleUrls: ['./kyc-upload.component.scss'],
})
export class KycUploadComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

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
  otpInterval: any;

  kycForm: FormGroup = this.fb.group({
    documentNumber: ['', Validators.required],
  });

  ngOnInit() {
    this.selectDocument(0);
  }

  ngOnDestroy() {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
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
  }

  removeFile() {
    this.uploadedFile = null;
    const fileInput = document.getElementById('documentFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
      .subscribe({
        next: () => {
          this.isOtpSent = true;
          this.isOtpLoading = false;
          this.startOtpTimer();
        },
        error: (err) => {
          this.error = err.error?.error || err.message || 'Failed to send OTP';
          this.isOtpLoading = false;
        },
      });
  }

  startOtpTimer() {
    this.otpTimer = 300;
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.otpInterval = setInterval(() => {
      if (this.otpTimer > 0) {
        this.otpTimer--;
      } else {
        clearInterval(this.otpInterval);
      }
    }, 1000);
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
      .subscribe({
        next: (res: any) => {
          if (res.isValid === true) {
            this.isOtpVerified = true;
            this.error = '';
            if (this.otpInterval) {
              clearInterval(this.otpInterval);
            }
          } else {
            this.error = 'Invalid OTP. Please try again.';
            this.isOtpVerified = false;
          }
          this.isOtpLoading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'OTP verification failed';
          this.isOtpLoading = false;
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

    this.http.post(`${environment.apiBaseUrl}/v1/kyc/upload`, formData).subscribe({
      next: () => {
        this.router.navigate(['/app/kyc/pending']);
      },
      error: (err) => {
        this.error = err.error?.error || err.message || 'Upload failed';
        this.isSubmitting = false;
      },
    });
  }
}
