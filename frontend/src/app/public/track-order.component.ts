import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../core/api.service';
import { NotifyService } from '../core/notify.service';
import { OrderStatus, TrackedOrder } from '../core/models';
import { environment } from '../../environments/environment';
import { SavedOrder, loadMyOrders } from './my-orders';

const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'Received', icon: 'receipt' },
  { status: 'ACCEPTED', label: 'Preparing', icon: 'soup_kitchen' },
  { status: 'READY', label: 'Ready', icon: 'room_service' },
  { status: 'COMPLETED', label: 'Done', icon: 'task_alt' },
];

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressBarModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Track Your Order</h1>
      <span class="spacer"></span>
      <a mat-button color="primary" routerLink="/online/menu"><mat-icon>restaurant_menu</mat-icon> Menu</a>
    </mat-card>

    <mat-card class="filter-card track-form">
      <form (submit)="$event.preventDefault(); go(codeInput.value)">
        <mat-form-field class="filter">
          <mat-label>Order code</mat-label>
          <input matInput #codeInput [value]="code() ?? ''" placeholder="e.g. K7M2Q9XA" maxlength="12"
                 autocapitalize="characters" autocomplete="off" required>
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit">Track</button>
      </form>
      @if (recent.length && !order()) {
        <div class="recent">
          <span class="muted">Your recent orders:</span>
          @for (r of recent; track r.code) {
            <a mat-stroked-button [routerLink]="['/online/track', r.code]">{{ r.code }}</a>
          }
        </div>
      }
    </mat-card>

    @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

    @if (notFound()) {
      <mat-card class="panel"><p>We couldn't find an order with code <b>{{ code() }}</b>. Please check the code and try again.</p></mat-card>
    }

    @if (order(); as o) {
      <mat-card class="panel track-card">
        <div class="track-head">
          <div>
            <div class="muted small">Order {{ o.code }} · {{ o.orderType === 'DELIVERY' ? 'Delivery' : 'Pickup' }}</div>
            <h2 class="track-message">{{ message() }}</h2>
          </div>
          <div class="muted small">Updated {{ o.updatedAt | date: 'HH:mm' }}</div>
        </div>

        @if (o.status === 'CANCELLED') {
          <div class="cancelled-banner"><mat-icon>cancel</mat-icon> This order was cancelled.</div>
        } @else {
          <ol class="steps">
            @for (s of steps; track s.status; let i = $index) {
              <li [class.done]="i <= stepIndex()" [class.current]="i === stepIndex()">
                <span class="step-dot"><mat-icon>{{ s.icon }}</mat-icon></span>
                <span class="step-label">{{ s.status === 'READY' && o.orderType === 'DELIVERY' ? 'On the way' : s.label }}</span>
              </li>
            }
          </ol>
        }

        <ul class="cart-lines">
          @for (l of o.items; track l.productId) {
            <li>
              <span class="cart-qty">{{ l.quantity }}×</span>
              <span class="cart-name">{{ l.name }}</span>
              <span class="cart-price">{{ l.total | currency: currency }}</span>
            </li>
          }
        </ul>
        <div class="cart-total"><span>Total</span><b>{{ o.total | currency: currency }}</b></div>
        <p class="muted small">Ordered {{ o.createdAt | date: 'dd.MM.yyyy HH:mm' }} by {{ o.customerName }}.
          @if (!isFinal()) { This page refreshes automatically. }</p>
      </mat-card>
    }
  `,
})
export class TrackOrderComponent {
  /** From the route /online/track/:code */
  readonly codeParam = input<string | undefined>(undefined, { alias: 'code' });

  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly currency = environment.currency;
  readonly steps = STEPS;
  readonly recent: SavedOrder[] = loadMyOrders();

  readonly code = signal<string | null>(null);
  readonly order = signal<TrackedOrder | null>(null);
  readonly loading = signal(false);
  readonly notFound = signal(false);
  private poll?: Subscription;

  readonly stepIndex = computed(() => STEPS.findIndex(s => s.status === this.order()?.status));
  readonly isFinal = computed(() => ['COMPLETED', 'CANCELLED'].includes(this.order()?.status ?? ''));
  readonly message = computed(() => {
    const o = this.order();
    if (!o) return '';
    switch (o.status) {
      case 'PENDING': return 'We received your order and will confirm it shortly.';
      case 'ACCEPTED': return 'Your order is being prepared.';
      case 'READY': return o.orderType === 'DELIVERY' ? 'Your order is on its way!' : 'Your order is ready for pickup!';
      case 'COMPLETED': return 'Enjoy! Thank you for ordering with us.';
      case 'CANCELLED': return 'Please call us if you have any questions.';
    }
  });

  constructor() {
    // load whenever the code in the URL changes (also when the page is reused)
    effect(() => {
      const c = this.codeParam()?.trim().toUpperCase();
      if (c) untracked(() => this.load(c));
    });
  }

  go(raw: string): void {
    const c = raw.trim().toUpperCase();
    if (!c) return;
    if (c === this.codeParam()?.trim().toUpperCase()) this.load(c);   // same URL: just refresh
    else this.router.navigate(['/online/track', c]);
  }

  private load(c: string): void {
    this.code.set(c.toUpperCase());
    this.notFound.set(false);
    this.loading.set(true);
    this.fetch(true);
    this.poll?.unsubscribe();
    this.poll = interval(15000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (!this.isFinal()) this.fetch(false);
    });
  }

  private fetch(showErrors: boolean): void {
    const c = this.code();
    if (!c) return;
    this.api.trackOrder(c).subscribe({
      next: o => { this.order.set(o); this.loading.set(false); },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        if (e.status === 404) { this.order.set(null); this.notFound.set(true); this.poll?.unsubscribe(); }
        else if (showErrors) this.notify.fromHttp(e);
      },
    });
  }
}
