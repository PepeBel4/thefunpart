import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { CartService } from '../cart/cart.service';
import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../core/translation.service';
import { UserMenuComponent } from './user-menu.component';

type LanguageOption = { code: string; label: string; flag: string };

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, TranslatePipe, UserMenuComponent],
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: border-color 0.2s ease;
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

    .menu-toggle {
      display: none;
      align-items: center;
      gap: 0.55rem;
      padding: 0.45rem 0.9rem;
      border: 0;
      border-radius: 0.95rem;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.9);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
    }

    .menu-toggle:hover,
    .menu-toggle:focus-visible {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.14);
      outline: none;
    }

    .menu-icon {
      position: relative;
      width: 1.1rem;
      height: 0.8rem;
    }

    .menu-icon::before,
    .menu-icon::after,
    .menu-icon span {
      content: '';
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: currentColor;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .menu-icon::before {
      top: 0;
    }

    .menu-icon::after {
      bottom: 0;
    }

    .menu-icon span {
      top: 50%;
      transform: translateY(-50%);
    }

    .menu-toggle[aria-expanded='true'] .menu-icon::before {
      transform: translateY(5px) rotate(45deg);
    }

    .menu-toggle[aria-expanded='true'] .menu-icon::after {
      transform: translateY(-5px) rotate(-45deg);
    }

    .menu-toggle[aria-expanded='true'] .menu-icon span {
      opacity: 0;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: opacity 0.2s ease;
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

    .nav-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      margin-left: auto;
    }

    .nav-actions > * {
      flex-shrink: 0;
    }

    .language-menu {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.55rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
    }

    .language-menu button {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.6rem;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .language-menu button:hover,
    .language-menu button:focus-visible {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
      outline: none;
    }

    .language-menu button.active {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    }

    .language-menu .flag {
      font-size: 1.1rem;
      line-height: 1;
    }

    .language-menu .label {
      font-weight: 600;
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
      color: #042f1a;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      font-weight: 600;
      box-shadow: 0 12px 25px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .cart-icon {
      font-size: 1.2rem;
    }

    .cart-count {
      min-width: 1.75rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: rgba(4, 47, 26, 0.12);
      color: inherit;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .cart-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 35px rgba(6, 193, 103, 0.32);
    }

    @media (max-width: 900px) {
      nav {
        flex-wrap: wrap;
        row-gap: 0.75rem;
        align-items: flex-start;
      }

      .nav-actions {
        order: 4;
        margin-left: auto;
      }
    }

    @media (max-width: 640px) {
      nav {
        padding-inline: 1.1rem;
        position: sticky;
      }

      .nav-links {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        order: 6;
        gap: 0.35rem;
        padding: 0.85rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        display: none;
      }

      .nav-links.open {
        display: flex;
      }

      .language-menu {
        background: rgba(255, 255, 255, 0.08);
        padding: 0.25rem 0.4rem;
        gap: 0.45rem;
      }

      .language-menu button {
        padding: 0.45rem;
        border-radius: 999px;
      }

      .language-menu .label {
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

      .user-menu {
        order: 5;
      }

      .cart-pill {
        order: 6;
        padding: 0.5rem 0.85rem;
      }

      .nav-actions {
        order: 3;
        margin-left: 0;
        gap: 0.45rem;
      }

      .menu-toggle {
        display: inline-flex;
        order: 4;
        margin-left: auto;
      }

      .nav-links a {
        width: 100%;
        text-align: left;
        background: rgba(255, 255, 255, 0.04);
      }

      .nav-links a:hover,
      .nav-links a.active {
        background: rgba(255, 255, 255, 0.16);
      }

      .menu-toggle {
        display: inline-flex;
      }
    }
  `],
  template: `
    <nav>
      <a routerLink="/" class="brand">
        <span class="brand-icon">🛵</span>
        thefunpart <span>eats</span>
      </a>
      <button
        type="button"
        class="menu-toggle"
        (click)="toggleMenu()"
        [attr.aria-expanded]="isMenuOpen()"
        aria-controls="primary-navigation"
      >
        <span class="menu-icon" aria-hidden="true"><span></span></span>
        <span>{{ 'nav.menu' | translate: 'Menu' }}</span>
      </button>
      <div class="nav-links" id="primary-navigation" [class.open]="isMenuOpen()">
        <a routerLink="/" (click)="closeMenu()">{{ 'nav.discover' | translate: 'Discover' }}</a>
        <a routerLink="/b2b" (click)="closeMenu()">{{ 'nav.b2b' | translate: 'For restaurants' }}</a>
        <a routerLink="/orders" (click)="closeMenu()">{{ 'nav.orders' | translate: 'Orders' }}</a>
        <a *ngIf="auth.isLoggedIn()" routerLink="/admin" (click)="closeMenu()">{{ 'nav.manage' | translate: 'Manage' }}</a>
      </div>
      <div class="nav-actions">
        <div class="language-menu" role="group" aria-label="{{ 'nav.languageLabel' | translate: 'Language' }}">
          <button
            type="button"
            *ngFor="let lang of languages"
            (click)="onLanguageChange(lang.code)"
            [class.active]="selectedLanguage() === lang.code"
            [attr.aria-pressed]="selectedLanguage() === lang.code"
            [attr.aria-label]="lang.label"
          >
            <span aria-hidden="true" class="flag">{{ lang.flag }}</span>
            <span class="label">{{ lang.label }}</span>
          </button>
        </div>
        <app-user-menu class="user-menu"></app-user-menu>
        <a routerLink="/checkout" class="cart-pill">
          <span aria-hidden="true" class="cart-icon">🛒</span>
          <span class="cart-count">{{ cart.count() }}</span>
          <span class="sr-only">
            {{ 'nav.cart' | translate: 'Cart with {{count}} items': { count: cart.count() } }}
          </span>
        </a>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private i18n = inject(TranslationService);
  languages: LanguageOption[] = this.i18n.languages.map((lang) => ({
    ...lang,
    flag: this.flagFor(lang.code)
  }));
  language = this.i18n.languageSignal;
  selectedLanguage = signal(this.language());
  isMenuOpen = signal(false);

  constructor() {
    effect(() => {
      this.selectedLanguage.set(this.language());
    });
  }

  onLanguageChange(code: string) {
    this.i18n.setLanguage(code);
  }

  private flagFor(code: string): string {
    switch (code) {
      case 'nl':
        return '🇳🇱';
      case 'fr':
        return '🇫🇷';
      case 'de':
        return '🇩🇪';
      case 'en':
      default:
        return '🇬🇧';
    }
  }

  toggleMenu() {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (typeof window !== 'undefined' && window.innerWidth > 640 && this.isMenuOpen()) {
      this.closeMenu();
    }
  }
}
