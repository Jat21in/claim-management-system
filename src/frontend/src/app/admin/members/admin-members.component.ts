import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface Member {
  memberId: string;
  fullName: string;
  email: string;
  role: string;
  contactNumber: string;
  dateOfBirth: string;
  createdAt: string;
  status: string;
  activePlan: {
    planId: string;
    name: string;
    insuredAmount: number;
  } | null;
  claimsCount: number;
  kycStatus: string;
}

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-members.component.html',
  styleUrls: ['./admin-members.component.scss'],
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
export class AdminMembersComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  Math = Math; // Expose Math to template

  loading = true;
  members: Member[] = [];
  filteredMembers: Member[] = [];

  // Filters
  searchTerm = '';
  roleFilter = 'all';
  kycFilter = 'all';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 15;

  // Selected member for detail view
  selectedMember: Member | null = null;
  showMemberModal = false;

  private refreshInterval: any;

  ngOnInit() {
    this.loadMembers();
    this.refreshInterval = setInterval(() => this.loadMembers(), 60000); // Auto-refresh every minute
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  get filteredAndSortedMembers(): Member[] {
    let filtered = [...this.members];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.fullName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.memberId.toLowerCase().includes(term) ||
        (m.contactNumber && m.contactNumber.includes(term))
      );
    }

    // Role filter
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(m => m.role === this.roleFilter);
    }

    // KYC filter
    if (this.kycFilter !== 'all') {
      filtered = filtered.filter(m => m.kycStatus === this.kycFilter);
    }

    // Sorting
    if (this.sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (this.sortBy === 'claims') {
      filtered.sort((a, b) => b.claimsCount - a.claimsCount);
    }

    return filtered;
  }

  get paginatedMembers(): Member[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSortedMembers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSortedMembers.length / this.pageSize);
  }

  get totalMembers(): number {
    return this.members.length;
  }

  get stats() {
    return {
      total: this.members.length,
      active: this.members.filter(m => m.status === 'Active').length,
      pendingKyc: this.members.filter(m => m.kycStatus === 'Pending').length,
      verified: this.members.filter(m => m.kycStatus === 'Verified').length,
      totalClaims: this.members.reduce((sum, m) => sum + (m.claimsCount || 0), 0)
    };
  }

  loadMembers() {
    this.loading = true;

    this.http.get(`${environment.apiBaseUrl}/admin/members`).subscribe({
      next: (res: any) => {
        let members = res;
        if (res && res.data) members = res.data;
        if (res && res.$values) members = res.$values;

        this.members = (Array.isArray(members) ? members : []).map((m: any) => ({
          ...m,
          kycStatus: m.status === 1 ? 'Verified' : m.status === 2 ? 'Rejected' : 'Pending',
          status: m.status === 1 ? 'Active' : 'Inactive'
        }));

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

  applyFilters() {
    this.currentPage = 1;
    this.filteredMembers = this.filteredAndSortedMembers;
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.kycFilter = 'all';
    this.sortBy = 'newest';
    this.applyFilters();
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
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  viewMemberDetails(member: Member) {
    this.selectedMember = member;
    this.showMemberModal = true;
  }

  closeModal() {
    this.showMemberModal = false;
    this.selectedMember = null;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'Admin') return 'admin';
    if (role === 'ClaimsProcessor') return 'processor';
    return 'member';
  }

  getKycBadgeClass(status: string): string {
    if (status === 'Verified') return 'verified';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
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
    const headers = ['Full Name', 'Email', 'Phone', 'Role', 'KYC Status', 'Active Plan', 'Claims Count', 'Member Since'];
    const rows = this.filteredAndSortedMembers.map(m => [
      m.fullName, m.email, m.contactNumber || 'N/A', m.role, m.kycStatus,
      m.activePlan?.name || 'No Plan', m.claimsCount, new Date(m.createdAt).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
