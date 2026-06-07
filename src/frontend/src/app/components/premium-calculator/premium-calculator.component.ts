import { Component, Input, OnChanges, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { PremiumCalculatorService, PremiumCalculationResult } from '../../services/premium-calculator.service';

@Component({
  selector: 'app-premium-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './premium-calculator.component.html',
  styleUrls: ['./premium-calculator.component.scss'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class PremiumCalculatorComponent implements OnInit, OnChanges {
  @Input() planId!: string;
  @Input() planName!: string;
  @Input() coverageAmount!: number;
  @Output() premiumCalculated = new EventEmitter<{ result: PremiumCalculationResult; factors: any }>();

  isLoading = false;
  calculationResult: PremiumCalculationResult | null = null;
  showAdvanced = false;
  showBreakdown = false;

  // Simple inputs (always visible)
  age = 30;
  isSmoker = false;
  hasPED = false;
  pinCode = '400001';

  // Advanced inputs (collapsible)
  spouseCount = 0;
  childCount = 0;
  parentCount = 0;
  seniorParentCount = 0;
  hasNoClaimBonus = false;
  noClaimBonusYears = 0;
  corporateCode = '';
  couponCode = '';

  selectedFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' = 'YEARLY';
  frequencyOptions: Array<{ value: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'; label: string }> = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'HALF_YEARLY', label: 'Half Yearly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  constructor(private premiumService: PremiumCalculatorService) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    const planIdChange = changes['planId'];
    if (planIdChange && planIdChange.currentValue) {
      this.calculatePremium();
    }
  }

  getTotalDependents(): number {
    return this.spouseCount + this.childCount + this.parentCount + this.seniorParentCount;
  }

  getDependentAgeGroups(): Record<string, number> {
    const groups: Record<string, number> = {};
    if (this.spouseCount > 0) groups['Spouse'] = this.spouseCount;
    if (this.childCount > 0) groups['Child'] = this.childCount;
    if (this.parentCount > 0) groups['Parent'] = this.parentCount;
    if (this.seniorParentCount > 0) groups['SeniorParent'] = this.seniorParentCount;
    return groups;
  }

  changeDependentCount(countName: 'spouseCount' | 'childCount' | 'parentCount' | 'seniorParentCount', delta: number) {
    this[countName] = Math.max(0, (this[countName] as number) + delta);
    this.calculatePremium();
  }

  calculatePremium() {
    if (!this.planId) return;

    this.isLoading = true;

    const request = {
      planId: this.planId,
      memberAge: this.age,
      isSmoker: this.isSmoker,
      hasPreExistingCondition: this.hasPED,
      pinCode: this.pinCode || '400001',
      dependentCount: this.getTotalDependents(),
      dependentAgeGroups: this.getDependentAgeGroups(),
      premiumFrequency: this.selectedFrequency,
      couponCode: this.couponCode || undefined,
      hasNoClaimBonus: this.hasNoClaimBonus,
      noClaimBonusYears: this.noClaimBonusYears,
      corporateCode: this.corporateCode || undefined
    };

    this.premiumService.calculatePremium(request).subscribe({
      next: (result) => {
        this.calculationResult = result;
        this.isLoading = false;
        this.premiumCalculated.emit({ result, factors: request });
      },
      error: (error) => {
        console.error('Premium calculation failed:', error);
        this.setFallbackCalculation();
        this.premiumCalculated.emit({ result: this.calculationResult!, factors: request });
      }
    });
  }

  private setFallbackCalculation() {
    let basePremium = 45000;

    if (this.coverageAmount === 300000) basePremium = 25000;
    else if (this.coverageAmount === 500000) basePremium = 45000;
    else if (this.coverageAmount === 750000) basePremium = 65000;
    else if (this.coverageAmount === 1000000) basePremium = 85000;

    const dependentLoadingPercent = 25;
    const dependentLoading = this.getTotalDependents() * (basePremium * dependentLoadingPercent / 100);
    let subtotal = basePremium + dependentLoading;

    if (this.isSmoker) {
      subtotal += basePremium * 0.25;
    }

    if (this.hasPED) {
      subtotal += basePremium * 0.30;
    }

    const frequencyDiscount = subtotal * 0.12;
    let afterDiscount = subtotal - frequencyDiscount;

    if (this.hasNoClaimBonus) {
      const ncbDiscount = afterDiscount * Math.min(this.noClaimBonusYears * 0.05, 0.25);
      afterDiscount -= ncbDiscount;
    }

    if (this.couponCode === 'WELCOME20') {
      afterDiscount *= 0.8;
    } else if (this.couponCode === 'FAMILY25') {
      afterDiscount *= 0.75;
    } else if (this.couponCode === 'HEALTH15') {
      afterDiscount *= 0.85;
    }

    const taxAmount = afterDiscount * 0.18;
    const grandTotal = afterDiscount + taxAmount;

    this.calculationResult = {
      basePremium: basePremium,
      ageLoading: 0,
      smokerLoading: this.isSmoker ? basePremium * 0.25 : 0,
      preExistingLoading: this.hasPED ? basePremium * 0.30 : 0,
      locationMultiplier: 1,
      dependentLoading: dependentLoading,
      subTotal: subtotal,
      noClaimBonusDiscount: this.hasNoClaimBonus ? (subtotal * 0.1) : 0,
      frequencyDiscount: frequencyDiscount,
      corporateDiscount: 0,
      couponDiscount: afterDiscount * (this.couponCode ? 0.2 : 0),
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      availableFrequencies: {
        MONTHLY: grandTotal / 12,
        QUARTERLY: grandTotal / 4,
        HALF_YEARLY: grandTotal / 2,
        YEARLY: grandTotal
      },
      breakdownItems: []
    };
    this.isLoading = false;
  }

  selectFrequency(frequency: typeof this.selectedFrequency) {
    this.selectedFrequency = frequency;
    this.calculatePremium();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getMonthlyAmount(): number {
    if (!this.calculationResult) return 0;
    return this.calculationResult.grandTotal / 12;
  }
}
