import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MemberService, MemberDashboardResponse, PolicySummary } from '../../../services/member.service';
import { ClaimService } from '../../../services/claim.service';
import { Subject, interval, takeUntil, forkJoin } from 'rxjs';
import { of } from 'rxjs';

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
export class DashboardComponent implements OnInit, OnDestroy {
  private memberService = inject(MemberService);
  private claimService = inject(ClaimService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // User Data
  memberName = 'User';
  healthScore = 85;

  // Plan Data
  activePlan: any = null;
  daysRemaining = 0;
  coverageUtilization = 0;
  totalClaimedAmount = 0;

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

  // Enhanced Policy Data (NEW)
  enhancedPolicy: PolicySummary | null = null;
  dependentsList: any[] = [];
  nomineesList: any[] = [];
  showEnhancedFeatures = false;
  enhancedData: any = null;

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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
  const policySummary$ = this.memberService.getEnhancedDashboard
    ? this.memberService.getEnhancedDashboard()
    : of(this.getFallbackPolicyData());
  const dependents$ = this.getDependentsData();
  const nominees$ = this.getNomineesData();

  console.log('📡 Observables created:', {
    member$,
    claims$,
    policySummary$,
    dependents$,
    nominees$
  });

  console.log('🧪 Type checks:', {
    member: typeof member$,
    claims: typeof claims$,
    policy: typeof policySummary$,
  });

  forkJoin({
    member: member$,
    claims: claims$,
    policySummary: policySummary$,
    dependents: dependents$,
    nominees: nominees$
  }).subscribe({
    next: (result) => {
      console.log('✅ forkJoin SUCCESS:', result);

      try {
        console.log('👤 Member response:', result.member);
        console.log('📄 Claims response:', result.claims);
        console.log('📊 Policy summary response:', result.policySummary);
        console.log('👨‍👩‍👧 Dependents response:', result.dependents);
        console.log('🧾 Nominees response:', result.nominees);

        // ✅ Assign safely
        this.memberName = result.member?.fullName;
        this.activePlan = result.member?.activePlan;

        console.log('✅ Assigned member + plan:', {
          memberName: this.memberName,
          activePlan: this.activePlan
        });

        // ✅ Process claims
        const claims = result.claims as any[];
        console.log('📊 Processing claims:', claims);

        this.totalClaims = claims?.length || 0;
        this.approvedClaims = claims.filter(c => c.status === 'Approved').length;
        this.pendingClaims = claims.filter(c => c.status === 'Submitted' || c.status === 'Pending').length;
        this.rejectedClaims = claims.filter(c => c.status === 'Rejected').length;

        console.log('📊 Claims stats:', {
          total: this.totalClaims,
          approved: this.approvedClaims,
          pending: this.pendingClaims,
          rejected: this.rejectedClaims
        });

        // ✅ Coverage
        if (this.activePlan) {
          this.totalClaimedAmount = claims.reduce((sum, c) =>
            c.status === 'Approved' ? sum + c.amount : sum, 0);

          this.coverageUtilization = Math.min(100, Math.round(
            (this.totalClaimedAmount / this.activePlan.insuredAmount) * 100
          ));

          console.log('💰 Coverage:', {
            claimed: this.totalClaimedAmount,
            utilization: this.coverageUtilization
          });
        }

        console.log('🎯 Before AI insights');
        this.generateAIInsights();
        console.log('🎯 After AI insights');

      } catch (err) {
        console.error('💥 ERROR inside success block:', err);
      }

      console.log('🔄 Triggering change detection');
      this.cdr.markForCheck();
    },

    error: (err) => {
      console.error('❌ forkJoin ERROR:', err);
      console.error('🔥 Full error object:', JSON.stringify(err));

      this.generateFallbackData();
      this.cdr.markForCheck();
    },

    complete: () => {
      console.log('✅ forkJoin COMPLETED');
    }
  });
}

  private getFallbackPolicyData(): any {
    // Return empty data structure
    return { policySummary: null, dependents: [], nominees: [] };
  }

  private getDependentsData() {
  return of([]);
}

private getNomineesData() {
  return of([]);
}

  private generateAIInsights(): void {
    this.aiInsights = [];

    // Premium due insight
    if (this.enhancedPolicy?.nextPremiumDueDate) {
      const dueDate = new Date(this.enhancedPolicy.nextPremiumDueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 7) {
        this.aiInsights.push({
          title: '⏰ Premium Due Soon',
          message: `Your premium of ₹${this.enhancedPolicy.nextPremiumAmount} is due in ${daysUntilDue} days. Pay now to avoid policy lapse.`,
          type: 'warning',
          action: 'Pay Premium',
          actionLabel: 'Pay Premium'
        });
      }
    }
    // In loadDashboardData, after setting enhancedPolicy
    if (this.enhancedPolicy || this.activePlan) {
        this.showEnhancedFeatures = true;
        this.enhancedData = {
            policySummary: this.enhancedPolicy || {
                hasActivePolicy: true,
                policyNumber: this.activePlan?.id,
                planName: this.activePlan?.name,
                sumInsured: this.activePlan?.insuredAmount,
                nextPremiumAmount: 125
            },
            dependents: this.dependentsList,
            nominees: this.nomineesList
        };
    }
    // Coverage utilization insight
    if (this.coverageUtilization > 70) {
      this.aiInsights.push({
        title: '📊 Coverage Alert',
        message: `You've utilized ${this.coverageUtilization}% of your coverage. Consider upgrading your plan.`,
        type: 'info',
        action: 'Upgrade Plan',
        actionLabel: 'Upgrade Plan'
      });
    }

    // Claims approval insight
    if (this.approvalRate < 60 && this.totalClaims > 0) {
      this.aiInsights.push({
        title: '✓ Improve Approval Rate',
        message: `Your claim approval rate is ${this.approvalRate}%. Review claim requirements for better success.`,
        type: 'warning',
        action: 'View Guidelines',
        actionLabel: 'View Guidelines'
      });
    }

    // Add default insight if none
    if (this.aiInsights.length === 0) {
      this.aiInsights.push({
        title: '✅ All Set!',
        message: `You're all set! Your policy is active with ₹${this.activePlan?.insuredAmount?.toLocaleString() || '0'} coverage.`,
        type: 'success'
      });
    }

    // Set AI prediction
    if (this.totalClaims > 0) {
      this.aiPrediction = `Based on your history, your next claim is likely to be processed within ${this.avgProcessingTime}`;
    } else {
      this.aiPrediction = 'Start your first claim to see AI-powered predictions';
    }
  }

  private generateFallbackData(): void {
    this.memberName = 'John Doe';
    this.healthScore = 85;
    this.totalClaims = 12;
    this.approvedClaims = 10;
    this.pendingClaims = 1;
    this.rejectedClaims = 1;
    this.approvalRate = 83;
    this.approvedPercent = 83;
    this.pendingPercent = 8;
    this.rejectedPercent = 8;
    this.avgProcessingTime = '3.2 days';
    this.pendingTrend = -2;

    this.activePlan = {
      id: '1',
      name: 'Essential Care Plan',
      insuredAmount: 300000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.daysRemaining = 245;
    this.coverageUtilization = 15;
    this.totalClaimedAmount = 45000;

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

  switchChartType(type: 'claims' | 'amount'): void {
    this.chartType = type;
    this.cdr.markForCheck();
  }

  handleInsightAction(action: string): void {
    if (action === 'Pay Premium') {
      this.router.navigate(['/app/payments']);
    } else if (action === 'Upgrade Plan') {
      this.router.navigate(['/plans']);
    } else if (action === 'View Guidelines') {
      this.router.navigate(['/app/claims/guidelines']);
    }
  }

  downloadReport(): void {
    // Generate and download a simple report
    const reportData = {
      memberName: this.memberName,
      date: new Date().toISOString(),
      policy: this.activePlan,
      claims: {
        total: this.totalClaims,
        approved: this.approvedClaims,
        pending: this.pendingClaims,
        rejected: this.rejectedClaims,
        approvalRate: this.approvalRate
      },
      coverageUtilization: this.coverageUtilization
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
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
      return this.activePlan.id;
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

  getNextPremiumDate(): string {
    if (this.enhancedPolicy?.nextPremiumDueDate) {
      const date = new Date(this.enhancedPolicy.nextPremiumDueDate);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return 'N/A';
  }

  getDependentsCount(): number {
    return this.dependentsList.length;
  }

  getNomineesCount(): number {
    return this.nomineesList.length;
  }
}
