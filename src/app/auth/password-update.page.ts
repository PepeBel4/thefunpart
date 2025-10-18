import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';
import { AuthService } from '../core/auth.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-password-update',
  imports: [CommonModule, FormsModule, TranslatePipe, RouterLink],
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

    .status.error {
      color: var(--brand-red, #c22727);
    }

    .status.success {
      color: var(--brand-green);
      font-weight: 600;
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
      <ng-container *ngIf="status !== 'success'; else successView">
        <div>
          <h2>
            {{
              'passwordResetConfirm.title'
                | translate: 'Choose a new password'
            }}
          </h2>
          <p>
            {{
              'passwordResetConfirm.subtitle'
                | translate: 'Enter your new password below to finish resetting your account.'
            }}
          </p>
        </div>
        <form (ngSubmit)="submit()">
          <label for="password">
            {{ 'passwordResetConfirm.password' | translate: 'New password' }}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            [(ngModel)]="password"
            required
          />
          <label for="passwordConfirmation">
            {{ 'passwordResetConfirm.confirmPassword' | translate: 'Confirm new password' }}
          </label>
          <input
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            [(ngModel)]="confirmation"
            required
          />

          <p class="status error" *ngIf="status === 'missingToken'">
            {{
              'passwordResetConfirm.missingToken'
                | translate: 'The reset link is missing or invalid. Please request a new password reset email.'
            }}
          </p>
          <p class="status error" *ngIf="status === 'missingPassword'">
            {{
              'passwordResetConfirm.missingPassword'
                | translate: 'Enter your new password and confirm it to continue.'
            }}
          </p>
          <p class="status error" *ngIf="status === 'mismatch'">
            {{
              'passwordResetConfirm.mismatch'
                | translate: 'The passwords do not match. Please try again.'
            }}
          </p>
          <p class="status error" *ngIf="status === 'invalidToken'">
            {{
              'passwordResetConfirm.invalidToken'
                | translate: 'This reset link has expired or was already used. Request a new one to continue.'
            }}
          </p>
          <p class="status error" *ngIf="status === 'error'">
            {{
              'passwordResetConfirm.error'
                | translate: 'We could not update your password. Please try again later.'
            }}
          </p>
          <button type="submit" [disabled]="loading || !token">
            {{
              loading
                ? ('passwordResetConfirm.loading' | translate: 'Updating password…')
                : ('passwordResetConfirm.submit' | translate: 'Update password')
            }}
          </button>
        </form>
        <p class="auth-switch">
          {{ 'passwordResetConfirm.requestAgain' | translate: 'Need a new link?' }}
          <a routerLink="/forgot-password">
            {{
              'passwordResetConfirm.requestAgainCta'
                | translate: 'Request another reset email'
            }}
          </a>
        </p>
      </ng-container>
      <ng-template #successView>
        <div>
          <h2>
            {{
              'passwordResetConfirm.successTitle'
                | translate: 'Password updated'
            }}
          </h2>
          <p>
            {{
              'passwordResetConfirm.successMessage'
                | translate: 'Your password has been changed. You can now sign in with your new credentials.'
            }}
          </p>
        </div>
        <button type="button" routerLink="/login">
          {{ 'passwordResetConfirm.backToLogin' | translate: 'Back to login' }}
        </button>
      </ng-template>
    </div>
  `,
})
export class PasswordUpdatePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private queryParamSub?: Subscription;

  token = '';
  password = '';
  confirmation = '';
  loading = false;
  status: 'idle' | 'missingToken' | 'missingPassword' | 'mismatch' | 'invalidToken' | 'error' | 'success' = 'idle';

  ngOnInit(): void {
    this.queryParamSub = this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token') ?? params.get('reset_password_token') ?? '';
      if (!this.token) {
        this.status = 'missingToken';
      } else if (this.status === 'missingToken') {
        this.status = 'idle';
      }
    });
  }

  ngOnDestroy(): void {
    this.queryParamSub?.unsubscribe();
  }

  async submit() {
    if (this.loading) {
      return;
    }

    if (!this.token) {
      this.status = 'missingToken';
      return;
    }

    const password = this.password.trim();
    const confirmation = this.confirmation.trim();

    if (!password || !confirmation) {
      this.status = 'missingPassword';
      return;
    }

    if (password !== confirmation) {
      this.status = 'mismatch';
      return;
    }

    this.loading = true;
    this.status = 'idle';

    try {
      await this.auth.finishPasswordReset(this.token, password, confirmation);
      this.status = 'success';
      this.password = '';
      this.confirmation = '';
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 422) {
        this.status = 'invalidToken';
      } else {
        this.status = 'error';
      }
    } finally {
      this.loading = false;
    }
  }
}
