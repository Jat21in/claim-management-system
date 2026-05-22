// /src/frontend/src/app/pages/public/plan-details/plan-details.component.ts

import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, AsyncPipe, CurrencyPipe } from '@angular/common';
import { Observable, switchMap, tap } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, RouterLink, CurrencyPipe],
  templateUrl: './plan-details.component.html'
})
export class PlanDetailComponent {
  plan$!: Observable<PublicPlan>;
  currentPlan: PublicPlan | null = null;

  constructor(
    private route: ActivatedRoute,
    private planService: PlanService,
    private router: Router
  ) {
    this.plan$ = this.route.paramMap.pipe(
      switchMap(params => {
        const planId = params.get('planId');
        console.log('🔍 Plan ID from route:', planId);

        if (!planId) {
          throw new Error('Invalid plan ID');
        }

        return this.planService.getPlanById(planId);
      }),
      tap(plan => {
        this.currentPlan = plan;
        console.log('✅ Fetched plan details:', plan);
      })
    );
  }

  navigateToRegister(): void {
  if (!this.currentPlan) {
    console.error('❌ No plan loaded');
    return;
  }

  const planId = this.currentPlan.planId;
  console.log('🚀 Navigating to register with plan ID:', planId);

  // ✅ Use absolute path with preserve query params
  this.router.navigateByUrl(`/auth/register?planId=${planId}`).then(success => {
    if (success) {
      console.log('✅ Navigation successful');
    } else {
      console.error('❌ Navigation failed');
    }
  });
}

}
