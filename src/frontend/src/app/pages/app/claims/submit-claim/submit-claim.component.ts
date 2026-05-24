import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { ClaimService } from '../../../../services/claim.service';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './submit-claim.component.html',
  styleUrls: ['./submit-claim.component.scss'],
})
export class SubmitClaimComponent {
  private fb = inject(FormBuilder);
  private claimService = inject(ClaimService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;
  success: string | null = null;

  form = this.fb.group({
    claimDate:   ['', Validators.required],
    amount:      [null, [Validators.required, Validators.min(1)]],
    description: [''],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedDate = new Date(this.form.value.claimDate!);
    if (selectedDate > new Date()) {
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
          this.success = 'Claim submitted successfully';
          this.claimService.triggerRefresh();
          setTimeout(() => {
            this.router.navigate(['/app/claims'], { replaceUrl: true });
          }, 1200);
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to submit claim';
        },
      });
  }
}
