import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { ClaimService } from '../../../services/claim.service';
import { MemberService, MemberDashboardResponse } from '../../../services/member.service';
import { Claim } from '../../../claims/models/claim.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('claimsChart') claimsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;

  private claimService = inject(ClaimService);
  private memberService = inject(MemberService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private refreshSubscription!: Subscription;

  // Member Data
  memberName = 'Member';
  activePlan: any = null;
  daysRemaining = 0;
  coverageUtilization = 0;
  totalClaimedAmount = 0;
  remainingCoverage = 0;

  // Claims Data
  claims: Claim[] = [];
  totalClaims = 0;
  approvedClaims = 0;
  pendingClaims = 0;
  rejectedClaims = 0;
  approvedPercent = 0;
  pendingPercent = 0;
  rejectedPercent = 0;
  approvalRate = 0;
  avgProcessingTime = 3.2;
  pendingTrend = 0;

  // Health Score
  healthScore = 85;

  // Chart Data
  chartType: 'claims' | 'amount' = 'claims';
  chartData: number[] = [];
  chartLabels: string[] = [];

  // AI Insights
  aiPrediction = '';
  aiInsights: any[] = [];

  recentClaims: Claim[] = [];

  private claimsChart: InstanceType<typeof Chart> | null = null;
  private statusChart: InstanceType<typeof Chart> | null = null;

  ngOnInit(): void {
    this.loadMemberData();
    this.loadClaims();
    this.refreshSubscription = this.claimService.refreshClaims$.subscribe(() => this.loadClaims());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 200);
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
    if (this.claimsChart) this.claimsChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }

  private loadMemberData(): void {
    this.memberService.getDashboard().subscribe({
      next: (res: MemberDashboardResponse) => {
        this.memberName = res.fullName.split(' ')[0];
        if (res.activePlan) {
          this.activePlan = res.activePlan;
          this.calculateCoverageMetrics();
        }
        this.cdr.markForCheck();
      },
      error: () => console.error('Failed to load member data')
    });
  }

  private loadClaims(): void {
    this.claimService.getMyClaims().subscribe({
      next: (claims: Claim[]) => {
        this.claims = claims;
        this.calculateStats();
        this.calculateRecentClaims();
        this.calculateChartData();
        this.generateAIInsights();
        this.renderCharts();
        this.cdr.markForCheck();
      },
      error: () => console.error('Failed to load claims')
    });
  }

  private calculateStats(): void {
    this.totalClaims = this.claims.length;
    this.approvedClaims = this.claims.filter(c =>
      c.status === 'Approved' || c.status === 'APPROVED'
    ).length;
    this.pendingClaims = this.claims.filter(c =>
      c.status === 'Submitted' || c.status === 'PendingAI' || c.status === 'Pending'
    ).length;
    this.rejectedClaims = this.claims.filter(c =>
      c.status === 'Rejected' || c.status === 'REJECTED'
    ).length;

    this.totalClaimedAmount = this.claims.reduce((sum, c) => sum + (c.amount || 0), 0);
    this.approvedPercent = this.totalClaims ? Math.round((this.approvedClaims / this.totalClaims) * 100) : 0;
    this.pendingPercent = this.totalClaims ? Math.round((this.pendingClaims / this.totalClaims) * 100) : 0;
    this.rejectedPercent = this.totalClaims ? Math.round((this.rejectedClaims / this.totalClaims) * 100) : 0;

    const totalProcessed = this.approvedClaims + this.rejectedClaims;
    this.approvalRate = totalProcessed ? Math.round((this.approvedClaims / totalProcessed) * 100) : 0;

    this.calculateCoverageMetrics();
    this.calculateHealthScore();
  }

  private calculateCoverageMetrics(): void {
    if (this.activePlan) {
      this.remainingCoverage = this.activePlan.insuredAmount - this.totalClaimedAmount;
      this.coverageUtilization = Math.round((this.totalClaimedAmount / this.activePlan.insuredAmount) * 100);

      // Calculate days remaining
      if (this.activePlan.endDate) {
        const endDate = new Date(this.activePlan.endDate);
        const today = new Date();
        this.daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      } else {
        this.daysRemaining = 365;
      }
    }
  }

  private calculateHealthScore(): void {
    let score = 80; // Base score

    // Add points for good claim ratio
    if (this.approvalRate > 80) score += 10;
    else if (this.approvalRate > 60) score += 5;

    // Deduct for high utilization
    if (this.coverageUtilization > 80) score -= 10;
    else if (this.coverageUtilization > 60) score -= 5;

    // Add points for profile completion
    if (this.memberName && this.memberName.length > 0) score += 5;

    this.healthScore = Math.min(100, Math.max(0, score));
  }

  private calculateChartData(): void {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    this.chartLabels = last7Days.map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('default', { weekday: 'short' });
    });

    if (this.chartType === 'claims') {
      this.chartData = last7Days.map(day =>
        this.claims.filter(c => c.claimDate.split('T')[0] === day).length
      );
    } else {
      this.chartData = last7Days.map(day =>
        this.claims.filter(c => c.claimDate.split('T')[0] === day)
          .reduce((sum, c) => sum + (c.amount || 0), 0)
      );
    }
  }

  private calculateRecentClaims(): void {
    this.recentClaims = [...this.claims]
      .sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime())
      .slice(0, 5);
  }

  private generateAIInsights(): void {
    // Generate prediction
    if (this.chartData.length > 0) {
      const avgClaims = this.chartData.reduce((a, b) => a + b, 0) / this.chartData.length;
      const trend = this.chartData[this.chartData.length - 1] - this.chartData[0];
      this.aiPrediction = trend > 0
        ? `📈 Claims are trending upward. Expected ~${Math.round(avgClaims + 1)} claims next week.`
        : `📉 Claim volume stable. Your approval rate is ${this.approvalRate}%.`;
    }

    // Generate insights
    this.aiInsights = [];

    if (this.coverageUtilization > 70) {
      this.aiInsights.push({
        type: 'warning',
        title: 'Coverage Alert',
        message: `You've used ${this.coverageUtilization}% of your coverage. Consider upgrading your plan.`,
        action: '/app/change-plan',
        actionLabel: 'View Plans →'
      });
    }

    if (this.pendingClaims > 0) {
      this.aiInsights.push({
        type: 'info',
        title: 'Pending Claims',
        message: `You have ${this.pendingClaims} claim(s) under review. Average processing time is ${this.avgProcessingTime} days.`,
        action: '/app/claims',
        actionLabel: 'Track Status →'
      });
    }

    if (this.approvalRate > 80) {
      this.aiInsights.push({
        type: 'success',
        title: 'Excellent Approval Rate!',
        message: `Your claims have a ${this.approvalRate}% approval rate - well above average!`,
        action: null,
        actionLabel: ''
      });
    }

    if (this.aiInsights.length === 0) {
      this.aiInsights.push({
        type: 'info',
        title: 'Welcome to ClaimCore',
        message: 'Start by submitting your first claim to get personalized insights.',
        action: '/app/claims/new',
        actionLabel: 'Submit Claim →'
      });
    }
  }

  private renderCharts(): void {
    if (!this.claimsChartCanvas || !this.statusChartCanvas) return;
    if (this.claimsChart) this.claimsChart.destroy();
    if (this.statusChart) this.statusChart.destroy();

    // Claims Chart
    this.claimsChart = new Chart(this.claimsChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: this.chartType === 'claims' ? 'Number of Claims' : 'Claim Amount (₹)',
          data: this.chartData,
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
          legend: { labels: { color: '#9ca3af' } },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y;
                return this.chartType === 'claims'
                  ? `${value} claim(s)`
                  : `₹${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af' }
          }
        }
      }
    });

    // Status Donut Chart
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
        plugins: { legend: { display: false } }
      }
    });
  }

  switchChartType(type: 'claims' | 'amount'): void {
    this.chartType = type;
    this.calculateChartData();
    this.renderCharts();
    this.cdr.markForCheck();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  handleInsightAction(action: string): void {
    if (action) this.router.navigate([action]);
  }

  getPlanValidity(): string {
    if (this.activePlan?.endDate) {
      return new Date(this.activePlan.endDate).toLocaleDateString('default', {
        month: 'long',
        year: 'numeric'
      });
    }
    const date = new Date();
    date.setMonth(date.getMonth() + 12);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  getClaimTrend(): string {
    if (this.totalClaims === 0) return 'No claims yet';
    const trend = this.pendingClaims > 0 ? 'Active claims pending' : `${this.approvalRate}% success rate`;
    return trend;
  }

  downloadReport(): void {
    // Generate CSV report
    const headers = ['Claim ID', 'Date', 'Amount', 'Status', 'Description'];
    const rows = this.claims.map(c => [
      c.claimId,
      new Date(c.claimDate).toLocaleDateString(),
      c.amount,
      c.status,
      c.description || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
