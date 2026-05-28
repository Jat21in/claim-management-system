import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MemberService } from '../../../services/member.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
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
  maxDate = new Date().toISOString().split('T')[0];
  memberSince = '';

  // Profile completion tracking
  profileCompletion = 0;
  hasFullName = false;
  hasEmail = false;
  hasDateOfBirth = false;
  hasContact = false;
  hasAddress = false;

  form = this.fb.group({
    fullName: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    dateOfBirth: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['', Validators.required],
    postalCode: ['', Validators.required],
    contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.memberService.getDashboard()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.form.patchValue({
            fullName: res.fullName,
            email: res.email
          });

          // Store member since date
          this.memberSince = new Date().toISOString().split('T')[0];

          this.updateProfileCompletion();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Failed to load profile';
          this.cdr.markForCheck();
        }
      });
  }

  private updateProfileCompletion(): void {
    const formValue = this.form.value;

    this.hasFullName = !!formValue.fullName && formValue.fullName.trim().length > 0;
    this.hasEmail = !!formValue.email && formValue.email.trim().length > 0;
    this.hasDateOfBirth = !!formValue.dateOfBirth;
    this.hasContact = !!formValue.contactNumber && formValue.contactNumber.trim().length >= 10;
    this.hasAddress = !!(formValue.street && formValue.city && formValue.state &&
                        formValue.country && formValue.postalCode);

    let completedCount = 0;
    if (this.hasFullName) completedCount++;
    if (this.hasEmail) completedCount++;
    if (this.hasDateOfBirth) completedCount++;
    if (this.hasContact) completedCount++;
    if (this.hasAddress) completedCount++;

    this.profileCompletion = Math.round((completedCount / 5) * 100);
  }

  getInitials(): string {
    const fullName = this.form.get('fullName')?.value || '';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  getMemberSince(): string {
    return this.memberSince || '2024';
  }

  get isProfileComplete(): boolean {
    return this.profileCompletion === 100;
  }

  resetForm(): void {
    this.loadProfile();
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;
    this.cdr.markForCheck();

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
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.success = 'Profile updated successfully!';
          this.updateProfileCompletion();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.success = null;
            this.cdr.markForCheck();
          }, 3000);
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Failed to update profile';
          this.cdr.markForCheck();
        }
      });
  }
}
