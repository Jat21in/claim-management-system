import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ClaimService } from '../../../services/claim.service';
import { Claim } from '../../../claims/models/claim.model';

type SortOption = 'latest' | 'oldest' | 'amount-desc' | 'amount-asc';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.scss']
})
export class ClaimsComponent implements OnInit {

  private readonly claimService = inject(ClaimService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;

  claims: Claim[] = [];
  sortedClaims: Claim[] = [];

  sortBy: SortOption = 'latest';

  ngOnInit(): void {
    this.fetchClaims();
    this.claimService.refreshClaims$.subscribe(() => this.fetchClaims());
  }

  private fetchClaims(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.claimService.getMyClaims()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (claims: Claim[]) => {
          this.claims = claims;
          this.applySort();
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Failed to load claims';
          this.cdr.markForCheck();
        }
      });
  }

  applySort(): void {
    const data = [...this.claims];
    switch (this.sortBy) {
      case 'latest':
        this.sortedClaims = data.sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime());
        break;
      case 'oldest':
        this.sortedClaims = data.sort((a, b) => new Date(a.claimDate).getTime() - new Date(b.claimDate).getTime());
        break;
      case 'amount-desc':
        this.sortedClaims = data.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        this.sortedClaims = data.sort((a, b) => a.amount - b.amount);
        break;
    }
  }

  onSortChange(value: SortOption): void {
    this.sortBy = value;
    this.applySort();
    this.cdr.markForCheck();
  }
}
