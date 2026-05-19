import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-animated-testimonials',
  templateUrl: './testimonial.html',
  styleUrls: ['./testimonials.scss']
})
export class AnimatedTestimonialsComponent implements OnInit, OnDestroy {
  @Input() testimonials: Testimonial[] = [];
  @Input() autoplay: boolean = false;

  active: number = 0;
  private intervalId: any;


ngOnInit() {
  if (!this.testimonials?.length) return;

  if (this.autoplay) {
    this.startAutoplay();
  }
}


  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  handleNext() {
  if (!this.testimonials.length) return;

  this.active = (this.active + 1) % this.testimonials.length;

  if (this.autoplay) this.resetAutoplay();
}

handlePrev() {
  if (!this.testimonials.length) return;

  this.active = (this.active - 1 + this.testimonials.length) % this.testimonials.length;

  if (this.autoplay) this.resetAutoplay();
}

  isActive(index: number): boolean {
    return index === this.active;
  }

  randomRotateY(): number {
    return Math.floor(Math.random() * 21) - 10;
  }

  private startAutoplay() {
    this.intervalId = setInterval(() => {
      this.handleNext();
    }, 3000);
  }

  private resetAutoplay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.startAutoplay();
    }
  }

  splitQuote(quote: string): string[] {
    return quote.split(' ');
  }
}
