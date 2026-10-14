import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { Category } from '../../core/models';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit category' : 'Add category' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required cdkFocusInitial>
          <mat-error>Name is required</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">{{ data ? 'Update' : 'Add' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CategoryDialogComponent {
  readonly data = inject<Category | null>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private ref = inject(MatDialogRef<CategoryDialogComponent>);

  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(100)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const name = this.form.getRawValue().name.trim();
    this.busy.set(true);
    const call = this.data ? this.api.updateCategory(this.data.id, name) : this.api.addCategory(name);
    call.subscribe({
      next: () => {
        this.notify.success(this.data ? 'Category updated.' : 'Category added.');
        this.ref.close(true);
      },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
