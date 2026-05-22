import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;
  successMessage: string | null = null;  // ✅ Add success message

  redirectUrl = '/app/dashboard';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    this.redirectUrl = this.route.snapshot.queryParams['redirect'] || '/app/dashboard';

    // ✅ Show success message if coming from registration
    if (this.route.snapshot.queryParams['registered'] === 'true') {
      this.successMessage = 'Account created successfully! Please login with your credentials.';

      // ✅ Auto-fill email if provided
      const email = this.route.snapshot.queryParams['email'];
      if (email) {
        this.form.patchValue({ email });
      }

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 5000);
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

    this.auth
      .login(
        { email: email!, password: password! },
        rememberMe ?? false
      )
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigateByUrl(this.redirectUrl);
        },
        error: () => {
          this.loading = false;
          this.error = 'Invalid credentials';
        },
      });
  }
}
