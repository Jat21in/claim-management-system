import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MemberService, ProfileResponse } from '../../../services/member.service';
import { environment } from '../../../../environments/environment';

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
  isUploading = false;
  error: string | null = null;
  success: string | null = null;
  maxDate = new Date().toISOString().split('T')[0];
  memberSince = '';

  // Photo upload
  profilePhoto: string | null = null;
  photoFile: File | null = null;
  photoPreview: string | null = null;

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

    this.memberService.getMyProfile()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: ProfileResponse) => {
          this.form.patchValue({
            fullName: res.fullName,
            email: res.email,
            dateOfBirth: res.dateOfBirth ? new Date(res.dateOfBirth).toISOString().split('T')[0] : '',
            contactNumber: res.phoneNumber || '',
            street: res.address?.street || '',
            city: res.address?.city || '',
            state: res.address?.state || '',
            country: res.address?.country || '',
            postalCode: res.address?.postalCode || ''
          });

          // ✅ Load profile photo with FULL URL
          if (res.profilePhotoUrl) {
            this.profilePhoto = `${environment.uploadBaseUrl}${res.profilePhotoUrl}`;
          } else {
            this.profilePhoto = null;
          }
          
          this.memberSince = new Date().toISOString().split('T')[0];

          this.updateProfileCompletion();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to load profile';
          this.cdr.markForCheck();
        }
      });
  }

  // ✅ PHOTO UPLOAD METHODS
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'File size cannot exceed 5MB';
        this.cdr.markForCheck();
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        this.error = 'Invalid file format. Allowed: JPG, PNG, GIF, WEBP';
        this.cdr.markForCheck();
        return;
      }

      this.photoFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto(): void {
    if (!this.photoFile) return;

    this.isUploading = true;
    this.error = '';
    this.success = '';
    this.cdr.markForCheck();

    this.memberService.uploadProfilePhoto(this.photoFile).subscribe({
      next: (response: { photoUrl: string; message: string }) => {
        this.isUploading = false;
        // ✅ Use FULL URL for the photo
        this.profilePhoto = `${environment.uploadBaseUrl}${response.photoUrl}`;
        this.photoPreview = null;
        this.photoFile = null;
        this.success = 'Profile photo updated successfully!';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.success = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err: any) => {
        this.isUploading = false;
        this.error = err?.error?.message || 'Failed to upload photo.';
        this.cdr.markForCheck();
      }
    });
  }

  removePhoto(): void {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.memberService.removeProfilePhoto().subscribe({
      next: () => {
        this.profilePhoto = null;
        this.photoPreview = null;
        this.loading = false;
        this.success = 'Profile photo removed.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.success = null;
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to remove photo.';
        this.cdr.markForCheck();
      }
    });
  }

  cancelPhotoUpload(): void {
    this.photoPreview = null;
    this.photoFile = null;
    this.cdr.markForCheck();
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
        error: (err: any) => {
          this.error = err?.error?.message ?? 'Failed to update profile';
          this.cdr.markForCheck();
        }
      });
  }
}