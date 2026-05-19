import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobeComponent } from '../globe/globe.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, GlobeComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  isSuccess = false;

  async submit() {
    if (!this.formData.email.includes('@')) {
      alert('Invalid email');
      return;
    }

    this.isSubmitting = true;

    try {
      const res = await fetch('https://localhost:7013/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formData)
      });

      if (!res.ok) throw new Error('Failed');

      this.isSuccess = true;
      this.formData = { name: '', email: '', subject: '', message: '' };

    } catch {
      alert('Something went wrong');
    }

    this.isSubmitting = false;
  }
}
