import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

import { PolicySetupService } from '../../../services/policy-setup.service';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { AuthService } from '../../../auth/auth.service';
import { MemberService } from '../../../services/member.service';
import { PolicySetupRequest, PremiumFrequency, DependentInput, NomineeInput, PolicySetupResponse } from '../../../models/policy-setup.model';

@Component({
  selector: 'app-policy-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './policy-setup.component.html',
  styleUrls: ['./policy-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class PolicySetupComponent implements OnInit, OnDestroy {
  private policySetupService = inject(PolicySetupService);
  private planService = inject(PlanService);
  private authService = inject(AuthService);
  private memberService = inject(MemberService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  selectedPlan: PublicPlan | null = null;
  currentStep = 1;
  totalSteps = 3;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  premiumCalculation: any = null;
  selectedFrequency: PremiumFrequency = 'YEARLY';
  appliedCoupon = '';
  isCouponValid = false;
  couponError = '';

  policySetupResponse: PolicySetupResponse | null = null;
  isProcessingPayment = false;

  relationshipOptions = [
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'Parent', label: 'Parent' }
  ];

  genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];

  frequencyOptions: { value: PremiumFrequency; label: string; discount: number }[] = [
    { value: 'MONTHLY', label: 'Monthly', discount: 0 },
    { value: 'QUARTERLY', label: 'Quarterly', discount: 3 },
    { value: 'HALF_YEARLY', label: 'Half Yearly', discount: 8 },
    { value: 'YEARLY', label: 'Yearly', discount: 12 }
  ];

  // Form groups
  mainForm: FormGroup = this.fb.group({
    dependents: this.fb.array([]),
    nominees: this.fb.array([])
  });

  get dependentsFormArray(): FormArray {
    return this.mainForm.get('dependents') as FormArray;
  }

  get nomineesFormArray(): FormArray {
    return this.mainForm.get('nominees') as FormArray;
  }

  ngOnInit(): void {
    this.loadSelectedPlan();
  }

  ngOnDestroy(): void {
    // Don't clear selected plan ID until payment is complete
    if (this.policySetupResponse) {
      this.authService.clearSelectedPlanId();
    }
  }

  private loadSelectedPlan(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    // Method 1: Check URL query params
    let planId = this.route.snapshot.queryParams['planId'];

    // Method 2: Check localStorage/sessionStorage
    if (!planId) {
      planId = this.authService.getSelectedPlanId();
    }

    // Method 3: Check if user already has an active plan assigned from member profile
    if (!planId) {
      console.log('[PolicySetup] No plan ID in storage, checking user profile for assigned plan');
      this.memberService.getDashboard().subscribe({
        next: (memberData) => {
          console.log('[PolicySetup] Member data:', memberData);

          if (memberData.activePlan && memberData.activePlan.id) {
            // User already has a plan assigned to their profile
            planId = memberData.activePlan.id;
            console.log('[PolicySetup] Found assigned plan from profile:', planId);
            this.loadPlanDetails(planId);
          } else {
            // No plan found anywhere - redirect to plans page
            console.error('[PolicySetup] No plan selected and no assigned plan found');
            this.errorMessage = 'No plan selected. Please choose a plan first.';
            this.isLoading = false;
            this.cdr.markForCheck();
            setTimeout(() => {
              this.router.navigate(['/plans']);
            }, 2000);
          }
        },
        error: (error) => {
          console.error('[PolicySetup] Failed to fetch member profile:', error);
          this.errorMessage = 'Unable to load your profile. Please try again.';
          this.isLoading = false;
          this.cdr.markForCheck();
          setTimeout(() => {
            this.router.navigate(['/plans']);
          }, 2000);
        }
      });
      return;
    }

    // Plan ID found in storage
    this.loadPlanDetails(planId);
  }

  private loadPlanDetails(planId: string): void {
    console.log('[PolicySetup] Loading plan details for ID:', planId);

    this.planService.getPlanById(planId).subscribe({
      next: (plan) => {
        console.log('[PolicySetup] Plan loaded:', plan);
        this.selectedPlan = plan;
        this.calculatePremium();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[PolicySetup] Failed to load plan:', error);
        this.errorMessage = 'Failed to load plan details. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.router.navigate(['/plans']);
        }, 2000);
      }
    });
  }

  calculatePremium(): void {
    if (!this.selectedPlan) return;

    const dependentCount = this.dependentsFormArray.length;
    const couponCode = this.isCouponValid ? this.appliedCoupon : undefined;

    this.policySetupService.calculatePremiumPreview(
      this.selectedPlan,
      dependentCount,
      this.selectedFrequency,
      couponCode
    ).subscribe({
      next: (calculation) => {
        this.premiumCalculation = calculation;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Premium calculation failed:', error);
      }
    });
  }

  createDependentGroup(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      relationship: ['', Validators.required],
      dateOfBirth: ['', [Validators.required, this.validateAge]],
      gender: ['MALE', Validators.required]
    });
  }

  createNomineeGroup(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      relationship: ['', Validators.required],
      percentageAllocation: [0, [Validators.required, Validators.min(1), Validators.max(100)]],
      guardianName: [''],
      isPrimary: [false]
    });
  }

  // Helper to access controls from template when iterating form arrays
  getControl(group: AbstractControl, key: string): FormControl {
    return ((group as FormGroup).get(key) as FormControl)!;
  }

  // Ensure only one nominee is marked primary
  onPrimaryNomineeChange(selectedIndex: number): void {
    for (let i = 0; i < this.nomineesFormArray.length; i++) {
      const ctrl = this.nomineesFormArray.at(i);
      ctrl.patchValue({ isPrimary: i === selectedIndex });
    }
  }

  validateAge(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const birthDate = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 0 || age > 120) {
      return { invalidAge: true };
    }
    return null;
  }

  addDependent(): void {
    const maxDependents = (this.selectedPlan as any).maxDependentsAllowed || 4;
    if (this.dependentsFormArray.length >= maxDependents) {
      this.errorMessage = `Maximum ${maxDependents} dependents allowed`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.dependentsFormArray.push(this.createDependentGroup());
    this.calculatePremium();
  }

  removeDependent(index: number): void {
    this.dependentsFormArray.removeAt(index);
    this.calculatePremium();
  }

  addNominee(): void {
    const maxNominees = (this.selectedPlan as any).maxNomineesAllowed || 3;
    if (this.nomineesFormArray.length >= maxNominees) {
      this.errorMessage = `Maximum ${maxNominees} nominees allowed`;
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const totalAllocation = this.getTotalAllocation();
    const remainingPercentage = 100 - totalAllocation;

    const nomineeGroup = this.createNomineeGroup();
    nomineeGroup.patchValue({
      percentageAllocation: Math.min(remainingPercentage, 100),
      isPrimary: this.nomineesFormArray.length === 0
    });

    this.nomineesFormArray.push(nomineeGroup);
    this.calculatePremium();
  }

  removeNominee(index: number): void {
    this.nomineesFormArray.removeAt(index);
    if (this.nomineesFormArray.length > 0 && !this.hasPrimaryNominee()) {
      this.nomineesFormArray.at(0).patchValue({ isPrimary: true });
    }
    this.calculatePremium();
  }

  getTotalAllocation(): number {
    let total = 0;
    for (let i = 0; i < this.nomineesFormArray.length; i++) {
      const allocation = this.nomineesFormArray.at(i).get('percentageAllocation')?.value || 0;
      total += allocation;
    }
    return total;
  }

  hasPrimaryNominee(): boolean {
    for (let i = 0; i < this.nomineesFormArray.length; i++) {
      if (this.nomineesFormArray.at(i).get('isPrimary')?.value) {
        return true;
      }
    }
    return false;
  }

  validateNomineeAllocation(): boolean {
    if (this.nomineesFormArray.length === 0) {
      this.errorMessage = 'Please add at least one nominee';
      return false;
    }

    const total = this.getTotalAllocation();
    if (total !== 100) {
      this.errorMessage = `Total nominee allocation must be 100%. Current: ${total}%`;
      return false;
    }

    if (!this.hasPrimaryNominee()) {
      this.errorMessage = 'Please select one primary nominee';
      return false;
    }

    return true;
  }

  applyCoupon(): void {
    if (!this.appliedCoupon) {
      this.couponError = 'Please enter a coupon code';
      return;
    }

    const validCoupons = ['WELCOME20', 'FIRST10', 'HEALTH15'];
    if (validCoupons.includes(this.appliedCoupon.toUpperCase())) {
      this.isCouponValid = true;
      this.couponError = '';
      this.calculatePremium();
    } else {
      this.isCouponValid = false;
      this.couponError = 'Invalid coupon code';
    }
  }

  removeCoupon(): void {
    this.appliedCoupon = '';
    this.isCouponValid = false;
    this.couponError = '';
    this.calculatePremium();
  }

  selectFrequency(frequency: PremiumFrequency): void {
    this.selectedFrequency = frequency;
    this.calculatePremium();
  }

  validateStep1(): boolean {
    if (!this.selectedPlan) {
      this.errorMessage = 'No plan selected';
      return false;
    }
    return true;
  }

  validateStep2(): boolean {
    if (!this.validateNomineeAllocation()) {
      return false;
    }

    for (let i = 0; i < this.dependentsFormArray.length; i++) {
      const dependent = this.dependentsFormArray.at(i);
      if (dependent.invalid) {
        this.errorMessage = `Please fill all required fields for dependent ${i + 1}`;
        return false;
      }
    }

    for (let i = 0; i < this.nomineesFormArray.length; i++) {
      const nominee = this.nomineesFormArray.at(i);
      if (nominee.invalid) {
        this.errorMessage = `Please fill all required fields for nominee ${i + 1}`;
        return false;
      }
    }

    return true;
  }

  nextStep(): void {
    this.errorMessage = '';

    if (this.currentStep === 1) {
      if (this.validateStep1()) {
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (this.currentStep === 2) {
      if (this.validateStep2()) {
        this.currentStep = 3;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  processPayment(): void {
    if (!this.selectedPlan || !this.premiumCalculation) return;

    this.isProcessingPayment = true;
    this.errorMessage = '';

    const dependents: DependentInput[] = this.dependentsFormArray.value.map((dep: any) => ({
      fullName: dep.fullName,
      relationship: dep.relationship,
      dateOfBirth: new Date(dep.dateOfBirth).toISOString(),
      gender: dep.gender
    }));

    const nominees: NomineeInput[] = this.nomineesFormArray.value.map((nom: any) => ({
      fullName: nom.fullName,
      relationship: nom.relationship,
      percentageAllocation: Number(nom.percentageAllocation),
      guardianName: nom.guardianName || null,
      isPrimary: nom.isPrimary
    }));

    const request: PolicySetupRequest = {
      planId: this.selectedPlan.planId,
      premiumFrequency: this.selectedFrequency,
      couponCode: this.isCouponValid ? this.appliedCoupon.toUpperCase() : null,
      dependents,
      nominees
    };

    this.policySetupService.setupPolicyWithPayment(request).subscribe({
      next: (response) => {
        this.policySetupResponse = response;
        this.authService.clearSelectedPlanId();
        this.successMessage = `Policy ${response.policy.policyNumber} created successfully! Redirecting to dashboard...`;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.isProcessingPayment = false;
          this.cdr.markForCheck();
          this.router.navigate(['/app/dashboard'], {
            queryParams: {
              policyCreated: true,
              policyNumber: response.policy.policyNumber
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Payment processing failed:', error);
        this.errorMessage = error.error?.message || error.error?.error || 'Payment processing failed. Please try again.';
        this.isProcessingPayment = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
