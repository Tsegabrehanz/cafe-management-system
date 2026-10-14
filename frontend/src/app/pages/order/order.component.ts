import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService, saveBlob } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Category, Product } from '../../core/models';
import { PHONE_PATTERN } from '../../shared/validators';

interface CartLine { product: Product; quantity: number; }

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, MatProgressBarModule],
  template: `
    <mat-card class="header-card">
      <h1 class="title">Manage Order</h1>
      <span class="spacer"></span>
      <button mat-flat-button color="primary" (click)="submit()" [disabled]="!canSubmit()">Submit & Get Bill</button>
    </mat-card>
    @if (busy()) { <mat-progress-bar mode="indeterminate" /> }

    <mat-card class="panel">
      <h2 class="panel-title">Customer Details:</h2>
      <form [formGroup]="customer" class="form-grid">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error>Name is required</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
          <mat-error>Enter a valid email</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Contact Number</mat-label>
          <input matInput formControlName="contactNumber" type="tel">
          <mat-error>Enter a valid phone number</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Payment Method</mat-label>
          <mat-select formControlName="paymentMethod" required>
            @for (m of paymentMethods; track m) { <mat-option [value]="m">{{ m }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-card>

    <mat-card class="panel">
      <h2 class="panel-title">Select Product:</h2>
      <form [formGroup]="picker" (ngSubmit)="add()">
        <div class="form-grid">
          <mat-form-field>
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId" (selectionChange)="loadProducts($event.value)">
              @for (c of categories(); track c.id) { <mat-option [value]="c.id">{{ c.name }}</mat-option> }
            </mat-select>
            @if (!categories().length) { <mat-hint>No products are available yet</mat-hint> }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Product</mat-label>
            <mat-select formControlName="productId">
              @for (p of products(); track p.id) { <mat-option [value]="p.id">{{ p.name }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Price</mat-label>
            <input matInput [value]="selected() ? (selected()!.price | number: '1.2-2') : ''" readonly>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Quantity</mat-label>
            <input matInput type="number" min="1" max="999" formControlName="quantity">
            @if (selected(); as p) { <mat-hint>Total: {{ p.price * (picker.value.quantity || 0) | number: '1.2-2' }}</mat-hint> }
          </mat-form-field>
        </div>
        <div class="picker-actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="picker.invalid">Add</button>
          <span class="order-total">Total Amount: {{ total() | number: '1.2-2' }}</span>
        </div>
      </form>
    </mat-card>

    <mat-card class="table-card">
      <div class="table-scroll">
        <table mat-table [dataSource]="cart()" class="template-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let l">{{ l.product.name }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let l">{{ l.product.categoryName }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let l">{{ l.product.price | number: '1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Quantity</th>
            <td mat-cell *matCellDef="let l" class="qty-cell">
              <button mat-icon-button color="primary" (click)="changeQty(l, -1)" aria-label="Decrease"><mat-icon>remove</mat-icon></button>
              {{ l.quantity }}
              <button mat-icon-button color="primary" (click)="changeQty(l, 1)" aria-label="Increase"><mat-icon>add</mat-icon></button>
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let l">{{ l.product.price * l.quantity | number: '1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Delete</th>
            <td mat-cell *matCellDef="let l" class="action-cell">
              <button mat-icon-button color="primary" matTooltip="Delete" (click)="removeLine(l)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow><td class="mat-cell empty" [attr.colspan]="columns.length">No products added yet.</td></tr>
        </table>
      </div>
    </mat-card>
  `,
})
export class OrderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  readonly paymentMethods = ['Cash', 'Card', 'Mobile payment'];
  readonly columns = ['name', 'category', 'price', 'quantity', 'total', 'action'];

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly busy = signal(false);
  private readonly selectedId = signal<number | null>(null);

  readonly selected = computed(() => this.products().find(p => p.id === this.selectedId()) ?? null);
  readonly total = computed(() => this.cart().reduce((s, l) => s + l.product.price * l.quantity, 0));

  readonly customer = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', Validators.email],
    contactNumber: ['', Validators.pattern(PHONE_PATTERN)],
    paymentMethod: ['Cash', Validators.required],
  });

  readonly picker = this.fb.group({
    categoryId: [null as number | null, Validators.required],
    productId: [null as number | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
  });

  private readonly formState = signal(0);   // bumps when the customer form changes, for canSubmit()
  readonly canSubmit = computed(() => {
    this.formState();
    return this.cart().length > 0 && this.customer.valid && !this.busy();
  });

  ngOnInit(): void {
    this.api.getCategories(true).subscribe({ next: c => this.categories.set(c), error: e => this.notify.fromHttp(e) });
    this.customer.statusChanges.subscribe(() => this.formState.update(n => n + 1));
    this.picker.controls.productId.valueChanges.subscribe(id => this.selectedId.set(id));
  }

  loadProducts(categoryId: number): void {
    this.picker.patchValue({ productId: null, quantity: 1 });
    this.api.getProductsByCategory(categoryId).subscribe({
      next: p => this.products.set(p),
      error: e => this.notify.fromHttp(e),
    });
  }

  add(): void {
    const p = this.selected();
    const qty = Number(this.picker.value.quantity);
    if (!p || !qty) return;
    this.cart.update(lines => {
      const existing = lines.find(l => l.product.id === p.id);
      if (existing) {
        return lines.map(l => l === existing ? { ...l, quantity: Math.min(999, l.quantity + qty) } : l);
      }
      return [...lines, { product: p, quantity: qty }];
    });
    this.picker.patchValue({ productId: null, quantity: 1 });
  }

  changeQty(line: CartLine, delta: number): void {
    const q = line.quantity + delta;
    if (q < 1) return this.removeLine(line);
    this.cart.update(lines => lines.map(l => l === line ? { ...l, quantity: Math.min(999, q) } : l));
  }

  removeLine(line: CartLine): void {
    this.cart.update(lines => lines.filter(l => l !== line));
  }

  submit(): void {
    if (!this.canSubmit()) { this.customer.markAllAsTouched(); return; }
    const c = this.customer.getRawValue();
    this.busy.set(true);
    this.api.generateBill({
      name: c.name.trim(),
      email: c.email.trim() || undefined,
      contactNumber: c.contactNumber.trim() || undefined,
      paymentMethod: c.paymentMethod,
      items: this.cart().map(l => ({ productId: l.product.id, quantity: l.quantity })),
    }).subscribe({
      next: res => {
        this.api.getBillPdf(res.uuid).subscribe({
          next: blob => saveBlob(blob, `${res.uuid}.pdf`),
          error: e => this.notify.fromHttp(e, 'Bill saved, but the PDF could not be downloaded.'),
        });
        this.notify.success('Bill generated.');
        this.cart.set([]);
        this.customer.reset({ name: '', email: '', contactNumber: '', paymentMethod: 'Cash' });
        this.busy.set(false);
      },
      error: e => { this.busy.set(false); this.notify.fromHttp(e); },
    });
  }
}
