import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PolicyService } from '../services/policy.service';
import { catchError, map, of, switchMap } from 'rxjs';

export const policySetupGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const policyService = inject(PolicyService);
  const router = inject(Router);

  // ✅ 1. Check URL query params
  let planId = route.queryParams['planId'];

  // ✅ 2. Check unified plan storage
  if (!planId) {
    planId = authService.getSelectedPlanId();
  }

  // ✅ 3. Check legacy storage for backward compatibility
  if (!planId) {
    planId = authService.getPlanIdFromLegacyStorage();
  }

  // ✅ 4. If still no planId, redirect to plans
  if (!planId) {
    console.warn('[PolicySetupGuard] No plan selected, redirecting to plans page');
    router.navigate(['/plans']);
    return false;
  }

  // ✅ Store planId for component use
  authService.setSelectedPlan(planId);

  // ✅ Check if user already has an active policy
  return policyService.getPolicySummary().pipe(
    map(summary => {
      if (summary.hasActivePolicy) {
        console.log('[PolicySetupGuard] User already has active policy, redirecting to dashboard');
        router.navigate(['/app/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      // If error (no policy exists), allow access
      return of(true);
    })
  );
};