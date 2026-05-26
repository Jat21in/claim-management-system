import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="admin-container min-h-screen bg-gray-900 text-white">
      <aside class="sidebar w-64 bg-gray-800 fixed h-full p-4">
        <h2 class="text-xl font-bold mb-6 text-indigo-400">Admin Panel</h2>
        <nav class="space-y-2">
          <a routerLink="dashboard" routerLinkActive="active" class="block px-3 py-2 rounded hover:bg-gray-700">📊 Dashboard</a>
          <a routerLink="claims" routerLinkActive="active" class="block px-3 py-2 rounded hover:bg-gray-700">📋 Pending Claims</a>
          <a routerLink="members" routerLinkActive="active" class="block px-3 py-2 rounded hover:bg-gray-700">👥 Members</a>
          <button (click)="logout()" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-700 mt-10">🚪 Logout</button>
        </nav>
      </aside>
      <main class="ml-64 p-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .active { background-color: #374151; color: #a5b4fc; }
  `]
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  logout() { this.auth.logout(); }
}
