import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <!-- Loading State -->
    <div *ngIf="loading" class="text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p class="mt-2">Loading stats...</p>
    </div>

    <!-- Stats Grid -->
    <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Members -->
      <div class="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm uppercase tracking-wide">Total Members</p>
            <p class="text-3xl font-bold text-white mt-2">{{ stats.totalMembers | number }}</p>
          </div>
          <div class="bg-blue-500/20 p-3 rounded-full">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Pending Claims -->
      <div class="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm uppercase tracking-wide">Pending Claims</p>
            <p class="text-3xl font-bold text-yellow-400 mt-2">{{ stats.pendingClaims | number }}</p>
          </div>
          <div class="bg-yellow-500/20 p-3 rounded-full">
            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Approved Claims -->
      <div class="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm uppercase tracking-wide">Approved Claims</p>
            <p class="text-3xl font-bold text-green-400 mt-2">{{ stats.approvedClaims | number }}</p>
          </div>
          <div class="bg-green-500/20 p-3 rounded-full">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Rejected Claims -->
      <div class="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm uppercase tracking-wide">Rejected Claims</p>
            <p class="text-3xl font-bold text-red-400 mt-2">{{ stats.rejectedClaims | number }}</p>
          </div>
          <div class="bg-red-500/20 p-3 rounded-full">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div *ngIf="error" class="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mt-4">
      {{ error }}
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;

  stats = {
    totalMembers: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0
  };

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    console.log('Fetching stats from:', `${environment.apiBaseUrl}/admin/dashboard/stats`);

    this.http.get(`${environment.apiBaseUrl}/admin/dashboard/stats`).subscribe({
      next: (res: any) => {
        console.log('Raw API Response:', res);

        // Handle different response structures
        let data = res;

        // If response has a data property (common pattern)
        if (res && res.data) {
          data = res.data;
        }

        // Parse numbers with fallbacks
        this.stats = {
          totalMembers: Number(data.totalMembers) || Number(data.totalMembers) || 0,
          pendingClaims: Number(data.pendingClaims) || Number(data.pendingClaims) || 0,
          approvedClaims: Number(data.approvedClaims) || Number(data.approvedClaims) || 0,
          rejectedClaims: Number(data.rejectedClaims) || Number(data.rejectedClaims) || 0
        };

        console.log('Parsed Stats:', this.stats);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.error = `Failed to load dashboard stats: ${err.message || 'Unknown error'}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
