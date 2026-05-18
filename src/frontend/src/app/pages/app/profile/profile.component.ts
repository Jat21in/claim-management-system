import {
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { MemberService } from '../../../services/member.service';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private memberService = inject(MemberService);

  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  // ✅ FORM
  form = this.fb.group({
    fullName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],

    dateOfBirth: ['', Validators.required],

    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    postalCode: ['', Validators.required],

    contactNumber: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
  this.loading = true;

  this.memberService.getDashboard()
    .pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck(); // ✅ ensure UI refresh after loading flag change
      })
    )
    .subscribe({
      next: (res) => {
        this.form.patchValue({
          fullName: res.fullName,
          email: res.email
        });

        // ✅ IMPORTANT: trigger UI update AFTER patch
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load profile';

        this.cdr.markForCheck();
      }
    });
}

  submit(): void {
  if (this.form.invalid || this.saving) {
    this.form.markAllAsTouched();
    return;
  }

  this.saving = true;
  this.error = null;
  this.success = null;

  const payload = {
    street: this.form.value.street!,
    city: this.form.value.city!,
    state: this.form.value.state!,
    country: this.form.value.country!,
    postalCode: this.form.value.postalCode!,
    contactNumber: this.form.value.contactNumber!,
    dateOfBirth: new Date(this.form.value.dateOfBirth!).toISOString()
  };

  this.memberService.updateProfile(payload)
    .pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck(); // ✅ ensures UI updates
      })
    )
    .subscribe({
      next: () => {
        this.success = 'Profile updated successfully ✅';

        // ✅ FORCE UI REFRESH
        this.cdr.detectChanges();

        // ✅ OPTIONAL: auto-hide after 3s
        setTimeout(() => {
          this.success = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        this.error =
          err?.error?.message ?? 'Failed to update profile';

        this.cdr.markForCheck();
      }
    });
}
}
