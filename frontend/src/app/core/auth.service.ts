import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from './models';

const KEY = 'cafe.session';

interface Session { token: string; role: 'admin' | 'user'; name: string; exp: number; }

/** Holds the logged-in session (JWT + role) and keeps it in localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(this.restore());

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.session()?.role === 'admin');
  readonly name = computed(() => this.session()?.name ?? '');

  constructor(private router: Router) {}

  get token(): string | null {
    const s = this.session();
    if (s && s.exp * 1000 < Date.now()) {
      this.clear();
      return null;
    }
    return s?.token ?? null;
  }

  saveLogin(res: LoginResponse): void {
    const s: Session = { token: res.token, role: res.role, name: res.name, exp: decodeExp(res.token) };
    this.session.set(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/']);
  }

  private clear(): void {
    this.session.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as Session;
      return s.exp * 1000 > Date.now() ? s : null;
    } catch {
      return null;
    }
  }
}

function decodeExp(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : 0;
  } catch {
    return 0;
  }
}
