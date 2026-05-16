import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { AuthVisualComponent } from '../../components/auth-visual/auth-visual.component';
import { AuthDeckComponent } from '../../components/auth-deck/auth-deck.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [AuthVisualComponent, AuthDeckComponent],
  templateUrl: './auth-shell.component.html'
})
export class AuthShellComponent implements OnInit, AfterViewInit, OnDestroy {

  // ✅ SINGLE SOURCE OF TRUTH
  mode: 'login' | 'register' = 'login';

  private router = inject(Router);

  /** cursor handlers */
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouseLeaveHandler!: () => void;
  private blurHandler!: () => void;

  // ===================================================
  // ✅ ROUTE → UI SYNC (CORRECT & FINAL)
  // ===================================================
  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.mode = this.router.url.includes('/auth/login')
          ? 'login'
          : 'register';
      });
  }

  // ===================================================
  // ✅ NAVIGATION METHODS
  // ===================================================
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  // ===================================================
  // ✅ CURSOR EFFECTS (UNCHANGED)
  // ===================================================
  ngAfterViewInit(): void {
    const root = document.documentElement;

    this.mouseMoveHandler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * -12;
      root.style.setProperty('--tilt-x', `${y}deg`);
      root.style.setProperty('--tilt-y', `${x}deg`);
    };

    this.mouseLeaveHandler = () => {
      root.style.setProperty('--tilt-x', '0deg');
      root.style.setProperty('--tilt-y', '0deg');
    };

    this.blurHandler = this.mouseLeaveHandler;

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseleave', this.mouseLeaveHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mouseleave', this.mouseLeaveHandler);
    window.removeEventListener('blur', this.blurHandler);
  }
}
