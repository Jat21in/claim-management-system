import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { FooterComponent } from '../landing/components/footer/footer.component';

interface FAQ {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  plans: PublicPlan[] = [];
  loading = true;
  error: string | null = null;
  viewMode: 'grid' | 'compare' = 'grid';

  faqs: FAQ[] = [
    {
      question: 'How do I choose the right plan?',
      answer: 'Consider your healthcare needs, budget, and family size. Our Essential plan is great for individuals, Premium for comprehensive coverage, and Family plan for complete family protection.',
      open: false
    },
    {
      question: 'Can I upgrade my plan later?',
      answer: 'Yes! You can upgrade your plan at any time. The new coverage will be activated immediately, and you\'ll only pay the difference in premium.',
      open: false
    },
    {
      question: 'What is the claim process?',
      answer: 'Simply submit your medical reports online, our AI system will process them, and you\'ll receive a decision within 2-3 business days.',
      open: false
    },
    {
      question: 'Are there any waiting periods?',
      answer: 'Most benefits start immediately. Some specific treatments may have a 30-day waiting period. Check the plan details for specifics.',
      open: false
    }
  ];

  constructor(private planService: PlanService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.error = null;

    this.planService.getPublicPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load plans. Please try again.';
        this.loading = false;
      }
    });
  }

  selectPlan(plan: PublicPlan): void {
    // Navigate to register with selected plan
    window.location.href = `/auth/register?planId=${plan.planId}`;
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  scrollToPlans(): void {
    document.querySelector('.plans-grid')?.scrollIntoView({ behavior: 'smooth' });
  }
}
