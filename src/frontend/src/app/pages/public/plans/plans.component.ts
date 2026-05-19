import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { PlanService, PublicPlan } from '../../../services/plan.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
  ],

  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {

  planMap: { [key: string]: string } = {
  'Elite Family': 'elite-id',
  'Essential Care': 'basic-id',
  'Advanced Plus': 'advanced-id'
};


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

animatePrice(key: keyof typeof this.animatedPrices) {
  const duration = 400;
  const start = this.animatedPrices[key];
  const end = this.targetPrices[key];

  const startTime = performance.now();

  const animate = (time: number) => {
    const progress = Math.min((time - startTime) / duration, 1);

    this.animatedPrices[key] =
      Math.floor(start + (end - start) * progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}
priceChanging = false;

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

  this.animatePrice('elite');
  this.animatePrice('basic');
  this.animatePrice('advanced');

  setTimeout(() => {
    this.priceChanging = false;
  }, 300);
}

getDigits(value: number): string[] {
  return value.toString().split('');
}

getPlanId(type: 'elite' | 'basic' | 'advanced'): string | null {
  return this.planMap[type] || null;
}

  billing: 'monthly' | 'yearly' = 'monthly';

  glowColor = 'rgba(99,102,241,0.4)'; 

  setGlowColor(type: string) {  if (type === 'gold') {    this.glowColor = 'rgba(255,215,0,0.6)';  } else if (type === 'silver') {    this.glowColor = 'rgba(192,192,192,0.6)';  } else if (type === 'blue') {    this.glowColor = 'rgba(59,130,246,0.6)';  }}

resetGlowColor() {
  this.glowColor = 'rgba(99,102,241,0.4)';
}

  glowX = 0;
  glowY = 0;

  glowTargetX = 0;
  glowTargetY = 0;

  selectedPlan: string | null = null;

  selectPlan(id: string) {
    this.selectedPlan = id;
  }

  onMouseMove(event: MouseEvent) {

    const x = event.clientX;
    const y = event.clientY;

    this.glowTargetX = x;
    this.glowTargetY = y;
  }

  
resetGlow() {
    this.glowTargetX = window.innerWidth / 2;
    this.glowTargetY = window.innerHeight / 2;
  }

ngOnInit() {

  this.planService.getPublicPlans().subscribe(res => {

    console.log('API DATA:', res);

    // ✅ FORCE MAPPING BY INDEX
    this.planMap = {
      elite: res[0]?.planId || '',
      basic: res[1]?.planId || '',
      advanced: res[2]?.planId || ''
    };

    console.log('FINAL MAP:', this.planMap);
  });

  this.animate();
}
  animate() {
    
this.glowX += (this.glowTargetX - this.glowX) * 0.12;
  this.glowY += (this.glowTargetY - this.glowY) * 0.12;


    requestAnimationFrame(() => this.animate());
  }

  plans$: Observable<PublicPlan[]>;

  constructor(private planService: PlanService) {
    this.plans$ = this.planService.getPublicPlans();
  }
}