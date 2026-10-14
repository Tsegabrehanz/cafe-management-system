import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <footer class="app-footer">
      <div class="footer-brand">
        <mat-icon>storefront</mat-icon>
        <span>© {{ year }} Cafe Management System. All rights reserved.</span>
      </div>
      <div class="footer-meta">
        <span>Built with Angular &amp; Spring Boot</span>
        <span class="dot">•</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
