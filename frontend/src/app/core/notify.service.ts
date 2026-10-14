import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  constructor(private snack: MatSnackBar) {}

  success(message: string): void {
    this.snack.open(message, 'OK', { duration: 3000, panelClass: 'snack-success', verticalPosition: 'top' });
  }

  error(message: string): void {
    this.snack.open(message, 'Close', { duration: 5000, panelClass: 'snack-error', verticalPosition: 'top' });
  }

  /** Shows the server's {message} if present, otherwise a generic error. */
  fromHttp(err: unknown, fallback = 'Something went wrong. Please try again.'): void {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return this.error('Cannot reach the server. Is the backend running?');
      if (err.status === 401 && !err.url?.includes('/user/login')) return; // interceptor already handled it
      const msg = (err.error && typeof err.error === 'object' && 'message' in err.error) ? err.error.message : null;
      return this.error(msg || fallback);
    }
    this.error(fallback);
  }
}
