import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { trigger, transition, style, animate, keyframes, query, stagger } from '@angular/animations';
import Chart from 'chart.js/auto';

interface DashboardStats {
  totalMembers: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalClaims: number;
  totalClaimAmount: number;
}

interface MonthlyData {
  month: string;
  claims: number;
  amount: number;
}

interface RecentDocument {
  id: string;
  type: string;
  title: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  memberName: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('claimsTrendChart') claimsTrendChartRef!: ElementRef;
  @ViewChild('statusDistributionChart') statusDistributionChartRef!: ElementRef;
  @ViewChild('monthlyAmountChart') monthlyAmountChartRef!: ElementRef;

  loading = true;
  error: string | null = null;

  stats: DashboardStats = {
    totalMembers: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalClaims: 0,
    totalClaimAmount: 0
  };

  adminName = 'Admin';

  // Analytics metrics
  approvalRate = 0;
  averageClaimAmount = 0;
  claimsThisMonth = 0;
  claimsThisWeek = 0;
  pendingPercentage = 0;
  approvedPercentage = 0;
  rejectedPercentage = 0;
  monthOverMonthGrowth = 0;

  // Monthly data for charts
  monthlyData: MonthlyData[] = [];

  // Recent documents
  recentDocuments: RecentDocument[] = [];
  showDocumentModal = false;
  selectedDocument: RecentDocument | null = null;
  documentUrl: SafeResourceUrl | null = null;
  documentFileType = '';

  // Chart instances
  private claimsTrendChart: InstanceType<typeof Chart> | null = null;
  private statusDistributionChart: InstanceType<typeof Chart> | null = null;
  private monthlyAmountChart: InstanceType<typeof Chart> | null = null;

  private refreshInterval: any;

  ngOnInit() {
    this.loadStats();
    this.loadRecentDocuments();
    this.refreshInterval = setInterval(() => {
      this.loadStats();
      this.loadRecentDocuments();
    }, 60000);
  }

  ngAfterViewInit() {
    // Charts will be initialized after data loads
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.destroyCharts();
  }

  private destroyCharts() {
    if (this.claimsTrendChart) this.claimsTrendChart.destroy();
    if (this.statusDistributionChart) this.statusDistributionChart.destroy();
    if (this.monthlyAmountChart) this.monthlyAmountChart.destroy();
  }

  loadStats() {
    this.loading = true;
    this.error = null;

    this.http.get(`${environment.apiBaseUrl}/admin/dashboard/stats`).subscribe({
      next: (res: any) => {
        let data = res;
        if (res && res.data) data = res.data;

        this.stats = {
          totalMembers: Number(data.totalMembers) || 0,
          pendingClaims: Number(data.pendingClaims) || 0,
          approvedClaims: Number(data.approvedClaims) || 0,
          rejectedClaims: Number(data.rejectedClaims) || 0,
          totalClaims: Number(data.totalClaims) || 0,
          totalClaimAmount: Number(data.totalClaimAmount) || 0
        };

        this.calculateMetrics();
        this.generateMonthlyData();
        this.initCharts();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentDocuments() {
    this.http.get(`${environment.apiBaseUrl}/admin/dashboard/recent-documents`).subscribe({
        next: (docs: any) => {
            this.recentDocuments = docs || [];
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error('Failed to load recent documents:', err);
            // Set empty array instead of breaking
            this.recentDocuments = [];
            this.cdr.detectChanges();
        }
    });
}

  viewDocument(doc: RecentDocument) {
    this.selectedDocument = doc;
    
    let fullUrl = doc.filePath;
    if (fullUrl.startsWith('/uploads/')) {
      fullUrl = `${environment.uploadBaseUrl}${fullUrl}`;
    } else if (!fullUrl.startsWith('http')) {
      fullUrl = `${environment.uploadBaseUrl}/${fullUrl}`;
    }
    
    this.documentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    
    const fileExt = doc.fileName?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      this.documentFileType = 'image';
    } else if (fileExt === 'pdf') {
      this.documentFileType = 'pdf';
    } else {
      this.documentFileType = 'other';
    }
    
    this.showDocumentModal = true;
  }

  closeDocumentModal() {
    this.showDocumentModal = false;
    this.selectedDocument = null;
    this.documentUrl = null;
  }

  downloadDocument() {
    if (this.selectedDocument?.filePath) {
      let downloadUrl = this.selectedDocument.filePath;
      if (downloadUrl.startsWith('/uploads/')) {
        downloadUrl = `${environment.uploadBaseUrl}${downloadUrl}`;
      } else if (!downloadUrl.startsWith('http')) {
        downloadUrl = `${environment.uploadBaseUrl}/${downloadUrl}`;
      }
      window.open(downloadUrl, '_blank');
    }
  }

  private calculateMetrics() {
    if (this.stats.totalClaims > 0) {
      this.approvalRate = Math.round((this.stats.approvedClaims / this.stats.totalClaims) * 100);
      this.pendingPercentage = Math.round((this.stats.pendingClaims / this.stats.totalClaims) * 100);
      this.rejectedPercentage = Math.round((this.stats.rejectedClaims / this.stats.totalClaims) * 100);
    }

    this.averageClaimAmount = this.stats.totalClaims > 0
      ? Math.round(this.stats.totalClaimAmount / this.stats.totalClaims)
      : 0;

    // Mock monthly growth (can be replaced with real data)
    this.claimsThisMonth = Math.round(this.stats.totalClaims * 0.35);
    this.claimsThisWeek = Math.round(this.stats.totalClaims * 0.12);
    this.monthOverMonthGrowth = 23;
  }

  private generateMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    const baseClaims = Math.max(1, Math.round(this.stats.totalClaims / 6));

    this.monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const claims = Math.round(baseClaims * (0.5 + Math.random() * 0.8));
      const amount = claims * this.averageClaimAmount;
      this.monthlyData.push({
        month: months[monthIndex],
        claims: claims,
        amount: amount
      });
    }
  }

  private initCharts() {
    this.initClaimsTrendChart();
    this.initStatusDistributionChart();
    this.initMonthlyAmountChart();
  }

  private initClaimsTrendChart() {
    if (!this.claimsTrendChartRef?.nativeElement) return;

    const ctx = this.claimsTrendChartRef.nativeElement.getContext('2d');
    if (this.claimsTrendChart) this.claimsTrendChart.destroy();

    this.claimsTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Claims Submitted',
            data: this.monthlyData.map(d => d.claims),
            borderColor: '#22D3EE',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#22D3EE',
            pointBorderColor: '#0B1220',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#E5E7EB', font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#E5E7EB',
            bodyColor: '#9CA3AF',
            borderColor: '#22D3EE',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            grid: { color: '#1F2937' },
            ticks: { color: '#9CA3AF' },
            title: { display: true, text: 'Number of Claims', color: '#9CA3AF' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF' }
          }
        }
      }
    });
  }

  private initStatusDistributionChart() {
    if (!this.statusDistributionChartRef?.nativeElement) return;

    const ctx = this.statusDistributionChartRef.nativeElement.getContext('2d');
    if (this.statusDistributionChart) this.statusDistributionChart.destroy();

    this.statusDistributionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [this.stats.approvedClaims, this.stats.pendingClaims, this.stats.rejectedClaims],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#E5E7EB', font: { size: 11 }, padding: 15 }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#E5E7EB',
            bodyColor: '#9CA3AF',
            callbacks: {
              label: (context: any) => {
                const value = context.raw as number;
                const total = this.stats.totalClaims;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private initMonthlyAmountChart() {
    if (!this.monthlyAmountChartRef?.nativeElement) return;

    const ctx = this.monthlyAmountChartRef.nativeElement.getContext('2d');
    if (this.monthlyAmountChart) this.monthlyAmountChart.destroy();

    this.monthlyAmountChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.monthlyData.map(d => d.month),
        datasets: [{
          label: 'Claim Amount (₹)',
          data: this.monthlyData.map(d => d.amount),
          backgroundColor: 'rgba(34, 211, 238, 0.6)',
          borderColor: '#22D3EE',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(34, 211, 238, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#E5E7EB', font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#E5E7EB',
            bodyColor: '#9CA3AF',
            callbacks: {
              label: (context: any) => {
                const value = context.raw as number;
                return `Amount: ₹${value.toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: '#1F2937' },
            ticks: {
              color: '#9CA3AF',
              callback: (value: any) => `₹${(Number(value) / 1000).toFixed(0)}K`
            },
            title: { display: true, text: 'Amount (₹ Thousands)', color: '#9CA3AF' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF' }
          }
        }
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}