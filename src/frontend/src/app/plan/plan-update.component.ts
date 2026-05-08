import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService } from './plan.service';

@Component({
  selector: 'app-plan-update',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-update.component.html'
})
export class PlanUpdateComponent {

  success = '';
  error = '';

  // ✅ These MUST map to REAL PlanIds in DB
  plans = [
  {
    id: 'D7F742BF-ACAE-4768-8610-C948B711D0FB',
    name: 'Health Plan',
    insuredAmount: 750000
  }
];

  constructor(private planService: PlanService) {}

 selectPlan(plan: any) {
  this.planService.assignPlan(plan.id).subscribe({
    next: () => {
      this.success = `Plan "${plan.name}" assigned successfully`;
      this.error = '';
    },
    error: err => {
      this.error = err?.error?.message || 'Failed to assign plan';
      this.success = '';
    }
  });
}
}
