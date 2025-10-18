import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../shared/translate.pipe';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

interface LoginErrorState {
  key?: string;
  fallback: string;
}

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe, RouterLink, NgIf],
  styles: [`
    .card {
      max-width: 420px;
      margin: 3rem auto;
      padding: 2.25rem;
      background: var(--surface);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    h2 {
      font-size: clamp(1.85rem, 3vw, 2.4rem);
      font-weight: 700;
      margin: 0;
    }

    label {
      display: block;
      margin: 0.25rem 0 0.35rem;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      background: var(--surface-elevated);
      font-size: 1rem;
    }

    button {
      margin-top: 0.5rem;
      width: 100%;
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      padding: 0.9rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 18px 30px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      box-shadow: none;
    }

    button:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.32);
    }

    .status {
      font-size: 0.9rem;
      color: #b00020;
      text-align: center;
    }

    .auth-switch {
      margin: 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .auth-switch a {
      color: var(--brand-green);
      font-weight: 600;
      text-decoration: none;
    }

    .auth-switch a:hover {
      text-decoration: underline;
    }
  `],
  template: `
    <div class="card">
      <div>
        <h2>{{ 'login.title' | translate: 'Welcome back' }}</h2>
        <p>{{ 'login.subtitle' | translate: 'Sign in to keep your cravings satisfied.' }}</p>
      </div>
      <form (ngSubmit)="submit()">
        <label>{{ 'login.email' | translate: 'Email' }}</label>
        <input [(ngModel)]="email" name="email" type="email" autocomplete="email" required />
        <label>{{ 'login.password' | translate: 'Password' }}</label>
        <input
          [(ngModel)]="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />
        <p class="status" *ngIf="error">
          {{ error.key ? (error.key | translate: error.fallback) : error.fallback }}
        </p>
        <button type="submit" [disabled]="loading">
          {{ loading ? ('login.loading' | translate: 'Signing you in…') : ('login.submit' | translate: 'Log in') }}
        </button>
      </form>
      <p class="auth-switch">
        {{ 'login.noAccount' | translate: "Don't have an account?" }}
        <a routerLink="/register">{{ 'login.registerCta' | translate: 'Create one' }}</a>
      </p>
    </div>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  email = '';
  password = '';
  loading = false;
  error: LoginErrorState | null = null;

  async submit() {
    if (this.loading) {
      return;
    }

    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      this.error = {
        key: 'login.missingFields',
        fallback: 'Please enter your email and password.',
      };
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      await this.auth.login(email, password);
    } catch (err) {
      this.error = this.normalizeError(err);
    } finally {
      this.loading = false;
    }
  }

  private normalizeError(err: unknown): LoginErrorState {
    if (err instanceof HttpErrorResponse) {
      const message = this.extractHttpErrorMessage(err);
      if (message) {
        return { fallback: message };
      }

      if (err.status === 401 || err.status === 403) {
        return {
          key: 'login.invalidCredentials',
          fallback: 'Incorrect email or password. Please try again.',
        };
      }
    } else if (err instanceof Error) {
      const message = err.message?.trim();
      if (message && message !== 'Unexpected login response shape') {
        return { fallback: message };
      }
    }

    return {
      key: 'login.error',
      fallback: 'We could not sign you in. Please try again in a moment.',
    };
  }

  private extractHttpErrorMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;

    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      const message = payload.trim();
      return message || null;
    }

    if (typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const candidates = [record['error'], record['message']];
      for (const value of candidates) {
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }

      if (Array.isArray(record['errors']) && record['errors'].length > 0) {
        const first = record['errors'][0];
        if (typeof first === 'string' && first.trim()) {
          return first.trim();
        }
      }
    }

    return null;
  }
}
