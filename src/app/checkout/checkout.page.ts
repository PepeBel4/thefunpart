import { CurrencyPipe, DecimalPipe, NgFor, NgIf, DOCUMENT } from '@angular/common';
import { Component, HostListener, OnDestroy, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartService, type CartLine, type CartRestaurant } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { AiSuggestedMenuItem, MenuItem, Order } from '../core/models';
import { RestaurantAiSuggestionsService } from '../restaurants/restaurant-ai-suggestions.service';
import { BrandColorService } from '../core/brand-color.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { MenuService } from '../menu/menu.service';

type CartFlightAnimation = {
  id: number;
  quantity: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  arcHeight: number;
};

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CurrencyPipe, DecimalPipe, TranslatePipe, NgFor, NgIf],
  styles: [`
    .card {
      max-width: 720px;
      margin: 0 auto;
      padding: 2.25rem;
      background: var(--surface);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    h2 {
      font-size: clamp(2rem, 3vw, 2.6rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      margin: 0;
    }

    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .loyalty-card-earned {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1.35rem 1.4rem 1.45rem;
      border-radius: var(--radius-card);
      background: linear-gradient(
        135deg,
        rgba(var(--brand-green-rgb, 6, 193, 103), 0.18),
        rgba(var(--brand-green-rgb, 6, 193, 103), 0.04)
      );
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.22);
      box-shadow: var(--shadow-soft);
      overflow: hidden;
    }

    .loyalty-card-earned__label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #045530;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      border-radius: 999px;
      padding: 0.25rem 0.65rem;
      align-self: flex-start;
    }

    .loyalty-card-earned__content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      color: rgba(4, 24, 16, 0.85);
    }

    .loyalty-card-earned__points {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
    }

    .loyalty-card-earned__value {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .loyalty-card-earned__unit {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(4, 24, 16, 0.65);
    }

    .loyalty-card-earned__hint {
      margin: 0;
      font-size: 0.9rem;
      color: rgba(4, 24, 16, 0.7);
    }

    .order-remark-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .order-remark-field label {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .order-remark-field textarea {
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.1);
      background: var(--surface);
      font: inherit;
      color: inherit;
      resize: vertical;
      min-height: 3.5rem;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }

    .order-remark-field textarea::placeholder {
      color: rgba(10, 10, 10, 0.45);
    }

    .order-remark-field textarea:focus {
      outline: none;
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
    }

    .order-remark-hint {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(10, 10, 10, 0.55);
    }

    button {
      align-self: flex-start;
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      border-radius: 14px;
      padding: 0.9rem 1.6rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 18px 32px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover:enabled {
      transform: translateY(-2px);
      box-shadow: 0 22px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.32);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .suggestions {
      border-top: 1px solid rgba(10, 10, 10, 0.08);
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .suggestions-header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .suggestions-header h3 {
      margin: 0;
      font-size: clamp(1.25rem, 2.3vw, 1.6rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .suggestions-header p {
      margin: 0;
      color: rgba(10, 10, 10, 0.6);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .suggestions-loading {
      color: rgba(10, 10, 10, 0.6);
      font-size: 0.95rem;
      margin: 0;
    }

    .suggestion-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .suggestion-card {
      background: var(--surface-elevated, #ffffff);
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 16px;
      padding: 1.1rem;
      box-shadow: var(--shadow-soft, 0 10px 24px rgba(10, 10, 10, 0.06));
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .suggestion-photo {
      margin: 0;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(10, 10, 10, 0.04);
    }

    .suggestion-photo img {
      width: 100%;
      display: block;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .suggestion-card h4 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .suggestion-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
    }

    .suggestion-price {
      font-weight: 600;
      font-size: 1rem;
    }

    .suggestion-description {
      margin: 0;
      color: rgba(10, 10, 10, 0.6);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .suggestion-card-button {
      display: contents;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 24, 16, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 1200;
      backdrop-filter: blur(2px);
    }

    .modal {
      background: var(--surface, #ffffff);
      border-radius: 24px;
      width: min(100%, 500px);
      max-height: min(720px, calc(100vh - 3rem));
      overflow-y: auto;
      padding: clamp(1.6rem, 4vw, 2.4rem);
      box-shadow: 0 24px 64px rgba(4, 30, 18, 0.35);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .menu-item-modal h3 {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 2rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .menu-item-modal figure {
      margin: 0;
      border-radius: 18px;
      overflow: hidden;
    }

    .menu-item-modal figure img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 3;
      object-fit: cover;
    }

    .modal-close-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 12px 24px rgba(4, 24, 16, 0.12);
      font-size: 1.5rem;
      font-weight: 600;
      cursor: pointer;
      color: rgba(4, 24, 16, 0.7);
    }

    .modal-close-button:hover,
    .modal-close-button:focus-visible {
      background: #fff;
      color: var(--brand-green, #06c167);
      outline: none;
    }

    .menu-item-modal .price-group {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }

    .menu-item-modal .price {
      font-weight: 700;
      font-size: 1.35rem;
    }

    .menu-item-modal .price.discounted {
      color: var(--brand-green, #06c167);
    }

    .menu-item-modal .price.original {
      font-size: 1rem;
      color: rgba(10, 10, 10, 0.55);
      text-decoration: line-through;
    }

    .menu-item-modal .discount-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green, #06c167);
      border-radius: 999px;
      padding: 0.2rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .menu-item-modal .menu-item-description {
      margin: 0;
      color: rgba(10, 10, 10, 0.7);
      font-size: 1rem;
      line-height: 1.5;
    }

    .menu-item-modal .menu-item-reason {
      margin: 0;
      background: rgba(6, 193, 103, 0.08);
      color: rgba(4, 24, 16, 0.75);
      border-radius: 14px;
      padding: 0.75rem 0.9rem;
      font-size: 0.95rem;
    }

    .menu-item-modal .quantity-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.35rem;
      border-radius: 999px;
      background: rgba(10, 10, 10, 0.04);
    }

    .menu-item-modal .quantity-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: #fff;
      box-shadow: 0 6px 14px rgba(4, 24, 16, 0.12);
      font-size: 1.35rem;
      line-height: 1;
      font-weight: 600;
      cursor: pointer;
    }

    .menu-item-modal .quantity-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .menu-item-modal .quantity-display {
      min-width: 1.75rem;
      text-align: center;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .menu-item-modal .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .menu-item-modal .modal-primary-button {
      align-self: stretch;
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: none;
      border-radius: 14px;
      padding: 0.85rem 1.2rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 18px 32px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .menu-item-modal .modal-primary-button:hover:enabled {
      transform: translateY(-2px);
      box-shadow: 0 22px 40px rgba(6, 193, 103, 0.32);
    }

    .menu-item-modal .modal-primary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .menu-item-modal-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 220px;
      text-align: center;
      color: rgba(10, 10, 10, 0.6);
    }

    .cart-flight-layer {
      pointer-events: none;
    }

    @media (max-width: 640px) {
      .card {
        padding: 1.8rem;
      }

      .suggestion-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="card">
      <div>
        <h2>{{ 'checkout.title' | translate: 'Checkout' }}</h2>
        <p>{{ 'checkout.subtitle' | translate: 'Confirm your delivery and get ready for a delicious drop-off.' }}</p>
      </div>
      <div class="summary">
        <span>{{ 'checkout.total' | translate: 'Total' }}</span>
        <span>{{ (cart.subtotalCents()/100) | currency:'EUR' }}</span>
      </div>
      <div class="loyalty-card-earned" *ngIf="cart.loyaltyPoints() > 0">
        <span class="loyalty-card-earned__label">
          {{ 'checkout.loyaltyPoints.label' | translate: 'Loyalty rewards' }}
        </span>
        <div class="loyalty-card-earned__content">
          <div class="loyalty-card-earned__points">
            <span class="loyalty-card-earned__value">{{ cart.loyaltyPoints() | number:'1.0-0' }}</span>
            <span class="loyalty-card-earned__unit">{{ 'checkout.loyaltyPoints.unit' | translate: 'points' }}</span>
          </div>
          <p class="loyalty-card-earned__hint">
            {{ 'checkout.loyaltyPoints.hint' | translate: 'Earn these rewards when this order is completed.' }}
          </p>
        </div>
      </div>
      <button
        (click)="placeOrder()"
        [disabled]="cart.lines().length === 0 || isPlacingOrder || !cart.hasValidTargetTime()"
      >
        {{ 'checkout.placeOrder' | translate: 'Place order' }}
      </button>
      <div class="order-remark-field">
        <label for="checkout-order-remark">{{ 'checkout.orderRemark.label' | translate: 'Order note' }}</label>
        <textarea
          id="checkout-order-remark"
          rows="3"
          [value]="cart.orderRemark() ?? ''"
          (input)="onOrderRemarkInput($event)"
          [attr.placeholder]="'checkout.orderRemark.placeholder' | translate: 'Share delivery instructions or notes for the kitchen'"
        ></textarea>
        <p class="order-remark-hint">
          {{ 'checkout.orderRemark.hint' | translate: 'We share these notes with the restaurant.' }}
        </p>
      </div>
      <section class="suggestions" *ngIf="isLoadingSuggestions || aiSuggestions.length">
        <div class="suggestions-header">
          <h3>{{ 'checkout.aiSuggestions.title' | translate: 'Recommended for your order' }}</h3>
          <p>{{ 'checkout.aiSuggestions.subtitle' | translate: 'Complete your meal with these smart picks.' }}</p>
        </div>
        <p class="suggestions-loading" *ngIf="isLoadingSuggestions">
          {{ 'general.loading' | translate: 'Loading…' }}
        </p>
        <div class="suggestion-grid" *ngIf="!isLoadingSuggestions">
          <article
            class="suggestion-card"
            *ngFor="let suggestion of aiSuggestions"
            tabindex="0"
            role="button"
            aria-haspopup="dialog"
            (click)="openSuggestion(suggestion, $event)"
            (keydown)="onSuggestionKeydown($event, suggestion)"
            [attr.aria-label]="
              'restaurantDetail.menuItemInfoLabel'
                | translate
                  : 'View details for {{name}}'
                  : { name: suggestion.name }
            "
          >
            <figure class="suggestion-photo" *ngIf="suggestion.photo_url as photoUrl">
              <img [src]="photoUrl" [alt]="suggestion.name" loading="lazy" />
            </figure>
            <div class="suggestion-meta">
              <h4>{{ suggestion.name }}</h4>
              <span class="suggestion-price">
                {{ ((suggestion.discounted_price_cents ?? suggestion.price_cents) / 100) | currency:'EUR' }}
              </span>
            </div>
            <p class="suggestion-description" *ngIf="suggestion.reason as reason">{{ reason }}</p>
            <p class="suggestion-description" *ngIf="!suggestion.reason && suggestion.description as description">
              {{ description }}
            </p>
          </article>
        </div>
      </section>
    </div>

    <div class="cart-flight-layer" aria-hidden="true">
      <div
        class="cart-flight"
        *ngFor="let flight of cartFlights()"
        [style.--start-x]="flight.startX + 'px'"
        [style.--start-y]="flight.startY + 'px'"
        [style.--delta-x]="flight.deltaX + 'px'"
        [style.--delta-y]="flight.deltaY + 'px'"
        [style.--arc-height]="flight.arcHeight + 'px'"
      >
        <span class="cart-flight-badge">+{{ flight.quantity }}</span>
      </div>
    </div>

    <ng-container *ngIf="menuItemModalOpen()">
      <div class="modal-backdrop" (click)="closeMenuItemModal()">
        <div
          class="modal menu-item-modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'checkout-menu-item-modal-title'"
          [attr.aria-describedby]="'checkout-menu-item-modal-description'"
          (click)="$event.stopPropagation()"
        >
          <button
            type="button"
            class="modal-close-button"
            (click)="closeMenuItemModal()"
            [attr.aria-label]="'restaurantDetail.infoModalClose' | translate: 'Close'"
          >
            <span aria-hidden="true">×</span>
          </button>
          <ng-container *ngIf="selectedSuggestion() as activeSuggestion">
            <ng-container *ngIf="selectedMenuItem() as menuItem; else menuItemModalFallback">
              <figure *ngIf="menuItem.photos?.[0]?.url as photoUrl">
                <img [src]="photoUrl" [alt]="menuItem.name" loading="lazy" />
              </figure>
              <h3 id="checkout-menu-item-modal-title">{{ menuItem.name }}</h3>
              <p class="menu-item-reason" *ngIf="activeSuggestion.reason as reason">{{ reason }}</p>
              <div class="price-group" *ngIf="hasDiscount(menuItem); else checkoutRegularPrice">
                <span class="price discounted">
                  {{ (getCurrentPriceCents(menuItem) / 100) | currency:'EUR' }}
                </span>
                <span class="price original">
                  {{ (menuItem.price_cents / 100) | currency:'EUR' }}
                </span>
                <span class="discount-pill">
                  {{ 'restaurantDetail.discountBadge' | translate: 'Special offer' }}
                </span>
              </div>
              <ng-template #checkoutRegularPrice>
                <div class="price-group">
                  <span class="price">{{ (menuItem.price_cents / 100) | currency:'EUR' }}</span>
                </div>
              </ng-template>
              <p class="menu-item-description" id="checkout-menu-item-modal-description">
                {{
                  menuItem.description ||
                    ('restaurantDetail.customerFavourite' | translate: 'Customer favourite')
                }}
              </p>
              <div class="modal-actions">
                <div
                  class="quantity-controls"
                  role="group"
                  [attr.aria-label]="'cart.quantity' | translate: 'Quantity'"
                >
                  <button
                    type="button"
                    class="quantity-button"
                    (click)="changeMenuItemQuantity(-1)"
                    [disabled]="menuItemQuantity() === 1"
                    [attr.aria-label]="'cart.decrease' | translate: 'Decrease quantity'"
                  >
                    −
                  </button>
                  <span class="quantity-display" aria-live="polite">{{ menuItemQuantity() }}</span>
                  <button
                    type="button"
                    class="quantity-button"
                    (click)="changeMenuItemQuantity(1)"
                    [attr.aria-label]="'cart.increase' | translate: 'Increase quantity'"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  class="modal-primary-button"
                  (click)="addSelectedMenuItemToCart($event)"
                >
                  {{ 'restaurantDetail.addToCart' | translate: 'Add to cart' }}
                </button>
              </div>
            </ng-container>
          </ng-container>
          <ng-template #menuItemModalFallback>
            <div class="menu-item-modal-loading">
              <p *ngIf="isLoadingMenuItemDetails">
                {{ 'general.loading' | translate: 'Loading…' }}
              </p>
              <p *ngIf="!isLoadingMenuItemDetails">
                {{ 'menu.form.error.load' | translate: 'Could not load menu items. Please try again.' }}
              </p>
            </div>
          </ng-template>
        </div>
      </div>
    </ng-container>
  `
})
export class CheckoutPage implements OnDestroy {
  cart = inject(CartService);
  private orders = inject(OrderService);
  private router = inject(Router);
  private aiSuggestionsService = inject(RestaurantAiSuggestionsService);
  private brandColor = inject(BrandColorService);
  private menu = inject(MenuService);
  private document = inject(DOCUMENT);
  isPlacingOrder = false;
  aiSuggestions: AiSuggestedMenuItem[] = [];
  isLoadingSuggestions = false;
  menuItemModalOpen = signal(false);
  selectedSuggestion = signal<AiSuggestedMenuItem | null>(null);
  selectedMenuItem = signal<MenuItem | null>(null);
  menuItemQuantity = signal(1);
  cartFlights = signal<CartFlightAnimation[]>([]);
  isLoadingMenuItemDetails = false;
  private menuItemRequestId = 0;
  private nextCartFlightId = 0;
  private cartFlightTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
  private modalLockCount = 0;
  private bodyOverflowBackup: string | null = null;

  private suggestionKey: string | null = null;
  private suggestionsRequestId = 0;

  private suggestionEffect = effect(() => {
    const lines = this.cart.lines();

    if (!lines.length) {
      this.resetSuggestions();
      return;
    }

    const restaurantId = lines[0]?.item.restaurant_id;
    if (!restaurantId) {
      this.resetSuggestions();
      return;
    }

    const selectedIds = this.buildSelectedMenuItemIds(lines);
    if (!selectedIds.length) {
      this.resetSuggestions();
      return;
    }

    const key = `${restaurantId}:${selectedIds.join(',')}`;
    if (key === this.suggestionKey) {
      return;
    }

    this.suggestionKey = key;
    void this.fetchAiSuggestions(restaurantId, selectedIds);
  });

  private brandColorEffect = effect(() => {
    const restaurant = this.cart.restaurant();
    if (restaurant?.primaryColor) {
      this.brandColor.setOverride(restaurant.primaryColor);
    } else {
      this.brandColor.reset();
    }
  });

  ngOnDestroy(): void {
    this.brandColor.reset();
    this.clearCartFlightTimeouts();
    while (this.modalLockCount > 0) {
      this.unlockBodyScroll();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (this.menuItemModalOpen()) {
      event.preventDefault();
      this.closeMenuItemModal();
    }
  }

  onOrderRemarkInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement | null;
    this.cart.setOrderRemark(textarea?.value ?? null);
  }

  async placeOrder(){
    const lines = this.cart.lines();
    if (!lines.length || this.isPlacingOrder) return;
    if (!this.cart.hasValidTargetTime()) return;

    const restaurantId = lines[0].item.restaurant_id;
    const items = lines.map(l => ({
      menu_item_id: l.item.id,
      quantity: l.quantity,
      category_id: l.category?.id ?? null,
      remark: l.remark ?? null,
    }));
    const scenario = this.cart.scenario();
    const targetTimeType = this.cart.targetTimeType();
    const targetTimeAt = this.cart.targetTime();
    this.isPlacingOrder = true;

    try {
      const order: Order = await firstValueFrom(
        this.orders.create({
          restaurantId,
          items,
          scenario,
          targetTimeType,
          targetTimeAt,
          remark: this.cart.orderRemark(),
        })
      );

      const paymentResponse = await firstValueFrom(
        this.orders.createPayment(order.id, {
          amountCents: order.total_cents,
          description: `Order #${order.id}`,
          redirectUrl: `${window.location.origin}/orders/${order.id}`,
        })
      );

      const status = paymentResponse.payment.status?.toLowerCase?.();
      const isSuccess = status === 'succeeded' || status === 'paid' || status === 'successful';

      if (isSuccess) {
        await firstValueFrom(this.orders.updateStatus(order.id, 'sent'));
        this.cart.clear();
        await this.router.navigate(['/orders', order.id]);
        return;
      }

      const checkoutUrl = paymentResponse.payment.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      console.warn('Payment was not successful and no checkout URL was provided.', paymentResponse.payment.status);
    } catch (error) {
      console.error('Failed to place order', error);
    } finally {
      this.isPlacingOrder = false;
    }
  }

  async openSuggestion(suggestion: AiSuggestedMenuItem, event?: Event) {
    event?.preventDefault();
    const requestId = ++this.menuItemRequestId;
    this.selectedSuggestion.set(suggestion);
    this.selectedMenuItem.set(null);
    this.menuItemQuantity.set(1);

    const wasOpen = this.menuItemModalOpen();
    if (!wasOpen) {
      this.lockBodyScroll();
    }
    this.menuItemModalOpen.set(true);
    this.isLoadingMenuItemDetails = true;

    try {
      const item = await firstValueFrom(this.menu.get(suggestion.id));
      if (this.menuItemRequestId === requestId && this.menuItemModalOpen()) {
        this.selectedMenuItem.set(item);
      }
    } catch (error) {
      if (this.menuItemRequestId === requestId) {
        this.selectedMenuItem.set(null);
      }
      console.error('Failed to load menu item details', error);
    } finally {
      if (this.menuItemRequestId === requestId) {
        this.isLoadingMenuItemDetails = false;
      }
    }
  }

  onSuggestionKeydown(event: KeyboardEvent, suggestion: AiSuggestedMenuItem) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openSuggestion(suggestion, event);
    }
  }

  closeMenuItemModal() {
    if (!this.menuItemModalOpen()) {
      return;
    }

    this.menuItemModalOpen.set(false);
    this.selectedSuggestion.set(null);
    this.selectedMenuItem.set(null);
    this.menuItemQuantity.set(1);
    this.isLoadingMenuItemDetails = false;
    this.unlockBodyScroll();
  }

  changeMenuItemQuantity(delta: number) {
    this.menuItemQuantity.update(current => Math.max(1, current + Math.trunc(delta)));
  }

  addSelectedMenuItemToCart(event: Event) {
    const menuItem = this.selectedMenuItem();
    const suggestion = this.selectedSuggestion();
    if (!menuItem || !suggestion) {
      return;
    }

    const quantity = this.menuItemQuantity();
    const existingRestaurant = this.cart.restaurant();
    const incomingRestaurant: CartRestaurant | null = existingRestaurant
      ? { ...existingRestaurant }
      : { id: menuItem.restaurant_id, name: null, primaryColor: null };

    try {
      this.cart.add(menuItem, null, incomingRestaurant, quantity);
    } catch (error) {
      console.error('Failed to add menu item to cart', error);
      return;
    }

    const triggerRect = this.resolveTriggerRect(event);
    if (triggerRect) {
      this.launchCartFlight(quantity, triggerRect);
    }

    this.removeSuggestion(suggestion.id);
    this.closeMenuItemModal();
  }

  getCurrentPriceCents(item: MenuItem): number {
    const discounted = item.discounted_price_cents;
    if (typeof discounted === 'number' && Number.isFinite(discounted) && discounted > 0) {
      return discounted;
    }

    return item.price_cents;
  }

  hasDiscount(item: MenuItem): boolean {
    const discounted = item.discounted_price_cents;
    return (
      typeof discounted === 'number' &&
      Number.isFinite(discounted) &&
      discounted > 0 &&
      discounted < item.price_cents
    );
  }

  private buildSelectedMenuItemIds(lines: CartLine[]): number[] {
    return lines.flatMap(line => {
      const quantity = Math.max(0, Math.floor(line.quantity));
      return Array.from({ length: quantity }, () => line.item.id);
    });
  }

  private resetSuggestions() {
    this.suggestionKey = null;
    this.aiSuggestions = [];
    this.isLoadingSuggestions = false;
    this.suggestionsRequestId++;
  }

  private removeSuggestion(suggestionId: number) {
    this.aiSuggestions = this.aiSuggestions.filter(item => item.id !== suggestionId);
  }

  private async fetchAiSuggestions(restaurantId: number, selectedIds: number[]) {
    const requestId = ++this.suggestionsRequestId;
    this.isLoadingSuggestions = true;

    try {
      const suggestions = await firstValueFrom(
        this.aiSuggestionsService.fetch(restaurantId, {
          selectedMenuItemIds: selectedIds,
        })
      );

      if (this.suggestionsRequestId === requestId) {
        this.aiSuggestions = suggestions;
      }
    } catch (error) {
      if (this.suggestionsRequestId === requestId) {
        this.aiSuggestions = [];
      }
      console.error('Failed to load AI menu item suggestions', error);
    } finally {
      if (this.suggestionsRequestId === requestId) {
        this.isLoadingSuggestions = false;
      }
    }
  }

  private resolveTriggerRect(event?: Event): DOMRect | null {
    if (!event) {
      return null;
    }

    const target = event.currentTarget;
    if (target instanceof Element) {
      return target.getBoundingClientRect();
    }

    return null;
  }

  private launchCartFlight(quantity: number, triggerRect: DOMRect) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    const targetRect = this.getCartTargetRect();
    if (!targetRect) {
      return;
    }

    const badgeSize = 36;
    const startX = triggerRect.left + triggerRect.width / 2 - badgeSize / 2;
    const startY = triggerRect.top + triggerRect.height / 2 - badgeSize / 2;
    const endX = targetRect.left + targetRect.width / 2 - badgeSize / 2;
    const endY = targetRect.top + targetRect.height / 2 - badgeSize / 2;
    const id = ++this.nextCartFlightId;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.hypot(deltaX, deltaY);
    const arcHeight = Math.min(280, Math.max(110, distance * 0.42));

    const flight: CartFlightAnimation = {
      id,
      quantity,
      startX,
      startY,
      deltaX,
      deltaY,
      arcHeight,
    };

    this.cartFlights.update(current => [...current, flight]);

    const timeout = setTimeout(() => {
      this.cartFlights.update(current => current.filter(entry => entry.id !== id));
      this.cartFlightTimeouts.delete(id);
    }, 1150);

    this.cartFlightTimeouts.set(id, timeout);
  }

  private getCartTargetRect(): DOMRect | null {
    const cartElement = this.document.querySelector('.cart-pill');
    if (cartElement instanceof HTMLElement) {
      const rect = cartElement.getBoundingClientRect();
      if (rect.width || rect.height) {
        return rect;
      }
    }

    return null;
  }

  private lockBodyScroll() {
    if (this.modalLockCount === 0) {
      const currentOverflow = this.document.body.style.overflow;
      this.bodyOverflowBackup = currentOverflow ?? '';
      this.document.body.style.overflow = 'hidden';
    }

    this.modalLockCount++;
  }

  private unlockBodyScroll() {
    if (this.modalLockCount === 0) {
      return;
    }

    this.modalLockCount--;

    if (this.modalLockCount === 0) {
      if (this.bodyOverflowBackup && this.bodyOverflowBackup.length) {
        this.document.body.style.overflow = this.bodyOverflowBackup;
      } else {
        this.document.body.style.removeProperty('overflow');
      }
      this.bodyOverflowBackup = null;
    }
  }

  private clearCartFlightTimeouts() {
    for (const timeout of this.cartFlightTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.cartFlightTimeouts.clear();
    this.cartFlights.set([]);
  }
}
