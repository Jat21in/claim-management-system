import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MemberService, MemberDashboardResponse, PolicySummary } from '../../../services/member.service';
import { ClaimService } from '../../../services/claim.service';
import { Subject, interval, takeUntil, forkJoin } from 'rxjs';
import { of } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PdfDownloadService } from '../../../services/pdf-download.service';
import { LanguageService } from '../../../services/language.service';

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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private pdfService = inject(PdfDownloadService);
  private languageService = inject(LanguageService);
  private destroy$ = new Subject<void>();

  @ViewChild('claimsChart') claimsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;

  private claimsChartInstance: Chart | null = null;
  private statusChartInstance: Chart | null = null;

  // Math helper for template
  Math = Math;

  // User Data
  memberName = 'User';
  healthScore = 85;

  // Plan Data
  activePlan: any = null;
  daysRemaining = 0;
  coverageUtilization = 0;
  totalClaimedAmount = 0;
  policyNumber = '';
  policyId = '';

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

  // Premium Payment Tracker
  nextPremiumDue: Date | null = null;
  nextPremiumAmount = 0;
  daysUntilDue = 0;
  lateFee = 0;
  isGracePeriod = false;
  isLapsed = false;
  isPremiumPaid = false;
  lastPaymentDate: Date | null = null;
  lastPaymentAmount = 0;
  lastPaymentId: string | null = null;

  // Payment Success Banner
  showPaymentSuccess = false;
  
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

  // /src/frontend/src/app/pages/app/dashboard/dashboard.component.ts

  ngOnInit(): void {
      this.initializeTime();
      this.startTimeUpdates();
      this.loadDashboardData();
      this.typeGreeting(this.currentGreeting);
      
      // ✅ FIX: Check for payment success from query params IMMEDIATELY and store in localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('paymentSuccess');
      const amount = urlParams.get('amount');
      
      if (paymentSuccess === 'true' && amount) {
          console.log('🎉 Payment success detected! Amount:', amount);
          
          // Store in localStorage to persist across navigation
          localStorage.setItem('paymentSuccess', 'true');
          localStorage.setItem('paymentAmount', amount);
          
          // Show banner
          this.showPaymentSuccess = true;
          this.lastPaymentAmount = parseFloat(amount);
          
          // Remove the query param from URL without reloading
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          // Auto-hide after 5 seconds
          setTimeout(() => {
              this.showPaymentSuccess = false;
              localStorage.removeItem('paymentSuccess');
              localStorage.removeItem('paymentAmount');
              this.cdr.markForCheck();
          }, 5000);
          
          this.cdr.markForCheck();
      } else {
          // ✅ Check localStorage for pending success message (in case of page refresh)
          const storedSuccess = localStorage.getItem('paymentSuccess');
          const storedAmount = localStorage.getItem('paymentAmount');
          
          if (storedSuccess === 'true' && storedAmount) {
              console.log('🎉 Retrieved payment success from localStorage');
              this.showPaymentSuccess = true;
              this.lastPaymentAmount = parseFloat(storedAmount);
              
              setTimeout(() => {
                  this.showPaymentSuccess = false;
                  localStorage.removeItem('paymentSuccess');
                  localStorage.removeItem('paymentAmount');
                  this.cdr.markForCheck();
              }, 5000);
              
              this.cdr.markForCheck();
          }
      }
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
    setTimeout(() => {
      this.initClaimsChart();
      this.initStatusChart();
    }, 100);
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

    const config: ChartConfiguration = {
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
              label: (context: any) => {
                const label = context.label || '';
                const value = context.raw as number;
                return `${label}: ${value}%`;
              }
            }
          }
        },
        cutout: '65%'
      } as any
    };

    this.statusChartInstance = new Chart(this.statusChartCanvas.nativeElement, config);
  }

  // Add this method for debugging
debugPolicyInfo() {
  console.log('========== DEBUG POLICY INFO ==========');
  console.log('activePlan:', this.activePlan);
  console.log('policyId from activePlan?.id:', this.activePlan?.id);
  console.log('policyId from activePlan?.policyId:', this.activePlan?.policyId);
  console.log('policyId stored in component:', this.policyId);
  console.log('policyNumber:', this.policyNumber);
  console.log('========================================');
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

  // PDF Download Methods - FIXED with correct IDs
  downloadPolicyCertificate() {
    if (!this.policyId) {
        console.error('No policy ID available. PolicyId:', this.policyId);
        alert('Policy ID not available. Please contact support.');
        return;
    }
    
    console.log('Downloading policy certificate for Policy ID:', this.policyId);
    console.log('Expected Policy ID (from database): 0a4cbb5a-c67e-4d01-b5e4-3de5ea094236');
    
    this.pdfService.downloadPolicyCertificate(this.policyId).subscribe({
        next: (blob) => {
            const fileName = `Policy_Certificate_${this.policyNumber || this.policyId.slice(0, 8)}.pdf`;
            this.pdfService.saveAs(blob, fileName);
        },
        error: (err) => {
            console.error('Download failed:', err);
            alert('Failed to download policy certificate. Please try again.');
        }
    });
}

  downloadGstInvoice() {
    // ✅ First try to get the latest payment ID from API
    this.pdfService.getRecentPayments().subscribe({
        next: (payments: any[]) => {
            console.log('📋 All payments:', payments);
            
            // Find completed payments (status === 1 or status === 'Completed')
            const completedPayments = payments.filter(p => p.status === 1 || p.status === 'Completed');
            console.log('✅ Completed payments:', completedPayments);
            
            if (completedPayments.length === 0) {
                alert('No completed payment found. Please make a payment first to download GST invoice.');
                return;
            }
            
            // Sort by payment date to get the latest
            const sortedPayments = [...completedPayments].sort((a, b) => 
                new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
            );
            
            const latestPayment = sortedPayments[0];
            const paymentId = latestPayment.paymentId;
            const paymentDate = latestPayment.paymentDate;
            const amount = latestPayment.amount;
            
            console.log(`📄 Downloading GST invoice for payment ${paymentId} from ${paymentDate} amount ₹${amount}`);
            
            // Store for future use
            localStorage.setItem('lastPaymentId', paymentId);
            
            this.downloadGstInvoiceWithId(paymentId);
        },
        error: (err) => {
            console.error('Failed to fetch payment records:', err);
            alert('Unable to fetch payment records. Please make a payment first.');
        }
    });
}

private downloadGstInvoiceWithId(paymentId: string) {
    console.log('📄 Downloading GST invoice for payment ID:', paymentId);
    
    this.pdfService.downloadGstInvoice(paymentId).subscribe({
        next: (blob) => {
            if (blob.size === 0) {
                console.error('Received empty PDF');
                alert('Generated invoice is empty. Please try again.');
                return;
            }
            const fileName = `GST_Invoice_${new Date().toISOString().slice(0, 10)}.pdf`;
            this.pdfService.saveAs(blob, fileName);
        },
        error: (err) => {
            console.error('Download failed:', err);
            
            // If 404, clear the cached ID and retry
            if (err.status === 404) {
                console.log('Payment ID not found, clearing cache and retrying...');
                localStorage.removeItem('lastPaymentId');
                
                // Retry once
                this.downloadGstInvoice();
            } else {
                alert('Failed to download GST invoice. Please try again later.');
            }
        }
    });
}

  // Navigation Methods
  navigateToPayments() {
    this.router.navigate(['/app/payments/new']);
  }

  navigateToPaymentHistory() {
    this.router.navigate(['/app/payments']);
  }

  navigateToReinstate() {
    this.router.navigate(['/app/policy/reinstate']);
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
            console.log('Member data:', result.member);

            this.memberName = result.member?.fullName || 'User';
            this.activePlan = result.member?.activePlan;
            
            // ✅ CRITICAL FIX: Use activePolicyId from backend, NOT activePlan.id
            const memberAny = result.member as any;
            this.policyId = memberAny?.activePolicyId || this.activePlan?.id || '';
            this.policyNumber = memberAny?.activePolicyNumber || this.activePlan?.id?.slice(0, 8) || '';
            
            console.log('✅ Active Policy ID (use this for certificate):', this.policyId);
            console.log('✅ Active Policy Number:', this.policyNumber);
            console.log('⚠️ Active Plan ID (DO NOT use for certificate):', this.activePlan?.id);
            
            // Store for GST invoice
            if (this.policyId) {
                localStorage.setItem('activePolicyId', this.policyId);
            }

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

            this.generateAIInsights();
            this.loadPremiumPaymentStatus();
            this.loadLastPaymentId();
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

// Add this method
private loadLastPaymentId(): void {
    this.pdfService.getRecentPayments().subscribe({
        next: (payments) => {
            console.log('Recent payments:', payments);
            
            // ✅ Find the MOST RECENT COMPLETED payment (not first, but with latest paymentDate)
            const completedPayments = payments?.filter(p => p.status === 'Completed' || p.status === 1);
            
            if (completedPayments && completedPayments.length > 0) {
                // Sort by payment date descending to get the latest
                const sortedPayments = [...completedPayments].sort((a, b) => 
                    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
                );
                
                const latestPayment = sortedPayments[0];
                
                if (latestPayment?.paymentId) {
                    localStorage.setItem('lastPaymentId', latestPayment.paymentId);
                    this.lastPaymentId = latestPayment.paymentId;
                    console.log('✅ Last payment ID stored:', latestPayment.paymentId);
                    console.log('✅ Payment date:', latestPayment.paymentDate);
                    console.log('✅ Payment amount:', latestPayment.amount);
                }
            } else {
                console.log('No completed payments found');
                localStorage.removeItem('lastPaymentId');
            }
        },
        error: (err) => {
            console.error('Failed to fetch recent payments:', err);
        }
    });
}

  private loadPremiumPaymentStatus(): void {
    this.memberService.getEnhancedDashboard().subscribe({
      next: (data) => {
        const summary = data.policySummary;
        if (summary) {
          this.isPremiumPaid = summary.isPremiumPaidForCurrentMonth || false;
          
          if (this.isPremiumPaid) {
            this.lastPaymentDate = summary.lastPaymentDate ? new Date(summary.lastPaymentDate) : null;
            this.lastPaymentAmount = summary.lastPaymentAmount || 0;
            // Store the last payment ID for GST invoice
            if (summary.lastPaymentId) {
              localStorage.setItem('lastPaymentId', summary.lastPaymentId);
              this.lastPaymentId = summary.lastPaymentId;
            }
            return;
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
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load payment status:', err)
    });
  }

  private generateAIInsights(): void {
    this.aiInsights = [];

    if (this.coverageUtilization > 70) {
      this.aiInsights.push({
        title: 'Coverage Alert',
        message: `You've utilized ${this.coverageUtilization}% of your coverage. Consider upgrading your plan for continued protection.`,
        type: 'warning',
        action: 'Upgrade Plan',
        actionLabel: 'Upgrade Plan'
      });
    }

    if (this.approvalRate < 60 && this.totalClaims > 0) {
      this.aiInsights.push({
        title: 'Improve Approval Rate',
        message: `Your claim approval rate is ${this.approvalRate}%. Review documentation requirements for better success.`,
        type: 'warning',
        action: 'View Guidelines',
        actionLabel: 'View Guidelines'
      });
    }

    if (this.pendingClaims > 3) {
      this.aiInsights.push({
        title: 'Pending Claims Alert',
        message: `You have ${this.pendingClaims} claims pending review. Track their status in the claims section.`,
        type: 'info',
        action: 'Track Claims',
        actionLabel: 'Track Now'
      });
    }

    if (this.daysRemaining < 30 && this.daysRemaining > 0) {
      this.aiInsights.push({
        title: 'Renewal Reminder',
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
      id: 'bb4354ec-77fb-4e84-91ec-f01f4cda87e8',
      name: 'Health Pro Plus',
      insuredAmount: 500000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    this.policyId = this.activePlan.id;
    this.policyNumber = 'POL-DEMO-001';

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
    if (this.policyNumber) {
      return this.policyNumber;
    }
    if (this.activePlan?.policyNumber) {
      return this.activePlan.policyNumber;
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