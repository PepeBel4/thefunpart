import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { SessionUser } from './models';
import { firstValueFrom } from 'rxjs';


interface LoginPayload { email: string; password: string; }


@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private readonly storageKey = 'thefunpart:sessionUser';


  private _user = signal<SessionUser | null>(null);
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());


  constructor() {
    const stored = this.getStoredUser();
    if (stored) {
      this._user.set(stored);
    }

    effect(() => {
      const current = this._user();
      if (!this.isBrowser()) {
        return;
      }

      try {
        if (current) {
          window.localStorage.setItem(this.storageKey, JSON.stringify(current));
        } else {
          window.localStorage.removeItem(this.storageKey);
        }
      } catch {
        // ignore storage errors
      }
    });
  }


  async login(email: string, password: string) {
    const response = await firstValueFrom(
      this.api.post<SessionUser | { user: SessionUser }>('/auth/login', {
        user: { email, password }
      })
    );
    const sessionUser = this.normalizeSessionUser(response);
    if (!sessionUser) {
      throw new Error('Unexpected login response shape');
    }
    this._user.set(sessionUser);
    await this.router.navigateByUrl('/');
  }


  async logout() {
    await firstValueFrom(this.api.delete('/auth/logout', {}));
    this._user.set(null);
    await this.router.navigateByUrl('/login');
  }


  private getStoredUser(): SessionUser | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      return this.normalizeSessionUser(parsed);
    } catch {
      // ignore parsing errors
    }

    return null;
  }

  private normalizeSessionUser(value: unknown): SessionUser | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = value as Record<string, unknown>;
    const maybeUser = 'user' in source ? source['user'] : value;
    if (!maybeUser || typeof maybeUser !== 'object') {
      return null;
    }

    const userRecord = maybeUser as Record<string, unknown>;
    const id = userRecord['id'];
    const email = userRecord['email'];

    if (typeof id === 'number' && typeof email === 'string') {
      return { id, email };
    }

    if (typeof id === 'string' && typeof email === 'string') {
      const numericId = Number.parseInt(id, 10);
      if (Number.isFinite(numericId)) {
        return { id: numericId, email };
      }
    }

    return null;
  }


  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}