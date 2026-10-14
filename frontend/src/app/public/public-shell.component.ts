import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from '../shared/footer.component';

/** Layout for customer-facing pages: no login, no sidebar. */
@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, FooterComponent],
  host: { class: 'home-page' },
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <a routerLink="/" class="brand-link" aria-label="Home">
        <mat-icon>storefront</mat-icon>
        <span class="brand">Cafe Management System</span>
      </a>
      <span class="spacer"></span>
      <a mat-button routerLink="/online/menu" routerLinkActive="toolbar-active">
        <mat-icon>restaurant_menu</mat-icon><span class="hide-xs">Menu</span>
      </a>
      <a mat-button routerLink="/online/track" routerLinkActive="toolbar-active">
        <mat-icon>local_shipping</mat-icon><span class="hide-xs">Track Order</span>
      </a>
    </mat-toolbar>
    <main class="public-content">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class PublicShellComponent {}
