import { Component, inject } from '@angular/core';
import { NgFor, CurrencyPipe } from '@angular/common';
import { CartService } from './cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [NgFor, CurrencyPipe, RouterLink],
  styles: [`
    aside { position: sticky; top: 0; align-self: start; border-left:1px solid #eee; padding-left:1rem; }
    .row { display:flex; justify-content:space-between; gap:.5rem; }
    input { width:64px; }
    button { background:transparent; border:1px solid #ddd; border-radius:8px; padding:.25rem .5rem; cursor:pointer; }
    .checkout { background:#111; color:#fff; border:0; padding:.5rem .75rem; border-radius:8px; margin-top:.5rem; width:100%; }
  `],
  template: `
    <aside>
      <h3>Cart</h3>
      <div *ngFor="let l of cart.lines()" class="row">
        <div>
          <div>{{ l.item.name }}</div>
          <small>{{ (l.item.price_cents / 100) | currency:'EUR' }}</small>
        </div>
        <div>
          <input type="number" min="1" [value]="l.quantity" (input)="cart.changeQty(l.item.id, $any($event.target).valueAsNumber)"/>
          <button (click)="cart.remove(l.item.id)">✕</button>
        </div>
      </div>
      <p><strong>Subtotal:</strong> {{ (cart.subtotalCents()/100) | currency:'EUR' }}</p>
      <a class="checkout" routerLink="/checkout">Go to checkout</a>
    </aside>
  `
})
export class CartSidebarComponent {
  cart = inject(CartService);
}