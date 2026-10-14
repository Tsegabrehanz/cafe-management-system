import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../core/notify.service';
import { Dashboard } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Dashboard</h1>
      <span class="spacer"></span>
      <span class="muted">Welcome, {{ auth.name() }}</span>
    </mat-card>

    @if (data(); as d) {
      <div class="stat-grid">
        <mat-card class="stat-card">
          <mat-icon class="stat-icon">category</mat-icon>
          <div class="stat-label">Total Category</div>
          <div class="stat-value">{{ d.category }}</div>
          @if (auth.isAdmin()) { <a mat-flat-button color="primary" routerLink="/cafe/category">View Category</a> }
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon">inventory_2</mat-icon>
          <div class="stat-label">Total Product</div>
          <div class="stat-value">{{ d.product }}</div>
          @if (auth.isAdmin()) { <a mat-flat-button color="primary" routerLink="/cafe/product">View Product</a> }
        </mat-card>
        <mat-card class="stat-card" [class.stat-alert]="d.pendingOnlineOrders > 0">
          <mat-icon class="stat-icon">delivery_dining</mat-icon>
          <div class="stat-label">New Online Orders</div>
          <div class="stat-value">{{ d.pendingOnlineOrders }}</div>
          <a mat-flat-button color="primary" routerLink="/cafe/online-orders">View Orders</a>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon">backup_table</mat-icon>
          <div class="stat-label">Total Bill</div>
          <div class="stat-value">{{ d.bill }}</div>
          <a mat-flat-button color="primary" routerLink="/cafe/bill">View Bill</a>
        </mat-card>
        @if (auth.isAdmin()) {
          <mat-card class="stat-card">
            <mat-icon class="stat-icon">people</mat-icon>
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ d.user }}</div>
            <a mat-flat-button color="primary" routerLink="/cafe/user">View Users</a>
          </mat-card>
        }
      </div>
    } @else {
      <div class="center-spinner"><mat-spinner diameter="40" /></div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  readonly data = signal<Dashboard | null>(null);

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: d => this.data.set(d),
      error: err => this.notify.fromHttp(err),
    });
  }
}
