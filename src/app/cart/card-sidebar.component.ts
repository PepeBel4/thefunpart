import { Component, inject } from '@angular/core';
import { NgFor, CurrencyPipe, NgIf } from '@angular/common';
import { CartService } from './cart.service';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [NgFor, CurrencyPipe, NgIf, RouterLink, TranslatePipe],
  styles: [`
    aside {
      position: sticky;
      top: 2rem;
      align-self: start;
      background: var(--surface);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-soft);
      padding: 1.75rem 1.75rem 2rem;
      border: 1px solid rgba(10, 10, 10, 0.06);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 300px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .cart-lines {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .line { 
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-soft);
    }

    .line:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .line-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .line-category {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }

    .line-price {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .qty-controls {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .qty-btn {
      background: rgba(10, 10, 10, 0.05);
      border: 0;
      color: var(--text-secondary);
      border-radius: 10px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: 700;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .qty-btn:hover:not(:disabled) {
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
    }

    .qty-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .qty-display {
      min-width: 1.5rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-primary);
    }

    button.remove {
      background: rgba(10, 10, 10, 0.05);
      border: 0;
      color: var(--text-secondary);
      border-radius: 10px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .qty-controls button.remove {
      margin-left: 0.2rem;
    }

    button.remove:hover {
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
    }

    .empty-state {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .checkout {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      border-radius: 14px;
      padding: 0.85rem 1rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 16px 30px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .checkout:hover {
      transform: translateY(-1px);
      box-shadow: 0 20px 40px rgba(6, 193, 103, 0.32);
    }

    .checkout.disabled {
      pointer-events: none;
      opacity: 0.5;
      box-shadow: none;
    }

    @media (max-width: 980px) {
      aside {
        position: static;
        min-width: unset;
      }
    }
  `],
  template: `
    <aside>
      <header>
        <h3>{{ 'cart.title' | translate: 'Your cart' }}</h3>
        <ng-container *ngIf="cart.count() as count">
          <span class="badge">
            {{
              count === 1
                ? ('cart.itemsOne' | translate: '{{count}} item': { count })
                : ('cart.itemsMany' | translate: '{{count}} items': { count })
            }}
          </span>
        </ng-container>
      </header>

      <div class="cart-lines" *ngIf="cart.lines().length; else empty">
        <div class="line" *ngFor="let l of cart.lines()">
          <div>
            <div class="line-name">{{ l.item.name }}</div>
            <div class="line-price">{{ (l.item.price_cents / 100) | currency:'EUR' }}</div>
            <div class="line-category" *ngIf="l.category?.label as label">{{ label }}</div>
          </div>
          <div class="qty-controls">
            <button
              class="qty-btn"
              type="button"
              (click)="cart.changeQty(l.item.id, l.quantity - 1, l.category)"
              [disabled]="l.quantity === 1"
              [attr.aria-label]="'cart.decrease' | translate: 'Decrease quantity'"
            >
              &minus;
            </button>
            <span class="qty-display" aria-live="polite">{{ l.quantity }}</span>
            <button
              class="qty-btn"
              type="button"
              (click)="cart.changeQty(l.item.id, l.quantity + 1, l.category)"
              [attr.aria-label]="'cart.increase' | translate: 'Increase quantity'"
            >
              +
            </button>
            <button
              class="remove"
              type="button"
              (click)="cart.remove(l.item.id, l.category)"
              [attr.aria-label]="'cart.remove' | translate: 'Remove item'"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty-state">
          {{ 'cart.empty' | translate: 'Add something tasty from the menu to start an order.' }}
        </div>
      </ng-template>

      <div class="summary">
        <span>{{ 'cart.subtotal' | translate: 'Subtotal' }}</span>
        <span>{{ (cart.subtotalCents()/100) | currency:'EUR' }}</span>
      </div>

      <a class="checkout" routerLink="/checkout" [class.disabled]="cart.lines().length === 0">
        {{ 'cart.checkout' | translate: 'Go to checkout' }}
      </a>
    </aside>
  `
})
export class CartSidebarComponent {
  cart = inject(CartService);
}
