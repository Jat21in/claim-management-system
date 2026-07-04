import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { AuthService } from '../../../auth/auth.service';
import { FooterComponent } from '../landing/components/footer/footer.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, CurrencyPipe, FooterComponent],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit, AfterViewInit {

  plans: PublicPlan[] = [];
  billing: 'monthly' | 'yearly' = 'monthly';

  private authService = inject(AuthService);
  private router = inject(Router);

  glowColor = 'rgba(99,102,241,0.4)';
  glowX = 0;
  glowY = 0;
  glowTargetX = 0;
  glowTargetY = 0;
  priceChanging = false;

  constructor(private planService: PlanService) { }

  ngOnInit() {
    this.planService.getPublicPlans().subscribe(res => {
      this.plans = res;
      console.log('Plans loaded:', res);
    });

    this.animate();
  }

  // ✅ SELECT PLAN METHOD
  selectPlan(plan: PublicPlan): void {
    console.log('[Plans] Selecting plan:', plan.planId, plan.name);
    
    // Store plan using unified method
    this.authService.setSelectedPlan(plan.planId, {
      planName: plan.name,
      insuredAmount: plan.insuredAmount,
      durationInMonths: plan.durationInMonths
    });

    console.log('[Plans] Plan stored, ID:', plan.planId);
    console.log('[Plans] Stored data:', this.authService.getSelectedPlan());

    // Navigate to policy setup or registration
    if (this.authService.isAuthenticated()) {
      console.log('[Plans] User authenticated, redirecting to policy setup');
      this.router.navigate(['/app/policy-setup']);
    } else {
      console.log('[Plans] User not authenticated, redirecting to registration with planId:', plan.planId);
      this.router.navigate(['/auth/register'], { 
        queryParams: { planId: plan.planId } 
      });
    }
  }

  // GET DATA DIRECTLY FROM THE PLAN OBJECT
  getBaseAnnual(plan: PublicPlan): number {
    return plan.basePremiumAnnual || 0;
  }

  getBaseMonthly(plan: PublicPlan): number {
    return Math.round(this.getBaseAnnual(plan) / 12);
  }

  getPlanYearlyBase(plan: PublicPlan): number {
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

  getPlanPremium(plan: PublicPlan): number {
    return this.billing === 'monthly'
      ? this.getBaseMonthly(plan)
      : this.getPlanYearlyBase(plan);
  }

  getPlanBestFor(plan: PublicPlan): string {
    if (plan.insuredAmount >= 1000000) return 'Premium Families';
    if (plan.insuredAmount >= 750000) return 'Families';
    if (plan.insuredAmount >= 500000) return 'Professionals';
    return 'Individuals';
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

  toggleBilling(event: any) {
    this.priceChanging = true;
    this.billing = event.target.checked ? 'yearly' : 'monthly';

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