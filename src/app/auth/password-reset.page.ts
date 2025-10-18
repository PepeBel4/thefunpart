import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-password-reset',
  imports: [FormsModule, TranslatePipe, RouterLink],
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

    p {
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

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.32);
    }

    button:disabled {
      opacity: 0.7;
      cursor: default;
      box-shadow: none;
    }

    .status {
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }

    .status.success {
      color: var(--brand-green);
      font-weight: 600;
    }

    .status.error {
      color: var(--brand-red, #c22727);
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
        <h2>{{ 'passwordReset.title' | translate: 'Reset your password' }}</h2>
        <p>
          {{
            'passwordReset.subtitle'
              | translate: 'Enter your email address and we will send you a reset link.'
          }}
        </p>
      </div>
      <form (ngSubmit)="submit()">
        <label for="email">{{ 'passwordReset.email' | translate: 'Email address' }}</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" required />
        <p class="status error" *ngIf="status === 'missing'">
          {{ 'passwordReset.missingEmail' | translate: 'Please enter a valid email address.' }}
        </p>
        <p class="status success" *ngIf="status === 'success'">
          {{
            'passwordReset.success'
              | translate:
                  'If an account exists for this email, you will receive reset instructions shortly.'
          }}
        </p>
        <p class="status error" *ngIf="status === 'error'">
          {{ 'passwordReset.error' | translate: 'We could not send the reset instructions. Please try again.' }}
        </p>
        <button type="submit" [disabled]="loading">
          {{
            loading
              ? ('passwordReset.loading' | translate: 'Sending instructions…')
              : ('passwordReset.submit' | translate: 'Send reset link')
          }}
        </button>
      </form>
      <p class="auth-switch">
        {{ 'passwordReset.backToLogin' | translate: 'Remembered your password?' }}
        <a routerLink="/login">{{ 'passwordReset.loginCta' | translate: 'Back to login' }}</a>
      </p>
    </div>
  `,
})
export class PasswordResetPage {
  private auth = inject(AuthService);

  email = '';
  loading = false;
  status: 'idle' | 'missing' | 'success' | 'error' = 'idle';

  async submit() {
    if (this.loading) {
      return;
    }

    const trimmedEmail = this.email.trim();
    if (!trimmedEmail) {
      this.status = 'missing';
      return;
    }

    this.loading = true;
    this.status = 'idle';

    try {
      await this.auth.requestPasswordReset(trimmedEmail);
      this.status = 'success';
    } catch (error) {
      console.error('Failed to request password reset', error);
      this.status = 'error';
    } finally {
      this.loading = false;
    }
  }
}
