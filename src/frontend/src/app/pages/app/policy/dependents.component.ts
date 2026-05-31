import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../../services/policy.service';

@Component({
  selector: 'app-dependents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dependents-container">
      <h1 class="page-title">👨‍👩‍👧 My Dependents</h1>
      <p class="page-subtitle">Family members covered under your policy</p>

      <!-- Add Dependent Form -->
      <div class="add-form">
        <h3>Add New Dependent</h3>
        <div class="form-group">
          <input [(ngModel)]="newDependent.fullName" placeholder="Full Name" class="form-input">
          <select [(ngModel)]="newDependent.relationship" class="form-input">
            <option value="">Select Relationship</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
          </select>
          <input type="date" [(ngModel)]="newDependent.dateOfBirth" class="form-input">
          <button (click)="addDependent()" [disabled]="loading" class="btn-primary">Add Dependent</button>
        </div>
      </div>

      <!-- Dependents List -->
      <div class="dependents-list">
        <div *ngFor="let dep of dependents" class="dependent-card">
          <div class="dependent-icon">👤</div>
          <div class="dependent-info">
            <h4>{{ dep.fullName }}</h4>
            <p>{{ dep.relationship }} • Born: {{ dep.dateOfBirth | date:'MMM dd, yyyy' }}</p>
          </div>
          <button class="btn-remove" (click)="removeDependent(dep.dependentId)">Remove</button>
        </div>

        <div *ngIf="dependents.length === 0" class="empty-state">
          <p>No dependents added yet. Add family members to your policy.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dependents-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .page-title { font-size: 28px; font-weight: 700; margin-bottom: 0.5rem; color: #22D3EE; }
    .page-subtitle { color: #888; margin-bottom: 2rem; }
    .add-form { background: #1a1a2e; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; }
    .add-form h3 { margin-bottom: 1rem; }
    .form-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    .form-input { flex: 1; padding: 0.75rem; background: #0f0f1a; border: 1px solid #2a2a3e; border-radius: 0.5rem; color: white; }
    .btn-primary { padding: 0.75rem 1.5rem; background: #22D3EE; color: black; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    .dependents-list { display: flex; flex-direction: column; gap: 1rem; }
    .dependent-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #1a1a2e; border-radius: 0.75rem; border: 1px solid #2a2a3e; }
    .dependent-icon { font-size: 2rem; }
    .dependent-info { flex: 1; }
    .dependent-info h4 { margin: 0; font-size: 16px; }
    .dependent-info p { margin: 0; font-size: 12px; color: #888; }
    .btn-remove { padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
  `]
})
export class DependentsComponent implements OnInit {
  private policyService = inject(PolicyService);

  dependents: any[] = [];
  loading = false;
  newDependent = { fullName: '', relationship: '', dateOfBirth: '' };

  ngOnInit() {
    this.loadDependents();
  }

  loadDependents() {
    this.policyService.getDependents().subscribe({
      next: (res) => this.dependents = res,
      error: (err) => console.error('Failed to load dependents', err)
    });
  }

  addDependent() {
    if (!this.newDependent.fullName || !this.newDependent.relationship || !this.newDependent.dateOfBirth) {
      alert('Please fill all fields');
      return;
    }

    this.loading = true;
    this.policyService.addDependent(this.newDependent).subscribe({
      next: () => {
        this.newDependent = { fullName: '', relationship: '', dateOfBirth: '' };
        this.loadDependents();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to add dependent', err);
        this.loading = false;
      }
    });
  }

  removeDependent(id: string) {
    // Note: You'll need to add a DELETE endpoint in backend
    alert('Remove functionality - implement DELETE endpoint');
  }
}
