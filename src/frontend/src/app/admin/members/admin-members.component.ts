import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

interface Member {
  memberId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: string;
  status: number;
  kycStatus: string;
  rejectionReason: string | null;
  kycSubmittedAt: string | null;
  kycVerifiedAt: string | null;
  activePlanId: string | null;
  activePlanName: string | null;
  activePlanCoverage: number | null;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  claimsCount: number;
  claimsTotalAmount: number;
  documents?: KycDocument[];
}

interface KycDocument {
  documentId: string;
  documentType: string;
  documentNumber: string;
  fileUrl: string;
  fileName: string;
  isVerified: boolean;
  uploadedAt: string;
}

interface Plan {
  planId: string;
  name: string;
  insuredAmount: number;
  durationInMonths: number;
}

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-members.component.html',
  styleUrls: ['./admin-members.component.scss']
})
export class AdminMembersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  // Data
  allMembers: Member[] = [];
  filteredMembers: Member[] = [];
  plans: Plan[] = [];

  // Filters
  searchTerm = '';
  roleFilter = 'all';
  kycStatusFilter = 'all';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  readonly math = Math;

  // Stats
  stats = {
    total: 0,
    kycVerified: 0,
    kycPending: 0,
    kycRejected: 0,
    totalClaims: 0,
    totalClaimAmount: 0
  };

  // UI State
  loading = true;
  processingId: string | null = null;

  // Member Detail Modal
  showDetailModal = false;
  selectedMember: Member | null = null;
  activeTab: 'profile' | 'claims' | 'documents' = 'profile';
  memberClaims: any[] = [];

  // Document Modal
  showDocumentModal = false;
  selectedDocument: KycDocument | null = null;
  documentUrl: SafeResourceUrl | null = null;
  documentFileType = '';

  // Assign Plan Modal
  showAssignPlanModal = false;
  selectedPlanId = '';
  assignPlanProcessing = false;

  // Role Change Modal
  showRoleModal = false;
  selectedRole = '';
  roleOptions = [
    { value: 'Member', label: 'Member' },
    { value: 'Admin', label: 'Admin' },
    { value: 'ClaimsProcessor', label: 'Claims Processor' }
  ];

  // Reject KYC Modal
  showRejectKycModal = false;
  rejectReason = '';
  memberToReject: Member | null = null;

  // Bulk Actions
  selectedMembers: Set<string> = new Set();
  showBulkActions = false;

  ngOnInit() {
    this.loadMembers();
    this.loadPlans();
  }

  loadMembers() {
    this.loading = true;
    this.http.get(`${environment.apiBaseUrl}/admin/members`).subscribe({
      next: (res: any) => {
        this.allMembers = res.map((m: any) => ({
          memberId: m.memberId,
          fullName: m.fullName,
          email: m.email,
          phoneNumber: m.phoneNumber,
          dateOfBirth: m.dateOfBirth,
          role: m.role,
          status: m.status,
          kycStatus: m.kycStatus,
          rejectionReason: m.rejectionReason,
          kycSubmittedAt: m.kycSubmittedAt,
          kycVerifiedAt: m.kycVerifiedAt,
          activePlanId: m.activePlanId,
          activePlanName: m.activePlanName,
          activePlanCoverage: m.activePlanCoverage,
          address: m.address,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          claimsCount: m.claimsCount || 0,
          claimsTotalAmount: m.claimsTotalAmount || 0,
          documents: m.documents || []
        }));
        this.calculateStats();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPlans() {
    this.http.get(`${environment.apiBaseUrl}/v1/public/plans`).subscribe({
      next: (res: any) => {
        this.plans = res;
      },
      error: (err) => console.error('Failed to load plans:', err)
    });
  }

  loadMemberClaims(memberId: string) {
    this.http.get(`${environment.apiBaseUrl}/admin/members/${memberId}/claims`).subscribe({
      next: (res: any) => {
        this.memberClaims = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load member claims:', err)
    });
  }

  calculateStats() {
    this.stats = {
      total: this.allMembers.length,
      kycVerified: this.allMembers.filter(m => m.kycStatus === 'Verified').length,
      kycPending: this.allMembers.filter(m => m.kycStatus === 'Pending').length,
      kycRejected: this.allMembers.filter(m => m.kycStatus === 'Rejected').length,
      totalClaims: this.allMembers.reduce((sum, m) => sum + (m.claimsCount || 0), 0),
      totalClaimAmount: this.allMembers.reduce((sum, m) => sum + (m.claimsTotalAmount || 0), 0)
    };
  }

  applyFilters() {
    let filtered = [...this.allMembers];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.fullName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        (m.phoneNumber && m.phoneNumber.includes(term))
      );
    }

    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === this.roleFilter);
    }

    if (this.kycStatusFilter !== 'all') {
      filtered = filtered.filter(m => m.kycStatus === this.kycStatusFilter);
    }

    if (this.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (this.sortBy === 'claims') {
      filtered.sort((a, b) => (b.claimsCount || 0) - (a.claimsCount || 0));
    }

    this.filteredMembers = filtered;
    this.currentPage = 1;
  }

  get paginatedMembers(): Member[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMembers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredMembers.length / this.pageSize);
  }

  onFilterChange() {
    this.applyFilters();
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
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

  getKycStatusClass(status: string): string {
    switch (status) {
      case 'Verified': return 'verified';
      case 'Rejected': return 'rejected';
      default: return 'pending';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'admin';
      case 'ClaimsProcessor': return 'processor';
      default: return 'member';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // Member Detail Modal
  viewMemberDetails(member: Member) {
    this.selectedMember = member;
    this.activeTab = 'profile';
    this.loadMemberClaims(member.memberId);
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedMember = null;
    this.memberClaims = [];
  }

  setActiveTab(tab: 'profile' | 'claims' | 'documents') {
    this.activeTab = tab;
  }

  // Document Modal
  openDocumentModal(doc: KycDocument, event: Event) {
    event.stopPropagation();
    this.selectedDocument = doc;

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

  // Change Role
  openRoleModal(member: Member, event: Event) {
    event.stopPropagation();
    this.selectedMember = member;
    this.selectedRole = member.role;
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.selectedMember = null;
  }

  confirmRoleChange() {
    if (!this.selectedMember || !this.selectedRole) return;
    this.processingId = this.selectedMember.memberId;

    this.http.put(`${environment.apiBaseUrl}/admin/members/${this.selectedMember.memberId}/role`, {
      role: this.selectedRole
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.closeRoleModal();
        this.loadMembers();
      },
      error: (err) => {
        console.error('Failed to change role:', err);
        alert('Failed to change role. Please try again.');
        this.processingId = null;
      }
    });
  }

  // Suspend/Activate Member
  toggleMemberStatus(member: Member, event: Event) {
    event.stopPropagation();
    const action = member.status === 1 ? 'suspend' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${member.fullName}?`)) {
      this.processingId = member.memberId;
      this.http.post(`${environment.apiBaseUrl}/admin/members/${member.memberId}/${action}`, {}).subscribe({
        next: () => {
          this.processingId = null;
          this.loadMembers();
        },
        error: (err) => {
          console.error(`Failed to ${action} member:`, err);
          alert(`Failed to ${action} member. Please try again.`);
          this.processingId = null;
        }
      });
    }
  }

  // Approve KYC
  approveKyc(member: Member, event: Event) {
    event.stopPropagation();
    if (confirm(`Approve KYC for ${member.fullName}?`)) {
      this.processingId = member.memberId;
      this.http.post(`${environment.apiBaseUrl}/admin/kyc/${member.memberId}/approve`, {}).subscribe({
        next: () => {
          this.processingId = null;
          this.loadMembers();
        },
        error: (err) => {
          console.error('Failed to approve KYC:', err);
          alert('Failed to approve KYC. Please try again.');
          this.processingId = null;
        }
      });
    }
  }

  // Reject KYC
  openRejectKycModal(member: Member, event: Event) {
    event.stopPropagation();
    this.memberToReject = member;
    this.rejectReason = '';
    this.showRejectKycModal = true;
  }

  closeRejectKycModal() {
    this.showRejectKycModal = false;
    this.memberToReject = null;
    this.rejectReason = '';
  }

  confirmRejectKyc() {
    if (!this.memberToReject || !this.rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    this.processingId = this.memberToReject.memberId;
    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${this.memberToReject.memberId}/reject`, {
      reason: this.rejectReason
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.closeRejectKycModal();
        this.loadMembers();
      },
      error: (err) => {
        console.error('Failed to reject KYC:', err);
        alert('Failed to reject KYC. Please try again.');
        this.processingId = null;
      }
    });
  }

  // Assign Plan
  openAssignPlanModal(member: Member, event: Event) {
    event.stopPropagation();
    this.selectedMember = member;
    this.selectedPlanId = member.activePlanId || '';
    this.showAssignPlanModal = true;
  }

  closeAssignPlanModal() {
    this.showAssignPlanModal = false;
    this.selectedMember = null;
    this.selectedPlanId = '';
  }

  confirmAssignPlan() {
    if (!this.selectedMember || !this.selectedPlanId) return;
    this.assignPlanProcessing = true;

    this.http.post(`${environment.apiBaseUrl}/admin/members/${this.selectedMember.memberId}/assign-plan`, {
      planId: this.selectedPlanId
    }).subscribe({
      next: () => {
        this.assignPlanProcessing = false;
        this.closeAssignPlanModal();
        this.loadMembers();
      },
      error: (err) => {
        console.error('Failed to assign plan:', err);
        alert('Failed to assign plan. Please try again.');
        this.assignPlanProcessing = false;
      }
    });
  }

  // Bulk Actions
  toggleSelectAll(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.paginatedMembers.forEach(m => this.selectedMembers.add(m.memberId));
    } else {
      this.selectedMembers.clear();
    }
    this.showBulkActions = this.selectedMembers.size > 0;
  }

  toggleSelectMember(memberId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedMembers.add(memberId);
    } else {
      this.selectedMembers.delete(memberId);
    }
    this.showBulkActions = this.selectedMembers.size > 0;
  }

  isSelected(memberId: string): boolean {
    return this.selectedMembers.has(memberId);
  }

  bulkApproveKyc() {
    const count = this.selectedMembers.size;
    if (confirm(`Approve KYC for ${count} selected member(s)?`)) {
      this.processingId = 'bulk';
      this.http.post(`${environment.apiBaseUrl}/admin/kyc/bulk-approve`, {
        memberIds: Array.from(this.selectedMembers)
      }).subscribe({
        next: () => {
          this.processingId = null;
          this.selectedMembers.clear();
          this.showBulkActions = false;
          this.loadMembers();
        },
        error: (err) => {
          console.error('Failed to bulk approve KYC:', err);
          alert('Failed to bulk approve KYC. Please try again.');
          this.processingId = null;
        }
      });
    }
  }

  exportToCSV() {
    const headers = ['Full Name', 'Email', 'Phone', 'Role', 'KYC Status', 'Active Plan', 'Claims', 'Joined Date'];
    const rows = this.filteredMembers.map(m => [
      `"${m.fullName}"`,
      `"${m.email}"`,
      `"${m.phoneNumber || 'N/A'}"`,
      m.role,
      m.kycStatus,
      m.activePlanName || 'None',
      m.claimsCount || 0,
      this.formatDate(m.createdAt)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
