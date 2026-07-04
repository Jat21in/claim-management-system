import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';

import {
  PlanService,
  PublicPlan
} from '../../../services/plan.service';

import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes
} from '@angular/animations';

import { AuthService } from '../../../auth/auth.service';
import { PremiumCalculatorComponent } from '../../../components/premium-calculator/premium-calculator.component';
import { PremiumCalculationResult } from '../../../services/premium-calculator.service';

import Chart from 'chart.js/auto';
import type { Chart as ChartJS } from 'chart.js';
import { FooterComponent } from '../landing/components/footer/footer.component';

interface PlanDetail {
  coverageAmount: number;
  basePremiumAnnual: number;
  dependentLoadingPercentage: number;
  maxDependentsAllowed: number;
  maxNomineesAllowed: number;
  ageLoadingPercentage: number;
  corporateDiscountPercentage: number;
  isFamilyFloater: boolean;
  locationRiskMultiplier: number;
  preExistingConditionLoading: number;
  smokerLoadingPercentage: number;
  hospitalNetwork: number;
  claimSettlementRatio: number;
  networkHospitals: number;
  ambulanceCover: number;
  preExistingWaiting: number;
  noClaimBonus: number;
  healthCheckup: boolean;
  maternityCover: boolean;
  ayushCover: boolean;
  mentalHealthCover: boolean;
  organDonorCover: boolean;
  dailyHospitalCash: number;
  roomRentLimit: string;
  icuCover: string;
  coverageUtilization: number;
  customerSatisfaction: number;
  renewalRate: number;
  doctorConsultations: string;
  hospitalization: string;
  emergencyCare: string;
  familyCoverage: string;
  cashlessHospitals: string;
  claimSettlement: string;
  noClaimBonusLabel: string;
}

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, PremiumCalculatorComponent, FooterComponent],
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ])
    ]),

    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '600ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ]),

    trigger('staggerCards', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('100ms', [
              animate(
                '500ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            ])
          ],
          { optional: true }
        )
      ])
    ]),

    trigger('pulse', [
      transition('* => *', [
        animate(
          '1s ease-in-out',
          keyframes([
            style({ transform: 'scale(1)', offset: 0 }),
            style({ transform: 'scale(1.05)', offset: 0.5 }),
            style({ transform: 'scale(1)', offset: 1 })
          ])
        )
      ])
    ]),

    trigger('progressFill', [
      transition(
        ':enter',
        [
          style({ width: '0%' }),
          animate('1s ease-out', style({ width: '{{width}}%' }))
        ],
        { params: { width: 0 } }
      )
    ])
  ]
})
export class PlanDetailComponent implements OnInit, AfterViewInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private planService = inject(PlanService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('claimsChart') claimsChartRef!: ElementRef;
  @ViewChild('satisfactionChart') satisfactionChartRef!: ElementRef;

  currentPlan: PublicPlan | null = null;

  activeTab:
    | 'overview'
    | 'coverage'
    | 'analytics'
    | 'exclusions'
    | 'addons' = 'overview';

  billingCycle: 'monthly' | 'yearly' = 'monthly';

  isLoading = true;
  error: string | null = null;
  errorMessage = '';

  selectedYear = 2024;
  planId: string | null = null;
  savedHealthFactors: any = null;

  // Chart instances
  private claimsChart: ChartJS | null = null;
  private satisfactionChart: ChartJS | null = null;

  // Workflow steps
  workflowSteps = [
    {
      step: 1,
      title: 'Select Plan',
      description: 'Choose your coverage',
      completed: true,
      active: false
    },
    {
      step: 2,
      title: 'Complete KYC',
      description: 'Verify identity',
      completed: false,
      active: false
    },
    {
      step: 3,
      title: 'Make Payment',
      description: 'First premium',
      completed: false,
      active: false
    },
    {
      step: 4,
      title: 'Policy Active',
      description: 'Coverage starts',
      completed: false,
      active: false
    }
  ];

  // Historical claims data
  claimsHistory = [
    { month: 'Jan', amount: 1250000, count: 45 },
    { month: 'Feb', amount: 1380000, count: 52 },
    { month: 'Mar', amount: 1420000, count: 58 },
    { month: 'Apr', amount: 1580000, count: 62 },
    { month: 'May', amount: 1650000, count: 68 },
    { month: 'Jun', amount: 1720000, count: 75 }
  ];

  planDetails: Record<string, PlanDetail> = {

    'Essential Care Plan': {
      coverageAmount: 300000,
      basePremiumAnnual: 25000,
      dependentLoadingPercentage: 15,
      maxDependentsAllowed: 2,
      maxNomineesAllowed: 2,
      ageLoadingPercentage: 10,
      corporateDiscountPercentage: 5,
      isFamilyFloater: false,
      locationRiskMultiplier: 1.0,
      preExistingConditionLoading: 20,
      smokerLoadingPercentage: 15,
      hospitalNetwork: 2500,
      claimSettlementRatio: 92,
      networkHospitals: 2500,
      ambulanceCover: 2000,
      preExistingWaiting: 48,
      noClaimBonus: 10,
      healthCheckup: true,
      maternityCover: false,
      ayushCover: false,
      mentalHealthCover: true,
      organDonorCover: false,
      dailyHospitalCash: 1000,
      roomRentLimit: 'Shared Ward',
      icuCover: 'Up to 7 days',
      coverageUtilization: 68,
      customerSatisfaction: 4.2,
      renewalRate: 85,
      doctorConsultations: 'Basic',
      hospitalization: 'Standard',
      emergencyCare: 'No',
      familyCoverage: 'Limited',
      cashlessHospitals: 'Network',
      claimSettlement: 'Standard',
      noClaimBonusLabel: 'No'
    },

    'Health Pro Plus': {
      coverageAmount: 500000,
      basePremiumAnnual: 45000,
      dependentLoadingPercentage: 25,
      maxDependentsAllowed: 4,
      maxNomineesAllowed: 3,
      ageLoadingPercentage: 15,
      corporateDiscountPercentage: 10,
      isFamilyFloater: true,
      locationRiskMultiplier: 1.0,
      preExistingConditionLoading: 30,
      smokerLoadingPercentage: 25,
      hospitalNetwork: 4500,
      claimSettlementRatio: 94,
      networkHospitals: 4500,
      ambulanceCover: 5000,
      preExistingWaiting: 36,
      noClaimBonus: 15,
      healthCheckup: true,
      maternityCover: true,
      ayushCover: false,
      mentalHealthCover: true,
      organDonorCover: false,
      dailyHospitalCash: 1800,
      roomRentLimit: 'Private Room',
      icuCover: 'Up to 5 days',
      coverageUtilization: 70,
      customerSatisfaction: 4.3,
      renewalRate: 88,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Standard',
      emergencyCare: 'Yes',
      familyCoverage: 'Standard',
      cashlessHospitals: 'Network',
      claimSettlement: 'Priority',
      noClaimBonusLabel: '5%/year'
    },

    'Advanced Care Plus Plan': {
      coverageAmount: 750000,
      basePremiumAnnual: 65000,
      dependentLoadingPercentage: 25,
      maxDependentsAllowed: 5,
      maxNomineesAllowed: 4,
      ageLoadingPercentage: 15,
      corporateDiscountPercentage: 10,
      isFamilyFloater: true,
      locationRiskMultiplier: 1.2,
      preExistingConditionLoading: 30,
      smokerLoadingPercentage: 25,
      hospitalNetwork: 5000,
      claimSettlementRatio: 95,
      networkHospitals: 5000,
      ambulanceCover: 5000,
      preExistingWaiting: 36,
      noClaimBonus: 15,
      healthCheckup: true,
      maternityCover: true,
      ayushCover: true,
      mentalHealthCover: true,
      organDonorCover: true,
      dailyHospitalCash: 2000,
      roomRentLimit: 'Private Room',
      icuCover: 'Full Coverage',
      coverageUtilization: 72,
      customerSatisfaction: 4.5,
      renewalRate: 88,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Enhanced',
      emergencyCare: 'Yes',
      familyCoverage: 'Extended',
      cashlessHospitals: 'Network +',
      claimSettlement: 'Priority',
      noClaimBonusLabel: '5%/year'
    },

    'Elite Family Protection Plan': {
      coverageAmount: 1000000,
      basePremiumAnnual: 85000,
      dependentLoadingPercentage: 20,
      maxDependentsAllowed: 6,
      maxNomineesAllowed: 5,
      ageLoadingPercentage: 12,
      corporateDiscountPercentage: 15,
      isFamilyFloater: true,
      locationRiskMultiplier: 1.15,
      preExistingConditionLoading: 25,
      smokerLoadingPercentage: 20,
      hospitalNetwork: 7500,
      claimSettlementRatio: 98,
      networkHospitals: 7500,
      ambulanceCover: 10000,
      preExistingWaiting: 24,
      noClaimBonus: 20,
      healthCheckup: true,
      maternityCover: true,
      ayushCover: true,
      mentalHealthCover: true,
      organDonorCover: true,
      dailyHospitalCash: 3000,
      roomRentLimit: 'Deluxe Private Room',
      icuCover: 'Full Coverage',
      coverageUtilization: 76,
      customerSatisfaction: 4.8,
      renewalRate: 92,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Premium',
      emergencyCare: 'Yes',
      familyCoverage: 'Complete',
      cashlessHospitals: 'All Network',
      claimSettlement: 'Fast-Track',
      noClaimBonusLabel: '5%/year'
    }
  };

  ngOnInit() {
    this.planId =
      this.route.snapshot.paramMap.get('planId') ||
      this.route.snapshot.params['id'];

    this.loadPlan();
    this.updateWorkflowStep(1);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 500);
  }

  loadPlan() {
  this.isLoading = true;
  this.error = null;

  // ✅ Get plan ID from route - try both param names
  let planId = this.route.snapshot.paramMap.get('planId') || 
               this.route.snapshot.params['id'] ||
               this.route.snapshot.queryParams['planId'];

  if (!planId) {
    this.error = 'Invalid plan ID';
    this.errorMessage = 'Invalid plan ID';
    this.isLoading = false;
    this.cdr.markForCheck();
    return;
  }

  this.planId = planId;
  console.log('[PlanDetail] Loading plan with ID:', this.planId);

  this.planService.getPlanById(planId).subscribe({
    next: (plan) => {
      this.currentPlan = plan;
      this.isLoading = false;
      console.log('[PlanDetail] Plan loaded:', plan.name);

      // ✅ Auto-store the plan when loaded
      if (this.planId) {
        this.authService.setSelectedPlan(this.planId, {
          planName: plan.name,
          insuredAmount: plan.insuredAmount,
          durationInMonths: plan.durationInMonths,
          features: plan.features
        });
        console.log('[PlanDetail] Plan auto-stored:', this.planId);
      }

      setTimeout(() => this.initCharts(), 300);
      this.cdr.markForCheck();
    },
    error: (err) => {
      console.error('Failed to load plan:', err);
      this.error = 'Failed to load plan details. Please try again.';
      this.errorMessage = 'Failed to load plan details';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  });
}

  private initCharts() {
    this.initClaimsChart();
    this.initSatisfactionChart();
  }

  private initClaimsChart() {

    if (!this.claimsChartRef?.nativeElement) return;

    const ctx =
      this.claimsChartRef.nativeElement.getContext('2d');

    if (this.claimsChart) {
      this.claimsChart.destroy();
    }

    this.claimsChart = new Chart(ctx, {

      type: 'line',

      data: {
        labels: this.claimsHistory.map(d => d.month),

        datasets: [
          {
            label: 'Claim Amount (₹ Lakhs)',
            data: this.claimsHistory.map(
              d => d.amount / 100000
            ),
            borderColor: '#22D3EE',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#22D3EE',
            pointBorderColor: '#0B1220',
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },

          {
            label: 'Number of Claims',
            data: this.claimsHistory.map(d => d.count),
            borderColor: '#A78BFA',
            backgroundColor: 'rgba(167, 139, 250, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#A78BFA',
            pointBorderColor: '#0B1220',
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#E5E7EB',
              font: { size: 11 }
            }
          },

          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#E5E7EB',
            bodyColor: '#9CA3AF',
            borderColor: '#22D3EE',
            borderWidth: 1
          }
        },

        scales: {
          y: {
            grid: { color: '#1F2937' },

            ticks: {
              color: '#9CA3AF',
              callback: (value: number | string) =>
                `₹${value}L`
            },

            title: {
              display: true,
              text: 'Claim Amount',
              color: '#9CA3AF'
            }
          },

          y1: {
            position: 'right',
            grid: { display: false },

            ticks: {
              color: '#A78BFA'
            },

            title: {
              display: true,
              text: 'Number of Claims',
              color: '#A78BFA'
            }
          },

          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF' }
          }
        }
      }
    });
  }

  private initSatisfactionChart() {

    if (!this.satisfactionChartRef?.nativeElement) return;

    const ctx =
      this.satisfactionChartRef.nativeElement.getContext('2d');

    if (this.satisfactionChart) {
      this.satisfactionChart.destroy();
    }

    const detail = this.getPlanDetail();

    this.satisfactionChart = new Chart(ctx, {

      type: 'doughnut',

      data: {
        labels: ['Excellent', 'Good', 'Average', 'Poor'],

        datasets: [
          {
            data: [65, 25, 8, 2],

            backgroundColor: [
              '#10B981',
              '#22D3EE',
              '#F59E0B',
              '#EF4444'
            ],

            borderWidth: 0,
            hoverOffset: 10
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom',

            labels: {
              color: '#E5E7EB',
              font: { size: 11 },
              padding: 15
            }
          },

          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#E5E7EB',
            bodyColor: '#9CA3AF'
          }
        }
      }
    });
  }

  getPlanDetail(): PlanDetail | null {

    if (!this.currentPlan) return null;

    return (
      this.planDetails[this.currentPlan.name] ||
      this.planDetails['Essential Care Plan']
    );
  }

  getBaseAnnual(): number {
    const detail = this.getPlanDetail();
    return detail ? detail.basePremiumAnnual : 0;
  }

  getBaseMonthly(): number {
    return Math.round(this.getBaseAnnual() / 12);
  }

  // Yearly price shown to user uses the same savings formula: monthly * 12 * 0.92
  getComputedYearly(): number {
    const monthly = this.getBaseMonthly();
    return Math.round(monthly * 12 * 0.92);
  }

  getGSTAnnual(): number {
    return Math.round(this.getComputedYearly() * 1.18);
  }

  getGSTMonthly(): number {
    return Math.round(this.getBaseMonthly() * 1.18);
  }

  getDependentAnnual(dependents = 1): number {
    const detail = this.getPlanDetail();
    if (!detail) return 0;
    return Math.round(
      detail.basePremiumAnnual *
        (1 + detail.dependentLoadingPercentage / 100)
    );
  }

  getDependentMonthly(dependents = 1): number {
    return Math.round(this.getDependentAnnual(dependents) / 12);
  }

  getCurrentPremium(): number {

    if (this.billingCycle === 'monthly') {
      return this.getBaseMonthly();
    }

    return this.getBaseAnnual();
  }

  getFormattedPremium(): string {

    const amount = this.getCurrentPremium();

    return this.formatCurrency(amount);
  }

  getSavingsPercentage(): number {
    const monthly = this.getBaseMonthly();
    const monthlyTotal = monthly * 12;
    const yearly = this.getComputedYearly();

    if (!monthlyTotal) return 0;

    return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
  }


  getCoveragePercentage(): number {

    const detail = this.getPlanDetail();

    if (!detail) return 0;

    return Math.min(
      100,
      Math.round((detail.coverageUtilization / 100) * 100)
    );
  }

  getPlanDetailValue(planName: string, key: string): any {
    const detail = this.planDetails[planName as keyof typeof this.planDetails];
    if (!detail) return null;
    return (detail as any)[key];
  }

  updateWorkflowStep(step: number) {

    this.workflowSteps.forEach((s, index) => {
      s.completed = index + 1 < step;
      s.active = index + 1 === step;
    });
  }

  buyNow(): void {
  console.log('[PlanDetail] buyNow called with planId:', this.planId);
  console.log('[PlanDetail] Current plan:', this.currentPlan?.name);

  // ✅ If planId is null, try to get it from storage
  let planId = this.planId;
  if (!planId) {
    planId = this.authService.getSelectedPlanId();
  }
  if (!planId) {
    planId = this.authService.getPlanIdFromLegacyStorage();
  }

  // ✅ If still null, try to get from route again
  if (!planId) {
    planId = this.route.snapshot.paramMap.get('planId') || 
             this.route.snapshot.params['id'] ||
             this.route.snapshot.queryParams['planId'];
  }

  if (!planId) {
    console.error('[PlanDetail] No plan ID found');
    this.router.navigate(['/plans']);
    return;
  }

  this.planId = planId;

  // Store selected plan using unified method
  this.authService.setSelectedPlan(planId, {
    planName: this.currentPlan?.name,
    insuredAmount: this.currentPlan?.insuredAmount,
    durationInMonths: this.currentPlan?.durationInMonths,
    features: this.currentPlan?.features
  });

  console.log('[PlanDetail] Plan stored, ID:', planId);
  console.log('[PlanDetail] Stored data:', this.authService.getSelectedPlan());

  // Store health factors if calculated
  if (this.savedHealthFactors) {
    localStorage.setItem(
      'premiumHealthFactors',
      JSON.stringify(this.savedHealthFactors)
    );
  }

  const token = this.authService.getToken();

  if (!token) {
    this.router.navigate(['/auth'], {
      queryParams: {
        mode: 'login',
        redirect: '/app/policy-setup'
      }
    });
  } else {
    this.router.navigate(['/app/policy-setup'], {
      queryParams: {
        planId: planId
      }
    });
  }
}

  onPremiumCalculated(event: {
    result: PremiumCalculationResult;
    factors: any;
  }) {
    // Store health factors for when user clicks "Get Started"
    this.savedHealthFactors = event.factors;
    localStorage.setItem(
      'premiumHealthFactors',
      JSON.stringify(event.factors)
    );
    this.cdr.markForCheck();
  }

  navigateToRegister() {

    if (this.currentPlan) {

      this.updateWorkflowStep(2);

      this.router.navigate(['/auth/register'], {
        queryParams: {
          planId: this.currentPlan.planId
        }
      });
    }
  }

  switchTab(
    tab:
      | 'overview'
      | 'coverage'
      | 'analytics'
      | 'exclusions'
      | 'addons'
  ) {

    this.activeTab = tab;

    if (tab === 'analytics') {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  toggleBillingCycle() {

    this.billingCycle =
      this.billingCycle === 'monthly'
        ? 'yearly'
        : 'monthly';
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
