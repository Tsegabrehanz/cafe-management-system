import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/auth.service';
import { OnlineOrderAlertsService } from '../core/online-order-alerts.service';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { FooterComponent } from '../shared/footer.component';

interface NavItem { path: string; label: string; icon: string; adminOnly: boolean; }

const NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', adminOnly: false },
  { path: 'category', label: 'Manage Category', icon: 'category', adminOnly: true },
  { path: 'product', label: 'Manage Product', icon: 'inventory_2', adminOnly: true },
  { path: 'order', label: 'Manage Order', icon: 'shopping_cart', adminOnly: false },
  { path: 'online-orders', label: 'Online Orders', icon: 'delivery_dining', adminOnly: false },
  { path: 'bill', label: 'View Bill', icon: 'backup_table', adminOnly: false },
  { path: 'user', label: 'Manage Users', icon: 'people', adminOnly: true },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, FooterComponent],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Toggle menu"><mat-icon>menu</mat-icon></button>
      <mat-icon>storefront</mat-icon>
      <span class="brand">Cafe Management System</span>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Account">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
        <div class="menu-user" mat-menu-item disabled>
          <mat-icon>person</mat-icon>{{ auth.name() }}{{ auth.isAdmin() ? ' (admin)' : '' }}
        </div>
        <mat-divider />
        <button mat-menu-item (click)="changePassword()"><mat-icon>key</mat-icon>Change Password</button>
        <button mat-menu-item (click)="logout()"><mat-icon>logout</mat-icon>Logout</button>
      </mat-menu>
    </mat-toolbar>

    <mat-sidenav-container class="shell">
      <mat-sidenav #drawer class="sidenav" [mode]="isHandset() ? 'over' : 'side'" [opened]="!isHandset()">
        <mat-nav-list>
          @for (item of nav(); track item.path) {
            <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link"
               (click)="isHandset() && drawer.close()">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}
                @if (item.path === 'online-orders' && alerts.pending()) {
                  <span class="nav-badge" [attr.aria-label]="alerts.pending() + ' new online orders'">{{ alerts.pending() }}</span>
                }
              </span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="content">
        <main class="page">
          <router-outlet />
        </main>
        <app-footer />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly alerts = inject(OnlineOrderAlertsService);
  private dialog = inject(MatDialog);

  readonly isHandset = toSignal(
    inject(BreakpointObserver).observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(map(r => r.matches)),
    { initialValue: false },
  );

  readonly nav = computed(() => NAV.filter(n => !n.adminOnly || this.auth.isAdmin()));

  ngOnInit(): void { this.alerts.start(); }

  ngOnDestroy(): void { this.alerts.stop(); }

  changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '420px' });
  }

  logout(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Logout', message: 'Are you sure you want to logout?', confirmText: 'Logout' },
    }).afterClosed().subscribe(ok => { if (ok) this.auth.logout(); });
  }
}
