import { Routes } from '@angular/router';

import { LandingComponent } from './pages/public/landing/landing.component';
import { PlansComponent } from './pages/public/plans/plans.component';
import { PlanDetailComponent } from './pages/public/plan-details/plan-details.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'plans', component: PlansComponent },
  { path: 'plans/:planId', component: PlanDetailComponent },
  { path: '**', redirectTo: '' }
];
