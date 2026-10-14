import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { NotifyService } from '../../core/notify.service';
import { NAME_PATTERN, PHONE_PATTERN, matchFields } from '../../shared/validators';

@Component({
  selector: 'app-signup-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressBarModule],
  template: `
    @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
    <h2 mat-dialog-title>Sign up</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" autocomplete="name" required>
          @if (form.controls.name.hasError('pattern')) { <mat-error>Letters and spaces only</mat-error> }
          @else { <mat-error>Name is required</mat-error> }
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" required>
          <mat-error>Enter a valid email</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Contact number</mat-label>
          <input matInput formControlName="contactNumber" type="tel" autocomplete="tel" required>
          <mat-error>Enter a valid phone number</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" [type]="hide() ? 'password' : 'text'" autocomplete="new-password" required>
          <button mat-icon-button matSuffix type="button" (click)="hide.set(!hide())" [attr.aria-label]="hide() ? 'Show password' : 'Hide password'">
            <mat-icon>{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error>At least 6 characters</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Confirm password</mat-label>
          <input matInput formControlName="confirmPassword" [type]="hide() ? 'password' : 'text'" autocomplete="new-password" required>
        </mat-form-field>
        @if (form.hasError('mismatch')) { <p class="form-error">Passwords do not match</p> }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">Sign up</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class SignupDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notify = inject(NotifyService);
  private ref = inject(MatDialogRef<SignupDialogComponent>);

  readonly busy = signal(false);
  readonly hide = signal(true);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email]],
    contactNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchFields('password', 'confirmPassword') });

  submit(): void {
    if (this.form.invalid) return;
    const { confirmPassword, ...body } = this.form.getRawValue();
    this.busy.set(true);
    this.api.signup(body).subscribe({
      next: res => { this.busy.set(false); this.notify.success(res.message); this.ref.close(true); },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
