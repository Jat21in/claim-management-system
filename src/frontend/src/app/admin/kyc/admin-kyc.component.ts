import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface KycRequest {
  memberId: string;
  fullName: string;
  email: string;
  submittedAt: string;
  verifiedAt?: string;
  documents: KycDocument[];
  status: string;
  rejectionReason?: string;
  claimsCount?: number;
  phoneNumber?: string;
  dateOfBirth?: string;
  kycScore?: number;
}

interface KycDocument {
  documentId: string;
  documentType: string;
  documentNumber: string;
  fileUrl: string;
  fileName: string;
  isVerified: boolean;
  uploadedAt: string;
  ocrConfidence?: number;
}

interface DashboardStats {
  pending: number;
  verified: number;
  rejected: number;
  total: number;
  todaySubmitted: number;
  averageProcessingTime: string;
  pendingUrgent: number;
  verificationRate: number;
}

@Component({
  selector: 'app-admin-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-kyc.component.html',
  styleUrls: ['./admin-kyc.component.scss']
})
export class AdminKycComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  Math = Math;

  loading = true;
  processingId: string | null = null;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  dateFilter = 'all';
  sortBy = 'newest';

  // Pagination - Default 5 per page
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];

  // Data
  allRequests: KycRequest[] = [];

  // Stats
  stats: DashboardStats = {
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0,
    todaySubmitted: 0,
    averageProcessingTime: '0',
    pendingUrgent: 0,
    verificationRate: 0
  };

  // UI State
  expandedRow: string | null = null;
  showRejectModal = false;
  rejectionReason = '';
  selectedMemberId: string | null = null;

  // Document Modal State
  showDocumentModal = false;
  selectedDocument: KycDocument | null = null;
  selectedRequestName = '';
  documentUrl: SafeResourceUrl | null = null;
  documentFileType = '';

  private refreshInterval: any;

  ngOnInit() {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadStats(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // Document Modal Methods
  openDocumentModal(doc: KycDocument, requestName: string, event: Event) {
    event.stopPropagation();
    this.selectedDocument = doc;
    this.selectedRequestName = requestName;

    let fullUrl = doc.fileUrl;

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
    if (this.selectedDocument?.fileUrl) {
      let downloadUrl = this.selectedDocument.fileUrl;
      if (downloadUrl.startsWith('/uploads/')) {
        downloadUrl = `${environment.uploadBaseUrl}${downloadUrl}`;
      } else if (!downloadUrl.startsWith('http')) {
        downloadUrl = `${environment.uploadBaseUrl}/${downloadUrl}`;
      }
      window.open(downloadUrl, '_blank');
    }
  }

  getFullFileUrl(fileUrl: string): string {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    if (fileUrl.startsWith('/uploads/')) return `${environment.uploadBaseUrl}${fileUrl}`;
    return `${environment.uploadBaseUrl}/${fileUrl}`;
  }

  get hasActiveFilters(): boolean {
    return this.statusFilter !== 'all' || this.dateFilter !== 'all' || !!this.searchTerm;
  }

  get filteredAndSortedRequests(): KycRequest[] {
    let filtered = [...this.allRequests];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.fullName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.documents.some(d => d.documentNumber.includes(term))
      );
    }

    if (this.dateFilter !== 'all') {
      const now = new Date();
      if (this.dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(r => new Date(r.submittedAt) >= today);
      } else if (this.dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filtered = filtered.filter(r => new Date(r.submittedAt) >= weekAgo);
      } else if (this.dateFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filtered = filtered.filter(r => new Date(r.submittedAt) >= monthAgo);
      }
    }

    if (this.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (this.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (this.sortBy === 'name-desc') {
      filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
    }

    return filtered;
  }

  get paginatedRequests(): KycRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSortedRequests.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedRequests.length / this.pageSize);
  }

  loadData() {
    this.loadAllRequests();
    this.loadStats();
  }

  loadAllRequests() {
    this.loading = true;

    this.http.get(`${environment.apiBaseUrl}/admin/kyc/all?page=1&pageSize=1000`).subscribe({
      next: (res: any) => {
        this.allRequests = (res.items || []).map((req: any) => ({
          ...req,
          documents: (req.documents || []).map((doc: any) => ({
            ...doc,
            fileUrl: doc.fileUrl || doc.fileUrl
          }))
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load KYC requests:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStats() {
    this.http.get(`${environment.apiBaseUrl}/admin/kyc/stats`).subscribe({
      next: (stats: any) => {
        this.stats = {
          pending: stats.pending || 0,
          verified: stats.verified || 0,
          rejected: stats.rejected || 0,
          total: stats.total || 0,
          todaySubmitted: stats.todaySubmitted || 0,
          averageProcessingTime: stats.averageProcessingTime || '0 days',
          pendingUrgent: stats.pendingUrgent || 0,
          verificationRate: stats.verificationRate || 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load stats:', err)
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  refreshData() {
    this.loadAllRequests();
    this.loadStats();
  }

  clearFilter(filter: string) {
    if (filter === 'status') this.statusFilter = 'all';
    if (filter === 'date') this.dateFilter = 'all';
    if (filter === 'search') this.searchTerm = '';
    this.onFilterChange();
  }

  getStatusText(status: string): string {
    if (status === 'Verified') return 'Approved';
    if (status === 'Rejected') return 'Rejected';
    return 'Pending Review';
  }

  getStatusClass(status: string): string {
    if (status === 'Verified') return 'approved';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
  }

  getDateFilterLabel(): string {
    const labels: Record<string, string> = {
      today: 'Today',
      week: 'Last 7 Days',
      month: 'Last 30 Days'
    };
    return labels[this.dateFilter] || this.dateFilter;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getDocumentIcon(type: string): string {
    const icons: Record<string, string> = {
      'Aadhaar': '🆔',
      'PAN': '📇',
      'Passport': '🛂'
    };
    return icons[type] || '📄';
  }

  getDaysAgo(date: string): number {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  getPendingProgress(): string {
    const pendingCount = this.filteredAndSortedRequests.filter(r => r.status === 'Pending').length;
    const total = this.filteredAndSortedRequests.length;
    if (total === 0) return '0%';
    return `${Math.round((pendingCount / total) * 100)}%`;
  }

  getQueuePosition(request: KycRequest): string {
    const pendingRequests = this.filteredAndSortedRequests.filter(r => r.status === 'Pending');
    const index = pendingRequests.findIndex(r => r.memberId === request.memberId);
    return index >= 0 ? `${index + 1}` : 'N/A';
  }

  toggleDocuments(memberId: string) {
    this.expandedRow = this.expandedRow === memberId ? null : memberId;
    this.cdr.detectChanges();
  }

  approve(memberId: string) {
    if (this.processingId) return;
    this.processingId = memberId;

    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${memberId}/approve`, {}).subscribe({
      next: () => {
        this.processingId = null;
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to approve KYC:', err);
        alert('Failed to approve KYC. Please try again.');
        this.processingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  openRejectModal(request: KycRequest, event: Event) {
    event.stopPropagation();
    this.selectedMemberId = request.memberId;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.selectedMemberId = null;
    this.rejectionReason = '';
  }

  setRejectionReason(reason: string) {
    this.rejectionReason = reason;
  }

  confirmReject() {
    if (!this.selectedMemberId || !this.rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    if (this.processingId) return;
    this.processingId = this.selectedMemberId;

    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${this.selectedMemberId}/reject`, {
      reason: this.rejectionReason
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.closeRejectModal();
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to reject KYC:', err);
        alert('Failed to reject KYC. Please try again.');
        this.processingId = null;
        this.cdr.detectChanges();
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

  goToPage(page: number) {
    this.currentPage = page;
    this.cdr.detectChanges();
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

  exportToExcel() {
    const headers = ['Full Name', 'Email', 'Phone Number', 'Document Type', 'Document Number', 'Status', 'Submitted Date', 'Processed Date', 'Rejection Reason'];
    const rows = this.filteredAndSortedRequests.flatMap(request =>
      request.documents.map(doc => [
        request.fullName,
        request.email,
        request.phoneNumber || 'N/A',
        doc.documentType,
        doc.documentNumber,
        request.status === 'Verified' ? 'Approved' : request.status,
        new Date(request.submittedAt).toLocaleString(),
        request.verifiedAt ? new Date(request.verifiedAt).toLocaleString() : 'Pending',
        request.rejectionReason || 'N/A'
      ])
    );

    const htmlContent = `
      <html>
      <head>
        <title>KYC Report</title>
        <meta charset="UTF-8">
        <style>
          th { background: #4F9CFF; color: white; padding: 8px; }
          td { padding: 6px; border: 1px solid #ccc; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <h2>KYC Verification Report</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc_report_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportToCSV() {
    const headers = ['Full Name', 'Email', 'Phone Number', 'Document Type', 'Document Number', 'Status', 'Submitted Date', 'Processed Date', 'Rejection Reason'];
    const rows = this.filteredAndSortedRequests.flatMap(request =>
      request.documents.map(doc => [
        `"${request.fullName}"`,
        `"${request.email}"`,
        `"${request.phoneNumber || 'N/A'}"`,
        `"${doc.documentType}"`,
        `"${doc.documentNumber}"`,
        `"${request.status === 'Verified' ? 'Approved' : request.status}"`,
        `"${new Date(request.submittedAt).toLocaleString()}"`,
        `"${request.verifiedAt ? new Date(request.verifiedAt).toLocaleString() : 'Pending'}"`,
        `"${request.rejectionReason || 'N/A'}"`
      ])
    );

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
