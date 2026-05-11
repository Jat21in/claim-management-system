import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {

  redirectUrl = '/app/dashboard'; // ✅ default fallback

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const redirect =
      this.route.snapshot.queryParamMap.get('redirect');

    if (redirect) {
      this.redirectUrl = redirect;
    }

    console.log('[Login] Redirect after login:', this.redirectUrl);
  }

  login(): void {
    // ✅ TEMPORARY login logic
    localStorage.setItem('auth_token', 'dummy-token');

    console.log('[Login] Login successful, navigating to:', this.redirectUrl);

    this.router.navigateByUrl(this.redirectUrl);
  }
}
