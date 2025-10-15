import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '../shared/translate.pipe';
import { ProfileService } from '../core/profile.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    header h2 {
      font-size: clamp(2rem, 3vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
    }

    header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
      max-width: 520px;
    }

    form {
      display: grid;
      gap: 1.5rem;
      padding: 1.75rem;
      border-radius: var(--radius-card);
      background: var(--surface);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    label {
      font-weight: 600;
    }

    input,
    select {
      appearance: none;
      border: 1px solid rgba(15, 23, 42, 0.15);
      border-radius: 10px;
      padding: 0.65rem 0.75rem;
      font: inherit;
      background: #fff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    input:focus-visible,
    select:focus-visible {
      border-color: var(--brand-green);
      box-shadow: 0 0 0 3px rgba(6, 193, 103, 0.2);
      outline: none;
    }

    .hint {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .error {
      color: #b00020;
      font-size: 0.85rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    button[type='submit'] {
      border: 0;
      border-radius: 999px;
      background: var(--brand-green);
      color: #042f1a;
      padding: 0.7rem 1.6rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 12px 25px rgba(6, 193, 103, 0.28);
    }

    button[type='submit']:disabled {
      cursor: not-allowed;
      opacity: 0.7;
      box-shadow: none;
    }

    button[type='submit']:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 35px rgba(6, 193, 103, 0.32);
    }

    .status {
      font-size: 0.9rem;
    }

    .status.success {
      color: var(--brand-green);
    }

    .status.error {
      color: #b00020;
    }

    @media (max-width: 640px) {
      form {
        padding: 1.25rem;
      }
    }
  `],
  template: `
    <header>
      <h2>{{ 'profile.title' | translate: 'Your profile' }}</h2>
      <p>
        {{
          'profile.subtitle'
            | translate: 'Share a few details so we can personalise your experience.'
        }}
      </p>
    </header>
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <div class="field">
        <label for="firstName">{{ 'profile.firstName' | translate: 'First name' }}</label>
        <input
          id="firstName"
          type="text"
          formControlName="firstName"
          autocomplete="given-name"
          required
        />
        <span class="error" *ngIf="showError('firstName')">
          {{ 'profile.required' | translate: 'This field is required.' }}
        </span>
      </div>
      <div class="field">
        <label for="lastName">{{ 'profile.lastName' | translate: 'Last name' }}</label>
        <input
          id="lastName"
          type="text"
          formControlName="lastName"
          autocomplete="family-name"
          required
        />
        <span class="error" *ngIf="showError('lastName')">
          {{ 'profile.required' | translate: 'This field is required.' }}
        </span>
      </div>
      <div class="field">
        <label for="gender">{{ 'profile.gender' | translate: 'Gender' }}</label>
        <select id="gender" formControlName="gender" required>
          <option value="">{{ 'profile.genderPlaceholder' | translate: 'Select gender' }}</option>
          <option value="female">
            {{ 'profile.gender.female' | translate: 'Female' }}
          </option>
          <option value="male">
            {{ 'profile.gender.male' | translate: 'Male' }}
          </option>
          <option value="other">
            {{ 'profile.gender.other' | translate: 'Other' }}
          </option>
        </select>
        <span class="error" *ngIf="showError('gender')">
          {{ 'profile.required' | translate: 'This field is required.' }}
        </span>
      </div>
      <div class="field">
        <label for="birthDate">{{ 'profile.birthDate' | translate: 'Birth date' }}</label>
        <input id="birthDate" type="date" formControlName="birthDate" required />
        <span class="error" *ngIf="showError('birthDate')">
          {{ 'profile.birthDateError' | translate: 'Enter a valid date.' }}
        </span>
        <span class="hint">
          {{ 'profile.birthDateHint' | translate: 'Format: YYYY-MM-DD' }}
        </span>
      </div>
      <div class="actions">
        <button type="submit" [disabled]="saving() || form.invalid">
          <ng-container *ngIf="saving(); else saveLabel">
            {{ 'profile.saving' | translate: 'Saving…' }}
          </ng-container>
          <ng-template #saveLabel>
            {{ 'profile.save' | translate: 'Save profile' }}
          </ng-template>
        </button>
        <span
          class="status success"
          *ngIf="status() === 'success'"
          aria-live="polite"
        >
          {{ 'profile.saved' | translate: 'Profile updated!' }}
        </span>
        <span class="status error" *ngIf="status() === 'error'" aria-live="assertive">
          {{ 'profile.error' | translate: 'Unable to update profile. Please try again.' }}
        </span>
      </div>
    </form>
  `,
})
export class ProfilePage {
  private fb = inject(FormBuilder);
  private profile = inject(ProfileService);
  private auth = inject(AuthService);

  form = this.fb.group({
    firstName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    lastName: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    gender: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
  });

  saving = signal(false);
  status = signal<'idle' | 'success' | 'error'>('idle');

  constructor() {
    this.profile
      .getProfile()
      .pipe(takeUntilDestroyed())
      .subscribe((profile) => {
        this.form.patchValue(
          {
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            gender: profile.gender ?? '',
            birthDate: profile.birthDate ?? '',
          },
          { emitEvent: false }
        );
      });
  }

  showError(controlName: 'firstName' | 'lastName' | 'gender' | 'birthDate'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.status.set('idle');
    const { firstName, lastName, gender, birthDate } = this.form.getRawValue();

    this.profile
      .updateProfile({ firstName, lastName, gender, birthDate })
      .pipe(takeUntilDestroyed(), finalize(() => this.saving.set(false)))
      .subscribe({
        next: (profile) => {
          this.status.set('success');
          this.form.patchValue(
            {
              firstName: profile.firstName ?? '',
              lastName: profile.lastName ?? '',
              gender: profile.gender ?? '',
              birthDate: profile.birthDate ?? '',
            },
            { emitEvent: false }
          );
          this.auth.updateSessionUser({
            firstName: profile.firstName,
            lastName: profile.lastName,
            gender: profile.gender,
            birthDate: profile.birthDate,
          });
        },
        error: () => {
          this.status.set('error');
        },
      });
  }
}
