import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../../services/policy.service';

@Component({
  selector: 'app-nominees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="nominees-container">
      <h1 class="page-title">⚖️ My Nominees</h1>
      <p class="page-subtitle">Beneficiaries who will receive claim benefits</p>

      <!-- Add Nominee Form -->
      <div class="add-form">
        <h3>Add New Nominee</h3>
        <div class="form-group">
          <input [(ngModel)]="newNominee.fullName" placeholder="Full Name" class="form-input">
          <select [(ngModel)]="newNominee.relationship" class="form-input">
            <option value="">Select Relationship</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
          </select>
          <input type="number" [(ngModel)]="newNominee.percentageAllocation" placeholder="Percentage %" class="form-input">
          <button (click)="addNominee()" [disabled]="loading" class="btn-primary">Add Nominee</button>
        </div>
        <div *ngIf="totalPercentage > 100" class="error-text">Total allocation cannot exceed 100%</div>
        <div *ngIf="totalPercentage < 100" class="warning-text">Total allocation: {{ totalPercentage }}% - {{ 100 - totalPercentage }}% remaining</div>
      </div>

      <!-- Nominees List -->
      <div class="nominees-list">
        <div *ngFor="let nom of nominees" class="nominee-card">
          <div class="nominee-icon">👤</div>
          <div class="nominee-info">
            <h4>{{ nom.fullName }}</h4>
            <p>{{ nom.relationship }} • {{ nom.percentageAllocation }}%</p>
            <p *ngIf="nom.isPrimary" class="primary-badge">Primary Nominee</p>
          </div>
          <button class="btn-remove" (click)="removeNominee(nom.nomineeId)">Remove</button>
        </div>

        <div *ngIf="nominees.length === 0" class="empty-state">
          <p>No nominees added yet. Add beneficiaries to your policy.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nominees-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .page-title { font-size: 28px; font-weight: 700; margin-bottom: 0.5rem; color: #22D3EE; }
    .page-subtitle { color: #888; margin-bottom: 2rem; }
    .add-form { background: #1a1a2e; padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; }
    .add-form h3 { margin-bottom: 1rem; }
    .form-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    .form-input { flex: 1; padding: 0.75rem; background: #0f0f1a; border: 1px solid #2a2a3e; border-radius: 0.5rem; color: white; }
    .btn-primary { padding: 0.75rem 1.5rem; background: #22D3EE; color: black; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
    .nominees-list { display: flex; flex-direction: column; gap: 1rem; }
    .nominee-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #1a1a2e; border-radius: 0.75rem; border: 1px solid #2a2a3e; }
    .nominee-icon { font-size: 2rem; }
    .nominee-info { flex: 1; }
    .nominee-info h4 { margin: 0; font-size: 16px; }
    .nominee-info p { margin: 0; font-size: 12px; color: #888; }
    .primary-badge { background: #10b98120; color: #10b981; padding: 2px 8px; border-radius: 4px; display: inline-block; }
    .btn-remove { padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 0.5rem; cursor: pointer; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
    .error-text { color: #ef4444; margin-top: 0.5rem; font-size: 12px; }
    .warning-text { color: #f59e0b; margin-top: 0.5rem; font-size: 12px; }
  `]
})
export class NomineesComponent implements OnInit {
  private policyService = inject(PolicyService);

  nominees: any[] = [];
  loading = false;
  newNominee = { fullName: '', relationship: '', percentageAllocation: 0, isPrimary: false };

  get totalPercentage(): number {
    return this.nominees.reduce((sum, n) => sum + n.percentageAllocation, 0);
  }

  ngOnInit() {
    this.loadNominees();
  }

  loadNominees() {
    this.policyService.getNominees().subscribe({
      next: (res) => this.nominees = res,
      error: (err) => console.error('Failed to load nominees', err)
    });
  }

  addNominee() {
    if (!this.newNominee.fullName || !this.newNominee.relationship || !this.newNominee.percentageAllocation) {
      alert('Please fill all fields');
      return;
    }

    if (this.totalPercentage + this.newNominee.percentageAllocation > 100) {
      alert('Total allocation cannot exceed 100%');
      return;
    }

    this.loading = true;
    this.policyService.addNominee({ ...this.newNominee, isPrimary: false }).subscribe({
      next: () => {
        this.newNominee = { fullName: '', relationship: '', percentageAllocation: 0, isPrimary: false };
        this.loadNominees();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to add nominee', err);
        this.loading = false;
      }
    });
  }

  removeNominee(id: string) {
    // Note: You'll need to add a DELETE endpoint in backend
    alert('Remove functionality - implement DELETE endpoint');
  }
}
