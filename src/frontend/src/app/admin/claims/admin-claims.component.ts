import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface Claim {
  claimId: string;
  memberName: string;
  memberId: string;
  claimDate: string;
  amount: number;
  description: string;
  status: string;
  aiConfidenceScore?: number;
  aiDecision?: string;
  aiReasoning?: string;
  medicalReportFileName?: string;
  processedAt?: string;
  processedBy?: string;
}

interface ClaimStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingAI: number;
  paid: number;
  totalAmount: number;
  avgProcessingTime: string;
}

@Component({
  selector: 'app-admin-claims',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-claims.component.html',
  styleUrls: ['./admin-claims.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('50ms', [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AdminClaimsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  allClaims: Claim[] = [];
  filteredClaims: Claim[] = [];
  selectedClaim: Claim | null = null;
  showDetailModal = false;
  showRejectModal = false;
  rejectionReason = '';
  processingId: string | null = null;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  dateFilter = 'all';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 15;

  // Stats
  stats: ClaimStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAI: 0,
    paid: 0,
    totalAmount: 0,
    avgProcessingTime: '0'
  };

  private refreshInterval: any;

  // Status options for filter
  statusOptions = [
    { value: 'all', label: 'All Claims', icon: '📋' },
    { value: 'Pending', label: 'Pending Review', icon: '⏳' },
    { value: 'PendingAI', label: 'AI Processing', icon: '🤖' },
    { value: 'Approved', label: 'Approved', icon: '✅' },
    { value: 'Rejected', label: 'Rejected', icon: '❌' },
    { value: 'Paid', label: 'Paid', icon: '💰' }
  ];

  dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' }
  ];

  ngOnInit() {
    this.loadClaims();
    this.refreshInterval = setInterval(() => this.loadClaims(), 60000); // Auto-refresh every minute
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  get filteredAndSortedClaims(): Claim[] {
    let filtered = [...this.allClaims];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.memberName.toLowerCase().includes(term) ||
        c.claimId.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // Date filter
    if (this.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (this.dateFilter === 'today') {
        filtered = filtered.filter(c => new Date(c.claimDate) >= today);
      } else if (this.dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = filtered.filter(c => new Date(c.claimDate) >= weekAgo);
      } else if (this.dateFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = filtered.filter(c => new Date(c.claimDate) >= monthAgo);
      } else if (this.dateFilter === 'quarter') {
        const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
        filtered = filtered.filter(c => new Date(c.claimDate) >= quarterAgo);
      }
    }

    // Sorting
    if (this.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime());
    } else if (this.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.claimDate).getTime() - new Date(b.claimDate).getTime());
    } else if (this.sortBy === 'amount-high') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (this.sortBy === 'amount-low') {
      filtered.sort((a, b) => a.amount - b.amount);
    } else if (this.sortBy === 'member') {
      filtered.sort((a, b) => a.memberName.localeCompare(b.memberName));
    }

    return filtered;
  }

  get paginatedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSortedClaims.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedClaims.length / this.pageSize);
  }

  getDisplayedEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAndSortedClaims.length);
  }

  loadClaims() {
    this.loading = true;

    // Get all claims (not just pending)
    this.http.get(`${environment.apiBaseUrl}/admin/claims/all`).subscribe({
      next: (res: any) => {
        let claims = res;
        if (res && res.data) claims = res.data;
        if (res && res.$values) claims = res.$values;

        this.allClaims = (Array.isArray(claims) ? claims : []).map((c: any) => ({
          claimId: c.claimId || c.ClaimId,
          memberName: c.memberName || c.MemberName || c.member?.fullName || 'Unknown',
          memberId: c.memberId || c.MemberId,
          claimDate: c.claimDate || c.ClaimDate,
          amount: c.amount || c.Amount || c.claimAmount?.amount || 0,
          description: c.description || c.Description || 'No description',
          status: c.status || c.Status || 'Submitted',
          aiConfidenceScore: c.aiConfidenceScore || c.AiConfidenceScore,
          aiDecision: c.aiDecision || c.AiDecision,
          aiReasoning: c.aiReasoning || c.AiReasoning,
          medicalReportFileName: c.medicalReportFileName,
          processedAt: c.processedAt,
          processedBy: c.processedBy
        }));

        this.calculateStats();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load claims:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.stats = {
      total: this.allClaims.length,
      pending: this.allClaims.filter(c => c.status === 'Submitted' || c.status === 'Pending').length,
      approved: this.allClaims.filter(c => c.status === 'Approved').length,
      rejected: this.allClaims.filter(c => c.status === 'Rejected').length,
      pendingAI: this.allClaims.filter(c => c.status === 'PendingAI').length,
      paid: this.allClaims.filter(c => c.status === 'Paid').length,
      totalAmount: this.allClaims.reduce((sum, c) => sum + c.amount, 0),
      avgProcessingTime: this.calculateAvgProcessingTime()
    };
  }

  calculateAvgProcessingTime(): string {
    const processedClaims = this.allClaims.filter(c => c.processedAt);
    if (processedClaims.length === 0) return '0 days';

    const totalHours = processedClaims.reduce((sum, c) => {
      const submitted = new Date(c.claimDate);
      const processed = new Date(c.processedAt!);
      return sum + (processed.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    }, 0);

    const avgHours = totalHours / processedClaims.length;
    if (avgHours < 24) return `${Math.round(avgHours)} hours`;
    return `${(avgHours / 24).toFixed(1)} days`;
  }

  applyFilters() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.dateFilter = 'all';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'Approved': return 'approved';
      case 'Rejected': return 'rejected';
      case 'PendingAI': return 'ai';
      case 'Paid': return 'paid';
      default: return 'pending';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'Approved': return '✅';
      case 'Rejected': return '❌';
      case 'PendingAI': return '🤖';
      case 'Paid': return '💰';
      default: return '⏳';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Approved': return 'Approved';
      case 'Rejected': return 'Rejected';
      case 'PendingAI': return 'AI Processing';
      case 'Paid': return 'Payment Processed';
      default: return 'Pending Review';
    }
  }

  viewClaimDetails(claim: Claim) {
    this.selectedClaim = claim;
    this.showDetailModal = true;
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedClaim = null;
  }

  approveClaim(claimId: string) {
    if (!confirm('Are you sure you want to approve this claim?')) return;

    this.processingId = claimId;
    this.http.post(`${environment.apiBaseUrl}/admin/claims/${claimId}/approve`, {
      comments: "Approved by admin"
    }).subscribe({
      next: () => {
        this.loadClaims();
        this.processingId = null;
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to approve claim:', err);
        alert('Failed to approve claim');
        this.processingId = null;
      }
    });
  }

  openRejectModal(claim: Claim) {
    this.selectedClaim = claim;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  confirmReject() {
    if (!this.selectedClaim || !this.rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    this.processingId = this.selectedClaim.claimId;
    this.http.post(`${environment.apiBaseUrl}/admin/claims/${this.selectedClaim.claimId}/reject`, {
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.loadClaims();
        this.processingId = null;
        this.showRejectModal = false;
        this.selectedClaim = null;
        this.rejectionReason = '';
      },
      error: (err) => {
        console.error('Failed to reject claim:', err);
        alert('Failed to reject claim');
        this.processingId = null;
      }
    });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxPages - 1);
    if (end - start + 1 < maxPages) start = Math.max(1, end - maxPages + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  exportToCSV() {
    const headers = ['Claim ID', 'Member Name', 'Claim Date', 'Amount', 'Status', 'Description', 'Processed Date'];
    const rows = this.filteredAndSortedClaims.map(c => [
      c.claimId, c.memberName, new Date(c.claimDate).toLocaleDateString(),
      c.amount, c.status, c.description || '', c.processedAt ? new Date(c.processedAt).toLocaleDateString() : 'Pending'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
