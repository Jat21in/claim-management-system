import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService, PublicPlan } from '../../../services/plan.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink],
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
