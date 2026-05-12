import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';

// ✅ IMPORT CHILD COMPONENTS
import { RegisterComponent } from '../../pages/auth/register/register.component';
import { LoginComponent } from '../../pages/auth/login/login.component';

@Component({
  selector: 'app-auth-deck',
  standalone: true,

  // ✅ THIS WAS MISSING — CRITICAL
  imports: [
    NgIf,              // for *ngIf
    RouterLink,        // for routerLink
    RegisterComponent, // <app-register>
    LoginComponent     // <app-login>
  ],

  animations: [
    trigger('slide', [
      transition('register => login', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate(
          '350ms cubic-bezier(0.4,0,0.2,1)',
          style({ transform: 'translateX(-40px)', opacity: 0 })
        )
      ]),
      transition('login => register', [
        style({ transform: 'translateX(40px)', opacity: 0 }),
        animate(
          '350ms cubic-bezier(0.4,0,0.2,1)',
          style({ transform: 'translateX(0)', opacity: 1 })
        )
      ])
    ])
  ],

  templateUrl: './auth-deck.component.html'
})
export class AuthDeckComponent {
  @Input() mode: 'login' | 'register' = 'register';
}
