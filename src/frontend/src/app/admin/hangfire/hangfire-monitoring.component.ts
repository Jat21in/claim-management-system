import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-hangfire-monitoring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Hangfire Job Monitoring</h1>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div class="bg-surface rounded-lg p-4">
          <div class="text-sm text-gray-400">Total Jobs</div>
          <div class="text-2xl font-bold">{{ stats.total || 0 }}</div>
        </div>
        <div class="bg-green-500/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Succeeded</div>
          <div class="text-2xl font-bold text-green-400">{{ stats.succeeded || 0 }}</div>
        </div>
        <div class="bg-red-500/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Failed</div>
          <div class="text-2xl font-bold text-red-400">{{ stats.failed || 0 }}</div>
        </div>
        <div class="bg-yellow-500/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Enqueued</div>
          <div class="text-2xl font-bold text-yellow-400">{{ stats.enqueued || 0 }}</div>
        </div>
        <div class="bg-blue-500/20 rounded-lg p-4">
          <div class="text-sm text-gray-400">Processing</div>
          <div class="text-2xl font-bold text-blue-400">{{ stats.processing || 0 }}</div>
        </div>
      </div>

      <!-- Recurring Jobs -->
      <div class="bg-surface rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Scheduled Jobs</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-2">Job Name</th>
                <th class="text-left py-2">Schedule</th>
                <th class="text-left py-2">Last Run</th>
                <th class="text-left py-2">Next Run</th>
                <th class="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of recurringJobs" class="border-b border-white/5">
                <td class="py-2">{{ job.name }}</td>
                <td class="py-2">{{ job.cron }}</td>
                <td class="py-2">{{ formatDate(job.lastExecution) }}</td>
                <td class="py-2">{{ formatDate(job.nextExecution) }}</td>
                <td class="py-2">
                  <span class="px-2 py-1 rounded text-xs" [class.bg-green-500/20]="job.enabled" [class.bg-red-500/20]="!job.enabled">
                    {{ job.enabled ? 'Active' : 'Disabled' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Jobs -->
      <div class="bg-surface rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Recent Jobs</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left py-2">ID</th>
                <th class="text-left py-2">Created</th>
                <th class="text-left py-2">Status</th>
                <th class="text-left py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let job of jobs" class="border-b border-white/5">
                <td class="py-2">{{ job.id }}</td>
                <td class="py-2">{{ formatDate(job.createdAt) }}</td>
                <td class="py-2">
                  <span class="px-2 py-1 rounded text-xs" 
                        [class.bg-green-500/20]="job.state === 'Succeeded'"
                        [class.bg-red-500/20]="job.state === 'Failed'"
                        [class.bg-yellow-500/20]="job.state === 'Enqueued'"
                        [class.bg-blue-500/20]="job.state === 'Processing'">
                    {{ job.state }}
                  </span>
                </td>
                <td class="py-2">{{ job.reason || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Manual Trigger Buttons -->
      <div class="bg-surface rounded-lg p-6 mt-8">
        <h2 class="text-xl font-semibold mb-4">Manual Triggers</h2>
        <div class="flex gap-4">
          <button (click)="triggerJob('send-grace-reminders')" 
                  class="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/80">
            Send Grace Reminders
          </button>
          <button (click)="triggerJob('check-overdue-payments')" 
                  class="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/80">
            Check Overdue Payments
          </button>
          <button (click)="triggerJob('check-lapsed-policies')" 
                  class="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/80">
            Check Lapsed Policies
          </button>
        </div>
        <div *ngIf="triggerMessage" class="mt-4 text-sm" [class.text-green-400]="triggerSuccess" [class.text-red-400]="!triggerSuccess">
          {{ triggerMessage }}
        </div>
      </div>
    </div>
  `
})
export class HangfireMonitoringComponent implements OnInit {
  stats: any = {};
  recurringJobs: any[] = [];
  jobs: any[] = [];
  triggerMessage = '';
  triggerSuccess = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
    this.loadRecurringJobs();
    this.loadJobs();
  }

  loadStats() {
    this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/stats`)
      .subscribe((res: any) => {
        if (res.success) this.stats = res.stats;
      });
  }

  loadRecurringJobs() {
    this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/recurring`)
      .subscribe((res: any) => {
        if (res.success) this.recurringJobs = res.recurringJobs;
      });
  }

  loadJobs() {
    this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/jobs`)
      .subscribe((res: any) => {
        if (res.success) this.jobs = res.jobs;
      });
  }

  triggerJob(jobName: string) {
    this.http.post(`${environment.apiBaseUrl}/admin/system/${jobName}`, {})
      .subscribe({
        next: () => {
          this.triggerMessage = `${jobName} triggered successfully!`;
          this.triggerSuccess = true;
          setTimeout(() => this.loadJobs(), 2000);
        },
        error: () => {
          this.triggerMessage = `Failed to trigger ${jobName}`;
          this.triggerSuccess = false;
        }
      });
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === 'Never' || dateStr === 'Not scheduled') return dateStr;
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
}