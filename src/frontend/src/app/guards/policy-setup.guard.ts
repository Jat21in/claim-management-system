import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PolicyService } from '../services/policy.service';
import { catchError, map, of } from 'rxjs';

export const policySetupGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const policyService = inject(PolicyService);
  const router = inject(Router);

  // Get planId from query params or localStorage
  const planId = route.queryParams['planId'] || localStorage.getItem('selectedPlanId');

  if (!planId) {
    console.warn('[PolicySetupGuard] No plan selected, redirecting to plans page');
    router.navigate(['/plans']);
    return false;
  }

  // Check if user already has an active policy
  return policyService.getPolicySummary().pipe(
    map(summary => {
      if (summary.hasActivePolicy) {
        // User already has policy, redirect to dashboard
        console.log('[PolicySetupGuard] User already has active policy, redirecting to dashboard');
        router.navigate(['/app/dashboard']);
        return false;
      }

      // Store planId for use in component
      localStorage.setItem('selectedPlanId', planId);
      return true;
    }),
    catchError(() => {
      // If error (no policy exists), allow access
      localStorage.setItem('selectedPlanId', planId);
      return of(true);
    })
  );
};
