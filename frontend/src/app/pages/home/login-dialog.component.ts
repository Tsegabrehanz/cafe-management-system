import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressBarModule],
  template: `
    @if (busy()) { <mat-progress-bar mode="indeterminate" /> }
    <h2 mat-dialog-title>Log in</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="dialog-form">
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="email" required>
          <mat-error>Enter a valid email</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" [type]="hide() ? 'password' : 'text'" autocomplete="current-password" required>
          <button mat-icon-button matSuffix type="button" (click)="hide.set(!hide())" [attr.aria-label]="hide() ? 'Show password' : 'Hide password'">
            <mat-icon>{{ hide() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error>Password is required</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">Log in</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class LoginDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);
  private router = inject(Router);
  private ref = inject(MatDialogRef<LoginDialogComponent>);

  readonly busy = signal(false);
  readonly hide = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.api.login(this.form.getRawValue()).subscribe({
      next: res => {
        this.busy.set(false);
        this.auth.saveLogin(res);
        this.ref.close(true);
        this.router.navigate(['/cafe/dashboard']);
      },
      error: err => { this.busy.set(false); this.notify.fromHttp(err); },
    });
  }
}
