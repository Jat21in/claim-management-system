import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

import { ClaimService } from '../../services/claim.service';
import { Claim } from '../models/claim.model';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './claims-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush // ✅ IMPORTANT
})
export class ClaimsListComponent implements OnInit {

  claims: Claim[] = [];
  loading = true;

  constructor(
    private claimService: ClaimService,
    private cdr: ChangeDetectorRef // ✅ Inject CD
  ) {}

  ngOnInit(): void {
    this.loadClaims();

    this.claimService.refreshClaims$
      .subscribe(() => {
        this.loadClaims();
      });
  }

  private loadClaims(): void {
    this.loading = true;
    this.cdr.markForCheck(); // ✅ trigger UI update for loader

    this.claimService.getMyClaims()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck(); // ✅ ensure loader hides
        })
      )
      .subscribe({
        next: (res) => {
          this.claims = res;

          // ✅ CRITICAL FIX: tell Angular data is ready
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load claims', err);
          this.cdr.markForCheck();
        }
      });
  }
}
