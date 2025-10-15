import { Component, inject } from '@angular/core';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '../shared/translate.pipe';
import { firstValueFrom } from 'rxjs';
import { Order } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CurrencyPipe, TranslatePipe],
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
      <button (click)="placeOrder()" [disabled]="cart.lines().length === 0">
        {{ 'checkout.placeOrder' | translate: 'Place order' }}
      </button>
    </div>
  `
})
export class CheckoutPage {
  cart = inject(CartService);
  private orders = inject(OrderService);
  private router = inject(Router);

  async placeOrder(){
    const lines = this.cart.lines();
    if (!lines.length) return;

    const restaurantId = lines[0].item.restaurant_id;
    const items = lines.map(l => ({
      menu_item_id: l.item.id,
      quantity: l.quantity,
      category_id: l.category?.id ?? null,
    }));
    const order: Order = await firstValueFrom(this.orders.create({ restaurantId, items }));
    this.cart.clear();
    this.router.navigate(['/orders', order!.id]);
  }
}
