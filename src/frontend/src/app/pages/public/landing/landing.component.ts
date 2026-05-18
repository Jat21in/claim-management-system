import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import lottie from 'lottie-web';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef) {} 

 title = 'Manage Claims.';
subtitle = 'Faster. Smarter. Simpler.';

displayTitle = '';
displaySubtitle = '';

ngOnInit() {
  this.startTyping();

  
lottie.loadAnimation({
    container: document.getElementById('lottie-container') as HTMLElement,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'lottie/doctor.json'
  });
}

startTyping() {
    this.displayTitle = '';
    this.displaySubtitle = '';

    let i = 0;

    const typeTitle = setInterval(() => {
      if (i < this.title.length) {
        this.displayTitle += this.title[i];
        i++;
      } else {
        clearInterval(typeTitle);
        this.typeSubtitle();
      }
    }, 60);
  }


typeSubtitle() {
  let j = 0;

  const typeSub = setInterval(() => {
    if (j < this.subtitle.length) {
      this.displaySubtitle += this.subtitle[j];
      j++;
      this.cdr.detectChanges();
    } else {
      clearInterval(typeSub);

      setTimeout(() => {
        this.displayTitle = '',
        this.displaySubtitle = '',
        this.startTyping();
      }, 2000);
    }
  }, 40);
}

deleteSubtitle() {
    let j = this.displaySubtitle.length;

    const delSub = setInterval(() => {
      if (j > 0) {
        this.displaySubtitle = this.displaySubtitle.slice(0, j - 1);
        j--;
      } else {
        clearInterval(delSub);
        this.deleteTitle();
      }
    }, 30);
  }

deleteTitle() {
    let i = this.displayTitle.length;

    const delTitle = setInterval(() => {
      if (i > 0) {
        this.displayTitle = this.displayTitle.slice(0, i - 1);
        i--;
      } else {
        clearInterval(delTitle);

        // ✅ RESTART LOOP
        this.startTyping();
      }
    }, 40);
  }

}
