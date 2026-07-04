import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  step: 'email' | 'otp' | 'reset' = 'email';
  email: string = '';
  resetToken: string = '';
  loading = false;
  error = '';
  success = '';
  timer = 0;
  timerInterval: any;

  emailForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { mismatch: boolean } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  sendOtp(): void {
    if (this.emailForm.invalid || this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = '';
    this.email = this.emailForm.value.email;
    this.cdr.markForCheck();

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'OTP sent to your email. Please check your inbox.';
        this.step = 'otp';
        this.startTimer();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to send OTP. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid || this.loading) return;

    this.loading = true;
    this.error = '';

    this.authService.verifyResetToken(this.email, this.otpForm.value.otp).subscribe({
      next: (response: { isValid: boolean }) => {
        this.loading = false;
        if (response.isValid) {
          this.resetToken = this.otpForm.value.otp;
          this.step = 'reset';
          this.success = 'OTP verified. Please set your new password.';
          clearInterval(this.timerInterval);
          this.cdr.markForCheck();
        } else {
          this.error = 'Invalid or expired OTP. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to verify OTP. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid || this.loading) return;

    this.loading = true;
    this.error = '';

    this.authService.resetPassword(
      this.email,
      this.resetToken,
      this.resetForm.value.password
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Password reset successfully! Redirecting to login...';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.router.navigate(['/auth'], { queryParams: { mode: 'login' } });
        }, 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to reset password. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  startTimer(): void {
    this.timer = 60;
    this.timerInterval = setInterval(() => {
      this.timer--;
      this.cdr.markForCheck();
      if (this.timer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  resendOtp(): void {
    if (this.loading) return;
    this.sendOtp();
  }

  goBack(): void {
    if (this.step === 'email') {
      this.router.navigate(['/auth']);
    } else {
      this.step = 'email';
      this.error = '';
      this.success = '';
      clearInterval(this.timerInterval);
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }
}