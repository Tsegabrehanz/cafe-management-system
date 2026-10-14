import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../core/api.service';
import { NotifyService } from '../core/notify.service';
import { MenuCategory, MenuProduct, OrderType, PlaceOrderResponse } from '../core/models';
import { PHONE_PATTERN } from '../shared/validators';
import { environment } from '../../environments/environment';
import { rememberOrder } from './my-orders';

interface CartLine { product: MenuProduct; quantity: number; }

const MAX_QTY = 50;

@Component({
  selector: 'app-online-menu',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatButtonToggleModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    @if (placed(); as p) {
      <!-- ---------------------------------------------------- confirmation -->
      <mat-card class="confirm-card">
        <mat-icon class="confirm-icon">check_circle</mat-icon>
        <h1>Thank you, your order is placed!</h1>
        <p class="muted">Keep this code to follow your order:</p>
        <div class="order-code">{{ p.code }}</div>
        <p>Total to pay on {{ lastType() === 'DELIVERY' ? 'delivery' : 'pickup' }}: <b>{{ p.total | currency: currency }}</b></p>
        <div class="confirm-actions">
          <a mat-flat-button color="primary" [routerLink]="['/online/track', p.code]"><mat-icon>local_shipping</mat-icon> Track my order</a>
          <button mat-stroked-button (click)="placed.set(null)">Order something else</button>
        </div>
      </mat-card>
    } @else {
      <mat-card class="header-card">
        <h1 class="title">Order Online</h1>
        <span class="spacer"></span>
        <span class="muted hide-xs">Pickup or delivery · pay when you receive your order</span>
      </mat-card>

      @if (loading()) {
        <div class="center-spinner"><mat-spinner diameter="40" /></div>
      } @else if (!menu().length) {
        <mat-card class="panel empty-menu">
          <mat-icon>no_meals</mat-icon>
          <p>Online ordering is not available right now. Please visit us or call.</p>
        </mat-card>
      } @else {
        <div class="shop-grid">
          <!-- ---------------------------------------------------- menu -->
          <section>
            <mat-card class="filter-card shop-filters">
              <mat-chip-listbox aria-label="Category" [value]="activeCategory()" (change)="activeCategory.set($event.value ?? 0)">
                <mat-chip-option [value]="0">All</mat-chip-option>
                @for (c of menu(); track c.id) { <mat-chip-option [value]="c.id">{{ c.name }}</mat-chip-option> }
              </mat-chip-listbox>
              <mat-form-field class="filter">
                <mat-label>Search the menu</mat-label>
                <input matInput [value]="search()" (input)="search.set($any($event.target).value)">
              </mat-form-field>
            </mat-card>

            @for (c of visibleMenu(); track c.id) {
              <h2 class="menu-category">{{ c.name }}</h2>
              <div class="product-grid">
                @for (p of c.products; track p.id) {
                  <mat-card class="product-card">
                    <div class="product-info">
                      <div class="product-name">{{ p.name }}</div>
                      @if (p.description) { <div class="product-desc">{{ p.description }}</div> }
                    </div>
                    <div class="product-buy">
                      <span class="product-price">{{ p.price | currency: currency }}</span>
                      @if (qty(p.id); as q) {
                        <div class="stepper">
                          <button mat-icon-button color="primary" (click)="change(p, -1)" [attr.aria-label]="'Remove one ' + p.name"><mat-icon>remove_circle_outline</mat-icon></button>
                          <span class="stepper-qty">{{ q }}</span>
                          <button mat-icon-button color="primary" (click)="change(p, 1)" [attr.aria-label]="'Add one ' + p.name"><mat-icon>add_circle_outline</mat-icon></button>
                        </div>
                      } @else {
                        <button mat-flat-button color="primary" (click)="change(p, 1)">Add</button>
                      }
                    </div>
                  </mat-card>
                }
              </div>
            } @empty {
              <p class="muted">Nothing matches "{{ search() }}".</p>
            }
          </section>

          <!-- ---------------------------------------------------- cart & checkout -->
          <aside id="cart">
            <mat-card class="panel cart-card">
              @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
              <h2 class="panel-title"><mat-icon>shopping_bag</mat-icon> Your order</h2>

              @if (!cart().length) {
                <p class="muted">Your cart is empty. Add something from the menu.</p>
              } @else {
                <ul class="cart-lines">
                  @for (l of cart(); track l.product.id) {
                    <li>
                      <span class="cart-qty">{{ l.quantity }}×</span>
                      <span class="cart-name">{{ l.product.name }}</span>
                      <span class="cart-price">{{ l.product.price * l.quantity | currency: currency }}</span>
                      <button mat-icon-button (click)="remove(l)" [attr.aria-label]="'Remove ' + l.product.name"><mat-icon>close</mat-icon></button>
                    </li>
                  }
                </ul>
                <div class="cart-total"><span>Total</span><b>{{ total() | currency: currency }}</b></div>

                <form [formGroup]="form" (ngSubmit)="submit()" class="checkout">
                  <mat-button-toggle-group formControlName="orderType" class="type-toggle" aria-label="Pickup or delivery">
                    <mat-button-toggle value="PICKUP"><mat-icon>storefront</mat-icon> Pickup</mat-button-toggle>
                    <mat-button-toggle value="DELIVERY"><mat-icon>delivery_dining</mat-icon> Delivery</mat-button-toggle>
                  </mat-button-toggle-group>

                  <mat-form-field>
                    <mat-label>Your name</mat-label>
                    <input matInput formControlName="customerName" autocomplete="name" required>
                    <mat-error>Please enter your name</mat-error>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Phone number</mat-label>
                    <input matInput formControlName="contactNumber" type="tel" autocomplete="tel" required>
                    <mat-hint>We'll call if there's a question about your order</mat-hint>
                    <mat-error>Please enter a valid phone number</mat-error>
                  </mat-form-field>
                  <mat-form-field>
                    <mat-label>Email (optional)</mat-label>
                    <input matInput formControlName="email" type="email" autocomplete="email">
                    <mat-error>Please enter a valid email</mat-error>
                  </mat-form-field>
                  @if (form.value.orderType === 'DELIVERY') {
                    <mat-form-field>
                      <mat-label>Delivery address</mat-label>
                      <textarea matInput formControlName="address" rows="2" autocomplete="street-address" required></textarea>
                      <mat-error>Please enter your address</mat-error>
                    </mat-form-field>
                  }
                  <mat-form-field>
                    <mat-label>Note for the kitchen (optional)</mat-label>
                    <input matInput formControlName="note" maxlength="300">
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit" class="place-btn" [disabled]="busy()">
                    Place order · {{ total() | currency: currency }}
                  </button>
                  <p class="muted small">Payment is made in cash or by card when you receive your order.</p>
                </form>
              }
            </mat-card>
          </aside>
        </div>

        @if (cart().length) {
          <a class="mobile-cart-bar" href="#cart">
            <mat-icon>shopping_bag</mat-icon>
            <span>View order ({{ count() }})</span>
            <b>{{ total() | currency: currency }}</b>
          </a>
        }
      }
    }
  `,
})
export class OnlineMenuComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private fb = inject(FormBuilder);

  readonly currency = environment.currency;
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly menu = signal<MenuCategory[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly activeCategory = signal(0);
  readonly search = signal('');
  readonly placed = signal<PlaceOrderResponse | null>(null);
  readonly lastType = signal<OrderType>('PICKUP');

  readonly total = computed(() => this.cart().reduce((s, l) => s + l.product.price * l.quantity, 0));
  readonly count = computed(() => this.cart().reduce((s, l) => s + l.quantity, 0));

  readonly visibleMenu = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.menu()
      .filter(c => !this.activeCategory() || c.id === this.activeCategory())
      .map(c => ({
        ...c,
        products: c.products.filter(p => !term
          || p.name.toLowerCase().includes(term)
          || (p.description ?? '').toLowerCase().includes(term)),
      }))
      .filter(c => c.products.length);
  });

  readonly form = this.fb.nonNullable.group({
    orderType: ['PICKUP' as OrderType],
    customerName: ['', [Validators.required, Validators.maxLength(100)]],
    contactNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', Validators.email],
    address: ['', Validators.maxLength(300)],
    note: ['', Validators.maxLength(300)],
  });

  ngOnInit(): void {
    this.api.getPublicMenu().subscribe({
      next: m => { this.menu.set(m); this.loading.set(false); },
      error: e => { this.loading.set(false); this.notify.fromHttp(e, 'Could not load the menu.'); },
    });
    // address is only required for delivery
    this.form.controls.orderType.valueChanges.subscribe(t => {
      const address = this.form.controls.address;
      address.setValidators(t === 'DELIVERY' ? [Validators.required, Validators.maxLength(300)] : [Validators.maxLength(300)]);
      address.updateValueAndValidity();
    });
  }

  qty(productId: number): number {
    return this.cart().find(l => l.product.id === productId)?.quantity ?? 0;
  }

  change(p: MenuProduct, delta: number): void {
    this.cart.update(lines => {
      const line = lines.find(l => l.product.id === p.id);
      if (!line) return delta > 0 ? [...lines, { product: p, quantity: 1 }] : lines;
      const q = Math.min(MAX_QTY, line.quantity + delta);
      return q <= 0 ? lines.filter(l => l !== line) : lines.map(l => l === line ? { ...l, quantity: q } : l);
    });
  }

  remove(line: CartLine): void {
    this.cart.update(lines => lines.filter(l => l !== line));
  }

  submit(): void {
    if (this.form.invalid || !this.cart().length) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.busy.set(true);
    this.api.placeOrder({
      customerName: v.customerName.trim(),
      contactNumber: v.contactNumber.trim(),
      email: v.email.trim() || undefined,
      orderType: v.orderType,
      address: v.orderType === 'DELIVERY' ? v.address.trim() : undefined,
      note: v.note.trim() || undefined,
      items: this.cart().map(l => ({ productId: l.product.id, quantity: l.quantity })),
    }).subscribe({
      next: res => {
        this.busy.set(false);
        rememberOrder(res.code, res.total);
        this.lastType.set(v.orderType);
        this.placed.set(res);
        this.cart.set([]);
        this.form.reset({ orderType: v.orderType, customerName: v.customerName, contactNumber: v.contactNumber,
          email: v.email, address: v.address, note: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: e => { this.busy.set(false); this.notify.fromHttp(e, 'Your order could not be placed. Please try again.'); },
    });
  }
}
