import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Chart from 'chart.js/auto';

import { ClaimService } from '../../../services/claim.service';
import { Claim } from '../../../claims/models/claim.model';

type SortOption = 'latest' | 'oldest' | 'amount-desc' | 'amount-asc';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimsComponent implements OnInit, AfterViewInit {
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartCanvas!: ElementRef<HTMLCanvasElement>;

  private claimService = inject(ClaimService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;

  claims: Claim[] = [];
  sortedClaims: Claim[] = [];
  sortBy: SortOption = 'latest';

  // Stats
  totalClaims = 0;
  approvedClaims = 0;
  pendingClaims = 0;
  rejectedClaims = 0;
  totalAmount = 0;
  approvedPercent = 0;
  pendingPercent = 0;
  rejectedPercent = 0;

  // Daily trend data
  dailyTrendLabels: string[] = [];
  dailyTrendValues: number[] = [];

  // Heat map data
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  hourSlots = Array.from({ length: 24 }, (_, i) => i);
  claimHeatData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

  private statusChart: InstanceType<typeof Chart> | null = null;
  private trendChart: InstanceType<typeof Chart> | null = null;

  ngOnInit(): void {
    this.fetchClaims();
    this.claimService.refreshClaims$.subscribe(() => this.fetchClaims());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  fetchClaims(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.claimService.getMyClaims()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (claims: Claim[]) => {
          this.claims = claims;
          console.log('Claims received:', claims); // Debug log
          this.calculateStats();
          this.buildHeatMap();
          this.calculateDailyTrend();
          this.applySort();
          this.renderCharts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load claims:', err);
          this.error = 'Failed to load claims';
          this.cdr.markForCheck();
        }
      });
  }

  private calculateStats(): void {
    this.totalClaims = this.claims.length;

    // Handle all possible status values from backend
    this.approvedClaims = this.claims.filter(c =>
      c.status === 'Approved' || c.status === 'APPROVED'
    ).length;

    this.pendingClaims = this.claims.filter(c =>
      c.status === 'Submitted' ||
      c.status === 'SUBMITTED' ||
      c.status === 'PendingAI' ||
      c.status === 'PENDING_AI' ||
      c.status === 'Pending' ||
      c.status === 'PENDING'
    ).length;

    this.rejectedClaims = this.claims.filter(c =>
      c.status === 'Rejected' || c.status === 'REJECTED'
    ).length;

    this.totalAmount = this.claims.reduce((sum, c) => sum + (c.amount || 0), 0);

    this.approvedPercent = this.totalClaims ? Math.round((this.approvedClaims / this.totalClaims) * 100) : 0;
    this.pendingPercent = this.totalClaims ? Math.round((this.pendingClaims / this.totalClaims) * 100) : 0;
    this.rejectedPercent = this.totalClaims ? Math.round((this.rejectedClaims / this.totalClaims) * 100) : 0;

    console.log('Stats calculated:', {
      total: this.totalClaims,
      approved: this.approvedClaims,
      pending: this.pendingClaims,
      rejected: this.rejectedClaims
    });
  }

  private calculateDailyTrend(): void {
    // Group claims by date for the last 7 days
    const dateMap = new Map<string, number>();
    const today = new Date();

    // Initialize last 7 days with zero
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dateLabel = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      dateMap.set(dateKey, 0);
      this.dailyTrendLabels.push(dateLabel);
    }

    // Sum claim amounts by date
    this.claims.forEach(claim => {
      const claimDate = new Date(claim.claimDate);
      const dateKey = claimDate.toISOString().split('T')[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + claim.amount);
      }
    });

    // Extract values in order
    this.dailyTrendValues = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      this.dailyTrendValues.push(dateMap.get(dateKey) || 0);
    }

    console.log('Daily trend:', {
      labels: this.dailyTrendLabels,
      values: this.dailyTrendValues
    });
  }

  private buildHeatMap(): void {
    // Reset heat map data
    this.claimHeatData = Array(7).fill(null).map(() => Array(24).fill(0));

    this.claims.forEach(claim => {
      const date = new Date(claim.claimDate);
      const dayOfWeek = date.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const hour = date.getHours();

      if (dayIndex >= 0 && dayIndex < 7 && hour >= 0 && hour < 24) {
        this.claimHeatData[dayIndex][hour]++;
      }
    });
  }

  getClaimCount(dayIndex: number, hour: number): number {
    return this.claimHeatData[dayIndex]?.[hour] || 0;
  }

  getHeatColor(count: number): string {
    const maxCount = Math.max(...this.claimHeatData.flat(), 1);
    const intensity = count / maxCount;
    const r = 34 + Math.floor(intensity * 221);
    const g = 211 + Math.floor(intensity * 44);
    const b = 238;
    return `rgba(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${b}, ${0.3 + intensity * 0.5})`;
  }

  private renderCharts(): void {
    if (!this.statusChartCanvas || !this.trendChartCanvas) return;

    // Destroy existing charts
    if (this.statusChart) this.statusChart.destroy();
    if (this.trendChart) this.trendChart.destroy();

    // Donut Chart - Status Distribution
    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [this.approvedClaims, this.pendingClaims, this.rejectedClaims],
          backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Line Chart - Daily Trend (Last 7 Days)
    this.trendChart = new Chart(this.trendChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.dailyTrendLabels,
        datasets: [{
          label: 'Claim Amount (₹)',
          data: this.dailyTrendValues,
          borderColor: '#22D3EE',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#22D3EE',
          pointBorderColor: '#0B1220',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `₹${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9ca3af',
              callback: (value: string | number) => `₹${Number(value).toLocaleString()}`
            },
            title: {
              display: true,
              text: 'Amount (₹)',
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#9ca3af',
              rotation: 45,
              autoSkip: true,
              maxRotation: 45,
              minRotation: 45
            },
            title: {
              display: true,
              text: 'Date',
              color: '#9ca3af',
              font: { size: 11 }
            }
          }
        }
      }
    });
  }

  applySort(): void {
    const data = [...this.claims];
    switch (this.sortBy) {
      case 'latest':
        this.sortedClaims = data.sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime());
        break;
      case 'oldest':
        this.sortedClaims = data.sort((a, b) => new Date(a.claimDate).getTime() - new Date(b.claimDate).getTime());
        break;
      case 'amount-desc':
        this.sortedClaims = data.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'amount-asc':
        this.sortedClaims = data.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
    }
  }

  onSortChange(value: SortOption): void {
    this.sortBy = value;
    this.applySort();
    this.cdr.markForCheck();
  }
}
