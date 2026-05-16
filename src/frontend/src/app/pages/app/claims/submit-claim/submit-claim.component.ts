import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-claim.component.html',
})
export class SubmitClaimComponent {
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    claimDate: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedDate = new Date(this.form.value.claimDate!);
    const today = new Date();

    // ✅ FUTURE DATE BLOCK
    if (selectedDate > today) {
      this.error = 'Claim date cannot be in the future';
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    this.claimService
      .submitClaim(this.form.value as any)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.success = 'Claim submitted successfully ✅';

          // ✅ refresh list
          this.claimService.triggerRefresh();

          this.router.navigate(['/app/claims'], {
            replaceUrl: true,
          });

          // ✅ soft reset (UX friendly)
          this.form.patchValue({
            claimDate: '',
            amount: null,
            description: '',
          });

          // ✅ auto-clear success
          setTimeout(() => {
            this.success = null;
          }, 3000);
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to submit claim';
        },
      });
  }
}
