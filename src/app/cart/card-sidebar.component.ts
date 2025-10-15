import { Component, inject } from '@angular/core';
import { NgFor, CurrencyPipe, NgIf, NgClass } from '@angular/common';
import { CartService } from './cart.service';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';
import { OrderScenario, OrderTargetTimeType } from '../core/models';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [NgFor, CurrencyPipe, NgIf, RouterLink, TranslatePipe, NgClass],
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

    .cart-restaurant {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: rgba(6, 193, 103, 0.1);
      color: #056333;
      font-weight: 600;
    }

    .cart-restaurant-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(5, 99, 51, 0.8);
    }

    .cart-restaurant-name {
      font-size: 1rem;
    }

    .order-settings {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .option-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .option {
      border: 1px solid var(--border-soft);
      background: transparent;
      border-radius: 999px;
      padding: 0.35rem 0.9rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      line-height: 1.1;
    }

    .option-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .option svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .option-label {
      white-space: nowrap;
    }

    .option:hover {
      border-color: var(--brand-green);
      color: var(--brand-green);
    }

    .option.active {
      background: rgba(6, 193, 103, 0.14);
      border-color: rgba(6, 193, 103, 0.4);
      color: #056333;
    }

    .target-time-input {
      padding: 0.6rem 0.75rem;
      border-radius: 12px;
      border: 1px solid var(--border-soft);
      font-size: 0.9rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .target-time-input:focus {
      border-color: var(--brand-green);
      outline: none;
      box-shadow: 0 0 0 3px rgba(6, 193, 103, 0.16);
    }

    .help-text {
      font-size: 0.8rem;
      color: #b85c00;
      background: rgba(255, 170, 43, 0.16);
      padding: 0.4rem 0.6rem;
      border-radius: 10px;
      width: fit-content;
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
      <div class="cart-restaurant" *ngIf="cart.restaurant() as restaurant">
        <span class="cart-restaurant-label">
          {{ 'cart.restaurantLabel' | translate: 'Ordering from' }}
        </span>
        <span class="cart-restaurant-name">
          {{ restaurant.name || ('cart.restaurantFallback' | translate: 'this restaurant') }}
        </span>
      </div>

      <section class="order-settings">
        <div class="field">
          <span class="field-label">{{ 'cart.scenario.label' | translate: 'Order type' }}</span>
          <div class="option-group">
            <button
              type="button"
              class="option"
              *ngFor="let scenario of scenarios"
              (click)="setScenario(scenario)"
              [ngClass]="{ active: cart.scenario() === scenario }"
            >
              <span class="option-icon" aria-hidden="true">
                <svg
                  *ngIf="scenario === 'takeaway'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.6"
                  aria-hidden="true"
                >
                  <path d="M8 7V6a4 4 0 0 1 8 0v1" />
                  <path d="M5.25 7h13.5l.98 11.745A2 2 0 0 1 17.74 21H6.26a2 2 0 0 1-1.99-2.255z" />
                </svg>
                <svg
                  *ngIf="scenario === 'delivery'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M3 6.5a1 1 0 0 1 1-1h11.2a1 1 0 0 1 .8.4l2.8 3.6H21a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-.3a2.7 2.7 0 1 1-5.4 0H9.7a2.7 2.7 0 1 1-5.4 0H4a1 1 0 0 1-1-1z"
                  />
                  <path d="M18 11.5h2V15h-2z" />
                  <circle cx="17" cy="17" r="1.7" />
                  <circle cx="7" cy="17" r="1.7" />
                </svg>
                <svg
                  *ngIf="scenario === 'eatin'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.6"
                  aria-hidden="true"
                >
                  <path d="M4 10.5h16" />
                  <path d="M6 10.5v8.25" />
                  <path d="M18 10.5v8.25" />
                  <path d="M12 10.5v8.25" />
                  <path d="M7.5 4v6.5" />
                  <path d="M16.5 4v6.5" />
                </svg>
              </span>
              <span class="option-label">
                {{ 'cart.scenario.' + scenario | translate: scenario }}
              </span>
            </button>
          </div>
        </div>

        <div class="field">
          <span class="field-label">
            {{ 'cart.targetTimeType.label' | translate: 'When do you want it?' }}
          </span>
          <div class="option-group">
            <button
              type="button"
              class="option"
              *ngFor="let type of targetTimeTypes"
              (click)="setTargetTimeType(type)"
              [ngClass]="{ active: cart.targetTimeType() === type }"
            >
              <span class="option-icon" aria-hidden="true">
                <svg
                  *ngIf="type === 'asap'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13 2.25 5.25 12h5.5L10.5 21.75 18.75 12h-5.5z" />
                </svg>
                <svg
                  *ngIf="type === 'scheduled'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.6"
                  aria-hidden="true"
                >
                  <rect x="4" y="6" width="16" height="14" rx="2" />
                  <path d="M8 4v4" />
                  <path d="M16 4v4" />
                  <path d="M4 10h16" />
                  <path d="M12 14l2 2 3-3" />
                </svg>
              </span>
              <span class="option-label">
                {{ 'cart.targetTimeType.' + type | translate: type }}
              </span>
            </button>
          </div>
        </div>

        <div class="field" *ngIf="cart.targetTimeType() === 'scheduled'">
          <label class="field-label" for="cart-target-time">
            {{ 'cart.targetTime.label' | translate: 'Schedule for' }}
          </label>
          <input
            id="cart-target-time"
            class="target-time-input"
            type="datetime-local"
            [value]="cart.targetTimeInput() ?? ''"
            (input)="onTargetTimeChange($event)"
          />
          <span class="help-text" *ngIf="!cart.hasValidTargetTime()">
            {{ 'cart.targetTime.required' | translate: 'Select a time to continue.' }}
          </span>
        </div>
      </section>

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

      <a
        class="checkout"
        routerLink="/checkout"
        [class.disabled]="cart.lines().length === 0 || !cart.hasValidTargetTime()"
      >
        {{ 'cart.checkout' | translate: 'Go to checkout' }}
      </a>
    </aside>
  `
})
export class CartSidebarComponent {
  cart = inject(CartService);
  scenarios = this.cart.scenarioOptions;
  targetTimeTypes = this.cart.targetTimeTypeOptions;

  setScenario(scenario: OrderScenario) {
    this.cart.setScenario(scenario);
  }

  setTargetTimeType(type: OrderTargetTimeType) {
    this.cart.setTargetTimeType(type);
  }

  onTargetTimeChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.cart.setTargetTimeInput(input?.value ?? null);
  }
}
