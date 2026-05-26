import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // ✅ FIX
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    CommonModule,     // ✅ REQUIRED for *ngIf
    RouterLink,
    RouterOutlet
  ],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {

  private auth = inject(AuthService);
  private router = inject(Router);

  get isAdmin(): boolean {
    const role = this.auth.getUserRole();
    return role === 'Admin' || role === 'ClaimsProcessor';
  }

  logout(): void {
    this.auth.logout(); // ✅ already handles navigation
  }
}
