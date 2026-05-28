import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, switchMap } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { FooterComponent } from '../landing/components/footer/footer.component';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule,FooterComponent],
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.scss']
})
export class PlanDetailComponent {
  plan$: Observable<PublicPlan>;

  constructor(
    private route: ActivatedRoute,
    private planService: PlanService,
    private router: Router
  ) {
    this.plan$ = this.route.paramMap.pipe(
      switchMap(params => {
        const planId = params.get('planId');
        if (!planId) throw new Error('Invalid plan ID');
        return this.planService.getPlanById(planId);
      })
    );
  }

  navigateToRegister(): void {
    this.route.paramMap.subscribe(params => {
      const planId = params.get('planId');
      if (planId) {
        this.router.navigate(['/auth/register'], { queryParams: { planId } });
      }
    });
  }

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}
