import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../core/api.service';
import { NotifyService } from '../core/notify.service';
import { matchFields } from '../shared/validators';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule],
  template: `
    @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
    <h2 mat-dialog-title>Change password</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Current password</mat-label>
          <input matInput type="password" formControlName="oldPassword" autocomplete="current-password" required>
        </mat-form-field>
        <mat-form-field>
          <mat-label>New password</mat-label>
          <input matInput type="password" formControlName="newPassword" autocomplete="new-password" required>
          <mat-error>At least 6 characters</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Confirm new password</mat-label>
          <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" required>
        </mat-form-field>
        @if (form.hasError('mismatch')) { <p class="form-error">Passwords do not match</p> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">Update</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ChangePasswordDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private ref = inject(MatDialogRef<ChangePasswordDialogComponent>);

  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchFields('newPassword', 'confirmPassword') });

  submit(): void {
    if (this.form.invalid) return;
    const { oldPassword, newPassword } = this.form.getRawValue();
    this.busy.set(true);
    this.api.changePassword(oldPassword, newPassword).subscribe({
      next: res => { this.busy.set(false); this.notify.success(res.message); this.ref.close(true); },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
