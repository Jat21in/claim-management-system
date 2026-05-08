import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from './member.service';

@Component({
  selector: 'app-member-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-profile.component.html'
})
export class MemberProfileComponent {

  model = {
    fullName: '',
    dateOfBirth: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    contactNumber: ''
  };

  success = '';
  error = '';

  constructor(private memberService: MemberService) {}

  save() {
    this.memberService.updateProfile(this.model).subscribe({
      next: () => {
        this.success = 'Profile updated successfully';
        this.error = '';
      },
      error: err =>
        this.error = err?.error?.message || 'Failed to update profile'
    });
  }
}
