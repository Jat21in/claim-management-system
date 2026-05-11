import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';

import { LandingComponent } from './pages/public/landing/landing.component';
import { PlansComponent } from './pages/public/plans/plans.component';
import { PlanDetailComponent } from './pages/public/plan-details/plan-details.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { DashboardComponent } from './pages/app/dashboard/dashboard.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { ClaimsComponent } from './pages/app/claims/claims.component';
import { ProfileComponent } from './pages/app/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'plans/:planId', component: PlanDetailComponent },

      // ✅ ADD THIS
      { path: 'auth/login', component: LoginComponent },
      { path: 'auth/register', component: RegisterComponent },
    ],
  },

  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'claims', component: ClaimsComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
