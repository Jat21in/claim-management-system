import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Plan {
  planId: string;
  code: string;
  name: string;
  description: string;
  insuredAmount: number;
  durationInMonths: number;
  features: string[];
  isFeatured: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
  basePremiumAnnual: number;
  dependentLoadingPercentage: number;
  maxDependentsAllowed: number;
  maxNomineesAllowed: number;
  requiredKycDocuments: string[];
  ageLoadingPercentage: number;
  corporateDiscountPercentage: number;
  isFamilyFloater: boolean;
  locationRiskMultiplier: number;
  preExistingConditionLoading: number;
  smokerLoadingPercentage: number;
}

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-plans.component.html',
  styleUrls: ['./admin-plans.component.scss']
})
export class AdminPlansComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  plans: Plan[] = [];
  filteredPlans: Plan[] = [];
  loading = true;
  errorMessage = '';

  // Filters
  searchTerm = '';
  statusFilter = 'all';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Modal states
  showPlanModal = false;
  isEditing = false;
  selectedPlan: Plan | null = null;
  saving = false;

  // Form data
  planForm: Partial<Plan> = {
    code: '',
    name: '',
    description: '',
    insuredAmount: 0,
    durationInMonths: 12,
    features: [],
    isFeatured: false,
    basePremiumAnnual: 0,
    dependentLoadingPercentage: 0,
    maxDependentsAllowed: 0,
    maxNomineesAllowed: 0,
    requiredKycDocuments: [],
    ageLoadingPercentage: 0,
    corporateDiscountPercentage: 0,
    isFamilyFloater: false,
    locationRiskMultiplier: 1,
    preExistingConditionLoading: 0,
    smokerLoadingPercentage: 0
  };

  featureInput = '';
  kycDocInput = '';

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loading = true;
    this.http.get<Plan[]>(`${environment.apiBaseUrl}/admin/plans`).subscribe({
      next: (plans) => {
        this.plans = plans;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load plans:', err);
        this.errorMessage = 'Failed to load plans';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.plans];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => 
        this.statusFilter === 'active' ? p.isActive : !p.isActive
      );
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    this.filteredPlans = filtered;
    this.currentPage = 1;
  }

  get paginatedPlans(): Plan[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPlans.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPlans.length / this.pageSize);
  }

  addFeature() {
    if (this.featureInput.trim()) {
      this.planForm.features = [...(this.planForm.features || []), this.featureInput.trim()];
      this.featureInput = '';
    }
  }

  removeFeature(index: number) {
    this.planForm.features = this.planForm.features?.filter((_, i) => i !== index);
  }

  addKycDoc() {
    if (this.kycDocInput.trim()) {
      this.planForm.requiredKycDocuments = [...(this.planForm.requiredKycDocuments || []), this.kycDocInput.trim()];
      this.kycDocInput = '';
    }
  }

  removeKycDoc(index: number) {
    this.planForm.requiredKycDocuments = this.planForm.requiredKycDocuments?.filter((_, i) => i !== index);
  }

  openCreateModal() {
    this.isEditing = false;
    this.selectedPlan = null;
    this.planForm = {
      code: '',
      name: '',
      description: '',
      insuredAmount: 0,
      durationInMonths: 12,
      features: [],
      isFeatured: false,
      basePremiumAnnual: 0,
      dependentLoadingPercentage: 0,
      maxDependentsAllowed: 0,
      maxNomineesAllowed: 0,
      requiredKycDocuments: [],
      ageLoadingPercentage: 0,
      corporateDiscountPercentage: 0,
      isFamilyFloater: false,
      locationRiskMultiplier: 1,
      preExistingConditionLoading: 0,
      smokerLoadingPercentage: 0
    };
    this.featureInput = '';
    this.kycDocInput = '';
    this.showPlanModal = true;
  }

  openEditModal(plan: Plan) {
    this.isEditing = true;
    this.selectedPlan = plan;
    this.planForm = { ...plan };
    this.showPlanModal = true;
  }

  closeModal() {
    this.showPlanModal = false;
    this.selectedPlan = null;
  }

  savePlan() {
    if (!this.planForm.name || !this.planForm.code) {
      this.errorMessage = 'Name and Code are required';
      return;
    }

    this.saving = true;
    const url = this.isEditing
      ? `${environment.apiBaseUrl}/admin/plans/${this.selectedPlan?.planId}`
      : `${environment.apiBaseUrl}/admin/plans`;
    const method = this.isEditing ? this.http.put.bind(this.http) : this.http.post.bind(this.http);

    method(url, this.planForm).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadPlans();
      },
      error: (err) => {
        console.error('Failed to save plan:', err);
        this.errorMessage = err.error?.error || 'Failed to save plan';
        this.saving = false;
      }
    });
  }

  togglePlanStatus(plan: Plan) {
    const newStatus = !plan.isActive;
    this.http.put(`${environment.apiBaseUrl}/admin/plans/${plan.planId}`, { ...plan, isActive: newStatus }).subscribe({
      next: () => this.loadPlans(),
      error: (err) => console.error('Failed to update plan status:', err)
    });
  }

  deletePlan(plan: Plan) {
    if (confirm(`Delete plan "${plan.name}"? This action cannot be undone.`)) {
      this.http.delete(`${environment.apiBaseUrl}/admin/plans/${plan.planId}`).subscribe({
        next: () => this.loadPlans(),
        error: (err) => console.error('Failed to delete plan:', err)
      });
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  getPageNumbers(): number[] {
  const pages: number[] = [];
  const start = Math.max(1, this.currentPage - 2);
  const end = Math.min(this.totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}
}