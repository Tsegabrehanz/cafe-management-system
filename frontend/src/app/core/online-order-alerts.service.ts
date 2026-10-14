import { Injectable, inject, signal } from '@angular/core';
import { Subscription, interval, startWith } from 'rxjs';
import { ApiService } from './api.service';

/** Polls the number of pending online orders for the sidebar badge. */
@Injectable({ providedIn: 'root' })
export class OnlineOrderAlertsService {
  private api = inject(ApiService);
  private sub?: Subscription;

  readonly pending = signal(0);

  start(): void {
    if (this.sub) return;
    this.sub = interval(30000).pipe(startWith(0)).subscribe(() => this.refresh());
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.pending.set(0);
  }

  refresh(): void {
    this.api.pendingOnlineCount().subscribe({
      next: r => this.pending.set(r.count),
      error: () => { /* ignore — badge just stays as it was */ },
    });
  }
}
