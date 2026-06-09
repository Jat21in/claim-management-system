import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { trigger, transition, style, animate, query, stagger, keyframes, sequence } from '@angular/animations';

interface JobMetric {
  name: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

interface ScheduledJob {
  name: string;
  cron: string;
  schedule: string;
  lastExecution: string;
  nextExecution: string;
  enabled: boolean;
  description: string;
  status: 'healthy' | 'warning' | 'error';
  businessImpact: string;
  risk?: 'Low' | 'Medium' | 'High' | string;
}

interface TimelineStep {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: string;
  status: 'active' | 'completed' | 'pending';
  details: string[];
}

@Component({
  selector: 'app-hangfire-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hangfire-monitoring.component.html',
  styleUrls: ['./hangfire-monitoring.component.scss'],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('timelineStagger', [
      transition('* => *', [
        query('.timeline-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('150ms', [
            animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('pulseMetric', [
      transition('* => *', [
        animate('600ms ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.05)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('slideInTable', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('progressAnimation', [
      transition(':increment', [
        animate('800ms ease-out', style({ width: '{{width}}%' }))
      ], { params: { width: 0 } })
    ])
  ]
})
export class HangfireMonitoringComponent implements OnInit, OnDestroy {
  stats: any = {};
  recurringJobs: ScheduledJob[] = [];
  jobs: any[] = [];
  triggerMessage = '';
  triggerSuccess = false;
  isLoading = true;
  autoRefresh = true;
  refreshInterval: any;
  lastRefreshed: Date = new Date();
  searchQuery = '';
  selectedJobFilter = 'all';
  activeTimelineStep = 2;
  
  // Timeline steps for background job process
  timelineSteps: TimelineStep[] = [
    {
      id: 1,
      title: 'Premium Due Detection',
      description: 'System identifies upcoming premium payments',
      time: 'Daily at 12:00 AM',
      icon: 'detection',
      status: 'active',
      details: [
        'Scans all active policies for premium due dates',
        'Identifies payments due in next 7 days',
        'Flags overdue payments (15+ days late)',
        'Adds late fees to overdue accounts'
      ]
    },
    {
      id: 2,
      title: 'Grace Period Notifications',
      description: 'Automated email reminders sent to members',
      time: 'Daily at 9:00 AM',
      icon: 'notification',
      status: 'active',
      details: [
        'Sends 7-day advance payment reminders',
        'Sends 3-day urgent payment reminders',
        'Sends 1-day final reminder before grace',
        'Sends overdue payment notifications',
        'Includes payment links and instructions'
      ]
    },
    {
      id: 3,
      title: 'Payment Tracking',
      description: 'Monitor and reconcile premium payments',
      time: 'Real-time & Daily at 12:00 AM',
      icon: 'payment',
      status: 'active',
      details: [
        'Tracks payment completion status',
        'Updates policy payment history',
        'Calculates next due dates',
        'Generates payment receipts'
      ]
    },
    {
      id: 4,
      title: 'Policy Lapse Processing',
      description: 'Automatic policy cancellation for non-payment',
      time: 'Daily at 1:00 AM',
      icon: 'policy',
      status: 'active',
      details: [
        'Identifies policies 30+ days overdue',
        'Automatically lapses unpaid policies',
        'Sends policy lapse notifications',
        'Updates member portal access'
      ]
    }
  ];

  // Job performance metrics
  performanceMetrics = [
    { label: 'Average Processing Time', value: '2.3s', trend: 'down', change: '-15%' },
    { label: 'Daily Job Volume', value: '247', trend: 'up', change: '+8%' },
    { label: 'Email Success Rate', value: '99.2%', trend: 'up', change: '+0.5%' },
    { label: 'System Uptime', value: '99.95%', trend: 'stable', change: '0%' }
  ];

  // Job definitions for management display
  jobDefinitions = {
    'check-lapsed-policies': {
      name: 'Policy Lapse Processor',
      description: 'Automatically identifies and processes policies that have exceeded the 30-day grace period without premium payment',
      businessImpact: 'Prevents revenue leakage by ensuring unpaid policies are properly lapsed',
      icon: 'policy',
      sla: '30 days',
      risk: 'High'
    },
    'check-overdue-payments': {
      name: 'Overdue Payment Tracker',
      description: 'Scans for pending premium payments, applies late fees, and updates payment statuses',
      businessImpact: 'Ensures accurate premium collection and timely fee assessment',
      icon: 'payment',
      sla: '15 days',
      risk: 'Medium'
    },
    'send-grace-reminders': {
      name: 'Grace Period Notifications',
      description: 'Sends automated email reminders to members with upcoming or overdue premium payments',
      businessImpact: 'Reduces customer churn through proactive communication',
      icon: 'notification',
      sla: 'Immediate',
      risk: 'Low'
    }
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAllData();
    this.animateTimeline();
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  animateTimeline() {
    // Simulate timeline animation - mark steps as completed based on current time
    const currentHour = new Date().getHours();
    if (currentHour >= 1) {
      this.timelineSteps[3].status = 'completed';
    }
    if (currentHour >= 9) {
      this.timelineSteps[1].status = 'completed';
    }
    if (currentHour >= 0) {
      this.timelineSteps[0].status = 'completed';
      this.timelineSteps[2].status = 'completed';
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      if (this.autoRefresh) {
        this.loadAllData();
      }
    }, 30000);
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refresh() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    Promise.all([
      this.loadStats(),
      this.loadRecurringJobs(),
      this.loadJobs()
    ]).finally(() => {
      this.isLoading = false;
      this.lastRefreshed = new Date();
    });
  }

  loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/stats`)
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.stats = res.stats;
              this.calculateSuccessRate();
            }
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  loadRecurringJobs(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/recurring`)
        .subscribe({
          next: (res: any) => {
            if (res.success && res.recurringJobs) {
              this.recurringJobs = res.recurringJobs.map((job: any) => ({
                ...job,
                ...this.jobDefinitions[job.name as keyof typeof this.jobDefinitions] || {},
                status: this.getJobStatus(job)
              }));
            }
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  loadJobs(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get(`${environment.apiBaseUrl}/admin/system/hangfire/jobs`)
        .subscribe({
          next: (res: any) => {
            if (res.success) this.jobs = res.jobs;
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  get filteredJobs() {
    let filtered = this.jobs;
    if (this.searchQuery) {
      filtered = filtered.filter(job => 
        job.id.toString().includes(this.searchQuery) ||
        job.state?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    if (this.selectedJobFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.state?.toLowerCase() === this.selectedJobFilter.toLowerCase()
      );
    }
    return filtered;
  }

  getJobStatus(job: any): 'healthy' | 'warning' | 'error' {
    if (job.lastExecution === 'Never') return 'warning';
    return 'healthy';
  }

  calculateSuccessRate() {
    if (this.stats.total > 0) {
      this.stats.successRate = ((this.stats.succeeded / this.stats.total) * 100).toFixed(1);
    } else {
      this.stats.successRate = '100';
    }
  }

  triggerJob(jobName: string) {
    this.triggerMessage = '';
    this.http.post(`${environment.apiBaseUrl}/admin/system/${jobName}`, {})
      .subscribe({
        next: () => {
          this.triggerMessage = `${this.getJobDisplayName(jobName)} executed successfully`;
          this.triggerSuccess = true;
          setTimeout(() => {
            this.loadJobs();
            setTimeout(() => {
              this.triggerMessage = '';
            }, 3000);
          }, 1000);
        },
        error: () => {
          this.triggerMessage = `Failed to execute ${this.getJobDisplayName(jobName)}`;
          this.triggerSuccess = false;
          setTimeout(() => {
            this.triggerMessage = '';
          }, 3000);
        }
      });
  }

  getJobDisplayName(jobName: string): string {
    return this.jobDefinitions[jobName as keyof typeof this.jobDefinitions]?.name || jobName;
  }

  formatDate(dateStr: string): string {
    if (!dateStr || dateStr === 'Never' || dateStr === 'Not scheduled') return dateStr;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  }

  getCronDescription(cron: string): string {
    const descriptions: Record<string, string> = {
      '0 0 * * *': 'Daily at 12:00 AM',
      '0 1 * * *': 'Daily at 1:00 AM',
      '0 9 * * *': 'Daily at 9:00 AM'
    };
    return descriptions[cron] || cron;
  }

  getRiskBadgeClass(risk?: string): string {
    switch (risk) {
      case 'High': return 'risk-high';
      case 'Medium': return 'risk-medium';
      case 'Low': return 'risk-low';
      default: return '';
    }
  }

  getTimelineIcon(iconName: string): string {
    const icons: Record<string, string> = {
      detection: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      notification: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
      payment: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
      policy: 'M9 12h6m-6 4h6m2-12H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z'
    };
    return icons[iconName] || icons['detection'];
  }
}