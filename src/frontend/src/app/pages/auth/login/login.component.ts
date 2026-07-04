import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  redirectUrl = '/app/dashboard';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    // Get redirect URL from query params
    this.redirectUrl = this.route.snapshot.queryParams['redirect'] || '/app/dashboard';

    console.log('[Login] Redirect URL:', this.redirectUrl);

    // Show success message if coming from registration
    if (this.route.snapshot.queryParams['registered'] === 'true') {
      this.successMessage = 'Account created successfully! Please login with your credentials.';
      this.cdr.markForCheck();

      const email = this.route.snapshot.queryParams['email'];
      if (email) {
        this.form.patchValue({ email });
      }

      setTimeout(() => {
        this.successMessage = null;
        this.cdr.markForCheck();
      }, 5000);
    }

    // Check if there's a selected plan and store it properly
    const selectedPlanId = this.authService.getSelectedPlanId();
    if (!selectedPlanId) {
      this.authService.getPlanIdFromLegacyStorage();
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    const { email, password, rememberMe } = this.form.value;

    // Check for selected plan BEFORE login
    const hasSelectedPlan = !!this.authService.getSelectedPlanId();

    this.authService.login(
      { email: email!, password: password! },
      rememberMe ?? false
    ).subscribe({
      next: () => {
        this.loading = false;

        const role = this.authService.getUserRole();
        console.log('[Login] User role after login:', role);

        // If user has a selected plan, redirect to policy setup
        if (hasSelectedPlan) {
          console.log('[Login] User has selected plan, redirecting to policy setup');
          this.router.navigate(['/app/policy-setup']);
          return;
        }

        // Role-based redirect
        if (role === 'Admin' || role === 'ClaimsProcessor') {
          console.log('[Login] Redirecting to Admin Panel');
          this.router.navigateByUrl('/admin/dashboard');
        } else {
          console.log('[Login] Redirecting to:', this.redirectUrl);
          this.router.navigateByUrl(this.redirectUrl);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || err.error?.message || 'Invalid credentials. Please try again.';
        console.error('[Login] Error:', err);
      },
    });
  }

  // ✅ Optional: Alternative method if routerLink doesn't work
  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}