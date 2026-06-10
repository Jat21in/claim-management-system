import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Hospital {
  hospitalId: string;
  hospitalName: string;
  registrationNumber: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  contactNumber: string;
  email: string;
  empanelmentDate: string;
  empanelmentEndDate: string | null;
  cashlessLimit: number;
  isActive: boolean;
  specializations: string[];
  consultationFee: number;
  roomRates: Record<string, number>;
}

@Component({
  selector: 'app-admin-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-hospitals.component.html',
  styleUrls: ['./admin-hospitals.component.scss']
})
export class AdminHospitalsComponent implements OnInit {
  private http = inject(HttpClient);

  hospitals: Hospital[] = [];
  filteredHospitals: Hospital[] = [];
  loading = true;

  searchTerm = '';
  statusFilter = 'all';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  showModal = false;
  isEditing = false;
  selectedHospital: Hospital | null = null;
  saving = false;
  errorMessage = '';

  hospitalForm: Partial<Hospital> = {
    hospitalName: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    contactNumber: '',
    email: '',
    cashlessLimit: 0,
    consultationFee: 0,
    specializations: [],
    roomRates: {}
  };

  specInput = '';
  roomRateKey = '';
  roomRateValue = 0;

  ngOnInit() {
    this.loadHospitals();
  }

  loadHospitals() {
    this.loading = true;
    this.http.get<Hospital[]>(`${environment.apiBaseUrl}/admin/hospitals`).subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load hospitals:', err);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.hospitals];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(h => this.statusFilter === 'active' ? h.isActive : !h.isActive);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.hospitalName.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.registrationNumber.toLowerCase().includes(term)
      );
    }

    this.filteredHospitals = filtered;
    this.currentPage = 1;
  }

  get paginatedHospitals(): Hospital[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHospitals.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredHospitals.length / this.pageSize);
  }

  addSpecialization() {
    if (this.specInput.trim()) {
      this.hospitalForm.specializations = [...(this.hospitalForm.specializations || []), this.specInput.trim()];
      this.specInput = '';
    }
  }

  removeSpecialization(index: number) {
    this.hospitalForm.specializations = this.hospitalForm.specializations?.filter((_, i) => i !== index);
  }

  addRoomRate() {
    if (this.roomRateKey.trim() && this.roomRateValue > 0) {
      this.hospitalForm.roomRates = { ...(this.hospitalForm.roomRates || {}), [this.roomRateKey]: this.roomRateValue };
      this.roomRateKey = '';
      this.roomRateValue = 0;
    }
  }

  removeRoomRate(key: string) {
    const newRates = { ...(this.hospitalForm.roomRates || {}) };
    delete newRates[key];
    this.hospitalForm.roomRates = newRates;
  }

  openCreateModal() {
    this.isEditing = false;
    this.selectedHospital = null;
    this.hospitalForm = {
      hospitalName: '',
      registrationNumber: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      contactNumber: '',
      email: '',
      cashlessLimit: 0,
      consultationFee: 0,
      specializations: [],
      roomRates: {}
    };
    this.showModal = true;
  }

  openEditModal(hospital: Hospital) {
    this.isEditing = true;
    this.selectedHospital = hospital;
    this.hospitalForm = { ...hospital };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedHospital = null;
  }

  saveHospital() {
    if (!this.hospitalForm.hospitalName || !this.hospitalForm.registrationNumber) {
      this.errorMessage = 'Hospital name and registration number are required';
      return;
    }

    this.saving = true;
    const url = this.isEditing
      ? `${environment.apiBaseUrl}/admin/hospitals/${this.selectedHospital?.hospitalId}`
      : `${environment.apiBaseUrl}/admin/hospitals`;
    const method = this.isEditing ? this.http.put.bind(this.http) : this.http.post.bind(this.http);

    method(url, this.hospitalForm).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadHospitals();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to save hospital';
        this.saving = false;
      }
    });
  }

  toggleStatus(hospital: Hospital) {
    const newStatus = !hospital.isActive;
    this.http.put(`${environment.apiBaseUrl}/admin/hospitals/${hospital.hospitalId}`, { ...hospital, isActive: newStatus }).subscribe({
      next: () => this.loadHospitals(),
      error: (err) => console.error('Failed to update status:', err)
    });
  }

  deleteHospital(hospital: Hospital) {
    if (confirm(`Delete hospital "${hospital.hospitalName}"?`)) {
      this.http.delete(`${environment.apiBaseUrl}/admin/hospitals/${hospital.hospitalId}`).subscribe({
        next: () => this.loadHospitals(),
        error: (err) => console.error('Failed to delete:', err)
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