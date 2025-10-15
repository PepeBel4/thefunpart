import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NgIf } from '@angular/common';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf],
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
      box-shadow: 0 0 0 4px rgba(6, 193, 103, 0.25);
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

    .cart-pill {
      text-decoration: none;
      background: var(--brand-green);
      color: #042f1a;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      font-weight: 600;
      box-shadow: 0 12px 25px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .cart-pill:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 35px rgba(6, 193, 103, 0.32);
    }

    button,
    .login-link {
      border: 0;
      border-radius: 999px;
      padding: 0.5rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    button {
      background: #fff;
      color: var(--brand-black);
      box-shadow: 0 10px 18px rgba(255, 255, 255, 0.16);
    }

    button:hover {
      transform: translateY(-1px);
    }

    .login-link {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .login-link:hover {
      background: rgba(255, 255, 255, 0.18);
      transform: translateY(-1px);
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
        order: 4;
      }

      .cart-pill {
        order: 5;
        width: 100%;
        text-align: center;
      }

      button,
      .login-link {
        order: 6;
        width: 100%;
        text-align: center;
      }
    }
  `],
  template: `
    <nav>
      <a routerLink="/" class="brand">
        <span class="brand-icon">🛵</span>
        thefunpart <span>eats</span>
      </a>
      <div class="location-chip">Deliver now • 15-25 min</div>
      <span class="spacer"></span>
      <div class="nav-links">
        <a routerLink="/">Discover</a>
        <a routerLink="/orders">Orders</a>
        <a *ngIf="auth.isLoggedIn()" routerLink="/admin">Manage</a>
      </div>
      <a routerLink="/checkout" class="cart-pill">Cart ({{ cart.count() }})</a>
      <button *ngIf="auth.isLoggedIn(); else login" (click)="auth.logout()">Logout</button>
      <ng-template #login>
        <a routerLink="/login" class="login-link">Log in</a>
      </ng-template>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
}