import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoginDialogComponent } from './login-dialog.component';
import { SignupDialogComponent } from './signup-dialog.component';
import { ForgotPasswordDialogComponent } from './forgot-password-dialog.component';
import { FooterComponent } from '../../shared/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatToolbarModule, FooterComponent],
  host: { class: 'home-page' },
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <mat-icon>storefront</mat-icon>
      <span class="brand">Cafe Management System</span>
      <span class="spacer"></span>
      <a mat-button routerLink="/online/menu"><mat-icon>shopping_bag</mat-icon> Order Online</a>
      <button mat-button (click)="openSignup()">Signup</button>
      <button mat-button (click)="openForgot()">Forgot Password?</button>
      <button mat-button (click)="openLogin()">Login</button>
    </mat-toolbar>

    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">Fresh coffee · bakery · light food</p>
        <h1>Order ahead, skip the queue.</h1>
        <p class="lead">
          Browse our menu, order online for pickup or delivery, and follow your order live.
          No account needed — pay when you receive it.
        </p>
        <div class="hero-actions">
          <a mat-flat-button color="primary" routerLink="/online/menu"><mat-icon>shopping_bag</mat-icon> Order online</a>
          <a mat-stroked-button routerLink="/online/track">Track my order</a>
        </div>
        <p class="staff-line muted">Staff? <button type="button" class="link-btn" (click)="openLogin()">Log in</button> ·
          <button type="button" class="link-btn" (click)="openSignup()">Create staff account</button></p>
      </div>
      <ul class="feature-list">
        <li><mat-icon>restaurant_menu</mat-icon><div><b>1. Choose</b><span>Pick drinks and food from our live menu</span></div></li>
        <li><mat-icon>shopping_bag</mat-icon><div><b>2. Order</b><span>Pickup or delivery, just your name and phone</span></div></li>
        <li><mat-icon>local_shipping</mat-icon><div><b>3. Track</b><span>Follow your order with your personal code</span></div></li>
        <li><mat-icon>payments</mat-icon><div><b>4. Pay</b><span>Cash or card when you receive your order</span></div></li>
      </ul>
    </section>
    <app-footer />
  `,
})
export class HomeComponent {
  private dialog = inject(MatDialog);

  openLogin(): void { this.dialog.open(LoginDialogComponent, { width: '420px' }); }
  openSignup(): void { this.dialog.open(SignupDialogComponent, { width: '480px' }); }
  openForgot(): void { this.dialog.open(ForgotPasswordDialogComponent, { width: '420px' }); }
}
