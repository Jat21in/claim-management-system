import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PolicyService } from '../services/policy.service';
import { KycService } from '../services/kyc.service';
import { catchError, map, of, switchMap } from 'rxjs';

export const dashboardGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const policyService = inject(PolicyService);
  const kycService = inject(KycService);
  const router = inject(Router);

  // First check authentication
  if (!authService.isAuthenticated()) {
    console.log('[DashboardGuard] Not authenticated, redirecting to login');
    router.navigate(['/auth'], { queryParams: { mode: 'login', redirect: state.url } });
    return false;
  }

  console.log('[DashboardGuard] User authenticated, checking KYC and policy status');

  // Check KYC status
  return kycService.getStatus().pipe(
    switchMap(kycStatus => {
      console.log('[DashboardGuard] KYC Status:', kycStatus);

      // If KYC not verified, redirect to KYC flow
      if (kycStatus.status !== 1) {
        console.log('[DashboardGuard] KYC not verified, redirecting to KYC');
        if (!kycStatus.hasSubmittedDocuments) {
          router.navigate(['/app/kyc/upload']);
        } else {
          router.navigate(['/app/kyc/pending']);
        }
        return of(false);
      }

      // KYC IS VERIFIED - Now check if user has an ACTIVE POLICY
      return policyService.getPolicySummary().pipe(
        map(policySummary => {
          console.log('[DashboardGuard] Policy Summary:', policySummary);

          if (!policySummary.hasActivePolicy) {
            // ✅ CRITICAL FIX: KYC verified but NO active policy
            // Redirect to POLICY SETUP, NOT dashboard
            console.log('[DashboardGuard] KYC verified but no active policy, redirecting to POLICY SETUP');
            router.navigate(['/app/policy-setup']);
            return false;
          }

          // User has active policy - allow access to dashboard
          console.log('[DashboardGuard] Has active policy, access granted to DASHBOARD');
          return true;
        }),
        catchError((error) => {
          console.error('[DashboardGuard] Error checking policy (likely no policy exists):', error);
          // Error means no policy exists - redirect to policy setup
          router.navigate(['/app/policy-setup']);
          return of(false);
        })
      );
    }),
    catchError((error) => {
      console.error('[DashboardGuard] KYC check error:', error);
      router.navigate(['/app/kyc/upload']);
      return of(false);
    })
  );
};
