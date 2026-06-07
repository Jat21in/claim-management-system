import { Routes } from '@angular/router';

// layouts
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { AuthShellComponent } from './layout/auth-shell/auth-shell.component';

// public pages
import { LandingComponent } from './pages/public/landing/landing.component';
import { PlansComponent } from './pages/public/plans/plans.component';
import { PlanDetailComponent } from './pages/public/plan-details/plan-details.component';

// auth pages
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';

// app pages
import { DashboardComponent } from './pages/app/dashboard/dashboard.component';
import { ClaimsComponent } from './pages/app/claims/claims.component';
import { ProfileComponent } from './pages/app/profile/profile.component';
import { ChangePlanComponent } from './pages/app/change-plan/change-plan.component';
import { SubmitClaimComponent } from './pages/app/claims/submit-claim/submit-claim.component';
import { DependentsComponent } from './pages/app/policy/dependents.component';
import { NomineesComponent } from './pages/app/policy/nominees.component';

// KYC pages
import { KycUploadComponent } from './pages/app/kyc/kyc-upload.component';
import { KycStatusComponent } from './pages/app/kyc/kyc-status.component';

// guards
import { authGuard } from './guards/auth.guard';
import { kycGuard } from './guards/kyc.guard';
import { PolicySetupComponent } from './pages/app/policy-setup/policy-setup.component';
import { policySetupGuard } from './guards/policy-setup.guard';
import { PolicySetupLayoutComponent } from './layout/policy-setup-layout/policy-setup-layout.component';
import { PaymentPageComponent } from './pages/app/payments/payment-page.component';
import { PaymentHistoryComponent } from './pages/app/payments/payment-history.component';

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
   * 🧠 App (authenticated + KYC verified)
   * All routes here require both authentication AND KYC verification
   */
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard, kycGuard], // ✅ BOTH guards required
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      // {path: 'policy-setup',component: PolicySetupComponent, canActivate:[policySetupGuard]},
      { path: 'claims', component: ClaimsComponent },
      { path: 'claims/new', component: SubmitClaimComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'change-plan', component: ChangePlanComponent },
      { path: 'policy/dependents', component: DependentsComponent },
      { path: 'policy/nominees', component: NomineesComponent },
      {path:'payments', component: PaymentHistoryComponent, canActivate:[authGuard]}, // ✅ Only auth required, NOT KYC
      {path:'payments/new', component: PaymentPageComponent, canActivate:[authGuard]}, // ✅ Only auth required, NOT KYC
    ],
  },
  {
    path: 'app/policy-setup',
    component: PolicySetupLayoutComponent,
    canActivate: [authGuard, kycGuard], // ✅ Only auth required, NOT KYC
    children: [
      { path: '', component: PolicySetupComponent },
    ]
  },

  /**
   * 📄 KYC Routes (authenticated but NOT necessarily verified)
   * These are accessible even before KYC verification
   */
  {
    path: 'app/kyc',
    component: AppLayoutComponent,
    canActivate: [authGuard], // ✅ Only auth required, NOT KYC
    children: [
      { path: 'upload', component: KycUploadComponent },
      { path: 'pending', component: KycStatusComponent },
      { path: 'rejected', component: KycStatusComponent },
    ],
  },

  /**
   * 👑 Admin Panel
   */
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  /**
   * ❌ Fallback
   */
  { path: '**', redirectTo: '' },
];
