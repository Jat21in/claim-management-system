import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminClaimsComponent } from './claims/admin-claims.component';
import { AdminMembersComponent } from './members/admin-members.component';
import { AdminKycComponent } from './kyc/admin-kyc.component'; // ✅ ADD THIS
import { adminGuard } from './gaurds/admin.guard';
import { HangfireMonitoringComponent } from './hangfire/hangfire-monitoring.component';
import { AdminPlansComponent } from './plans/admin-plans.component';
import { AdminHospitalsComponent } from './hospitals/admin-hospitals.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'claims', component: AdminClaimsComponent },
      { path: 'members', component: AdminMembersComponent },
      { path: 'kyc', component: AdminKycComponent }, // ✅ ADD THIS
      { path: 'hangfire', component: HangfireMonitoringComponent },
      { path: 'plans', component: AdminPlansComponent },
      { path: 'hospitals', component: AdminHospitalsComponent }
    ]
  }
];