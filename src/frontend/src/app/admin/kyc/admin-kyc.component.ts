import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

interface ExportData {
  fullName: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
  status: string;
  submittedDate: string;
  processedDate: string;
  rejectionReason: string;
}

@Component({
  selector: 'app-admin-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-kyc-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Identity Verification Management</h1>
          <p class="page-subtitle">Review, verify, and manage customer KYC submissions</p>
        </div>
        <div class="header-actions">
          <button class="btn-excel" (click)="exportToExcel()" [disabled]="loading || filteredAndSortedRequests.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Export to Excel
          </button>
          <button class="btn-excel" (click)="exportToCSV()" [disabled]="loading || filteredAndSortedRequests.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Export to CSV
          </button>
        </div>
      </div>

      <!-- Statistics Dashboard -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Pending Verification</span>
            <span class="stat-badge urgent" *ngIf="stats.pendingUrgent > 0">{{ stats.pendingUrgent }} urgent</span>
          </div>
          <div class="stat-value">{{ stats.pending | number }}</div>
          <div class="stat-trend">Awaiting review</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Verified Today</span>
          </div>
          <div class="stat-value">{{ stats.todaySubmitted | number }}</div>
          <div class="stat-trend positive">+{{ stats.verificationRate }}% this week</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Verification Rate</span>
          </div>
          <div class="stat-value">{{ stats.verificationRate }}%</div>
          <div class="stat-trend positive">Above target</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Avg. Processing Time</span>
          </div>
          <div class="stat-value">{{ stats.averageProcessingTime }}</div>
          <div class="stat-trend neutral">Target: 24 hours</div>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div class="filters-section">
        <div class="filters-bar">
          <div class="search-box">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onFilterChange()"
              placeholder="Search by name, email, or document number..."
              class="search-input">
          </div>

          <div class="filter-group">
            <select [(ngModel)]="statusFilter" (change)="onFilterChange()" class="filter-select">
              <option value="all">All Status</option>
              <option value="Pending">Pending Review</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select [(ngModel)]="dateFilter" (change)="onFilterChange()" class="filter-select">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <select [(ngModel)]="sortBy" (change)="onFilterChange()" class="filter-select">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>

            <select [(ngModel)]="pageSize" (change)="onFilterChange()" class="filter-select">
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>

          <button class="btn-refresh" (click)="refreshData()" [disabled]="loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        <!-- Active Filters Display -->
        <div class="active-filters" *ngIf="hasActiveFilters">
          <span class="filter-label">Active filters:</span>
          <span class="filter-tag" *ngIf="statusFilter !== 'all'">
            Status: {{ getStatusText(statusFilter) }}
            <button (click)="clearFilter('status')" class="filter-remove">×</button>
          </span>
          <span class="filter-tag" *ngIf="dateFilter !== 'all'">
            Date: {{ getDateFilterLabel() }}
            <button (click)="clearFilter('date')" class="filter-remove">×</button>
          </span>
          <span class="filter-tag" *ngIf="searchTerm">
            Search: {{ searchTerm }}
            <button (click)="clearFilter('search')" class="filter-remove">×</button>
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading verification requests...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredAndSortedRequests.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <h3>No verification requests found</h3>
        <p>Try adjusting your filters or check back later.</p>
      </div>

      <!-- Requests Table -->
      <div *ngIf="!loading && filteredAndSortedRequests.length > 0" class="requests-table-container">
        <table class="requests-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Submitted</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Main Row -->
            <tr *ngFor="let request of paginatedRequests" class="request-row" (click)="toggleDocuments(request.memberId)">
              <!-- Applicant Info -->
              <td class="applicant-cell">
                <div class="applicant-info">
                  <div class="applicant-avatar">{{ getInitials(request.fullName) }}</div>
                  <div>
                    <div class="applicant-name">{{ request.fullName }}</div>
                    <div class="applicant-email">{{ request.email }}</div>
                    <div class="applicant-id">ID: {{ request.memberId | slice:0:8 }}...</div>
                  </div>
                </div>
              </td>

              <!-- Submission Date -->
              <td class="date-cell">
                <div class="submission-date">{{ request.submittedAt | date:'MMM dd, yyyy' }}</div>
                <div class="submission-time">{{ request.submittedAt | date:'h:mm a' }}</div>
                <div class="days-ago" *ngIf="getDaysAgo(request.submittedAt) > 0">
                  {{ getDaysAgo(request.submittedAt) }} days ago
                </div>
              </td>

              <!-- Documents -->
              <td class="documents-cell">
                <div class="document-badges">
                  <div *ngFor="let doc of request.documents" class="document-badge" [class.verified]="doc.isVerified">
                    <span class="doc-type">{{ getDocumentIcon(doc.documentType) }}</span>
                    <span class="doc-status" *ngIf="doc.isVerified">✓</span>
                  </div>
                </div>
                <button class="view-docs-link" (click)="$event.stopPropagation(); toggleDocuments(request.memberId)">
                  {{ expandedRow === request.memberId ? 'Hide documents' : 'View documents' }} →
                </button>
              </td>

              <!-- Status -->
              <td class="status-cell">
                <div class="status-container">
                  <span class="status-badge" [class]="getStatusClass(request.status)">
                    {{ getStatusText(request.status) }}
                  </span>
                  <div *ngIf="request.status === 'Pending'" class="status-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width]="getPendingProgress()"></div>
                    </div>
                    <span class="progress-label">Queue position: {{ getQueuePosition(request) }}</span>
                  </div>
                </div>
              </td>

              <!-- Actions -->
              <td class="actions-cell">
                <div *ngIf="request.status === 'Pending'" class="action-buttons">
                  <button class="btn-approve" (click)="$event.stopPropagation(); approve(request.memberId)" [disabled]="processingId === request.memberId">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {{ processingId === request.memberId ? 'Processing...' : 'Approve' }}
                  </button>
                  <button class="btn-reject" (click)="$event.stopPropagation(); openRejectModal(request)" [disabled]="processingId === request.memberId">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Reject
                  </button>
                </div>
                <div *ngIf="request.status !== 'Pending'" class="processed-indicator">
                  <span class="processed-by">{{ request.status === 'Verified' ? 'Approved' : 'Rejected' }}</span>
                  <span class="processed-date">{{ request.verifiedAt | date:'MMM dd' }}</span>
                </div>
              </td>
            </tr>

            <!-- Expanded Documents Row -->
            <tr *ngFor="let request of paginatedRequests" class="expanded-docs-row">
              <td colspan="5" class="documents-expanded" *ngIf="expandedRow === request.memberId">
                <div class="documents-grid">
                  <div *ngFor="let doc of request.documents" class="document-preview-card">
                    <div class="document-preview-header">
                      <span class="document-preview-type">{{ doc.documentType }}</span>
                      <span class="document-preview-number">{{ doc.documentNumber }}</span>
                    </div>
                    <div class="document-preview-body">
                      <div class="document-preview-info">
                        <div>Uploaded: {{ doc.uploadedAt | date:'medium' }}</div>
                        <div *ngIf="doc.ocrConfidence">OCR Confidence: {{ doc.ocrConfidence }}%</div>
                      </div>
                      <div class="document-actions">
                        <a [href]="getFullFileUrl(doc.fileUrl)" target="_blank" class="btn-view-doc" (click)="$event.stopPropagation()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Preview
                        </a>
                        <a [href]="getFullFileUrl(doc.fileUrl)" download class="btn-download-doc" (click)="$event.stopPropagation()">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredAndSortedRequests.length) }} of {{ filteredAndSortedRequests.length }} results
        </div>
        <div class="pagination-controls">
          <button (click)="previousPage()" [disabled]="currentPage === 1" class="page-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Previous
          </button>
          <span class="page-numbers">
            <button *ngFor="let page of getPageNumbers()"
                    (click)="goToPage(page)"
                    class="page-number"
                    [class.active]="page === currentPage">
              {{ page }}
            </button>
          </span>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="page-btn">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Rejection Modal -->
      <div class="modal-overlay" *ngIf="showRejectModal" (click)="closeRejectModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reject Verification Request</h3>
            <button class="modal-close" (click)="closeRejectModal()">×</button>
          </div>
          <div class="modal-body">
            <p>Please provide a reason for rejecting this verification request:</p>
            <textarea
              [(ngModel)]="rejectionReason"
              placeholder="Enter detailed reason for rejection..."
              class="modal-textarea"
              rows="4">
            </textarea>
            <div class="rejection-reasons">
              <p class="quick-reasons-label">Common reasons:</p>
              <button class="quick-reason" (click)="setRejectionReason('Document is blurry or unreadable')">Blurry document</button>
              <button class="quick-reason" (click)="setRejectionReason('Document number does not match format')">Invalid document number</button>
              <button class="quick-reason" (click)="setRejectionReason('Document appears to be edited or tampered')">Tampered document</button>
              <button class="quick-reason" (click)="setRejectionReason('Document has expired')">Expired document</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeRejectModal()">Cancel</button>
            <button class="btn-confirm-reject" (click)="confirmReject()" [disabled]="!rejectionReason || processingId !== null">
              {{ processingId ? 'Processing...' : 'Confirm Rejection' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-kyc-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
      background: #0B1220;
      min-height: 100vh;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-title {
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #FFFFFF;
      letter-spacing: -0.3px;
    }
    .page-subtitle {
      color: #6B7280;
      font-size: 14px;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .btn-excel {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-excel:hover:not(:disabled) {
      background: #374151;
      border-color: #4B5563;
    }
    .btn-excel:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }
    .stat-card:hover {
      border-color: #374151;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 13px;
      font-weight: 500;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }
    .stat-badge.urgent {
      background: #EF444420;
      color: #F87171;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .stat-trend {
      font-size: 12px;
      color: #6B7280;
    }
    .stat-trend.positive {
      color: #10B981;
    }
    .stat-trend.neutral {
      color: #F59E0B;
    }

    /* Filters Section */
    .filters-section {
      background: #111827;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #1F2937;
    }
    .filters-bar {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 2;
      position: relative;
      min-width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6B7280;
    }
    .search-input {
      width: 100%;
      padding: 10px 12px 10px 38px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #FFFFFF;
      font-size: 14px;
    }
    .search-input:focus {
      outline: none;
      border-color: #22D3EE;
    }
    .filter-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      flex: 3;
    }
    .filter-select {
      padding: 10px 32px 10px 12px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      font-size: 14px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-refresh:hover {
      background: #374151;
    }

    /* Active Filters */
    .active-filters {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #1F2937;
    }
    .filter-label {
      font-size: 12px;
      color: #6B7280;
    }
    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 12px;
      background: #1F2937;
      border-radius: 6px;
      font-size: 12px;
      color: #E5E7EB;
    }
    .filter-remove {
      background: none;
      border: none;
      color: #6B7280;
      cursor: pointer;
      font-size: 14px;
      padding: 0 2px;
    }
    .filter-remove:hover {
      color: #EF4444;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #1F2937;
      border-top-color: #22D3EE;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px;
      background: #111827;
      border-radius: 12px;
      border: 1px solid #1F2937;
    }
    .empty-icon svg {
      stroke: #374151;
      margin-bottom: 16px;
    }

    /* Table Styles */
    .requests-table-container {
      background: #111827;
      border-radius: 12px;
      border: 1px solid #1F2937;
      overflow-x: auto;
    }
    .requests-table {
      width: 100%;
      border-collapse: collapse;
    }
    .requests-table th {
      text-align: left;
      padding: 16px 20px;
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #1F2937;
      background: #0F172A;
    }
    .requests-table td {
      padding: 20px;
      border-bottom: 1px solid #1F2937;
      vertical-align: top;
    }
    .request-row:hover {
      background: #1A202C;
      cursor: pointer;
    }

    /* Applicant Cell */
    .applicant-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .applicant-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #22D3EE, #06B6D4);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #0B1220;
    }
    .applicant-name {
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 2px;
    }
    .applicant-email {
      font-size: 12px;
      color: #9CA3AF;
      margin-bottom: 2px;
    }
    .applicant-id {
      font-size: 10px;
      color: #6B7280;
      font-family: monospace;
    }

    /* Date Cell */
    .submission-date {
      font-weight: 500;
      color: #E5E7EB;
    }
    .submission-time {
      font-size: 11px;
      color: #6B7280;
      margin-top: 2px;
    }
    .days-ago {
      font-size: 10px;
      color: #F59E0B;
      margin-top: 4px;
    }

    /* Documents Cell */
    .document-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .document-badge {
      width: 32px;
      height: 32px;
      background: #1F2937;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .document-badge.verified {
      border: 1px solid #10B981;
    }
    .doc-status {
      position: absolute;
      bottom: -4px;
      right: -4px;
      font-size: 10px;
      background: #10B981;
      border-radius: 10px;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .view-docs-link {
      background: none;
      border: none;
      color: #22D3EE;
      font-size: 12px;
      cursor: pointer;
      padding: 0;
    }

    /* Status Cell */
    .status-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      width: fit-content;
    }
    .status-badge.pending {
      background: #F59E0B20;
      color: #F59E0B;
    }
    .status-badge.approved {
      background: #10B98120;
      color: #10B981;
    }
    .status-badge.rejected {
      background: #EF444420;
      color: #EF4444;
    }
    .status-progress {
      margin-top: 4px;
    }
    .progress-bar {
      width: 80px;
      height: 3px;
      background: #1F2937;
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #22D3EE;
      width: 0%;
      animation: progressPulse 1.5s ease-in-out infinite;
    }
    @keyframes progressPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    .progress-label {
      font-size: 10px;
      color: #6B7280;
    }

    /* Actions Cell */
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    .btn-approve, .btn-reject {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-approve {
      background: #10B981;
      color: white;
    }
    .btn-approve:hover:not(:disabled) {
      background: #059669;
      transform: translateY(-1px);
    }
    .btn-reject {
      background: #EF4444;
      color: white;
    }
    .btn-reject:hover:not(:disabled) {
      background: #DC2626;
      transform: translateY(-1px);
    }
    .btn-approve:disabled, .btn-reject:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .processed-indicator {
      text-align: center;
    }
    .processed-by {
      font-size: 12px;
      font-weight: 500;
      display: block;
    }
    .processed-date {
      font-size: 10px;
      color: #6B7280;
    }

    /* Expanded Documents */
    .expanded-docs-row {
      background: #0F172A;
    }
    .expanded-docs-row td {
      padding: 0 !important;
      border-bottom: none;
    }
    .documents-expanded {
      padding: 20px !important;
      background: #0F172A;
      border-top: 1px solid #1F2937;
      border-bottom: 1px solid #1F2937;
    }
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .document-preview-card {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 10px;
      overflow: hidden;
    }
    .document-preview-header {
      padding: 12px;
      background: #1A202C;
      border-bottom: 1px solid #1F2937;
    }
    .document-preview-type {
      font-weight: 600;
      font-size: 13px;
    }
    .document-preview-number {
      font-size: 11px;
      color: #6B7280;
      margin-left: 8px;
    }
    .document-preview-body {
      padding: 12px;
    }
    .document-preview-info {
      font-size: 11px;
      color: #9CA3AF;
      margin-bottom: 12px;
    }
    .document-actions {
      display: flex;
      gap: 12px;
    }
    .btn-view-doc, .btn-download-doc {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 6px;
      color: #E5E7EB;
      text-decoration: none;
      font-size: 12px;
      transition: all 0.2s;
    }
    .btn-view-doc:hover, .btn-download-doc:hover {
      background: #374151;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding: 16px 0;
    }
    .pagination-info {
      font-size: 13px;
      color: #6B7280;
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      cursor: pointer;
    }
    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .page-numbers {
      display: flex;
      gap: 6px;
    }
    .page-number {
      width: 36px;
      height: 36px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      cursor: pointer;
    }
    .page-number.active {
      background: #22D3EE;
      border-color: #22D3EE;
      color: #0B1220;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: #111827;
      border-radius: 16px;
      width: 90%;
      max-width: 500px;
      border: 1px solid #1F2937;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #1F2937;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 18px;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6B7280;
      cursor: pointer;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-textarea {
      width: 100%;
      padding: 12px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      font-size: 14px;
      margin-bottom: 16px;
      resize: vertical;
    }
    .quick-reasons-label {
      font-size: 12px;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .quick-reason {
      display: inline-block;
      margin: 4px;
      padding: 6px 12px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 6px;
      font-size: 11px;
      color: #E5E7EB;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quick-reason:hover {
      background: #374151;
      border-color: #22D3EE;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #1F2937;
    }
    .btn-cancel {
      padding: 10px 20px;
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #E5E7EB;
      cursor: pointer;
    }
    .btn-confirm-reject {
      padding: 10px 20px;
      background: #EF4444;
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .requests-table th, .requests-table td {
        padding: 12px;
      }
    }
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      .filters-bar {
        flex-direction: column;
      }
      .filter-group {
        flex-direction: column;
      }
      .pagination {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class AdminKycComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  Math = Math;

  loading = true;
  processingId: string | null = null;

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  dateFilter = 'all';
  sortBy = 'newest';

  // Pagination
  currentPage = 1;
  pageSize = 10;

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

  private refreshInterval: any;

  ngOnInit() {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadStats(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  getFullFileUrl(fileUrl: string): string {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${environment.uploadBaseUrl}${fileUrl}`;
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

    let url = `${environment.apiBaseUrl}/admin/kyc/all?page=1&pageSize=1000`;

    this.http.get(url).subscribe({
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
    return diff;
  }

  getPendingProgress(): string {
    return '45%';
  }

  getQueuePosition(request: KycRequest): string {
    const index = this.filteredAndSortedRequests.findIndex(r => r.memberId === request.memberId);
    return `${index + 1}`;
  }

  toggleDocuments(memberId: string) {
    this.expandedRow = this.expandedRow === memberId ? null : memberId;
    this.cdr.detectChanges();
  }

  openRejectModal(request: KycRequest) {
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

  approve(memberId: string) {
    this.processingId = memberId;
    this.http.post(`${environment.apiBaseUrl}/admin/kyc/${memberId}/approve`, {}).subscribe({
      next: () => {
        this.processingId = null;
        this.loadData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to approve KYC:', err);
        alert('Failed to approve KYC');
        this.processingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  confirmReject() {
    if (!this.selectedMemberId || !this.rejectionReason) return;

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
        alert('Failed to reject KYC');
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

  // ✅ Excel Export Function
  exportToExcel() {
    const exportData: ExportData[] = [];

    this.filteredAndSortedRequests.forEach(request => {
      request.documents.forEach(doc => {
        exportData.push({
          fullName: request.fullName,
          email: request.email,
          phoneNumber: request.phoneNumber || 'N/A',
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          status: request.status,
          submittedDate: new Date(request.submittedAt).toLocaleString(),
          processedDate: request.verifiedAt ? new Date(request.verifiedAt).toLocaleString() : 'Pending',
          rejectionReason: request.rejectionReason || 'N/A'
        });
      });
    });

    // Create HTML table for Excel
    const headers = ['Full Name', 'Email', 'Phone Number', 'Document Type', 'Document Number', 'Status', 'Submitted Date', 'Processed Date', 'Rejection Reason'];
    const rows = exportData.map(item => [
      item.fullName,
      item.email,
      item.phoneNumber,
      item.documentType,
      item.documentNumber,
      item.status,
      item.submittedDate,
      item.processedDate,
      item.rejectionReason
    ]);

    const htmlContent = this.generateExcelHTML(headers, rows);
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc_report_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ✅ CSV Export Function
  exportToCSV() {
    const exportData: ExportData[] = [];

    this.filteredAndSortedRequests.forEach(request => {
      request.documents.forEach(doc => {
        exportData.push({
          fullName: request.fullName,
          email: request.email,
          phoneNumber: request.phoneNumber || 'N/A',
          documentType: doc.documentType,
          documentNumber: doc.documentNumber,
          status: request.status,
          submittedDate: new Date(request.submittedAt).toLocaleString(),
          processedDate: request.verifiedAt ? new Date(request.verifiedAt).toLocaleString() : 'Pending',
          rejectionReason: request.rejectionReason || 'N/A'
        });
      });
    });

    const headers = ['Full Name', 'Email', 'Phone Number', 'Document Type', 'Document Number', 'Status', 'Submitted Date', 'Processed Date', 'Rejection Reason'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of exportData) {
      const values = headers.map(header => {
        const value = item[header.toLowerCase().replace(/ /g, '') as keyof ExportData] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyc_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateExcelHTML(headers: string[], rows: any[][]): string {
    const tableRows = rows.map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
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
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
}
