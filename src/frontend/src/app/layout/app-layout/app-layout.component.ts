import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {}
