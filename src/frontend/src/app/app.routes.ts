import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

import { LandingComponent } from './pages/public/landing/landing.component';
import { PlansComponent } from './pages/public/plans/plans.component';
import { PlanDetailComponent } from './pages/public/plan-details/plan-details.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { DashboardComponent } from './pages/app/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'plans/:planId', component: PlanDetailComponent },
      { path: 'auth/login', component: LoginComponent }
    ]
  },
  {
    path: 'app',
    component: AppLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
