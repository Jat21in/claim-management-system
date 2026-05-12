import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './register.component.html',
})
export class RegisterComponent {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  // ✅ restrict future DOB
  maxDob = new Date().toISOString().split('T')[0];

  selectedPlanId =
    this.route.snapshot.queryParamMap.get('planId') ?? undefined;

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.auth.register({
      fullName: this.form.value.fullName!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      dateOfBirth: this.form.value.dateOfBirth!,
      selectedPlanId: this.selectedPlanId,
    })
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => {
        this.success =
          'Registration successful. Please login to continue.';
        this.form.reset();
      },
      error: err => {
        this.error =
          err?.error?.message ?? 'Registration failed';
      },
    });
  }
}
