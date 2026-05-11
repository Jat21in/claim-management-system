import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {

  form!: FormGroup;
  selectedPlanId?: string;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // ✅ Read planId from query params
    this.selectedPlanId =
      this.route.snapshot.queryParamMap.get('planId') ?? undefined;

    console.log('[Register] Selected planId:', this.selectedPlanId);

    // ✅ Initialize reactive form
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      fullName: this.form.value.fullName,
      email: this.form.value.email,
      password: this.form.value.password,

      // ✅ VERY IMPORTANT
      selectedPlanId: this.selectedPlanId
    };

    console.log('[Register] Submitting payload:', payload);

    // 🔜 call register API here
  }
}
