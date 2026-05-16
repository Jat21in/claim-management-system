import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService, MemberDashboardResponse } from '../../../services/member.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ important
})
export class DashboardComponent implements OnInit {
  private memberService = inject(MemberService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error: string | null = null;
  data!: MemberDashboardResponse;

  ngOnInit(): void {
    this.memberService.getDashboard().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;

        // ✅ single, explicit, controlled CD
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load dashboard';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
