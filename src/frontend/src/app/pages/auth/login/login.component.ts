import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  error: string | null = null;

  // ✅ Define redirect URL properly
  redirectUrl = '/app/dashboard';

  // ✅ Define rememberMe if you want it
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    // ✅ Support redirects from AuthGuard
    this.redirectUrl =
      this.route.snapshot.queryParams['redirect'] || '/app/dashboard';
  }

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null; // ✅ FIXED (not undefined)

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
