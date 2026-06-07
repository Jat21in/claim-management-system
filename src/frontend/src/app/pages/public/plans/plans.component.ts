import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { FooterComponent } from '../landing/components/footer/footer.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, CurrencyPipe, FooterComponent],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit, AfterViewInit {

  plans: PublicPlan[] = [];   // ✅ dynamic plans

  billing: 'monthly' | 'yearly' = 'monthly';

  glowColor = 'rgba(99,102,241,0.4)';

  glowX = 0;
  glowY = 0;
  glowTargetX = 0;
  glowTargetY = 0;

  priceChanging = false;


  animatedPrices = {
    elite: 99,
    basic: 29,
    advanced: 59
  };

  targetPrices = {
    elite: 99,
    basic: 29,
    advanced: 59
  };
  constructor(private planService: PlanService) { }

  ngOnInit() {

    // ✅ fetch plans (like teammate)
    this.planService.getPublicPlans().subscribe(res => {
      this.plans = res;
      console.log('Plans:', res);
    });

    this.animate();
  }

  private planConfigs: Record<string, {
    basePremiumAnnual: number;
    dependentLoadingPercentage: number;
    maxDependents: number;
    maxNominees: number;
    bestFor: string;
    familyCoverage: string;
    cashlessHospitals: string;
    claimSettlement: string;
    coverageAmount?: number;
    doctorConsultations?: string;
    hospitalization?: string;
    maternityCover?: boolean;
    healthCheckup?: boolean;
    emergencyCare?: boolean;
    noClaimBonusLabel?: string;
  }> = {
    '2b94d09f-4bb8-44db-9ff5-ac3fa24edc79': {
      basePremiumAnnual: 25000,
      dependentLoadingPercentage: 15,
      maxDependents: 2,
      maxNominees: 2,
      bestFor: 'Individuals',
      familyCoverage: 'Limited',
      cashlessHospitals: 'Network',
      claimSettlement: 'Standard',
      coverageAmount: 300000,
      doctorConsultations: 'Basic',
      hospitalization: 'Standard',
      maternityCover: false,
      healthCheckup: false,
      emergencyCare: false,
      noClaimBonusLabel: 'No'
    },
    'cb47cd47-9920-471d-bff5-071061211e10': {
      basePremiumAnnual: 65000,
      dependentLoadingPercentage: 25,
      maxDependents: 5,
      maxNominees: 4,
      bestFor: 'Families',
      familyCoverage: 'Extended',
      cashlessHospitals: 'Network +',
      claimSettlement: 'Priority',
      coverageAmount: 750000,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Enhanced',
      maternityCover: true,
      healthCheckup: true,
      emergencyCare: true,
      noClaimBonusLabel: '5%/year'
    },
    'cbedf83d-4caf-4c90-ab5d-549000e4ac41': {
      basePremiumAnnual: 85000,
      dependentLoadingPercentage: 20,
      maxDependents: 6,
      maxNominees: 5,
      bestFor: 'Premium Families',
      familyCoverage: 'Complete',
      cashlessHospitals: 'All Network',
      claimSettlement: 'Fast-Track',
      coverageAmount: 1000000,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Premium',
      maternityCover: true,
      healthCheckup: true,
      emergencyCare: true,
      noClaimBonusLabel: '5%/year'
    },
    'bb4354ec-77fb-4e84-91ec-f01f4cda87e8': {
      basePremiumAnnual: 45000,
      dependentLoadingPercentage: 25,
      maxDependents: 4,
      maxNominees: 3,
      bestFor: 'Professionals',
      familyCoverage: 'Standard',
      cashlessHospitals: 'Network',
      claimSettlement: 'Priority',
      coverageAmount: 500000,
      doctorConsultations: 'Unlimited',
      hospitalization: 'Standard',
      maternityCover: true,
      healthCheckup: true,
      emergencyCare: true,
      noClaimBonusLabel: '5%/year'
    }
  };

  findPlanByName(name: string) {
    return this.plans.find(p => p.name?.toLowerCase() === name.toLowerCase());
  }

  getConfigByPlanName(name: string) {
    const plan = this.findPlanByName(name);
    if (!plan) return undefined;
    return this.getPlanConfig(plan);
  }

  getCoverageByName(name: string) {
    const plan = this.findPlanByName(name);
    const cfg = this.getConfigByPlanName(name);
    return plan?.insuredAmount ?? cfg?.coverageAmount ?? 0;
  }

  getPlanConfig(plan: PublicPlan): {
    basePremiumAnnual: number;
    dependentLoadingPercentage: number;
    maxDependents: number;
    maxNominees: number;
    bestFor: string;
    familyCoverage: string;
    cashlessHospitals: string;
    claimSettlement: string;
    coverageAmount?: number;
    doctorConsultations?: string;
    hospitalization?: string;
    maternityCover?: boolean;
    healthCheckup?: boolean;
    emergencyCare?: boolean;
    noClaimBonusLabel?: string;
  } | undefined {
    return this.planConfigs[plan.planId?.toLowerCase() ?? ''];
  }

  getBaseAnnual(plan: PublicPlan): number {
    const config = this.getPlanConfig(plan);
    return config ? config.basePremiumAnnual : 0;
  }

  getBaseMonthly(plan: PublicPlan): number {
    return Math.round(this.getBaseAnnual(plan) / 12);
  }

  getPlanYearlyBase(plan: PublicPlan): number {
    // Display yearly as: Monthly × 12 × 0.92 (8% discount)
    const monthly = this.getBaseMonthly(plan);
    return Math.round(monthly * 12 * 0.92);
  }

  getPlanSavings(plan: PublicPlan) {
    const monthly = this.getBaseMonthly(plan);
    const yearly = Math.round(monthly * 12 * 0.92);
    const monthlyTotal = monthly * 12;
    const saved = monthlyTotal - yearly;
    const percent = monthlyTotal ? Math.round((saved / monthlyTotal) * 100) : 0;
    return { saved, percent };
  }

  getPlanGSTMonthly(plan: PublicPlan): number {
    return Math.round(this.getBaseMonthly(plan) * 1.18);
  }

  getPlanGSTYearly(plan: PublicPlan): number {
    return Math.round(this.getPlanYearlyBase(plan) * 1.18);
  }

  getPlanMonthlyBase(plan: PublicPlan): number {
    return this.getBaseMonthly(plan);
  }

  getPlanPremium(plan: PublicPlan): number {
    return this.billing === 'monthly'
      ? this.getBaseMonthly(plan)
      : this.getPlanYearlyBase(plan);
  }

  getPlanBestFor(plan: PublicPlan): string {
    return this.getPlanConfig(plan)?.bestFor ?? 'Business';
  }

  formatPlanPremium(plan: PublicPlan): string {
    return this.formatCurrency(this.getPlanPremium(plan));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // ✅ billing logic stays same
  toggleBilling(event: any) {

    this.priceChanging = true;
    this.billing = event.target.checked ? 'yearly' : 'monthly';


if (this.billing === 'monthly') {
    this.targetPrices = {
      elite: 99,
      basic: 29,
      advanced: 59
    };
  } else {
    this.targetPrices = {
      elite: 999,
      basic: 299,
      advanced: 599
    };
  }

  // ✅ apply instantly (no delay like before)
  this.animatedPrices = { ...this.targetPrices };

  // ✅ reset animation flag after short delay
  setTimeout(() => {
    this.priceChanging = false;
  }, 400);

  }

  setGlowColor(type: string) {
    if (type === 'gold') this.glowColor = 'rgba(255,215,0,0.6)';
    else if (type === 'silver') this.glowColor = 'rgba(192,192,192,0.6)';
    else this.glowColor = 'rgba(59,130,246,0.6)';
  }

  resetGlowColor() {
    this.glowColor = 'rgba(99,102,241,0.4)';
  }

  onMouseMove(event: MouseEvent) {
    this.glowTargetX = event.clientX;
    this.glowTargetY = event.clientY;
  }

  resetGlow() {
    this.glowTargetX = window.innerWidth / 2;
    this.glowTargetY = window.innerHeight / 2;
  }

  animate() {
    this.glowX += (this.glowTargetX - this.glowX) * 0.12;
    this.glowY += (this.glowTargetY - this.glowY) * 0.12;

    requestAnimationFrame(() => this.animate());
  }

  ngAfterViewInit() {
    const rows = document.querySelectorAll<HTMLElement>('.row');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, { threshold: 0.2 });

    rows.forEach((row, index) => {
      observer.observe(row);
      row.style.transitionDelay = `${index * 80}ms`;
    });
  }
}
