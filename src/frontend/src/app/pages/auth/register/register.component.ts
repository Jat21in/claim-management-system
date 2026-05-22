// /src/frontend/src/app/pages/auth/register/register.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parentRoute = inject(ActivatedRoute);  // ✅ Get parent route

  loading = false;
  error: string | null = null;
  success: string | null = null;

  maxDob = new Date().toISOString().split('T')[0];

  selectedPlanId: string | undefined = undefined;

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
  });

  ngOnInit(): void {
    // ✅ Try multiple ways to get query params
    console.log('🔍 RegisterComponent - Full URL:', window.location.href);
    console.log('🔍 RegisterComponent - URL params:', new URLSearchParams(window.location.search));

    // Method 1: Check root route
    const rootParams = this.route.root.firstChild?.snapshot.queryParams;
    console.log('🔍 Root query params:', rootParams);

    // Method 2: Check current route snapshot
    const snapshotParams = this.route.snapshot.queryParamMap;
    console.log('🔍 Current snapshot params:', snapshotParams);

    // Method 3: Direct URL parsing (most reliable)
    const urlParams = new URLSearchParams(window.location.search);
    const planIdFromUrl = urlParams.get('planId');
    console.log('🔍 planId from URL parsing:', planIdFromUrl);

    if (planIdFromUrl) {
      this.selectedPlanId = planIdFromUrl;
      console.log('✅ Plan ID found via URL parsing:', this.selectedPlanId);
    }

    // Method 4: Subscribe to query params
    this.route.queryParams.subscribe(params => {
      console.log('📋 RegisterComponent queryParams subscription:', params);
      if (params['planId'] && !this.selectedPlanId) {
        this.selectedPlanId = params['planId'];
        console.log('✅ Plan ID from subscription:', this.selectedPlanId);
      }
    });

    // Method 5: Check parent route (AuthShell)
    this.parentRoute.parent?.queryParams.subscribe(params => {
      console.log('📋 Parent route params:', params);
      if (params['planId'] && !this.selectedPlanId) {
        this.selectedPlanId = params['planId'];
        console.log('✅ Plan ID from parent:', this.selectedPlanId);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
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
      console.log('✅ Including selectedPlanId in payload:', this.selectedPlanId);
    } else {
      console.warn('⚠️ No selectedPlanId, registering without plan');
    }

    console.log('📤 Final request body:', payload);

    this.loading = true;
    this.error = null;
    this.success = null;

    this.auth.register(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          console.log('✅ Registration API call successful');
          this.success = 'Registration successful! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login'], {
              queryParams: {
                registered: 'true',
                email: this.form.value.email
              }
            });
          }, 2000);
        },
        error: err => {
          console.error('❌ Registration failed:', err);
          this.error = err?.error?.message ?? 'Registration failed';
        },
      });
  }
}
