import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ClaimService } from '../../../../services/claim.service';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-claim.component.html'
})
export class SubmitClaimComponent {

  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);

  loading = false;
  error: string | null = null;

  form = this.fb.group({
    claimDate: ['', Validators.required],
    amount: [
      null,
      [Validators.required, Validators.min(1)]
    ],
    description: ['']
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    this.claimService.submitClaim(this.form.value as any)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          // ✅ refresh claims list
          this.claimService.triggerRefresh();
          this.form.reset();
        },
        error: err => {
          this.error =
            err?.error?.message ?? 'Failed to submit claim';
        }
      });
  }
}
