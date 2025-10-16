import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
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
      top: clamp(0.5rem, 2vw, 1.5rem);
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin: 0 auto;
      width: min(1220px, 100%);
      padding: 1rem clamp(1rem, 4vw, 2.5rem);
      border-radius: clamp(22px, 4vw, 32px);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58));
      color: var(--text-primary);
      border: 1px solid var(--surface-border);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    nav::after {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), transparent 65%);
      mix-blend-mode: screen;
      pointer-events: none;
      opacity: 0.85;
    }

    nav:hover {
      box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
      transform: translateY(-2px);
    }

    .brand {
      position: relative;
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
      background: linear-gradient(135deg, #1d9bf0, #38efb1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-icon {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.4));
      color: var(--brand-green);
      font-size: 1.35rem;
      box-shadow: inset 0 1px 6px rgba(255, 255, 255, 0.5), 0 8px 18px rgba(15, 23, 42, 0.14);
    }

    .brand-icon::after {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), transparent 70%);
      pointer-events: none;
      mix-blend-mode: screen;
    }

    .menu-toggle {
      position: relative;
      display: none;
      align-items: center;
      gap: 0.55rem;
      padding: 0.5rem 1rem;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.68);
      color: var(--text-primary);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 10px 25px rgba(15, 23, 42, 0.12);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
    }

    .menu-toggle:hover,
    .menu-toggle:focus-visible {
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 12px 28px rgba(15, 23, 42, 0.16);
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
      position: relative;
      padding: 0.45rem 1rem;
      border-radius: 999px;
      text-decoration: none;
      color: color-mix(in srgb, var(--text-secondary) 70%, #1f2937 30%);
      font-weight: 600;
      transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    }

    .nav-links a::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), transparent 70%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.7);
      box-shadow: 0 12px 20px rgba(15, 23, 42, 0.12);
    }

    .nav-links a:hover::after,
    .nav-links a.active::after {
      opacity: 1;
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
      position: relative;
      display: inline-flex;
      align-items: center;
      color: var(--text-secondary);
    }

    .language-toggle {
      position: relative;
      border: 0;
      background: rgba(255, 255, 255, 0.65);
      color: inherit;
      font: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      cursor: pointer;
      transition: transform 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 12px 24px rgba(15, 23, 42, 0.12);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
    }

    .language-toggle:hover,
    .language-toggle:focus-visible {
      color: var(--text-primary);
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 16px 32px rgba(15, 23, 42, 0.16);
      outline: none;
    }

    .language-menu.open .language-toggle {
      color: var(--text-primary);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.75), 0 16px 30px rgba(15, 23, 42, 0.15);
    }

    .language-menu .flag {
      font-size: 1.1rem;
      line-height: 1;
    }

    .language-menu .label {
      font-weight: 600;
      white-space: nowrap;
    }

    .chevron {
      font-size: 0.9rem;
      transition: transform 0.2s ease;
    }

    .language-menu.open .chevron {
      transform: rotate(180deg);
    }

    .language-options {
      position: absolute;
      top: calc(100% + 0.35rem);
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.45rem;
      border-radius: 0.9rem;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid var(--surface-border);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
      min-width: max-content;
      z-index: 5;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
    }

    .language-option {
      border: 0;
      background: transparent;
      color: var(--text-secondary);
      font: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.75rem;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: background 0.25s ease, color 0.25s ease;
      text-align: left;
      white-space: nowrap;
    }

    .language-option:hover,
    .language-option:focus-visible {
      background: rgba(255, 255, 255, 0.95);
      color: var(--text-primary);
      outline: none;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
    }

    .language-option[aria-selected='true'] {
      background: rgba(255, 255, 255, 0.8);
      color: var(--text-primary);
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.3);
      cursor: default;
    }

    @media (max-width: 760px) {
      .language-options {
        right: auto;
        left: 50%;
        transform: translateX(-50%);
      }
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

      .language-toggle {
        background: rgba(255, 255, 255, 0.08);
        padding: 0.45rem;
        gap: 0.35rem;
      }

      .language-toggle .label {
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

      .language-options {
        left: 50%;
        right: auto;
        transform: translate(-50%, 0);
        padding: 0.35rem;
        gap: 0.1rem;
      }

      .language-option {
        padding: 0.4rem 0.6rem;
        gap: 0.35rem;
      }

      .language-option .label {
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
        <div
          class="language-menu"
          #languageMenu
          [class.open]="isLanguageMenuOpen()"
          aria-label="{{ 'nav.languageLabel' | translate: 'Language' }}"
        >
          <button
            type="button"
            class="language-toggle"
            (click)="toggleLanguageMenu()"
            [attr.aria-expanded]="isLanguageMenuOpen()"
            aria-haspopup="listbox"
          >
            <span aria-hidden="true" class="flag">{{ selectedLanguageDetails().flag }}</span>
            <span class="label">{{ selectedLanguageDetails().label }}</span>
            <span aria-hidden="true" class="chevron">▾</span>
            <span class="sr-only">{{ 'nav.changeLanguage' | translate: 'Change language' }}</span>
          </button>
          <ul
            *ngIf="isLanguageMenuOpen()"
            class="language-options"
            role="listbox"
            [attr.aria-activedescendant]="selectedLanguageOptionId"
          >
            <li *ngFor="let lang of languages" role="presentation">
              <button
                type="button"
                class="language-option"
                (click)="onLanguageSelect(lang.code)"
                [attr.id]="languageOptionId(lang.code)"
                [attr.role]="'option'"
                [attr.aria-selected]="selectedLanguage() === lang.code"
              >
                <span aria-hidden="true" class="flag">{{ lang.flag }}</span>
                <span class="label">{{ lang.label }}</span>
              </button>
            </li>
          </ul>
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
  @ViewChild('languageMenu') languageMenu?: ElementRef<HTMLElement>;
  languages: LanguageOption[] = this.i18n.languages.map((lang) => ({
    ...lang,
    flag: this.flagFor(lang.code)
  }));
  language = this.i18n.languageSignal;
  selectedLanguage = signal(this.language());
  selectedLanguageDetails = computed<LanguageOption>(() => {
    const fallback = this.languages[0];
    return this.languages.find((lang) => lang.code === this.selectedLanguage()) ?? fallback;
  });
  isMenuOpen = signal(false);
  isLanguageMenuOpen = signal(false);
  selectedLanguageOptionId = `language-option-${this.selectedLanguage()}`;

  constructor() {
    effect(() => {
      this.selectedLanguage.set(this.language());
      this.selectedLanguageOptionId = this.languageOptionId(this.selectedLanguage());
    });
  }

  onLanguageChange(code: string) {
    this.i18n.setLanguage(code);
  }

  onLanguageSelect(code: string) {
    if (code !== this.selectedLanguage()) {
      this.onLanguageChange(code);
    }
    this.isLanguageMenuOpen.set(false);
  }

  toggleLanguageMenu() {
    this.isLanguageMenuOpen.update((open) => !open);
  }

  languageOptionId(code: string) {
    return `language-option-${code}`;
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isLanguageMenuOpen()) {
      return;
    }

    const target = event.target as Node | null;
    if (target && this.languageMenu?.nativeElement.contains(target)) {
      return;
    }

    this.isLanguageMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isLanguageMenuOpen()) {
      this.isLanguageMenuOpen.set(false);
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (typeof window !== 'undefined' && window.innerWidth > 640 && this.isMenuOpen()) {
      this.closeMenu();
    }
  }
}
