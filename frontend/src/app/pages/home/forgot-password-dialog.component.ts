import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressBarModule],
  template: `
    @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
    <h2 mat-dialog-title>Forgot password</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <p class="hint">We'll email you a temporary password. Change it after logging in.</p>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" required>
          <mat-error>Enter a valid email</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">Send</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ForgotPasswordDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private ref = inject(MatDialogRef<ForgotPasswordDialogComponent>);

  readonly busy = signal(false);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submit(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.api.forgotPassword(this.form.getRawValue().email).subscribe({
      next: res => { this.busy.set(false); this.notify.success(res.message); this.ref.close(true); },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
