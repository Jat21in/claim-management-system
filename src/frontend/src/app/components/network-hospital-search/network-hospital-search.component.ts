import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalService, NetworkHospital } from '../../services/hospital.service';

@Component({
  selector: 'app-network-hospital-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './network-hospital-search.component.html',
  styleUrls: ['./network-hospital-search.component.scss']
})
export class NetworkHospitalSearchComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() selectHospital = new EventEmitter<NetworkHospital>();

  isOpen = true;
  isLoading = false;
  hospitals: NetworkHospital[] = [];
  searchTerm = '';
  selectedCity = '';
  selectedSpecialization = '';

  cities: string[] = ['Mumbai', 'Bangalore', 'New Delhi', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad'];
  specializations: string[] = ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Gastroenterology', 'Urology', 'Pediatrics'];

  constructor(private hospitalService: HospitalService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.searchHospitals();
  }

  searchHospitals() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.hospitalService.searchNetworkHospitals(this.selectedCity || undefined, this.selectedSpecialization || undefined)
      .subscribe({
        next: (hospitals) => {
          this.hospitals = hospitals;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load hospitals:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onCityChange() {
    this.searchHospitals();
  }

  onSpecializationChange() {
    this.searchHospitals();
  }

  filterHospitals(): NetworkHospital[] {
    if (!this.searchTerm) return this.hospitals;
    const term = this.searchTerm.toLowerCase();
    return this.hospitals.filter(h =>
      h.hospitalName.toLowerCase().includes(term) ||
      h.city.toLowerCase().includes(term)
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  closeModal() {
    this.close.emit();
  }

  select(hospital: NetworkHospital) {
    this.selectHospital.emit(hospital);
  }
}
