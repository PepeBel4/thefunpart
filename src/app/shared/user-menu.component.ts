import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [NgIf, RouterLink, RouterLinkActive, TranslatePipe],
  template: `
    <ng-container *ngIf="auth.isLoggedIn(); else loggedOut">
      <a
        routerLink="/profile"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="profile-link"
      >
        {{ 'nav.profile' | translate: 'Profile' }}
      </a>
      <button type="button" class="logout-button" (click)="auth.logout()">
        {{ 'nav.logout' | translate: 'Logout' }}
      </button>
    </ng-container>
    <ng-template #loggedOut>
      <a routerLink="/login" class="login-link">
        {{ 'nav.login' | translate: 'Log in' }}
      </a>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }

      .profile-link {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        transition: background 0.25s ease, color 0.25s ease;
      }

      .profile-link:hover,
      .profile-link.active {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }

      .logout-button {
        border: 0;
        border-radius: 999px;
        padding: 0.5rem 1.1rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        transition: transform 0.2s ease, background 0.2s ease;
        background: #fff;
        color: var(--brand-black);
        box-shadow: 0 10px 18px rgba(255, 255, 255, 0.16);
      }

      .logout-button:hover {
        transform: translateY(-1px);
      }

      .login-link {
        border-radius: 999px;
        padding: 0.5rem 1.1rem;
        font-weight: 600;
        text-decoration: none;
        transition: transform 0.2s ease, background 0.2s ease;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .login-link:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-1px);
      }

      @media (max-width: 640px) {
        :host {
          width: 100%;
          flex-direction: column;
          align-items: stretch;
        }

        .logout-button,
        .login-link {
          width: 100%;
          text-align: center;
        }
      }
    `,
  ],
})
export class UserMenuComponent {
  protected auth = inject(AuthService);
}
