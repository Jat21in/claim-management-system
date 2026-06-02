import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="otp-container">
      <div class="otp-header">
        <div class="otp-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <h3>Verify Your Identity</h3>
        <p>We've sent a verification code to your registered mobile number</p>
      </div>

      <div class="otp-input-group">
        <div class="input-container">
          <input
            type="text"
            [(ngModel)]="otpCode"
            (keyup)="onOtpInput()"
            maxlength="6"
            placeholder="Enter 6-digit OTP"
            class="otp-input"
            [class.error]="errorMessage">
        </div>

        <div class="timer" *ngIf="timer > 0">
          Resend code in {{ formatTime(timer) }}
        </div>

        <button
          *ngIf="timer === 0"
          (click)="resendOtp()"
          class="resend-btn"
          [disabled]="isResending">
          Resend Verification Code
        </button>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ errorMessage }}
      </div>

      <div class="otp-actions">
        <button (click)="cancel()" class="btn-secondary">Cancel</button>
        <button (click)="verifyOtp()" [disabled]="otpCode.length !== 6 || isVerifying" class="btn-primary">
          <span *ngIf="!isVerifying">Verify & Continue</span>
          <span *ngIf="isVerifying" class="loading-spinner"></span>
        </button>
      </div>

      <div class="security-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>This code expires in 5 minutes for your security</span>
      </div>
    </div>
  `,
  styles: [`
    .otp-container {
      background: #1a1a2e;
      border-radius: 16px;
      padding: 32px;
      border: 1px solid #2a2a3e;
      max-width: 480px;
      margin: 0 auto;
    }
    .otp-header { text-align: center; margin-bottom: 32px; }
    .otp-icon { margin-bottom: 16px; color: #22D3EE; }
    .otp-header h3 { font-size: 20px; margin-bottom: 8px; }
    .otp-header p { font-size: 14px; color: #9ca3af; }
    .otp-input-group { margin-bottom: 24px; }
    .input-container { margin-bottom: 16px; }
    .otp-input {
      width: 100%;
      padding: 16px;
      background: #0f0f1a;
      border: 1px solid #2a2a3e;
      border-radius: 12px;
      color: white;
      font-size: 24px;
      text-align: center;
      letter-spacing: 8px;
      font-weight: 600;
    }
    .otp-input:focus { outline: none; border-color: #22D3EE; }
    .otp-input.error { border-color: #ef4444; }
    .timer { text-align: center; color: #22D3EE; font-size: 14px; margin-top: 12px; }
    .resend-btn {
      width: 100%;
      padding: 12px;
      background: transparent;
      border: 1px solid #22D3EE;
      border-radius: 10px;
      color: #22D3EE;
      cursor: pointer;
      font-weight: 500;
    }
    .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fca5a5;
      font-size: 14px;
    }
    .otp-actions { display: flex; gap: 16px; margin-bottom: 20px; }
    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 14px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #22D3EE, #06b6d4);
      color: #0B1220;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: #2a2a3e;
      color: white;
      border: 1px solid #3a3a4e;
    }
    .loading-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid #0B1220;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #0f0f1a;
      border-radius: 8px;
      font-size: 12px;
      color: #9ca3af;
    }
  `]
})
export class OtpVerificationComponent {
  private http = inject(HttpClient);

  @Input() phoneNumber: string = '';
  @Output() verified = new EventEmitter<boolean>();
  @Output() cancelled = new EventEmitter<void>();

  otpCode = '';
  timer = 300; // 5 minutes in seconds
  isVerifying = false;
  isResending = false;
  errorMessage = '';
  private interval: any;

  ngOnInit() {
    this.startTimer();
    this.sendOtp();
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  sendOtp() {
    this.http.post(`${environment.apiBaseUrl}/api/verification/send-otp`, { phoneNumber: this.phoneNumber })
      .subscribe({
        next: () => console.log('OTP sent'),
        error: (err) => this.errorMessage = 'Failed to send OTP'
      });
  }

  resendOtp() {
    this.isResending = true;
    this.sendOtp();
    this.timer = 300;
    this.startTimer();
    setTimeout(() => this.isResending = false, 2000);
  }

  onOtpInput() {
    if (this.otpCode.length === 6) {
      this.verifyOtp();
    }
  }

  verifyOtp() {
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code';
      return;
    }

    this.isVerifying = true;
    this.http.post(`${environment.apiBaseUrl}/api/verification/verify-otp`, {
      phoneNumber: this.phoneNumber,
      otp: this.otpCode
    }).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        if (res.isValid) {
          this.verified.emit(true);
        } else {
          this.errorMessage = 'Invalid verification code. Please try again.';
        }
      },
      error: () => {
        this.isVerifying = false;
        this.errorMessage = 'Verification failed. Please try again.';
      }
    });
  }

  cancel() {
    this.cancelled.emit();
  }
}
