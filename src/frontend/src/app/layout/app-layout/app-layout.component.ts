import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {

  private auth = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
