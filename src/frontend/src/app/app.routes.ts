import { Routes } from '@angular/router';

// layouts
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AuthShellComponent } from './layout/auth-shell/auth-shell.component';

// public pages
import { LandingComponent } from './pages/public/landing/landing.component';
import { PlansComponent } from './pages/public/plans/plans.component';
import { PlanDetailComponent } from './pages/public/plan-details/plan-details.component';
import { ChangePlanComponent } from './pages/app/change-plan/change-plan.component';

// auth pages
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';

// app pages
import { DashboardComponent } from './pages/app/dashboard/dashboard.component';
import { ClaimsComponent } from './pages/app/claims/claims.component';
import { ProfileComponent } from './pages/app/profile/profile.component';

// guards
import { authGuard } from './guards/auth.guard';
import { SubmitClaimComponent } from './pages/app/claims/submit-claim/submit-claim.component';

export const routes: Routes = [
  /**
   * 🌍 Public (no auth required)
   */
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: LandingComponent },
      { path: 'plans', component: PlansComponent },
      { path: 'plans/:planId', component: PlanDetailComponent },
    ],
  },

  /**
   * 🔐 Auth (login / register)
   */
  {
    path: 'auth',
    component: AuthShellComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  /**
   * 🧠 App (authenticated)
   */
  {
  path: 'app',
  component: AppLayoutComponent,
  canActivate: [authGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'claims', component: ClaimsComponent },
    { path: 'claims/new', component: SubmitClaimComponent }, // ✅ ADD THIS
    { path: 'profile', component: ProfileComponent },
    {path: 'change-plan', component: ChangePlanComponent},
  ],
},

  /**
   * ❌ Fallback
   */
  { path: '**', redirectTo: '' },
];
