import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrorState {
  key?: string;
  fallback: string;
}

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [FormsModule, TranslatePipe, NgIf, RouterLink],
  styles: [`
    .card {
      max-width: 460px;
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

    .field-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
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
        <h2>{{ 'register.title' | translate: 'Create your account' }}</h2>
        <p>
          {{
            'register.subtitle'
              | translate: 'Join us and start ordering from your favourite restaurants.'
          }}
        </p>
      </div>
      <form (ngSubmit)="submit()">
        <div class="field-group">
          <div>
            <label for="firstName">{{ 'register.firstName' | translate: 'First name' }}</label>
            <input
              id="firstName"
              name="firstName"
              [(ngModel)]="form.firstName"
              autocomplete="given-name"
              required
            />
          </div>
          <div>
            <label for="lastName">{{ 'register.lastName' | translate: 'Last name' }}</label>
            <input
              id="lastName"
              name="lastName"
              [(ngModel)]="form.lastName"
              autocomplete="family-name"
              required
            />
          </div>
        </div>
        <label for="email">{{ 'register.email' | translate: 'Email' }}</label>
        <input id="email" name="email" type="email" [(ngModel)]="form.email" required />
        <label for="password">{{ 'register.password' | translate: 'Password' }}</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="form.password"
          required
          minlength="8"
        />
        <label for="confirmPassword">
          {{ 'register.confirmPassword' | translate: 'Confirm password' }}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          [(ngModel)]="form.confirmPassword"
          required
          minlength="8"
        />
        <p class="status" *ngIf="passwordMismatch">
          {{ 'register.passwordMismatch' | translate: 'Passwords must match.' }}
        </p>
        <p class="status" *ngIf="error">
          {{ error.key ? (error.key | translate: error.fallback) : error.fallback }}
        </p>
        <button type="submit" [disabled]="loading || passwordMismatch">
          {{ loading ? ('register.loading' | translate: 'Creating account…') : ('register.submit' | translate: 'Sign up') }}
        </button>
      </form>
      <p class="auth-switch">
        {{ 'register.haveAccount' | translate: 'Already have an account?' }}
        <a routerLink="/login">{{ 'register.signIn' | translate: 'Log in' }}</a>
      </p>
    </div>
  `,
})
export class RegisterPage {
  private auth = inject(AuthService);

  form: RegisterFormState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  loading = false;
  error: RegisterErrorState | null = null;

  get passwordMismatch(): boolean {
    return (
      this.form.password.trim() !== '' &&
      this.form.confirmPassword.trim() !== '' &&
      this.form.password !== this.form.confirmPassword
    );
  }

  async submit() {
    if (this.loading || this.passwordMismatch) {
      return;
    }

    const firstName = this.form.firstName.trim();
    const lastName = this.form.lastName.trim();
    const email = this.form.email.trim();
    const password = this.form.password;

    if (!email || !password || !firstName || !lastName) {
      this.error = {
        key: 'register.missingFields',
        fallback: 'Please fill in all required fields.',
      };
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      await this.auth.register({ firstName, lastName, email, password });
    } catch (err) {
      if (err instanceof Error) {
        const message = err.message?.trim();
        if (!message || message === 'Unexpected register response shape') {
          this.error = {
            key: 'register.error',
            fallback: 'We could not create your account. Please try again.',
          };
        } else {
          this.error = { fallback: message };
        }
      } else {
        this.error = {
          key: 'register.error',
          fallback: 'We could not create your account. Please try again.',
        };
      }
    } finally {
      this.loading = false;
    }
  }
}
