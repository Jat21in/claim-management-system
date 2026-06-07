import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MemberService, MemberDashboardResponse, PolicySummary } from '../../../services/member.service';
import { ClaimService } from '../../../services/claim.service';
import { PolicyService } from '../../../services/policy.service';
import { Subject, interval, takeUntil, forkJoin } from 'rxjs';
import { of } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardStats {
  claimsSubmitted: number;
  claimsApproved: number;
  totalCoverage: number;
  daysUntilRenewal: number;
  approvalRate: number;
}

interface RecentClaim {
  id: string;
  date: string;
  claimDate: string;
  amount: number;
  status: string;
  description: string;
  aiConfidenceScore?: number;
}

interface AIInsight {
  message: string;
  title?: string;
  type: 'success' | 'warning' | 'info';
  action?: string;
  actionLabel?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms 100ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('600ms 200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms 300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private memberService = inject(MemberService);
  private claimService = inject(ClaimService);
  private policyService = inject(PolicyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @ViewChild('claimsChart') claimsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;

  private claimsChartInstance: Chart | null = null;
  private statusChartInstance: Chart | null = null;

  Math = Math;

  // User Data
  memberName = 'User';
  healthScore = 85;

  // Plan Data
  activePlan: any = null;
  daysRemaining = 0;
  coverageUtilization = 0;
  totalClaimedAmount = 0;
  nextPremiumDue: Date | null = null;
  nextPremiumAmount = 0;
  daysUntilDue = 0;
  lateFee = 0;
  isGracePeriod = false;
  isLapsed = false;
  isPremiumPaid = false; // ✅ NEW
  lastPaymentDate: Date | null = null; // ✅ NEW

  // Payment success banner
  showPaymentSuccess = false;
  lastPaymentAmount = 0;

  // Claims Data
  totalClaims = 0;
  approvedClaims = 0;
  pendingClaims = 0;
  rejectedClaims = 0;
  approvalRate = 0;
  approvedPercent = 0;
  pendingPercent = 0;
  rejectedPercent = 0;
  avgProcessingTime = '3.2 days';

  // Trends
  pendingTrend = -2;

  // Chart & AI
  chartType: 'claims' | 'amount' = 'claims';
  aiPrediction: string | null = null;
  aiInsights: AIInsight[] = [];
  recentClaims: RecentClaim[] = [];

  // Enhanced Policy Data
  enhancedPolicy: PolicySummary | null = null;
  dependentsList: any[] = [];
  nomineesList: any[] = [];
  showEnhancedFeatures = false;
  enhancedData: any = null;

  // Chart Data
  claimsChartData = [65, 45, 78, 32, 89, 56, 92];
  amountChartData = [25000, 18000, 32000, 15000, 45000, 28000, 52000];
  chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Time & Greeting
  currentTime = '';
  currentDate = '';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  greetingIndex = 0;
  greetings = [
    "Ready to manage your claims?",
    "Your policies are secure with us.",
    "Track your coverage in real-time.",
    "Any new claims to submit?",
    "Your health is our priority."
  ];
  currentGreeting = this.greetings[0];
  typedGreeting = '';
  private typingIndex = 0;
  private typingSpeed = 30;

  ngOnInit(): void {
    this.initializeTime();
    this.startTimeUpdates();
    this.loadDashboardData();
    this.typeGreeting(this.currentGreeting);
    this.checkPaymentSuccess();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.claimsChartInstance) {
      this.claimsChartInstance.destroy();
      this.claimsChartInstance = null;
    }
    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
      this.statusChartInstance = null;
    }
  }

  private initCharts(): void {
    this.initClaimsChart();
    this.initStatusChart();
  }

  private initClaimsChart(): void {
    if (!this.claimsChartCanvas?.nativeElement) return;

    if (this.claimsChartInstance) {
      this.claimsChartInstance.destroy();
    }

    const data = this.chartType === 'claims' ? this.claimsChartData : this.amountChartData;
    const label = this.chartType === 'claims' ? 'Number of Claims' : 'Claim Amount (₹)';
    const backgroundColor = this.chartType === 'claims'
      ? 'rgba(34, 211, 238, 0.6)'
      : 'rgba(139, 92, 246, 0.6)';

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.chartLabels,
        datasets: [{
          label: label,
          data: data,
          borderColor: '#22D3EE',
          backgroundColor: backgroundColor,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#22D3EE',
          pointBorderColor: '#0B1220',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8',
              font: { size: 11 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                let value = context.raw as number;
                if (this.chartType === 'amount') {
                  return `₹${value.toLocaleString()}`;
                }
                return `${value} claims`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94A3B8' },
            title: {
              display: true,
              text: this.chartType === 'amount' ? 'Amount (₹)' : 'Claims Count',
              color: '#64748B'
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94A3B8' }
          }
        }
      }
    };

    this.claimsChartInstance = new Chart(this.claimsChartCanvas.nativeElement, config);
  }

  private initStatusChart(): void {
    if (!this.statusChartCanvas?.nativeElement) return;

    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
    }

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [this.approvedPercent, this.pendingPercent, this.rejectedPercent],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                return `${label}: ${value}%`;
              }
            }
          }
        },
        cutout: '65%'
      }
    };

    this.statusChartInstance = new Chart(this.statusChartCanvas.nativeElement, config);
  }

  private typeGreeting(text: string): void {
    this.typedGreeting = '';
    this.typingIndex = 0;

    const typingInterval = interval(this.typingSpeed)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.typingIndex < text.length) {
          this.typedGreeting += text[this.typingIndex];
          this.typingIndex++;
          this.cdr.markForCheck();
        } else {
          typingInterval.unsubscribe();
        }
      });
  }

  private initializeTime(): void {
    this.updateTime();
  }

  private startTimeUpdates(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTime();
        this.cdr.markForCheck();
      });

    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.greetingIndex = (this.greetingIndex + 1) % this.greetings.length;
        this.currentGreeting = this.greetings[this.greetingIndex];
        this.typeGreeting(this.currentGreeting);
      });
  }

  private updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    this.currentDate = now.toLocaleDateString('en-US', options);

    const hour = now.getHours();
    if (hour >= 5 && hour < 12) this.timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) this.timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) this.timeOfDay = 'evening';
    else this.timeOfDay = 'night';
  }

  getSunMoonIcon(): string {
    switch (this.timeOfDay) {
      case 'morning': return '🌅';
      case 'afternoon': return '☀️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      default: return '⏰';
    }
  }

  getTimeBasedGreeting(): string {
    switch (this.timeOfDay) {
      case 'morning': return 'Good Morning';
      case 'afternoon': return 'Good Afternoon';
      case 'evening': return 'Good Evening';
      case 'night': return 'Good Night';
      default: return 'Hello';
    }
  }

  private loadDashboardData(): void {
    console.log('🚀 Dashboard Load Started');

    const member$ = this.memberService.getDashboard();
    const claims$ = this.claimService.getMyClaims();
    const dependents$ = of([]);
    const nominees$ = of([]);

    forkJoin({
      member: member$,
      claims: claims$,
      dependents: dependents$,
      nominees: nominees$
    }).subscribe({
      next: (result) => {
        console.log('✅ Dashboard data loaded');

        this.memberName = result.member?.fullName || 'User';
        this.activePlan = result.member?.activePlan;

        const claims = result.claims as any[];
        this.recentClaims = claims?.slice(0, 5).map((c: any) => ({
          id: c.claimId,
          date: c.claimDate,
          claimDate: c.claimDate,
          amount: c.amount,
          status: c.status,
          description: c.description,
          aiConfidenceScore: c.aiConfidenceScore
        })) || [];

        this.totalClaims = claims?.length || 0;
        this.approvedClaims = claims?.filter(c => c.status === 'Approved' || c.status === 'Paid').length || 0;
        this.pendingClaims = claims?.filter(c => c.status === 'Submitted' || c.status === 'Pending').length || 0;
        this.rejectedClaims = claims?.filter(c => c.status === 'Rejected').length || 0;

        this.approvalRate = this.totalClaims > 0
          ? Math.round((this.approvedClaims / this.totalClaims) * 100)
          : 0;

        this.approvedPercent = this.totalClaims > 0
          ? Math.round((this.approvedClaims / this.totalClaims) * 100)
          : 0;
        this.pendingPercent = this.totalClaims > 0
          ? Math.round((this.pendingClaims / this.totalClaims) * 100)
          : 0;
        this.rejectedPercent = this.totalClaims > 0
          ? Math.round((this.rejectedClaims / this.totalClaims) * 100)
          : 0;

        if (this.activePlan) {
          this.totalClaimedAmount = claims?.reduce((sum, c) =>
            (c.status === 'Approved' || c.status === 'Paid') ? sum + c.amount : sum, 0) || 0;

          this.coverageUtilization = Math.min(100, Math.round(
            (this.totalClaimedAmount / this.activePlan.insuredAmount) * 100
          ));

          const endDate = new Date(this.activePlan.endDate);
          this.daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        }

        this.loadPremiumPaymentStatus();
        this.generateAIInsights();
        this.cdr.markForCheck();

        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (err) => {
        console.error('❌ Dashboard data error:', err);
        this.generateFallbackData();
        this.cdr.markForCheck();

        setTimeout(() => {
          this.initCharts();
        }, 100);
      }
    });
  }

  private loadPremiumPaymentStatus(): void {
    this.policyService.getPolicySummary().subscribe({
      next: (summary) => {
        // ✅ Check if premium is already paid for current month
        this.isPremiumPaid = summary.isPremiumPaidForCurrentMonth || false;

        if (this.isPremiumPaid) {
          this.lastPaymentDate = summary.lastPaymentDate ? new Date(summary.lastPaymentDate) : null;
          this.lastPaymentAmount = summary.lastPaymentAmount || 0;
          this.cdr.markForCheck();
          return; // No need to show due payment
        }

        if (summary.nextPremiumDueDate && !this.isPremiumPaid) {
          this.nextPremiumDue = new Date(summary.nextPremiumDueDate);
          this.nextPremiumAmount = summary.nextPremiumAmount || 0;

          const today = new Date();
          this.daysUntilDue = Math.ceil((this.nextPremiumDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          this.isGracePeriod = this.daysUntilDue <= 15 && this.daysUntilDue > 0;
          this.isLapsed = this.daysUntilDue <= -30;

          if (this.daysUntilDue <= 0 && this.daysUntilDue > -30) {
            this.lateFee = this.nextPremiumAmount * 0.05;
          }
        }

        this.cdr.markForCheck();
      }
    });
  }

  private generateAIInsights(): void {
    this.aiInsights = [];

    if (this.coverageUtilization > 70) {
      this.aiInsights.push({
        title: '📊 Coverage Alert',
        message: `You've utilized ${this.coverageUtilization}% of your coverage. Consider upgrading your plan for continued protection.`,
        type: 'warning',
        action: 'Upgrade Plan',
        actionLabel: 'Upgrade Plan'
      });
    }

    if (this.approvalRate < 60 && this.totalClaims > 0) {
      this.aiInsights.push({
        title: '✓ Improve Approval Rate',
        message: `Your claim approval rate is ${this.approvalRate}%. Review documentation requirements for better success.`,
        type: 'warning',
        action: 'View Guidelines',
        actionLabel: 'View Guidelines'
      });
    }

    if (this.pendingClaims > 3) {
      this.aiInsights.push({
        title: '⏳ Pending Claims Alert',
        message: `You have ${this.pendingClaims} claims pending review. Track their status in the claims section.`,
        type: 'info',
        action: 'Track Claims',
        actionLabel: 'Track Now'
      });
    }

    if (this.daysRemaining < 30 && this.daysRemaining > 0) {
      this.aiInsights.push({
        title: '🔄 Renewal Reminder',
        message: `Your policy renews in ${this.daysRemaining} days. Renew early to avoid coverage gaps.`,
        type: 'warning',
        action: 'Renew Now',
        actionLabel: 'Renew Now'
      });
    }

    if (this.aiInsights.length === 0) {
      this.aiInsights.push({
        title: 'All Set!',
        message: `Your policy is active with ${this.formatCurrency(this.activePlan?.insuredAmount || 0)} coverage. Everything looks good!`,
        type: 'success'
      });
    }

    if (this.totalClaims > 0) {
      this.aiPrediction = `Based on your claim history, your next claim is estimated to be processed within ${this.avgProcessingTime}`;
    } else {
      this.aiPrediction = 'Start your first claim to see AI-powered predictions and insights';
    }
  }

  private generateFallbackData(): void {
    this.memberName = 'Valued Customer';
    this.healthScore = 85;
    this.totalClaims = 0;
    this.approvedClaims = 0;
    this.pendingClaims = 0;
    this.rejectedClaims = 0;
    this.approvalRate = 0;
    this.approvedPercent = 0;
    this.pendingPercent = 0;
    this.rejectedPercent = 0;
    this.avgProcessingTime = '3-5 days';
    this.pendingTrend = 0;
    this.coverageUtilization = 0;
    this.totalClaimedAmount = 0;
    this.daysRemaining = 365;

    this.activePlan = {
      id: '1',
      name: 'Health Pro Plus',
      insuredAmount: 500000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.recentClaims = [];
    this.generateAIInsights();
  }

  getPlanValidity(): string {
    if (!this.activePlan) return 'No active plan';
    const start = new Date(this.activePlan.startDate);
    const end = new Date(this.activePlan.endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  getClaimTrend(): string {
    if (this.pendingTrend > 0) return `+${this.pendingTrend} this week`;
    if (this.pendingTrend < 0) return `${this.pendingTrend} this week`;
    return 'No change';
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Update these methods
  navigateToPayments() {
    this.router.navigate(['/app/payments/new']); // Goes to payment page
  }

  navigateToPaymentHistory() {
    this.router.navigate(['/app/payments']); // Goes to history page
  }

  navigateToReinstate() {
    this.router.navigate(['/app/policy/reinstate']);
  }

  switchChartType(type: 'claims' | 'amount'): void {
    this.chartType = type;
    this.initClaimsChart();
    this.cdr.markForCheck();
  }

  handleInsightAction(action: string): void {
    if (action === 'Pay Premium' || action === 'Renew Now') {
      this.router.navigate(['/app/payments']);
    } else if (action === 'Upgrade Plan') {
      this.router.navigate(['/plans']);
    } else if (action === 'View Guidelines') {
      this.router.navigate(['/app/claims/guidelines']);
    } else if (action === 'Track Claims' || action === 'Track Now') {
      this.router.navigate(['/app/claims']);
    }
  }

  downloadReport(): void {
    const reportData = {
      memberName: this.memberName,
      generatedAt: new Date().toISOString(),
      policy: {
        name: this.activePlan?.name,
        coverageAmount: this.activePlan?.insuredAmount,
        validUntil: this.activePlan?.endDate,
        daysRemaining: this.daysRemaining,
        utilization: this.coverageUtilization
      },
      claims: {
        total: this.totalClaims,
        approved: this.approvedClaims,
        pending: this.pendingClaims,
        rejected: this.rejectedClaims,
        approvalRate: this.approvalRate,
        totalClaimedAmount: this.totalClaimedAmount
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimcore-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getRemainingCoverage(): number {
    if (!this.activePlan) return 0;
    return this.activePlan.insuredAmount - this.totalClaimedAmount;
  }

  getPolicyNumber(): string {
    if (this.enhancedPolicy?.policyNumber) {
      return this.enhancedPolicy.policyNumber;
    }
    if (this.activePlan?.id) {
      return this.activePlan.id.slice(0, 8).toUpperCase();
    }
    return 'N/A';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private checkPaymentSuccess(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['paymentSuccess'] === 'true') {
        this.showPaymentSuccess = true;
        this.lastPaymentAmount = Number(params['amount']) || 0;

        // Clear cache if available and refresh payment status
        try {
          this.policyService.clearCache?.();
        } catch (e) {
          // ignore if not implemented
        }
        this.loadPremiumPaymentStatus();
        this.cdr.markForCheck();

        // Auto-hide after 5 seconds
        setTimeout(() => {
          this.showPaymentSuccess = false;
          this.cdr.markForCheck();
        }, 5000);
      }
    });
  }

  getNextPremiumDate(): string {
    if (this.enhancedPolicy?.nextPremiumDueDate) {
      const date = new Date(this.enhancedPolicy.nextPremiumDueDate);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    return nextDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDependentsCount(): number {
    return this.dependentsList.length;
  }

  getNomineesCount(): number {
    return this.nomineesList.length;
  }
}
