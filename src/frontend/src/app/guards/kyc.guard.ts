import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KycService } from '../services/kyc.service';
import { map, catchError, of } from 'rxjs';

export const kycGuard: CanActivateFn = (route, state) => {
  const kycService = inject(KycService);
  const router = inject(Router);

  return kycService.getStatus().pipe(
    map(status => {
      console.log('KYC Guard - Status:', status);
      console.log('KYC Guard - Has Submitted Documents:', status.hasSubmittedDocuments);

      if (status.status === 1) {
        // ✅ VERIFIED - Allow access to dashboard
        return true;
      }
      else if (status.status === 0) {
        // ✅ PENDING - Check if documents already submitted
        if (status.hasSubmittedDocuments) {
          // Documents submitted, waiting for admin approval
          router.navigate(['/app/kyc/pending']);
        } else {
          // No documents submitted yet - redirect to upload
          router.navigate(['/app/kyc/upload']);
        }
        return false;
      }
      else if (status.status === 2) {
        // REJECTED - Redirect to upload with message
        router.navigate(['/app/kyc/rejected']);
        return false;
      }

      // Default fallback
      router.navigate(['/app/kyc/upload']);
      return false;
    }),
    catchError((err) => {
      console.error('KYC Guard Error:', err);
      router.navigate(['/app/kyc/upload']);
      return of(false);
    })
  );
};
