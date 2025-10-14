import { Component, inject } from '@angular/core';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../orders/order.service';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Order } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-checkout',
  imports: [CurrencyPipe],
  styles: [`
    .card { max-width: 680px; margin: 0 auto; padding: 1rem; border:1px solid #eee; border-radius:12px; }
    button { background:#111; color:#fff; border:0; padding:.75rem 1rem; border-radius:8px; }
  `],
  template: `
    <div class="card">
      <h2>Checkout</h2>
      <p>Total: {{ (cart.subtotalCents()/100) | currency:'EUR' }}</p>
      <button (click)="placeOrder()" [disabled]="cart.lines().length === 0">Place order</button>
    </div>
  `
})
export class CheckoutPage {
  cart = inject(CartService);
  private orders = inject(OrderService);
  private router = inject(Router);

  async placeOrder(){
    const items = this.cart.lines().map(l => ({ menu_item_id: l.item.id, quantity: l.quantity }));
    const order: Order = await firstValueFrom(this.orders.create({ items }));
    this.cart.clear();
    this.router.navigate(['/orders', order!.id]);
  }
}