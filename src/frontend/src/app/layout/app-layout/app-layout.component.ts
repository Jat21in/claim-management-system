import { Component, HostListener, OnInit, OnDestroy, inject, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MemberService } from '../../services/member.service';
import { ClaimService } from '../../services/claim.service';
import { KycService } from '../../services/kyc.service'; // ✅ Add this
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../pages/public/landing/components/footer/footer.component';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FooterComponent],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss']
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private memberService = inject(MemberService);
  private claimService = inject(ClaimService);
  private kycService = inject(KycService); // ✅ Add this
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private boundEscapeHandler = this.handleEscapeKey.bind(this);

  // ✅ KYC STATE
  isKycVerified = false;
  isLoadingKyc = true;

  // UI State
  isScrolled = false;
  mobileMenuOpen = false;
  dropdownOpen = false;
  notificationsOpen = false;
  isOnline = true;

  // User Data
  userName = 'Member';
  userEmail = '';
  userRole = 'Member';
  userInitials = 'M';

  // Notifications
  notifications: Notification[] = [];
  notificationCount = 0;

  // Subscriptions
  private refreshSubscription!: Subscription;
  private clickListener: (() => void) | null = null;

  ngOnInit(): void {
    this.loadUserData();
    this.loadNotifications();
    this.checkKycStatus(); // ✅ Add this

    this.refreshSubscription = this.claimService.refreshClaims$.subscribe(() => {
      this.loadNotifications();
    });

    document.addEventListener('keydown', this.boundEscapeHandler);
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
    if (this.clickListener) this.clickListener();
    document.removeEventListener('keydown', this.boundEscapeHandler);
  }

  // ✅ ✅ ✅ KYC LOGIC
  private checkKycStatus() {
    this.kycService.getStatus().subscribe({
      next: (status) => {
        this.isKycVerified = status.status === 1;
        this.isLoadingKyc = false;
        console.log('KYC Status:', this.isKycVerified);
      },
      error: () => {
        this.isKycVerified = false;
        this.isLoadingKyc = false;
      }
    });
  }

  // ✅ ADMIN GETTER
  get isAdmin(): boolean {
    const role = this.auth.getUserRole();
    return role === 'Admin' || role === 'ClaimsProcessor';
  }

  private loadUserData(): void {
    const token = this.auth.getToken();
    if (token) {
      try {
        const decoded: any = (this.auth as any).getDecodedToken ? (this.auth as any).getDecodedToken() : null;
        this.userName = decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                        decoded?.unique_name ||
                        'Member';
        this.userEmail = decoded?.email || decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
        this.userRole = decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                        decoded?.role ||
                        'Member';

        const nameParts = this.userName.split(' ');
        if (nameParts.length >= 2) {
          this.userInitials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else {
          this.userInitials = this.userName.substring(0, 2).toUpperCase();
        }
      } catch (e) {
        console.error('Error decoding token', e);
      }
    }

    this.memberService.getDashboard().subscribe({
      next: (res) => {
        if (res.fullName) {
          this.userName = res.fullName;
          const nameParts = res.fullName.split(' ');
          if (nameParts.length >= 2) {
            this.userInitials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
          } else {
            this.userInitials = res.fullName.substring(0, 2).toUpperCase();
          }
        }
        if (res.email) this.userEmail = res.email;
      },
      error: () => console.error('Failed to load user data')
    });
  }

  private loadNotifications(): void {
    this.claimService.getMyClaims().subscribe({
      next: (claims) => {
        const newNotifications: Notification[] = [];

        const pendingClaims = claims.filter(c =>
          c.status === 'Submitted' || c.status === 'PendingAI' || c.status === 'Pending'
        );

        if (pendingClaims.length > 0) {
          newNotifications.push({
            id: 'pending-claims',
            message: `You have ${pendingClaims.length} claim(s) pending review.`,
            type: 'warning',
            time: 'Just now',
            read: false
          });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentApproved = claims.filter(c =>
          (c.status === 'Approved' || c.status === 'APPROVED') &&
          new Date(c.claimDate) > sevenDaysAgo
        );

        if (recentApproved.length > 0) {
          newNotifications.push({
            id: 'approved-claims',
            message: `${recentApproved.length} claim(s) approved recently!`,
            type: 'success',
            time: 'Recently',
            read: false
          });
        }

        this.notifications = newNotifications;
        this.notificationCount = this.notifications.filter(n => !n.read).length;
      },
      error: () => console.error('Failed to load notifications')
    });
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.dropdownOpen = false;
      this.notificationsOpen = false;
      this.renderer.addClass(document.body, 'overflow-hidden');
    } else {
      this.renderer.removeClass(document.body, 'overflow-hidden');
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.notificationsOpen = false;
    this.mobileMenuOpen = false;

    if (this.dropdownOpen) {
      setTimeout(() => {
        this.clickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
          const dropdown = this.elementRef.nativeElement.querySelector('.dropdown-menu');
          const avatar = this.elementRef.nativeElement.querySelector('.user-dropdown');

          if (dropdown && avatar && !dropdown.contains(event.target) && !avatar.contains(event.target)) {
            this.dropdownOpen = false;
            if (this.clickListener) this.clickListener();
            this.clickListener = null;
          }
        });
      });
    } else if (this.clickListener) {
      this.clickListener();
      this.clickListener = null;
    }
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
    if (this.clickListener) {
      this.clickListener();
      this.clickListener = null;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    this.dropdownOpen = false;
  }

  handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.dropdownOpen = false;
      this.notificationsOpen = false;
      this.mobileMenuOpen = false;
    }
  }

  scrollToSection(sectionId: string): void {
    this.router.navigate(['/app/dashboard']).then(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
