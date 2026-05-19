import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-navbar.component.html',
  styleUrls: ['./public-navbar.component.scss']
})
export class PublicNavbarComponent {
  mobileMenuOpen = false;

  private router = inject(Router);
  private location = inject(Location);

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }

  closeMenu() {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  scrollToSection(sectionId: string) {
    this.closeMenu();

    const currentUrl = this.router.url;
    const isOnLanding = currentUrl === '/' || currentUrl === '';

    if (isOnLanding) {
      // Already on homepage → smooth scroll directly
      this.smoothScrollTo(sectionId);
    } else {
      // Navigate to homepage with fragment, then scroll after navigation completes
      this.router.navigate(['/'], { fragment: sectionId }).then(() => {
        setTimeout(() => this.smoothScrollTo(sectionId), 100);
      });
    }
  }

  private smoothScrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const navbar = document.querySelector('.public-navbar');
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }
}