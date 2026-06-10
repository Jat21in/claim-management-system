import { Component, inject, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { AdminService, SearchResult } from '../services/admin.service';
import { trigger, transition, style, animate, query, stagger, keyframes } from '@angular/animations';
import { filter, Subscription } from 'rxjs';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: number;
  active: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'kyc' | 'claim' | 'payment' | 'system';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('sidebarAnimation', [
      transition(':enter', [
        style({ width: '0px', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: '260px', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: '0px', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerNav', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('50ms', [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('userMenuAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('pulseBadge', [
      transition('* => *', [
        animate('500ms ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.2)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentYear = new Date().getFullYear();
  adminName = 'Administrator';
  adminEmail = 'admin@claimcore.com';
  adminRole = 'Super Admin';
  adminAvatar = '';
  currentTime = '';
  currentDate = '';
  sidebarCollapsed = false;
  userMenuOpen = false;
  mobileMenuOpen = false;
  isMobile = false;

  // Real-time counts
  pendingKycCount = 0;
  pendingClaimsCount = 0;
  pendingTasks = 0;
  notificationCount = 0;

  // Search
  searchQuery = '';
  showSearchResults = false;
  searchResults: SearchResult[] = [];

  // Notifications
  showNotifications = false;
  notifications: Notification[] = [];
  unreadNotifications = 0;

  private timeInterval: any;
  private statsInterval: any;
  private resizeListener: any;
  private subscriptions: Subscription[] = [];

  navItems: NavItem[] = [
    { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: false },
    { path: 'kyc', label: 'KYC Verification', icon: 'verified', active: false },
    { path: 'claims', label: 'Claims Management', icon: 'claim', active: false },
    { path: 'members', label: 'Member Directory', icon: 'members', active: false },
    { path: 'plans', label: 'Plan Management', icon: 'plans', active: false },
    { path: 'hospitals', label: 'Network Hospitals', icon: 'hospitals', active: false },
    { path: 'hangfire', label: 'Job Monitor', icon: 'jobs', active: false }
  ];

  ngOnInit() {
    this.updateDateTime();
    this.timeInterval = setInterval(() => this.updateDateTime(), 1000);
    this.checkMobile();
    this.setupResizeListener();
    this.loadAdminProfile();
    this.updateActiveNav();
    this.startRealTimeStats();
    this.loadNotifications();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveNav();
      this.closeSearch();
      this.closeNotifications();
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.statsInterval) clearInterval(this.statsInterval);
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateDateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.cdr.markForCheck();
  }

  private startRealTimeStats() {
    this.loadStats();
    this.statsInterval = setInterval(() => this.loadStats(), 30000);
  }

  private loadStats() {
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.pendingKycCount = stats.pendingKyc;
        this.pendingClaimsCount = stats.pendingClaims;
        this.pendingTasks = stats.pendingTasks;
        this.notificationCount = stats.pendingKyc + stats.pendingClaims;

        const kycNav = this.navItems.find(n => n.path === 'kyc');
        if (kycNav) kycNav.badge = this.pendingKycCount;

        const claimsNav = this.navItems.find(n => n.path === 'claims');
        if (claimsNav) claimsNav.badge = this.pendingClaimsCount;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.cdr.markForCheck();
      }
    });
  }

  private checkMobile() {
    this.isMobile = window.innerWidth < 1024;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
    this.cdr.markForCheck();
  }

  private setupResizeListener() {
    this.resizeListener = () => {
      this.checkMobile();
    };
    window.addEventListener('resize', this.resizeListener);
  }

  private loadAdminProfile() {
    const user = this.auth.getUser();
    if (user?.fullName) this.adminName = user.fullName;
    if (user?.email) this.adminEmail = user.email;
    if (user?.['role']) this.adminRole = user['role'];
    this.adminAvatar = this.getInitials(this.adminName);
    this.cdr.markForCheck();
  }

  private loadNotifications() {
    // In production, fetch from API
    this.notifications = [
      { id: '1', title: 'New KYC Submission', message: 'John Doe submitted KYC documents for verification', time: '5 minutes ago', read: false, type: 'kyc' },
      { id: '2', title: 'Claim Approved', message: 'Claim #POL-20260606-77D64B5C has been approved', time: '1 hour ago', read: false, type: 'claim' },
      { id: '3', title: 'Payment Received', message: 'Premium payment of ₹46,728 received successfully', time: '2 hours ago', read: true, type: 'payment' },
      { id: '4', title: 'New Member Registration', message: 'Ansh Kumar has registered as a new member', time: '3 hours ago', read: false, type: 'system' }
    ];
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
    this.cdr.markForCheck();
  }

  private updateActiveNav() {
    const currentUrl = this.router.url;
    this.navItems.forEach(item => {
      item.active = currentUrl.includes(item.path);
    });
    this.cdr.markForCheck();
  }

  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (!this.sidebarCollapsed && this.isMobile) {
      this.mobileMenuOpen = true;
    }
    this.cdr.markForCheck();
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    this.cdr.markForCheck();
  }

  closeUserMenu() {
    this.userMenuOpen = false;
    this.cdr.markForCheck();
  }

  closeMobileMenu() {
    if (this.isMobile && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      this.sidebarCollapsed = true;
    }
    this.cdr.markForCheck();
  }

  // Search Methods
  onSearchInput() {
    if (this.searchQuery.length < 2) {
      this.showSearchResults = false;
      this.cdr.markForCheck();
      return;
    }

    this.adminService.searchGlobal(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.showSearchResults = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.showSearchResults = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeSearch() {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  // Notification Methods
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.userMenuOpen = false;
    }
    this.cdr.markForCheck();
  }

  closeNotifications() {
    this.showNotifications = false;
    this.cdr.markForCheck();
  }

  markNotificationsAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    let changed = false;
    
    if (!target.closest('.user-menu') && this.userMenuOpen) {
      this.userMenuOpen = false;
      changed = true;
    }
    if (!target.closest('.search-container') && this.showSearchResults) {
      this.showSearchResults = false;
      changed = true;
    }
    if (!target.closest('.notification-container') && this.showNotifications) {
      this.showNotifications = false;
      changed = true;
    }
    if (changed) {
      this.cdr.markForCheck();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}