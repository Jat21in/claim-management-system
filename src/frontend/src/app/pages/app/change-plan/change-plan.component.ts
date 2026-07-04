import { ChangeDetectionStrategy, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { MemberService } from '../../../services/member.service';

@Component({
  selector: 'app-change-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './change-plan.component.html',
  styleUrls: ['./change-plan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePlanComponent implements OnInit {
  private planService = inject(PlanService);
  private memberService = inject(MemberService);
  private cdr = inject(ChangeDetectorRef);

  plans: PublicPlan[] = [];
  currentPlan: PublicPlan | null = null;
  selectedPlanId: string | null = null;
  selectedPlanForConfirm: PublicPlan | null = null;

  loading = true;
  saving = false;
  processing = false;
  loadError: string | null = null;
  success: string | null = null;
  error: string | null = null;

  showConfirmModal = false;
  isDowngrade = false;

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.loading = true;
    this.loadError = null;
    this.cdr.markForCheck();

    this.planService.getPublicPlans()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (plans) => {
          this.plans = plans;
          console.log('Plans loaded:', plans);
          this.loadCurrentPlan();
        },
        error: () => {
          this.loadError = 'Failed to load plans. Please try again.';
          this.cdr.markForCheck();
        }
      });
  }

  private loadCurrentPlan(): void {
    this.memberService.getDashboard().subscribe({
      next: (res) => {
        // ✅ Fixed: safe navigation with optional chaining
        if (res?.activePlan) {
          const fullPlan = this.plans.find(p => p.planId === res.activePlan?.id);
          
          if (fullPlan) {
            this.currentPlan = fullPlan;
          } else {
            // ✅ Fallback with all required fields
            this.currentPlan = {
              planId: res.activePlan.id,
              name: res.activePlan.name,
              description: 'Your current active plan',
              insuredAmount: res.activePlan.insuredAmount,
              durationInMonths: 12,
              features: [],
              isFeatured: false,
              basePremiumAnnual: 0,
              dependentLoadingPercentage: 0,
              maxDependentsAllowed: 0,
              maxNomineesAllowed: 0,
              isFamilyFloater: false
            };
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        console.error('Failed to load current plan');
      }
    });
  }

  selectPlan(plan: PublicPlan): void {
    this.selectedPlanId = plan.planId;
    this.cdr.markForCheck();
  }

  confirmPlan(plan: PublicPlan): void {
    this.selectedPlanForConfirm = plan;
    this.isDowngrade = this.currentPlan ?
      plan.insuredAmount < this.currentPlan.insuredAmount : false;
    this.showConfirmModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showConfirmModal = false;
    this.selectedPlanForConfirm = null;
    this.cdr.markForCheck();
  }

  confirmChange(): void {
    if (!this.selectedPlanForConfirm) return;

    this.processing = true;
    this.cdr.markForCheck();

    this.planService.assignPlan(this.selectedPlanForConfirm.planId)
      .pipe(finalize(() => {
        this.processing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = `Successfully upgraded to ${this.selectedPlanForConfirm!.name}!`;
          this.showConfirmModal = false;
          this.currentPlan = this.selectedPlanForConfirm;
          this.selectedPlanId = null;

          setTimeout(() => {
            this.success = null;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to change plan. Please try again.';
          this.showConfirmModal = false;

          setTimeout(() => {
            this.error = null;
            this.cdr.markForCheck();
          }, 3000);
        }
      });
  }

  getPlanValidity(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + (this.currentPlan?.durationInMonths || 12));
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }
}