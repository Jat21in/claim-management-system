import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import lottie from 'lottie-web';
import Flip from 'gsap/Flip';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {

  /* =========================
     ✅ VIEW CHILDREN (existing)
  ========================= */

  @ViewChild('lottieContainer', { static: true })
  lottieContainer!: ElementRef;

  @ViewChild('marquee', { static: false })
  marquee!: ElementRef;

  /* =========================
     ✅ NEW FEATURES SECTION VIEW CHILDREN
  ========================= */

  @ViewChild('comparisonSection') comparisonSection!: ElementRef;
  @ViewChild('afterImage') afterImage!: ElementRef;
  @ViewChild('afterImg') afterImg!: ElementRef;
  @ViewChild('featuresHeader') featuresHeader!: ElementRef;
  @ViewChild('featuresPills') featuresPills!: ElementRef;
  @ViewChild('divider') divider!: ElementRef;
  @ViewChild('afterLabel') afterLabel!: ElementRef;

  @ViewChild('modal') modal!: ElementRef;
  @ViewChild('modalContent') modalContent!: ElementRef;

  /* =========================
     ✅ SUBTEXT TYPEWRITER
  ========================= */

  typedText = '';

  private phrases = [
    'Track claims in real-time...',
    'Experience faster approvals...',
    'Secure. Transparent. Reliable...'
  ];

  /* =========================
     ✅ ABOUT IMAGE TRANSITION
  ========================= */

  currentImage: string = '/assets/about/1.jpg';
  previousImage: string = '';
  isTransitioning: boolean = false;

  private imageIndex = 0;

  private aboutImages: string[] = [
    '/assets/about/2.jpg',
    '/assets/about/3.jpg',
    '/assets/about/4.jpg',
    '/assets/about/1.jpg'
  ];

  private imageInterval: any;

  constructor(private cdr: ChangeDetectorRef) {}

  /* =========================
     ✅ LIFECYCLE
  ========================= */

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger, Flip);

    ScrollTrigger.config({
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
    });

    this.initLottie();
    this.initHeroAnimation();
    this.startTypingEffect();

    // All scroll-based animations delayed slightly
    setTimeout(() => {
      this.initParallax();
      this.initBentoGallery();
      this.initAboutAnimation();
      this.startImageRotation();

      // ✅ NEW FEATURES SECTION INITIALISATIONS
      this.initFeaturesHeaderAnimation();
      this.initComparisonScroll();
      this.initFeaturesPillsAnimation();

    }, 400);
  }

  ngOnDestroy(): void {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
    // Kill all ScrollTriggers to avoid memory leaks
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  /* =========================
     ✅ HERO ANIMATION
  ========================= */

  private initHeroAnimation(): void {
    const tl = gsap.timeline();

    tl.from('.hero-title', { y: 60, opacity: 0, duration: 1 })
      .from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.8 }, '-=0.6')
      .from('.typewriter', { opacity: 0 }, '-=0.4')
      .from('.cta-btn', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
      .from('.lottie-container', { scale: 0.85, opacity: 0, duration: 1 }, '-=0.8');
  }

  /* =========================
     ✅ LOTTIE
  ========================= */

  private initLottie(): void {
    if (!this.lottieContainer) return;

    lottie.loadAnimation({
      container: this.lottieContainer.nativeElement,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottie/Health.json'
    });
  }

  /* =========================
     ✅ SUBTEXT TYPEWRITER
  ========================= */

  private startTypingEffect(): void {
    let phraseIndex = 0;
    let charIndex = 0;

    const type = () => {
      if (charIndex < this.phrases[phraseIndex].length) {
        this.typedText += this.phrases[phraseIndex][charIndex++];
        this.cdr.detectChanges();
        setTimeout(type, 40);
      } else {
        setTimeout(erase, 1500);
      }
    };

    const erase = () => {
      if (charIndex > 0) {
        this.typedText = this.typedText.slice(0, -1);
        charIndex--;
        this.cdr.detectChanges();
        setTimeout(erase, 20);
      } else {
        phraseIndex = (phraseIndex + 1) % this.phrases.length;
        setTimeout(type, 300);
      }
    };

    type();
  }

  /* =========================
     ✅ PARALLAX LOGOS
  ========================= */

  private initParallax(): void {
    if (!this.marquee) return;

    const logos = this.marquee.nativeElement.querySelectorAll('img');

    logos.forEach((logo: HTMLElement) => {
      logo.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = logo.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        gsap.to(logo, {
          x: x * 10,
          y: y * 10,
          rotationX: -y * 10,
          rotationY: x * 10,
          duration: 0.4
        });
      });

      logo.addEventListener('mouseleave', () => {
        gsap.to(logo, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          duration: 0.5
        });
      });
    });
  }

  /* =========================
     ✅ BENTO SCROLL (GALLERY)
  ========================= */

  private initBentoGallery(): void {
    const galleryWrap = document.querySelector('.gallery-wrap');
    const gallery = document.querySelector('#gallery-8');

    if (!galleryWrap || !gallery) return;

    const images = gallery.querySelectorAll('img');
    const centerItem = gallery.querySelector('.featured') as HTMLElement;
    const zoomText = gallery.querySelector('.zoom-content') as HTMLElement;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: galleryWrap,
        start: 'top top',
        end: '+=140%',
        scrub: true,
        pin: true,
        anticipatePin: 1
      }
    });

    tl.to(centerItem, { scale: 2.2 })
      .to(images, {
        filter: 'blur(8px)',
        opacity: (i, el: any) =>
          el === centerItem.querySelector('img') ? 1 : 0.2
      }, '-=1')
      .to(centerItem, { scale: 2.8, y: -40 });

    if (zoomText) {
      tl.to(zoomText, { opacity: 1, y: 0 });
    }

    tl.to(gallery, { opacity: 0 });
  }

  /* =========================
     ✅ ABOUT IMAGE ROTATION
  ========================= */

  private startImageRotation(): void {
    this.imageInterval = setInterval(() => {
      const nextIndex = (this.imageIndex + 1) % this.aboutImages.length;
      const nextImage = this.aboutImages[nextIndex];
      this.transitionToImage(nextImage);
      this.imageIndex = nextIndex;
    }, 3000);
  }

  private transitionToImage(newImage: string): void {
    if (this.currentImage === newImage) return;

    this.previousImage = this.currentImage;
    const img = new Image();
    img.src = newImage;

    img.onload = () => {
      this.currentImage = newImage;
      requestAnimationFrame(() => {
        this.isTransitioning = true;
        this.cdr.detectChanges();
      });
      setTimeout(() => {
        this.isTransitioning = false;
      }, 900);
    };
  }

  /* =========================
     ✅ ABOUT SECTION ANIMATION
  ========================= */

  private initAboutAnimation(): void {
    gsap.from('.about-left', {
      y: 60,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 75%'
      }
    });

    gsap.from('.feature-card', {
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.8,
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 75%'
      }
    });
  }

  /* =========================
     ✅ NEW FEATURES: HEADER FADE-IN
  ========================= */

  private initFeaturesHeaderAnimation(): void {
    if (!this.featuresHeader) return;

    gsap.to(this.featuresHeader.nativeElement, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: this.featuresHeader.nativeElement,
        start: 'top 80%',
      }
    });

    // Animate eyebrow, title lines, subtitle staggered
    gsap.from(
      this.featuresHeader.nativeElement.querySelectorAll(
        '.features-eyebrow, .features-title, .features-subtitle'
      ),
      {
        y: 30,
        opacity: 0,
        stagger: 0.15,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: this.featuresHeader.nativeElement,
          start: 'top 80%',
        }
      }
    );
  }

  /* =========================
     ✅ NEW FEATURES: IMAGE COMPARISON REVEAL (SCROLL)
  ========================= */

  private initComparisonScroll(): void {
    if (!this.comparisonSection || !this.afterImage || !this.afterImg || !this.divider || !this.afterLabel) return;

    const section = this.comparisonSection.nativeElement;
    const after = this.afterImage.nativeElement;
    const afterImgEl = this.afterImg.nativeElement;
    const dividerEl = this.divider.nativeElement;
    const afterLabelEl = this.afterLabel.nativeElement;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'center center',
        end: () => '+=' + section.offsetWidth,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Show divider handle once reveal starts
          if (self.progress > 0.05 && self.progress < 0.95) {
            gsap.set(dividerEl, { opacity: 1 });
          } else {
            gsap.set(dividerEl, { opacity: 0 });
          }
        }
      }
    });

    // Core reveal — after panel slides in from right, image counter-translates
    tl.fromTo(after, { xPercent: 100, x: 0 }, { xPercent: 0 })
      .fromTo(afterImgEl, { xPercent: -100, x: 0 }, { xPercent: 0 }, 0);

    // Divider tracks the reveal edge
    tl.fromTo(dividerEl, { left: '100%' }, { left: '0%' }, 0);

    // After label fades in during second half of reveal
    tl.fromTo(afterLabelEl, { opacity: 0, x: 30 }, { opacity: 1, x: 0, ease: 'power2.out' }, 0.5);
  }

  /* =========================
     ✅ NEW FEATURES: PILLS STAGGER ANIMATION
  ========================= */

  private initFeaturesPillsAnimation(): void {
    if (!this.featuresPills) return;

    const pillsEl = this.featuresPills.nativeElement;

    gsap.to(pillsEl, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      scrollTrigger: {
        trigger: pillsEl,
        start: 'top 85%',
      }
    });

    gsap.from(pillsEl.querySelectorAll('.pill'), {
      y: 20,
      opacity: 0,
      stagger: 0.07,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: pillsEl,
        start: 'top 85%',
      }
    });
  }
}
