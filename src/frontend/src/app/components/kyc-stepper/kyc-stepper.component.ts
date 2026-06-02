import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
  label: string;
  description: string;
  completed: boolean;
  active: boolean;
  icon: string;
}

@Component({
  selector: 'app-kyc-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper-container">
      <div class="stepper">
        <div *ngFor="let step of steps; let i = index" class="step" [class.completed]="step.completed" [class.active]="step.active">
          <div class="step-circle">
            <span *ngIf="!step.completed" class="step-number">{{ i + 1 }}</span>
            <span *ngIf="step.completed" class="step-check">✓</span>
            <div class="step-icon">{{ step.icon }}</div>
          </div>
          <div class="step-content">
            <div class="step-label">{{ step.label }}</div>
            <div class="step-description">{{ step.description }}</div>
          </div>
          <div *ngIf="i < steps.length - 1" class="step-line" [class.completed]="step.completed"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stepper-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid rgba(34, 211, 238, 0.2);
    }
    .stepper { display: flex; justify-content: space-between; position: relative; flex-wrap: wrap; }
    .step { flex: 1; text-align: center; position: relative; min-width: 120px; }
    .step-circle {
      width: 48px;
      height: 48px;
      background: #2a2a3e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      font-weight: bold;
      color: white;
      position: relative;
      z-index: 2;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .step.completed .step-circle {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }
    .step.active .step-circle {
      background: linear-gradient(135deg, #22D3EE, #06b6d4);
      color: #0B1220;
      box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.3);
      border-color: #22D3EE;
    }
    .step-number { font-size: 20px; font-weight: 700; }
    .step-check { font-size: 24px; font-weight: 700; }
    .step-icon { display: none; }
    .step-label { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #e5e7eb; }
    .step-description { font-size: 11px; color: #9ca3af; }
    .step-line {
      position: absolute;
      top: 24px;
      left: 50%;
      width: 100%;
      height: 2px;
      background: #2a2a3e;
      z-index: 1;
      transition: all 0.3s ease;
    }
    .step-line.completed { background: linear-gradient(90deg, #10b981, #22D3EE); }
    .step:last-child .step-line { display: none; }
    @media (max-width: 768px) {
      .step-description { display: none; }
      .step-label { font-size: 10px; }
      .step-circle { width: 36px; height: 36px; }
      .step-line { top: 18px; }
      .step-number { font-size: 14px; }
    }
  `]
})
export class KycStepperComponent implements OnInit {
  @Input() currentStep: 'select-plan' | 'register' | 'kyc-upload' | 'kyc-pending' | 'dashboard' = 'select-plan';

  steps: Step[] = [
    { label: 'Select Plan', description: 'Choose coverage', completed: false, active: false, icon: '📋' },
    { label: 'Register', description: 'Create account', completed: false, active: false, icon: '📝' },
    { label: 'Upload KYC', description: 'Verify identity', completed: false, active: false, icon: '📄' },
    { label: 'Verification', description: 'Admin review', completed: false, active: false, icon: '⏳' },
    { label: 'Dashboard', description: 'Start using', completed: false, active: false, icon: '🏠' }
  ];

  private stepMap = {
    'select-plan': 0,
    'register': 1,
    'kyc-upload': 2,
    'kyc-pending': 3,
    'dashboard': 4
  };

  ngOnInit() {
    this.updateSteps();
  }

  @Input() set step(step: 'select-plan' | 'register' | 'kyc-upload' | 'kyc-pending' | 'dashboard') {
    this.currentStep = step;
    this.updateSteps();
  }

  private updateSteps() {
    const activeIndex = this.stepMap[this.currentStep];
    this.steps.forEach((step, index) => {
      step.completed = index < activeIndex;
      step.active = index === activeIndex;
    });
  }
}
