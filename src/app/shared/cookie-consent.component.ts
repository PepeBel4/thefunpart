import { Component, Inject, OnInit, signal } from '@angular/core';
import { DOCUMENT, NgIf } from '@angular/common';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [NgIf, TranslatePipe],
  styles: [`
    :host {
      position: fixed;
      inset: auto clamp(1rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem);
      z-index: 999;
      pointer-events: none;
      display: block;
    }

    .banner {
      display: grid;
      gap: 1rem;
      padding: 1.25rem clamp(1.25rem, 4vw, 2rem);
      background: rgba(18, 23, 25, 0.95);
      color: white;
      border-radius: 1rem;
      box-shadow: 0 18px 45px rgba(7, 35, 31, 0.35);
      pointer-events: auto;
      max-width: min(520px, 90vw);
      font: inherit;
    }

    .banner strong {
      display: block;
      font-size: 1rem;
      font-weight: 600;
    }

    .banner p {
      margin: 0;
      font-size: 0.925rem;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.8);
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    button {
      appearance: none;
      border: none;
      border-radius: 999px;
      padding: 0.55rem 1.35rem;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
    }

    button.primary {
      background: var(--brand-primary, #06c167);
      color: var(--surface, #040707);
      box-shadow: 0 10px 20px rgba(6, 193, 103, 0.25);
    }

    button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(6, 193, 103, 0.35);
    }

    button.secondary {
      background: rgba(255, 255, 255, 0.12);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.28);
    }

    button.secondary:hover {
      background: rgba(255, 255, 255, 0.18);
    }

    a {
      color: inherit;
      text-decoration: underline;
      font-weight: 500;
    }

    @media (max-width: 580px) {
      :host {
        inset: auto 1rem 1rem;
      }

      .banner {
        padding: 1rem 1.1rem 1.1rem;
      }
    }
  `],
  template: `
    <section *ngIf="isVisible()" class="banner" role="dialog" aria-live="polite">
      <div>
        <strong>{{ 'cookie.title' | translate: 'We use cookies' }}</strong>
        <p>
          {{
            'cookie.message'
              | translate:
                'This website uses cookies to enhance your experience, provide essential site functionality, and analyze traffic. By clicking "Accept all" you agree to the storing of cookies on your device.'
          }}
        </p>
      </div>
      <div class="actions">
        <button type="button" class="primary" (click)="accept()">
          {{ 'cookie.accept' | translate: 'Accept all' }}
        </button>
        <button type="button" class="secondary" (click)="decline()">
          {{ 'cookie.decline' | translate: 'Decline' }}
        </button>
      </div>
    </section>
  `
})
export class CookieConsentComponent implements OnInit {
  private readonly storageKey = 'thefunpart:cookie-consent';
  private readonly visible = signal(false);

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit(): void {
    if (!this.isBrowser()) {
      return;
    }

    const storedValue = window.localStorage.getItem(this.storageKey);
    this.visible.set(storedValue !== 'accepted' && storedValue !== 'declined');
  }

  isVisible() {
    return this.visible();
  }

  accept(): void {
    this.persist('accepted');
    this.visible.set(false);
  }

  decline(): void {
    this.persist('declined');
    this.visible.set(false);
  }

  private persist(value: 'accepted' | 'declined'): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, value);
    } catch (error) {
      console.warn('Could not persist cookie preference', error);
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && this.document?.defaultView === window;
  }
}
