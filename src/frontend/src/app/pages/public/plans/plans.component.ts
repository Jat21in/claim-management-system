import { Component } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './plans.component.html'
})
export class PlansComponent {
  plans$: Observable<PublicPlan[]>;

  constructor(private planService: PlanService) {
    this.plans$ = this.planService.getPublicPlans();
  }
}
