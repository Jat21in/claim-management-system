import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';

// Custom validator: password match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { mismatch: true };
}

// Custom validator: age >= 18
function ageValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const birthDate = new Date(control.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18 ? null : { age: true };
}

// Password strength pattern
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentRoute = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  registrationSuccess = false;  // ✅ Track if registration succeeded

  maxDob = new Date().toISOString().split('T')[0];
  selectedPlanId: string | undefined = undefined;

  // Password toggles
  showPassword = false;
  showConfirmPassword = false;

  // CAPTCHA
  captchaQuestion = '';
  captchaAnswer = '';

  // Terms modal
  showTermsModal = false;

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(passwordPattern)
    ]],
    confirmPassword: ['', Validators.required],
    dateOfBirth: ['', [Validators.required, ageValidator]],
    captcha: ['', Validators.required],
    acceptTerms: [false, Validators.requiredTrue]
  }, { validators: passwordMatchValidator });

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/app/dashboard']);
      return;
    }

    this.generateCaptcha();

    // Plan ID from URL handling
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get('planId');
    if (planIdFromUrl) {
      this.selectedPlanId = planIdFromUrl;
    }
    this.route.queryParams.subscribe(params => {
      if (params['planId'] && !this.selectedPlanId) {
        this.selectedPlanId = params['planId'];
      }
    });
    this.parentRoute.parent?.queryParams.subscribe(params => {
      if (params['planId'] && !this.selectedPlanId) {
        this.selectedPlanId = params['planId'];
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  generateCaptcha(): void {
    this.captchaAnswer = this.generateRandomCode();
    this.captchaQuestion = this.captchaAnswer;
    this.form.get('captcha')?.setValue('');
    this.form.get('captcha')?.setErrors(null);
  }

  refreshCaptcha(): void {
    this.generateCaptcha();
  }

  openTermsModal(): void {
    this.showTermsModal = true;
  }

  closeTermsModal(): void {
    this.showTermsModal = false;
  }

  // ✅ Reset form after successful registration
  private resetForm(): void {
    this.form.reset({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      captcha: '',
      acceptTerms: false
    });
    this.generateCaptcha();
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    // Validate CAPTCHA
    const userCaptcha = this.form.value.captcha?.trim() || '';
    if (userCaptcha === '' || userCaptcha.toUpperCase() !== this.captchaAnswer) {
      this.form.get('captcha')?.setErrors({ captcha: true });
      this.form.get('captcha')?.markAsTouched();
      return;
    }

    const payload: any = {
      fullName: this.form.value.fullName!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      dateOfBirth: this.form.value.dateOfBirth!,
    };

    if (this.selectedPlanId && this.selectedPlanId.trim() !== '') {
      payload.selectedPlanId = this.selectedPlanId;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.auth.register(payload)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: () => {
          // ✅ Show success message
          this.successMessage = '✅ Account created successfully! Kindly Redirect to login.';
          this.registrationSuccess = true;
          
          // ✅ Reset the form (clear all fields)
          this.resetForm();
          
          // ✅ Auto redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: {
                registered: 'true',
                email: payload.email
              }
            });
          }, 2000);
        },
        error: err => {
          this.error = err?.error?.message ?? 'Registration failed. Please try again.';
          this.registrationSuccess = false;
        },
      });
  }
}