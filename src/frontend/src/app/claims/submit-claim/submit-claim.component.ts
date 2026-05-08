import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { Router } from '@angular/router';
import { ClaimService } from '../../services/claim.service';

@Component({
  selector: 'app-submit-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-claim.component.html'
})
export class SubmitClaimComponent {

  loading = false;
  error = '';
  claimForm!: FormGroup; // ✅ definite assignment

  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ Form initialized AFTER fb exists
    this.claimForm = this.fb.group({
      claimDate: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  submit() {
    if (this.claimForm.invalid || this.loading) return;

    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.claimService.submitClaim(this.claimForm.value).subscribe({
      next: () => {
        this.claimService.triggerRefresh(); // ✅ refresh claims list
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/claims']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to submit claim. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
