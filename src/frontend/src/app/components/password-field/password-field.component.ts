import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { getPasswordStrength } from '../../utils/password-strength';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './password-field.component.html'
})
export class PasswordFieldComponent {

  @Input({ required: true })
  control!: FormControl;

  showPassword = false;

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get type(): 'text' | 'password' {
    return this.showPassword ? 'text' : 'password';
  }

  get strength() {
    return getPasswordStrength(this.control.value ?? '');
  }
}
