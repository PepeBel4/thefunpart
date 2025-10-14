import { Component, inject } from '@angular/core';
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
    :host {
      display: block;
    }

    .hero {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2.5rem clamp(1.5rem, 4vw, 3rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }

    .hero-title {
      font-size: clamp(2.25rem, 4vw, 3rem);
      font-weight: 700;
      letter-spacing: -0.045em;
      margin: 0;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      color: var(--text-secondary);
    }

    .hero-meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .tag {
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
    }

    h3 {
      margin-top: 0;
      font-size: 1.5rem;
    }

    .menu {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
    }

    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.12), transparent 60%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .card:hover::after {
      opacity: 1;
    }

    .price {
      font-weight: 700;
      font-size: 1.1rem;
    }

    button {
      align-self: flex-start;
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      border-radius: 12px;
      padding: 0.6rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(6, 193, 103, 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgba(6, 193, 103, 0.28);
    }

    @media (max-width: 720px) {
      .hero {
        padding: 2rem 1.5rem;
      }

      .menu {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <ng-container *ngIf="(restaurant$ | async) as r">
      <section class="hero">
        <h2 class="hero-title">{{ r.name }}</h2>
        <p>{{ r.description || 'Fresh meals, crafted for delivery.' }}</p>
        <div class="hero-meta">
          <span class="tag">Popular</span>
          <span>⭐ 4.8</span>
          <span>20-30 min</span>
          <span>Free delivery over €15</span>
        </div>
      </section>

      <h3>Menu</h3>
      <div class="menu" *ngIf="(menu$ | async) as menu">
        <div class="card" *ngFor="let m of menu">
          <h4>{{ m.name }}</h4>
          <p>{{ m.description || 'Customer favourite' }}</p>
          <span class="price">{{ (m.price_cents / 100) | currency:'EUR' }}</span>
          <button (click)="add(m)">Add to cart</button>
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
