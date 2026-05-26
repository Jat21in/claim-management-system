import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminClaimsComponent } from './claims/admin-claims.component';
import { AdminMembersComponent } from './members/admin-members.component';
import { adminGuard } from './gaurds/admin.guard';

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
    ]
  }
];
