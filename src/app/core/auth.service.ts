import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { SessionUser } from './models';
import { firstValueFrom } from 'rxjs';


interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface PasswordResetPayload {
  email: string;
}

interface PasswordResetUpdatePayload {
  reset_password_token: string;
  password: string;
  password_confirmation: string;
}


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


  async register(input: { email: string; password: string; firstName?: string; lastName?: string }) {
    const payload: RegisterPayload = {
      email: input.email.trim(),
      password: input.password,
    };

    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    if (firstName) {
      payload.first_name = firstName;
    }

    if (lastName) {
      payload.last_name = lastName;
    }

    const response = await firstValueFrom(
      this.api.post<SessionUser | { user: SessionUser }>('/auth/register', {
        user: payload,
      })
    );

    const sessionUser = this.normalizeSessionUser(response);
    if (!sessionUser) {
      throw new Error('Unexpected register response shape');
    }

    this._user.set(sessionUser);
    await this.router.navigateByUrl('/');
  }


  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return;
    }

    const payload: PasswordResetPayload = { email: normalizedEmail };

    await firstValueFrom(
      this.api.post('/auth/password', {
        user: payload,
      })
    );
  }

  async finishPasswordReset(token: string, password: string, confirmation: string) {
    const payload: PasswordResetUpdatePayload = {
      reset_password_token: token,
      password,
      password_confirmation: confirmation,
    };

    await firstValueFrom(
      this.api.put('/auth/password', {
        user: payload,
      })
    );
  }


  async logout() {
    await firstValueFrom(this.api.delete('/auth/logout', {}));
    this._user.set(null);
    await this.router.navigateByUrl('/login');
  }


  updateSessionUser(update: Partial<SessionUser>) {
    const current = this._user();
    if (!current) {
      return;
    }

    this._user.set({ ...current, ...update });
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
    const id = this.normalizeId(userRecord['id']);
    const email = typeof userRecord['email'] === 'string' ? userRecord['email'] : null;

    if (id == null || !email) {
      return null;
    }

    return {
      id,
      email,
      firstName: this.readOptionalString(userRecord['first_name'] ?? userRecord['firstName']),
      lastName: this.readOptionalString(userRecord['last_name'] ?? userRecord['lastName']),
      gender: this.readOptionalString(userRecord['gender']),
      birthDate: this.readOptionalString(userRecord['birth_date'] ?? userRecord['birthDate']),
    };
  }

  private normalizeId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const numericId = Number.parseInt(value, 10);
      if (Number.isFinite(numericId)) {
        return numericId;
      }
    }

    return null;
  }

  private readOptionalString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    return null;
  }


  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}