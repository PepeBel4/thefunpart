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
    const user = await firstValueFrom(
      this.api.post<SessionUser>('/auth/login', { user: { email, password } })
    );
    this._user.set(user);
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
      if (typeof parsed === 'object' && parsed && 'email' in parsed && 'id' in parsed) {
        return { id: Number(parsed.id) || 0, email: String(parsed.email) };
      }
    } catch {
      // ignore parsing errors
    }

    return null;
  }


  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}