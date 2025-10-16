import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { CartService } from '../cart/cart.service';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../core/translation.service';
import { FormsModule } from '@angular/forms';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, TranslatePipe, FormsModule, UserMenuComponent],
  styles: [`
    nav {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.1rem clamp(1rem, 4vw, 3rem);
      background: var(--brand-black);
      color: #fefefe;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      text-decoration: none;
      color: inherit;
    }

    .brand span {
      color: var(--brand-green);
    }

    .brand-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      font-size: 1.35rem;
    }

    .location-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 1rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.85);
    }

    .location-chip::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand-green);
      box-shadow: 0 0 0 4px rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
    }

    .spacer {
      flex: 1;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .nav-links a {
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.85);
      font-weight: 500;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .nav-links a:hover,
    .nav-links a.active {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }

    .language-select {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
    }

    .language-select select {
      appearance: none;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding-right: 1.1rem;
    }

    .language-select select:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }

    .language-select::after {
      content: '▾';
      font-size: 0.75rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .cart-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      background: var(--brand-green);
      color: var(--brand-on-primary);
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      font-weight: 600;
      box-shadow: 0 12px 25px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .cart-icon {
      font-size: 1.2rem;
    }

    .cart-count {
      min-width: 1.75rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      color: inherit;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .cart-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 35px rgba(var(--brand-green-rgb, 6, 193, 103), 0.32);
    }

    @media (max-width: 900px) {
      nav {
        flex-wrap: wrap;
        row-gap: 0.75rem;
      }

      .location-chip {
        order: 3;
        width: 100%;
        justify-content: center;
      }

      .language-select {
        order: 4;
      }

      .spacer {
        display: none;
      }
    }

    @media (max-width: 640px) {
      nav {
        padding-inline: 1.1rem;
      }

      .nav-links {
        width: 100%;
        justify-content: center;
        order: 5;
      }

      .cart-pill {
        order: 6;
        width: 100%;
        text-align: center;
      }

      .user-menu {
        order: 7;
        width: 100%;
        text-align: center;
      }

      .language-select {
        order: 4;
        width: 100%;
        justify-content: center;
      }
    }
  `],
  template: `
    <nav>
      <a routerLink="/" class="brand">
        <span class="brand-icon">🛵</span>
        thefunpart <span>eats</span>
      </a>
      <div class="location-chip">
        {{ 'nav.deliveryChip' | translate: 'Deliver now • 15-25 min' }}
      </div>
      <span class="spacer"></span>
      <div class="nav-links">
        <a routerLink="/">{{ 'nav.discover' | translate: 'Discover' }}</a>
        <a routerLink="/b2b">{{ 'nav.b2b' | translate: 'For restaurants' }}</a>
        <a routerLink="/orders">{{ 'nav.orders' | translate: 'Orders' }}</a>
        <a *ngIf="auth.isLoggedIn()" routerLink="/admin">{{ 'nav.manage' | translate: 'Manage' }}</a>
      </div>
      <app-user-menu class="user-menu"></app-user-menu>
      <label class="language-select">
        <span class="sr-only">{{ 'nav.languageLabel' | translate: 'Language' }}</span>
        <select
          [ngModel]="selectedLanguage()"
          (ngModelChange)="onLanguageChange($event)"
          [attr.aria-label]="'nav.languageAria' | translate: 'Select website language'"
        >
          <option *ngFor="let lang of languages" [value]="lang.code">{{ lang.label }}</option>
        </select>
      </label>
      <a routerLink="/checkout" class="cart-pill">
        <span aria-hidden="true" class="cart-icon">🛒</span>
        <span class="cart-count">{{ cart.count() }}</span>
        <span class="sr-only">
          {{ 'nav.cart' | translate: 'Cart with {{count}} items': { count: cart.count() } }}
        </span>
      </a>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private i18n = inject(TranslationService);
  languages = this.i18n.languages;
  language = this.i18n.languageSignal;
  selectedLanguage = signal(this.language());

  constructor() {
    effect(() => {
      this.selectedLanguage.set(this.language());
    });
  }

  onLanguageChange(code: string) {
    this.i18n.setLanguage(code);
  }
}