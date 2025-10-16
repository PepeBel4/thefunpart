import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [NgIf, RouterLink, TranslatePipe],
  template: `
    <div class="user-menu-root" [class.open]="isOpen()">
      <button
        type="button"
        class="user-toggle"
        (click)="toggleMenu()"
        aria-haspopup="menu"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="isOpen() ? panelId : null"
        [attr.aria-label]="'nav.account' | translate: 'Account'"
      >
        <span aria-hidden="true" class="user-icon">👤</span>
        <span class="user-label">{{ 'nav.account' | translate: 'Account' }}</span>
        <span aria-hidden="true" class="chevron">▾</span>
      </button>
      <div
        *ngIf="isOpen()"
        class="menu-panel"
        role="menu"
        [attr.id]="panelId"
        [attr.aria-label]="'nav.accountMenu' | translate: 'Account menu'"
      >
        <ng-container *ngIf="auth.isLoggedIn(); else loggedOutMenu">
          <a routerLink="/profile" role="menuitem" (click)="closeMenu()">
            {{ 'nav.profile' | translate: 'Profile' }}
          </a>
          <button
            type="button"
            role="menuitem"
            class="panel-action"
            (click)="handleLogout()"
          >
            {{ 'nav.logout' | translate: 'Logout' }}
          </button>
        </ng-container>
        <ng-template #loggedOutMenu>
          <a routerLink="/login" role="menuitem" (click)="closeMenu()">
            {{ 'nav.login' | translate: 'Log in' }}
          </a>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: relative;
        display: inline-flex;
      }

      .user-menu-root {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      .user-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 0.85rem;
        border-radius: 999px;
        border: 0;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.92);
        font-weight: 600;
        transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
      }

      .user-toggle:hover,
      .user-toggle:focus-visible {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.14);
      }

      .user-menu-root.open .user-toggle {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
      }

      .user-icon {
        font-size: 1.1rem;
        line-height: 1;
      }

      .chevron {
        font-size: 0.75rem;
        line-height: 1;
        margin-left: -0.2rem;
      }

      .menu-panel {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 180px;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        border-radius: 12px;
        background: #fff;
        color: var(--brand-black);
        box-shadow: 0 16px 35px rgba(0, 0, 0, 0.18);
        z-index: 20;
      }

      .menu-panel a,
      .menu-panel .panel-action {
        display: block;
        width: 100%;
        padding: 0.55rem 0.75rem;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 600;
        text-align: left;
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .menu-panel a:hover,
      .menu-panel a:focus-visible,
      .menu-panel .panel-action:hover,
      .menu-panel .panel-action:focus-visible {
        background: rgba(6, 193, 103, 0.12);
        outline: none;
      }

      @media (max-width: 640px) {
        .user-toggle {
          padding: 0.4rem 0.6rem;
        }

        .user-label {
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

        .chevron {
          display: none;
        }

        .menu-panel {
          min-width: 160px;
        }
      }
    `,
  ],
})
export class UserMenuComponent {
  protected auth = inject(AuthService);
  protected isOpen = signal(false);
  protected panelId = `user-menu-${Math.random().toString(36).slice(2, 9)}`;
  protected host = inject(ElementRef<HTMLElement>);

  toggleMenu() {
    this.isOpen.update((open) => !open);
  }

  closeMenu() {
    this.isOpen.set(false);
  }

  async handleLogout() {
    await this.auth.logout();
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenu();
  }
}
