import { Component, AfterViewInit, ElementRef, ViewChild, Input, HostBinding } from '@angular/core';
import lottie from 'lottie-web';

@Component({
  selector: 'app-auth-visual',
  standalone: true,
  templateUrl: './auth-visual.component.html',
  styleUrls: ['./auth-visual.component.scss']
})
export class AuthVisualComponent implements AfterViewInit {

  @Input() mode: 'login' | 'register' = 'login';

  @HostBinding('class.register')
  get isRegister(): boolean {
    return this.mode === 'register';
  }

  @ViewChild('lottieContainer', { static: true })
  lottieContainer!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    lottie.loadAnimation({
      container: this.lottieContainer.nativeElement,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/lottie/cms-flow.json',
    });
  }
}
