import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartService, type CartLine } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { AiSuggestedMenuItem, Order } from '../core/models';
import { RestaurantAiSuggestionsService } from '../restaurants/restaurant-ai-suggestions.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CurrencyPipe, TranslatePipe, NgFor, NgIf],
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

    button {
      align-self: flex-start;
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      border-radius: 14px;
      padding: 0.9rem 1.6rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 18px 32px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover:enabled {
      transform: translateY(-2px);
      box-shadow: 0 22px 40px rgba(6, 193, 103, 0.32);
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
      <button
        (click)="placeOrder()"
        [disabled]="cart.lines().length === 0 || isPlacingOrder || !cart.hasValidTargetTime()"
      >
        {{ 'checkout.placeOrder' | translate: 'Place order' }}
      </button>
      <section class="suggestions" *ngIf="isLoadingSuggestions || aiSuggestions.length">
        <div class="suggestions-header">
          <h3>{{ 'checkout.aiSuggestions.title' | translate: 'Recommended for your order' }}</h3>
          <p>{{ 'checkout.aiSuggestions.subtitle' | translate: 'Complete your meal with these smart picks.' }}</p>
        </div>
        <p class="suggestions-loading" *ngIf="isLoadingSuggestions">
          {{ 'general.loading' | translate: 'Loading…' }}
        </p>
        <div class="suggestion-grid" *ngIf="!isLoadingSuggestions">
          <article class="suggestion-card" *ngFor="let suggestion of aiSuggestions">
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
  `
})
export class CheckoutPage {
  cart = inject(CartService);
  private orders = inject(OrderService);
  private router = inject(Router);
  private aiSuggestionsService = inject(RestaurantAiSuggestionsService);
  isPlacingOrder = false;
  aiSuggestions: AiSuggestedMenuItem[] = [];
  isLoadingSuggestions = false;

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

  async placeOrder(){
    const lines = this.cart.lines();
    if (!lines.length || this.isPlacingOrder) return;
    if (!this.cart.hasValidTargetTime()) return;

    const restaurantId = lines[0].item.restaurant_id;
    const items = lines.map(l => ({
      menu_item_id: l.item.id,
      quantity: l.quantity,
      category_id: l.category?.id ?? null,
    }));
    const scenario = this.cart.scenario();
    const targetTimeType = this.cart.targetTimeType();
    const targetTimeAt = this.cart.targetTime();
    this.isPlacingOrder = true;

    try {
      const order: Order = await firstValueFrom(
        this.orders.create({ restaurantId, items, scenario, targetTimeType, targetTimeAt })
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
        await firstValueFrom(this.orders.updateState(order.id, 'sent'));
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
}
