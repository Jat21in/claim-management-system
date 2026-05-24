import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { MemberService, MemberDashboardResponse } from '../../../services/member.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-change-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 text-gray-200">
      <h2 class="text-2xl font-bold mb-6 text-center text-white">Manage Your Plan</h2>

      <!-- Current Plan Card (dark themed) -->
      <div *ngIf="currentPlan" class="mb-8 p-5 bg-gray-800/50 rounded-xl shadow-sm border border-gray-700">
        <h3 class="text-lg font-semibold text-blue-400">📋 Current Plan</h3>
        <div class="grid grid-cols-2 gap-4 mt-3">
          <div><span class="font-medium text-gray-400">Plan:</span> {{ currentPlan.name }}</div>
          <div><span class="font-medium text-gray-400">Coverage:</span> ₹{{ currentPlan.insuredAmount | number }}</div>
          <div><span class="font-medium text-gray-400">Valid from:</span> {{ currentPlan.startDate | date }}</div>
          <div><span class="font-medium text-gray-400">Valid until:</span> {{ currentPlan.endDate | date }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-700 mb-6">
        <button (click)="activeTab = 'switch'"
                [class]="activeTab === 'switch' ? 'tab-active-dark' : 'tab-inactive-dark'"
                class="px-5 py-2 font-medium">
          🔄 Switch to another plan
        </button>
        <button (click)="activeTab = 'upgrade'"
                [class]="activeTab === 'upgrade' ? 'tab-active-dark' : 'tab-inactive-dark'"
                class="px-5 py-2 font-medium ml-2">
          ⬆️ Upgrade current plan
        </button>
      </div>

      <!-- Tab 1: Switch Plan -->
      <div *ngIf="activeTab === 'switch'" class="space-y-5">
        <form [formGroup]="switchForm" (ngSubmit)="switchPlan()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Select New Plan</label>
            <select formControlName="planId" class="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white">
              <option *ngFor="let plan of availablePlans" [value]="plan.planId">
                {{ plan.name }} – ₹{{ plan.insuredAmount | number }} / {{ plan.durationInMonths }} months
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Your current plan will be replaced immediately.</p>
          </div>

          <button type="submit" [disabled]="switchLoading"
                  class="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {{ switchLoading ? 'Switching...' : 'Switch Plan' }}
          </button>
        </form>
      </div>

      <!-- Tab 2: Upgrade Current Plan -->
      <div *ngIf="activeTab === 'upgrade'" class="space-y-5">
        <form [formGroup]="upgradeForm" (ngSubmit)="upgradePlan()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New End Date</label>
            <input type="date" formControlName="endDate" class="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white" />
            <p class="text-xs text-gray-500">Must be after current end date ({{ currentPlan?.endDate | date }})</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New Insured Amount (₹)</label>
            <input type="number" formControlName="insuredAmount" class="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white" />
            <p class="text-xs text-gray-500">Must be greater than current ₹{{ currentPlan?.insuredAmount | number }}</p>
          </div>

          <button type="submit" [disabled]="upgradeLoading"
                  class="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
            {{ upgradeLoading ? 'Upgrading...' : 'Upgrade Plan' }}
          </button>
        </form>
      </div>

      <!-- Global messages -->
      <div *ngIf="globalSuccess" class="mt-4 p-3 bg-green-900/50 text-green-300 rounded-md border border-green-700">
        {{ globalSuccess }}
      </div>
      <div *ngIf="globalError" class="mt-4 p-3 bg-red-900/50 text-red-300 rounded-md border border-red-700">
        {{ globalError }}
      </div>
    </div>
  `,
  styles: [`
    .tab-active-dark {
      border-bottom: 2px solid #4f46e5;
      color: #a5b4fc;
    }
    .tab-inactive-dark {
      border-bottom: 2px solid transparent;
      color: #9ca3af;
    }
    .tab-inactive-dark:hover {
      color: #e5e7eb;
    }
  `]
})
export class ChangePlanComponent implements OnInit {
  private fb = inject(FormBuilder);
  private planService = inject(PlanService);
  private memberService = inject(MemberService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'switch' | 'upgrade' = 'switch';

  currentPlan: any = null;
  availablePlans: PublicPlan[] = [];

  switchForm!: FormGroup;
  switchLoading = false;

  upgradeForm!: FormGroup;
  upgradeLoading = false;

  globalSuccess = '';
  globalError = '';

  ngOnInit() {
    this.initForms();
    this.loadCurrentPlan();
    this.loadAvailablePlans();
  }

  private initForms() {
    this.switchForm = this.fb.group({
      planId: ['', Validators.required]
    });

    this.upgradeForm = this.fb.group({
      endDate: ['', Validators.required],
      insuredAmount: [0, [Validators.required, Validators.min(1)]]
    });
  }

  private loadCurrentPlan() {
    this.memberService.getDashboard().subscribe({
      next: (res: MemberDashboardResponse) => {
        this.currentPlan = res.activePlan;
        if (this.currentPlan) {
          this.upgradeForm.patchValue({
            endDate: this.currentPlan.endDate.split('T')[0],
            insuredAmount: this.currentPlan.insuredAmount
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalError = 'Failed to load current plan';
        this.cdr.markForCheck();
      }
    });
  }

  private loadAvailablePlans() {
    this.planService.getPublicPlans().subscribe({
      next: (plans) => {
        this.availablePlans = plans;
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalError = 'Failed to load plan list';
        this.cdr.markForCheck();
      }
    });
  }

  switchPlan() {
    if (this.switchForm.invalid) return;
    this.switchLoading = true;
    this.globalSuccess = '';
    this.globalError = '';
    this.cdr.markForCheck();

    const planId = this.switchForm.value.planId;
    this.planService.assignPlan(planId)
      .pipe(finalize(() => {
        this.switchLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.globalSuccess = 'Plan changed successfully! Reloading...';
          setTimeout(() => window.location.reload(), 1500);
        },
        error: (err) => {
          this.globalError = err.error?.message || 'Failed to switch plan';
          console.error('Switch error:', err);
          this.cdr.markForCheck();
        }
      });
  }

  upgradePlan() {
    if (this.upgradeForm.invalid) return;

    const newEndDate = new Date(this.upgradeForm.value.endDate);
    const currentEndDate = this.currentPlan ? new Date(this.currentPlan.endDate) : null;
    if (currentEndDate && newEndDate <= currentEndDate) {
      this.globalError = 'End date must be after current end date.';
      this.cdr.markForCheck();
      return;
    }

    const newAmount = this.upgradeForm.value.insuredAmount;
    if (this.currentPlan && newAmount <= this.currentPlan.insuredAmount) {
      this.globalError = 'Insured amount must be greater than current amount.';
      this.cdr.markForCheck();
      return;
    }

    this.upgradeLoading = true;
    this.globalSuccess = '';
    this.globalError = '';
    this.cdr.markForCheck();

    this.planService.updatePlan({
      endDate: new Date(this.upgradeForm.value.endDate).toISOString(),
      insuredAmount: newAmount
    }).pipe(finalize(() => {
      this.upgradeLoading = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: () => {
        this.globalSuccess = 'Plan upgraded successfully! Reloading...';
        setTimeout(() => window.location.reload(), 1500);
      },
      error: (err) => {
        this.globalError = err.error?.message || 'Upgrade failed';
        console.error('Upgrade error:', err);
        this.cdr.markForCheck();
      }
    });
  }
}
