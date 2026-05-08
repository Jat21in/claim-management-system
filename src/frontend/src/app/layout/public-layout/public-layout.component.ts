import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'public-layout',
  standalone: true,
  imports: [RouterOutlet],   // ✅ REQUIRED
  templateUrl: './public-layout.component.html',
})
export class PublicLayoutComponent {}
