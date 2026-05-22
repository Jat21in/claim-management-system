import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

import { AuthVisualComponent } from '../../components/auth-visual/auth-visual.component';
import { AuthDeckComponent } from '../../components/auth-deck/auth-deck.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [AuthVisualComponent, AuthDeckComponent],
  templateUrl: './auth-shell.component.html'
})
export class AuthShellComponent implements OnInit, AfterViewInit, OnDestroy {

  mode: 'login' | 'register' = 'login';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // ✅ Cleanup handler
  private destroy$ = new Subject<void>();

  // ✅ Proper typing
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private mouseLeaveHandler!: () => void;
  private blurHandler!: () => void;

  // ===================================================
  // ✅ INIT
  // ===================================================
  ngOnInit(): void {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const url = this.router.url;

        // ✅ Reliable mode detection
        if (url.includes('/auth/login')) {
          this.mode = 'login';
        } else if (url.includes('/auth/register')) {
          this.mode = 'register';
        }

        console.log('🔍 URL:', url);
        console.log('🔍 Mode:', this.mode);

        // ✅ ALWAYS get fresh query params
        const planId = this.activatedRoute.snapshot.queryParamMap.get('planId');
        console.log('🔍 planId:', planId);
      });
  }

  // ===================================================
  // ✅ NAVIGATION (preserve params safely)
  // ===================================================
  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParamsHandling: 'merge'   // ✅ better than manual snapshot
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParamsHandling: 'merge'
    });
  }

  // ===================================================
  // ✅ CURSOR EFFECT
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

  // ===================================================
  // ✅ CLEANUP
  // ===================================================
  ngOnDestroy(): void {
    // ✅ Kill subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // ✅ Remove event listeners
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mouseleave', this.mouseLeaveHandler);
    window.removeEventListener('blur', this.blurHandler);
  }
}
