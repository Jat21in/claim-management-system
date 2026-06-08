import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { FilterByStatusPipe } from './filter-by-status.pipe';

export interface Claim {
  claimId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  claimDate: string;
  amount: number;
  status: string;
  description: string;
  aiConfidenceScore?: number;
  aiDecision?: string;
  aiReasoning?: string;
  medicalReportFileName?: string;
  medicalReportPath?: string;
  isPreAuthorization?: boolean;
  hospitalName?: string;
  admissionDate?: string;
  doctorName?: string;
  diagnosis?: string;
  estimatedAmount?: number;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  // Payment fields
  paymentMode?: string;
  paymentReferenceNumber?: string;
  treatmentType?: string;
}

@Component({
  selector: 'app-admin-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterByStatusPipe],
  templateUrl: './admin-claims.component.html',
  styleUrls: ['./admin-claims.component.scss']
})
export class AdminClaimsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  // Claims data
  allClaims: Claim[] = [];
  filteredClaims: Claim[] = [];
  stats = {
    total: 0,
    totalAmount: 0,
    pending: 0,
    pendingAI: 0,
    preAuth: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    avgProcessingTime: '0'
  };

  // Filters
  statusFilter = 'all';
  searchTerm = '';
  dateFilter = 'all';
  sortBy = 'newest';
  itemsPerPage = 10;
  currentPage = 1;

  // UI State
  isLoading = true;
  errorMessage = '';
  selectedClaim: Claim | null = null;
  showDetailModal = false;
  showDocumentModal = false;
  selectedDocumentClaim: Claim | null = null;
  documentUrl: SafeResourceUrl | null = null;
  documentFileName = '';
  documentFileType = '';

  // Action state
  isProcessing = false;
  processingId: string | null = null;
  showRejectModal = false;
  rejectionReason = '';
  claimToReject: Claim | null = null;

  // Options
  statusOptions = [
    { value: 'all', label: 'All Claims', icon: '📋' },
    { value: 'Submitted', label: 'Submitted', icon: '📝' },
    { value: 'Pending', label: 'Pending', icon: '⏳' },
    { value: 'PreAuth', label: 'Pre-Authorization', icon: '🏥' },
    { value: 'Approved', label: 'Approved', icon: '✅' },
    { value: 'Rejected', label: 'Rejected', icon: '❌' },
    { value: 'Paid', label: 'Paid', icon: '💰' }
  ];

  dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' }
  ];

  itemsPerPageOptions = [5, 10, 25, 50];

  // Computed
  get totalPages(): number {
    return Math.ceil(this.filteredClaims.length / this.itemsPerPage);
  }

  get paginatedClaims(): Claim[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredClaims.slice(start, start + this.itemsPerPage);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredClaims.length);
  }

  ngOnInit() {
    this.loadClaims();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => this.loadClaims(), 30000);
    this.ngOnDestroy = () => clearInterval(interval);
  }

  ngOnDestroy() {}

  loadClaims() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any[]>(`${environment.apiBaseUrl}/admin/claims/all`).subscribe({
      next: (claims) => {
        this.allClaims = claims.map(c => ({
          claimId: c.claimId,
          memberId: c.memberId,
          memberName: c.memberName || 'Unknown',
          memberEmail: c.memberEmail || '',
          claimDate: c.claimDate,
          amount: c.amount || c.claimAmount || 0,
          status: c.status,
          description: c.description || '',
          aiConfidenceScore: c.aiConfidenceScore,
          aiDecision: c.aiDecision,
          aiReasoning: c.aiReasoning,
          medicalReportFileName: c.medicalReportFileName,
          medicalReportPath: c.medicalReportPath,
          isPreAuthorization: c.isPreAuthorization,
          hospitalName: c.hospitalName,
          admissionDate: c.admissionDate,
          doctorName: c.doctorName,
          diagnosis: c.diagnosis,
          estimatedAmount: c.estimatedAmount,
          paymentMode: c.paymentMode,
          paymentReferenceNumber: c.paymentReferenceNumber,
          treatmentType: c.treatmentType
        }));
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load claims:', error);
        this.errorMessage = 'Failed to load claims. Please try again.';
        this.isLoading = false;
      }
    });
  }

  calculateStats() {
    const totalAmount = this.allClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const pending = this.allClaims.filter(c => c.status === 'Pending').length;
    const pendingAI = this.allClaims.filter(c => c.status === 'PendingAI').length;
    const preAuth = this.allClaims.filter(c => c.status === 'PreAuth').length;
    const approved = this.allClaims.filter(c => c.status === 'Approved').length;
    const rejected = this.allClaims.filter(c => c.status === 'Rejected').length;
    const paid = this.allClaims.filter(c => c.status === 'Paid').length;

    // Calculate average processing time for approved claims
    // This would need backend support, using mock for now
    const avgTime = '2.5 days';

    this.stats = {
      total: this.allClaims.length,
      totalAmount,
      pending,
      pendingAI,
      preAuth,
      approved,
      rejected,
      paid,
      avgProcessingTime: avgTime
    };
  }

  applyFilters() {
    let filtered = [...this.allClaims];

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // Date filter
    if (this.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(c => {
        const claimDate = new Date(c.claimDate);
        if (this.dateFilter === 'today') {
          return claimDate >= today;
        } else if (this.dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return claimDate >= weekAgo;
        } else if (this.dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          return claimDate >= monthAgo;
        }
        return true;
      });
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.memberName?.toLowerCase().includes(term) ||
        c.memberEmail?.toLowerCase().includes(term) ||
        c.claimId?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime();
        case 'oldest':
          return new Date(a.claimDate).getTime() - new Date(b.claimDate).getTime();
        case 'amount-high':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-low':
          return (a.amount || 0) - (b.amount || 0);
        case 'member':
          return (a.memberName || '').localeCompare(b.memberName || '');
        default:
          return 0;
      }
    });

    this.filteredClaims = filtered;
    this.currentPage = 1;
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  onDateFilterChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  clearFilters() {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.dateFilter = 'all';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Submitted': return 'submitted';
      case 'Pending': return 'pending';
      case 'PendingAI': return 'ai';
      case 'PreAuth': return 'preauth';
      case 'Approved': return 'approved';
      case 'Rejected': return 'rejected';
      case 'Paid': return 'paid';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PendingAI': return 'AI Review';
      case 'PreAuth': return 'Pre-Authorization';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Submitted': return '📝';
      case 'Pending': return '⏳';
      case 'PendingAI': return '🤖';
      case 'PreAuth': return '🏥';
      case 'Approved': return '✅';
      case 'Rejected': return '❌';
      case 'Paid': return '💰';
      default: return '📋';
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

  viewDocument(claim: Claim, event: Event) {
    event.stopPropagation();
    console.log('🔍 viewDocument() called');
    console.log('📋 Claim object:', claim);
    this.selectedDocumentClaim = claim;

    if (claim.medicalReportPath) {
        console.log('📄 medicalReportPath found:', claim.medicalReportPath);

        let fullUrl = claim.medicalReportPath;

        // Case 1: Already has full URL with /uploads/
        if (fullUrl.includes('/uploads/')) {
            // Make sure it starts with the base URL
            if (fullUrl.startsWith('/uploads/')) {
                fullUrl = `${environment.uploadBaseUrl}${fullUrl}`;
            }
            console.log('✅ Case 1 - URL with /uploads/:', fullUrl);
        }
        // Case 2: Just filename (old format) - construct the correct path
        else if (!fullUrl.includes('/') && !fullUrl.includes('\\')) {
            // Old format: just filename like "1889c08b-906b-4915-ba53-32dcb918acca_20260528194504_medical_report_test.pdf"
            // Construct using claimId folder
            const claimId = claim.claimId.toLowerCase();
            fullUrl = `${environment.uploadBaseUrl}/uploads/ClaimDocuments/${claimId}/${fullUrl}`;
            console.log('✅ Case 2 - Old filename format, constructed URL:', fullUrl);
        }
        // Case 3: Relative path without /uploads/
        else if (!fullUrl.startsWith('http')) {
            fullUrl = `${environment.uploadBaseUrl}/${fullUrl}`;
            console.log('✅ Case 3 - Relative path:', fullUrl);
        }

        console.log('🎯 Final Document URL:', fullUrl);
        console.log('📛 File name:', claim.medicalReportFileName);

        this.documentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
        this.documentFileName = claim.medicalReportFileName || 'Medical Report';

        const fileExt = claim.medicalReportFileName?.split('.').pop()?.toLowerCase() || '';

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
            this.documentFileType = 'image';
        } else if (fileExt === 'pdf') {
            this.documentFileType = 'pdf';
        } else {
            this.documentFileType = 'other';
        }

        this.showDocumentModal = true;
    } else {
        console.warn('⚠️ No medicalReportPath in claim object');
        alert('No document attached to this claim.');
    }
}


  closeDocumentModal() {
    this.showDocumentModal = false;
    this.selectedDocumentClaim = null;
    this.documentUrl = null;
  }

  downloadDocument() {
    if (this.selectedDocumentClaim?.medicalReportPath) {
        let downloadUrl = this.selectedDocumentClaim.medicalReportPath;

        // Same URL construction logic as viewDocument
        if (downloadUrl.includes('/uploads/')) {
            if (downloadUrl.startsWith('/uploads/')) {
                downloadUrl = `${environment.uploadBaseUrl}${downloadUrl}`;
            }
        }
        else if (!downloadUrl.includes('/') && !downloadUrl.includes('\\')) {
            const claimId = this.selectedDocumentClaim.claimId.toLowerCase();
            downloadUrl = `${environment.uploadBaseUrl}/uploads/ClaimDocuments/${claimId}/${downloadUrl}`;
        }
        else if (!downloadUrl.startsWith('http')) {
            downloadUrl = `${environment.uploadBaseUrl}/${downloadUrl}`;
        }

        window.open(downloadUrl, '_blank');
    }
}


  approveClaim(claimId: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processingId = claimId;

    const claim = this.allClaims.find(c => c.claimId === claimId);
    const endpoint = claim?.isPreAuthorization
      ? `${environment.apiBaseUrl}/admin/claims/${claimId}/approve-pre-auth`
      : `${environment.apiBaseUrl}/admin/claims/${claimId}/approve`;

    this.http.post(endpoint, {}).subscribe({
      next: () => {
        this.loadClaims();
        this.isProcessing = false;
        this.processingId = null;
        this.closeModal();
      },
      error: (error) => {
        console.error('Failed to approve claim:', error);
        alert('Failed to approve claim. Please try again.');
        this.isProcessing = false;
        this.processingId = null;
      }
    });
  }

  openRejectModal(claim: Claim, event?: Event) {
    if (event) event.stopPropagation();
    this.claimToReject = claim;
    this.rejectionReason = '';
    this.showRejectModal = true;
    this.closeModal();
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.claimToReject = null;
    this.rejectionReason = '';
  }

  confirmReject() {
    if (!this.rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    this.http.post(`${environment.apiBaseUrl}/admin/claims/${this.claimToReject?.claimId}/reject`, {
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.loadClaims();
        this.closeRejectModal();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Failed to reject claim:', error);
        alert('Failed to reject claim. Please try again.');
        this.isProcessing = false;
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportToCSV() {
    const headers = ['Claim ID', 'Member Name', 'Member Email', 'Claim Date', 'Amount', 'Status', 'Description'];
    const rows = this.filteredClaims.map(c => [
      c.claimId,
      c.memberName,
      c.memberEmail,
      this.formatDate(c.claimDate),
      c.amount,
      c.status,
      c.description
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
