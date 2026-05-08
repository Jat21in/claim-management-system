import { Routes } from '@angular/router';
import { PlansComponent } from '../../pages/public/plans/plans.component';
import { PlanDetailComponent } from '../../pages/public/plan-details/plan-details.component';

export const PLANS_ROUTES: Routes = [
  {
    path: '',
    component: PlansComponent
  },
  {
    path: ':id', // ✅ PARAM NAME = id
    component: PlanDetailComponent
  }
];

