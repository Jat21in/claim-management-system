import { ChangeDetectionStrategy, Component, Output, EventEmitter, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalService, NetworkHospital } from '../../services/hospital.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-network-hospital-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './network-hospital-search.component.html',
  styleUrls: ['./network-hospital-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkHospitalSearchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() selectHospital = new EventEmitter<NetworkHospital>();

  private hospitalService = inject(HospitalService);
  private cdr = inject(ChangeDetectorRef);

  isOpen = true;
  isLoading = false;
  isLoadingFilters = false;
  hospitals: NetworkHospital[] = [];
  filteredHospitals: NetworkHospital[] = [];
  searchTerm = '';
  selectedCity = '';
  selectedSpecialization = '';

  // ✅ DYNAMIC - Loaded from API
  cities: string[] = [];
  specializations: string[] = [];

  // ✅ Fallback static cities (if API fails)
  private fallbackCities: string[] = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
    'Gurugram', 'Noida', 'Faridabad', 'Chandigarh', 'Mohali', 'Panchkula',
    'Navi Mumbai'
  ];

  private fallbackSpecializations: string[] = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 
    'Gastroenterology', 'Urology', 'Nephrology', 'Pediatrics',
    'Gynecology', 'ENT', 'General Surgery', 'Transplant',
    'Spine Surgery', 'Cardiac Surgery', 'Vascular Surgery',
    'Plastic Surgery', 'Dermatology', 'Internal Medicine',
    'Robotic Surgery', 'Sports Medicine', 'Trauma'
  ];

  constructor() {
    // No need for manual injection here - using inject() above
  }

  ngOnInit() {
    this.loadFilters();
    this.searchHospitals();
  }

  loadFilters(): void {
    this.isLoadingFilters = true;
    this.cdr.markForCheck();

    // Load cities
    this.hospitalService.getCities().pipe(
      finalize(() => {
        this.isLoadingFilters = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (cities) => {
        this.cities = cities.length > 0 ? cities : this.fallbackCities;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cities = this.fallbackCities;
        this.cdr.markForCheck();
      }
    });

    // Load specializations
    this.hospitalService.getSpecializations().subscribe({
      next: (specializations) => {
        this.specializations = specializations.length > 0 ? specializations : this.fallbackSpecializations;
        this.cdr.markForCheck();
      },
      error: () => {
        this.specializations = this.fallbackSpecializations;
        this.cdr.markForCheck();
      }
    });
  }

  searchHospitals(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.hospitalService.searchNetworkHospitals(
      this.selectedCity || undefined,
      this.selectedSpecialization || undefined
    ).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        this.applySearchFilter();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load hospitals:', error);
        this.hospitals = [];
        this.filteredHospitals = [];
        this.cdr.markForCheck();
      }
    });
  }

  onCityChange(): void {
    this.searchHospitals();
  }

  onSpecializationChange(): void {
    this.searchHospitals();
  }

  applySearchFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredHospitals = this.hospitals;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredHospitals = this.hospitals.filter(h =>
      h.hospitalName.toLowerCase().includes(term) ||
      h.city.toLowerCase().includes(term) ||
      h.state.toLowerCase().includes(term) ||
      h.specializations.some(s => s.toLowerCase().includes(term))
    );
  }

  onSearchTermChange(): void {
    this.applySearchFilter();
    this.cdr.markForCheck();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  closeModal(): void {
    this.close.emit();
  }

  select(hospital: NetworkHospital): void {
    this.selectHospital.emit(hospital);
  }

  // ✅ TrackBy for better performance
  trackByHospitalId(index: number, hospital: NetworkHospital): string {
    return hospital.hospitalId;
  }
}