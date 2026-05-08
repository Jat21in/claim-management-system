import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe],
  templateUrl: './plan-details.component.html'
})
export class PlanDetailComponent {

  plan$!: Observable<PublicPlan>;

  constructor(
    private route: ActivatedRoute,
    private planService: PlanService
  ) {
    console.log('[PlanDetail] Component constructed');

    this.plan$ = this.route.paramMap.pipe(
      switchMap(params => {
        const planId = params.get('planId');
        console.log('[PlanDetail] Route param planId:', planId);

        if (!planId) {
          throw new Error('Invalid plan ID');
        }

        console.log('[PlanDetail] Fetching plan via API');
        return this.planService.getPlanById(planId);
      })
    );
  }
}
