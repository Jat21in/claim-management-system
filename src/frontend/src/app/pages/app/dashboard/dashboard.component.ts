
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MemberService, MemberDashboardResponse } from '../../../services/member.service';
import { Subject, interval, takeUntil } from 'rxjs';

interface DashboardStats {
  claimsSubmitted: number;
  claimsApproved: number;
  totalCoverage: number;
  daysUntilRenewal: number;
  approvalRate: number;
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
    ]),
    trigger('pulseGlow', [
      transition('* => *', [
        animate('2s ease-in-out', keyframes([
          style({ boxShadow: '0 0 20px rgba(79, 156, 255, 0.3)', offset: 0 }),
          style({ boxShadow: '0 0 40px rgba(79, 156, 255, 0.6)', offset: 0.5 }),
          style({ boxShadow: '0 0 20px rgba(79, 156, 255, 0.3)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private memberService = inject(MemberService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  loading = true;
  error: string | null = null;
  data!: MemberDashboardResponse;

  // Time & Greeting
  currentTime = '';
  currentDate = '';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  greetingIndex = 0;

  // Stats
  stats: DashboardStats = {
    claimsSubmitted: 12,
    claimsApproved: 10,
    totalCoverage: 750000,
    daysUntilRenewal: 45,
    approvalRate: 83
  };

  coverageRemainingPercent = 0;

  // Greeting messages that rotate
  greetings = [
    "Welcome back! Ready to manage your claims?",
    "Great to see you again! All your policies are active.",
    "You're all set! Check your coverage status.",
    "Everything's looking good! Any new claims?",
    "Happy to help! Your claims are secure with us."
  ];

  currentGreeting = this.greetings[0];

  typedGreeting = '';
  private typingIndex = 0;
  private typingSpeed = 25; // ms per character

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
        typingInterval.unsubscribe(); // stop when done
      }
    });
  }

  ngOnInit(): void {
    this.initializeTime();
    this.startTimeUpdates();
    this.loadDashboard();
    this.typeGreeting(this.currentGreeting);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  /**
   * Initialize time and date display
   */
  private initializeTime(): void {
    this.updateTime();
  }

  /**
   * Update current time every second and rotate greetings every 5 seconds
   */
  private startTimeUpdates(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTime();
        this.cdr.markForCheck();
      });

    // Rotate greeting every 4 seconds
    interval(4000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.greetingIndex = (this.greetingIndex + 1) % this.greetings.length;
        this.currentGreeting = this.greetings[this.greetingIndex];
        this.typeGreeting(this.currentGreeting);
      });
  }

  /**
   * Update time, date, and time of day
   */
  private updateTime(): void {
    const now = new Date();

    // Time formatting
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    // Date formatting
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    this.currentDate = now.toLocaleDateString('en-US', options);

    // Determine time of day
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
      this.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      this.timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      this.timeOfDay = 'evening';
    } else {
      this.timeOfDay = 'night';
    }
  }

  /**
   * Get sun/moon icon based on time of day
   */
  getSunMoonIcon(): string {
    switch (this.timeOfDay) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌆';
      case 'night':
        return '🌙';
      default:
        return '⏰';
    }
  }

  /**
   * Get greeting text based on time
   */
  getTimeBasedGreeting(): string {
    switch (this.timeOfDay) {
      case 'morning':
        return 'Good Morning';
      case 'afternoon':
        return 'Good Afternoon';
      case 'evening':
        return 'Good Evening';
      case 'night':
        return 'Good Night';
      default:
        return 'Hello';
    }
  }

  /**
   * Load dashboard data from service
   */
  private loadDashboard(): void {
    this.memberService.getDashboard().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;

        // Calculate stats based on response
        this.calculateStats(res);

        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load dashboard';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Calculate dashboard statistics
   */
  private calculateStats(data: MemberDashboardResponse): void {
    if (data.activePlan) {
      // Calculate days until renewal
      const endDate = new Date(data.activePlan.endDate);
      const today = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      this.stats.daysUntilRenewal = Math.max(0, daysLeft);
      this.stats.totalCoverage = data.activePlan.insuredAmount;
      this.coverageRemainingPercent = Math.round((this.stats.daysUntilRenewal / 365) * 100);
    } else {
      this.coverageRemainingPercent = 0;
    }
  }

  /**
   * Format currency in INR
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Get status color based on metric
   */
  getStatusColor(metric: 'approval' | 'renewal'): string {
    if (metric === 'approval') {
      return this.stats.approvalRate >= 80 ? 'success' : this.stats.approvalRate >= 60 ? 'warning' : 'danger';
    }
    if (metric === 'renewal') {
      return this.stats.daysUntilRenewal > 30 ? 'success' : this.stats.daysUntilRenewal > 10 ? 'warning' : 'danger';
    }
    return 'default';
  }

  /**
   * Get status text
   */
  getStatusText(metric: 'approval' | 'renewal'): string {
    if (metric === 'approval') {
      return this.stats.approvalRate >= 80 ? 'Excellent' : this.stats.approvalRate >= 60 ? 'Good' : 'Needs Attention';
    }
    if (metric === 'renewal') {
      return this.stats.daysUntilRenewal > 30 ? 'Plenty of Time' : this.stats.daysUntilRenewal > 10 ? 'Renew Soon' : 'Urgent';
    }
    return 'Unknown';
  }
}
