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
    <div class="user-menu-root">
      <button
        type="button"
        class="user-toggle"
        (click)="toggleMenu()"
        aria-haspopup="true"
        [attr.aria-expanded]="isOpen()"
      >
        <span aria-hidden="true" class="user-icon">👤</span>
        <span class="user-label">
          {{ 'nav.account' | translate: 'Account' }}
        </span>
      </button>
      <div *ngIf="isOpen()" class="menu-panel" role="menu">
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
      }

      .user-toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        border: 0;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.92);
        font-weight: 600;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .user-toggle:hover,
      .user-toggle:focus-visible {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
        outline: none;
      }

      .user-icon {
        font-size: 1.1rem;
        line-height: 1;
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
        background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
        outline: none;
      }

      @media (max-width: 640px) {
        :host {
          width: 100%;
        }

        .user-menu-root {
          width: 100%;
        }

        .user-toggle {
          width: 100%;
          justify-content: center;
        }

        .menu-panel {
          position: static;
          margin-top: 0.75rem;
          width: 100%;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
        }
      }
    `,
  ],
})
export class UserMenuComponent {
  protected auth = inject(AuthService);
  protected isOpen = signal(false);
  private host = inject(ElementRef<HTMLElement>);

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
