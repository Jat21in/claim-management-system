import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { ClaimService } from '../../../services/claim.service';
import { Claim } from '../../../claims/models/claim.model';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './claims.component.html'
})
export class ClaimsComponent implements OnInit {

  private readonly claimService = inject(ClaimService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;
  claims: Claim[] = [];

  ngOnInit(): void {
    // ✅ initial load
    this.fetchClaims();

    // ✅ refresh when a claim is submitted
    this.claimService.refreshClaims$
      .subscribe(() => {
        this.fetchClaims();
      });
  }

  private fetchClaims(): void {
    this.loading = true;
    this.error = null;

    // ✅ ensure loader renders immediately
    this.cdr.markForCheck();

    this.claimService.getMyClaims()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (claims: Claim[]) => {
          this.claims = claims;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Failed to load claims';
          this.cdr.markForCheck();
        }
      });
  }
}
