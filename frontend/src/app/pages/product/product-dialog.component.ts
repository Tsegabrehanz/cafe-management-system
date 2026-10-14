import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Category, Product } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit product' : 'Add product' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error>Name is required</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId" required>
            @for (c of categories(); track c.id) { <mat-option [value]="c.id">{{ c.name }}</mat-option> }
          </mat-select>
          @if (!categories().length) { <mat-hint>Add a category first</mat-hint> }
          <mat-error>Choose a category</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Price ({{ currency }})</mat-label>
          <input matInput type="number" min="0" step="0.01" formControlName="price" required>
          <mat-error>Enter a price of 0 or more</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">{{ data ? 'Update' : 'Add' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ProductDialogComponent implements OnInit {
  readonly data = inject<Product | null>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private ref = inject(MatDialogRef<ProductDialogComponent>);

  readonly currency = environment.currency;
  readonly busy = signal(false);
  readonly categories = signal<Category[]>([]);

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    categoryId: [this.data?.categoryId ?? null as number | null, Validators.required],
    price: [this.data?.price ?? null as number | null, [Validators.required, Validators.min(0)]],
    description: [this.data?.description ?? '', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: c => this.categories.set(c), error: e => this.notify.fromHttp(e) });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body = {
      name: v.name!.trim(),
      categoryId: v.categoryId!,
      price: Number(v.price),
      description: v.description?.trim() || null,
    };
    this.busy.set(true);
    const call = this.data ? this.api.updateProduct({ id: this.data.id, ...body }) : this.api.addProduct(body);
    call.subscribe({
      next: () => {
        this.notify.success(this.data ? 'Product updated.' : 'Product added.');
        this.ref.close(true);
      },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
