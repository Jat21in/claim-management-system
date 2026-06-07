import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FooterComponent } from '../../pages/public/landing/components/footer/footer.component';

@Component({
  selector: 'app-policy-setup-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FooterComponent
  ],
  template: `
    <div class="policy-setup-layout">

      <!-- ✅ PREMIUM POLICY SETUP NAVBAR -->
      <nav class="setup-navbar">

        <div class="nav-container">

          <!-- ✅ LOGO -->
          <a routerLink="/" class="nav-logo">
            <span class="logo-icon">✦</span>

            <span class="logo-text">
              Claim<span class="logo-highlight">Core</span>
            </span>
          </a>

          <!-- ✅ CENTER STATUS -->
          <div class="setup-status desktop-only">

            <div class="status-pill">

              <div class="status-pulse"></div>

              <div class="status-content">
                <span class="status-title">
                  Setting up your policy
                </span>

                <span class="status-subtitle">
                  Secure • Encrypted • Guided
                </span>
              </div>

            </div>

          </div>

          <!-- ✅ RIGHT ACTIONS -->
          <div class="nav-actions">

            <!-- ✅ KYC STYLE BADGE -->
            <div class="setup-badge">

              <svg
                class="setup-icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2L4 5V11C4 16.5 7.8 21.7 12 23C16.2 21.7 20 16.5 20 11V5L12 2Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <span>
                Protected Setup
              </span>

            </div>

            <!-- ✅ HELP BUTTON -->
            <a
              href="mailto:support@claimcore.com"
              class="help-link"
            >

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9A3 3 0 0 1 15 10C15 12 12 12 12 14"/>
                <path d="M12 17h.01"/>
              </svg>

              <span class="desktop-only">
                Need Help?
              </span>

            </a>

          </div>

        </div>

      </nav>

      <!-- ✅ MAIN -->
      <main class="setup-main">

        <div class="setup-content">
          <router-outlet></router-outlet>
        </div>

        <app-footer></app-footer>

      </main>

    </div>
  `,
  styles: [`
    .policy-setup-layout {
      min-height: 100vh;
      background:
        radial-gradient(circle at top, rgba(34, 211, 238, 0.08), transparent 30%),
        linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a);
    }

    /* ✅ NAVBAR */

    .setup-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;

      background: rgba(11, 18, 32, 0.92);
      backdrop-filter: blur(20px);

      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      transition: all 0.3s ease;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;

      padding: 0 24px;
      height: 74px;

      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* ✅ LOGO */

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;

      text-decoration: none;

      transition: transform 0.25s ease;
    }

    .nav-logo:hover {
      transform: scale(1.02);
    }

    .logo-icon {
      font-size: 1.9rem;

      background: linear-gradient(135deg, #22D3EE, #3B82F6);

      -webkit-background-clip: text;
      background-clip: text;

      color: transparent;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.03em;

      color: white;
    }

    .logo-highlight {
      background: linear-gradient(135deg, #22D3EE, #3B82F6);

      -webkit-background-clip: text;
      background-clip: text;

      color: transparent;
    }

    /* ✅ CENTER STATUS */

    .setup-status {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 14px;

      padding: 10px 18px;

      border-radius: 999px;

      background: rgba(255, 255, 255, 0.04);

      border: 1px solid rgba(255, 255, 255, 0.07);

      transition: all 0.3s ease;
    }

    .status-pill:hover {
      border-color: rgba(34, 211, 238, 0.25);

      background: rgba(34, 211, 238, 0.06);
    }

    .status-pulse {
      width: 10px;
      height: 10px;

      border-radius: 50%;

      background: #22D3EE;

      animation: pulse-dot 1.6s ease-in-out infinite;

      box-shadow: 0 0 18px rgba(34, 211, 238, 0.5);
    }

    .status-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-title {
      color: white;

      font-size: 13px;
      font-weight: 600;
    }

    .status-subtitle {
      color: #94a3b8;

      font-size: 11px;
    }

    /* ✅ RIGHT ACTIONS */

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ✅ SECURITY BADGE */

    .setup-badge {
      display: flex;
      align-items: center;
      gap: 8px;

      padding: 8px 14px;

      border-radius: 999px;

      background: rgba(16, 185, 129, 0.12);

      border: 1px solid rgba(16, 185, 129, 0.32);

      color: #10B981;

      font-size: 12px;
      font-weight: 600;
    }

    .setup-icon {
      width: 14px;
      height: 14px;

      flex-shrink: 0;
    }

    /* ✅ HELP BUTTON */

    .help-link {
      display: flex;
      align-items: center;
      gap: 8px;

      padding: 10px 14px;

      border-radius: 999px;

      text-decoration: none;

      color: #94a3b8;

      background: rgba(255, 255, 255, 0.04);

      border: 1px solid rgba(255, 255, 255, 0.06);

      font-size: 13px;
      font-weight: 500;

      transition: all 0.25s ease;
    }

    .help-link svg {
      width: 16px;
      height: 16px;
    }

    .help-link:hover {
      color: #22D3EE;

      background: rgba(34, 211, 238, 0.08);

      border-color: rgba(34, 211, 238, 0.2);

      transform: translateY(-2px);
    }

    /* ✅ MAIN */

    .setup-main {
      margin-top: 74px;

      min-height: calc(100vh - 74px);

      display: flex;
      flex-direction: column;
    }

    .setup-content {
      flex: 1;
    }

    app-footer {
      display: block;
      margin-top: auto;
    }

    /* ✅ ANIMATIONS */

    @keyframes pulse-dot {
      0% {
        transform: scale(0.9);
        opacity: 1;
      }

      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }

      100% {
        transform: scale(0.9);
        opacity: 1;
      }
    }

    /* ✅ RESPONSIVE */

    .desktop-only {
      display: flex;
    }

    @media (max-width: 900px) {

      .desktop-only {
        display: none;
      }

      .nav-container {
        padding: 0 16px;
      }

      .logo-text {
        font-size: 1.3rem;
      }

      .setup-badge {
        padding: 8px 12px;
      }

      .help-link {
        padding: 10px;
      }
    }

    @media (max-width: 640px) {

      .setup-badge span {
        display: none;
      }

      .help-link {
        width: 42px;
        height: 42px;

        padding: 0;

        justify-content: center;
      }
    }
  `]
})
export class PolicySetupLayoutComponent {}
