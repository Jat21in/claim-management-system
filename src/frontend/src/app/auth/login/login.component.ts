import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loading = false;
  loginForm;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    // ✅ SAFE: fb is initialized here
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;

    this.auth.login(this.loginForm.value as any).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.auth.saveToken(res.token);
        this.auth.startTokenExpiryWatcher();
        this.router.navigate(['/claims']);
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
