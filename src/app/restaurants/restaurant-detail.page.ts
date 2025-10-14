import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import { AsyncPipe, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { CartService } from '../cart/cart.service';

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf],
  styles: [`
    .menu { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .card { border:1px solid #eee; padding:1rem; border-radius:12px; }
    button { background:#111; color:#fff; border:0; padding:.5rem .75rem; border-radius:8px; cursor:pointer; }
  `],
  template: `
    <ng-container *ngIf="(restaurant$ | async) as r">
      <h2>{{ r.name }}</h2>
      <p>{{ r.description }}</p>
      <h3>Menu</h3>
      <div class="menu" *ngIf="(menu$ | async) as menu">
        <div class="card" *ngFor="let m of menu">
          <h4>{{ m.name }}</h4>
          <p>{{ m.description }}</p>
          <strong>{{ (m.price_cents / 100) | currency:'EUR' }}</strong>
          <div><button (click)="add(m)">Add</button></div>
        </div>
      </div>
    </ng-container>
  `
})
export class RestaurantDetailPage {
  private route = inject(ActivatedRoute);
  private menuSvc = inject(MenuService);
  private rSvc = inject(RestaurantService);
  private cart = inject(CartService);

  id = Number(this.route.snapshot.paramMap.get('id'));
  restaurant$ = this.rSvc.get(this.id);
  menu$ = this.menuSvc.listByRestaurant(this.id);
  add = this.cart.add.bind(this.cart);
}