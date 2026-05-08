import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],   // ✅ REQUIRED
  templateUrl: './app-layout.component.html',
})

export class AppLayoutComponent {}
