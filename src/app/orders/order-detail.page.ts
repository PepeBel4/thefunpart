import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from './order.service';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf],
  styles: [`
    :host {
      display: block;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    h2 {
      font-size: clamp(2rem, 3vw, 2.5rem);
      font-weight: 700;
      margin: 0;
    }

    .meta {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    li {
      display: flex;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-soft);
    }

    li:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .total {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 1.05rem;
    }
  `],
  template: `
    <ng-container *ngIf="order$ | async as o">
      <div class="card">
        <div>
          <h2>Order #{{ o.id }}</h2>
          <div class="meta">{{ o.status }} • Placed {{ o.created_at | date:'short' }}</div>
        </div>
        <div>
          <h3>Items</h3>
          <ul>
            <li *ngFor="let it of o.order_items">
              <span>
                {{ it.menu_item?.name || ('#' + it.menu_item_id) }} × {{ it.quantity }}
              </span>
              <span>{{ (it.price_cents/100) | currency:'EUR' }}</span>
            </li>
          </ul>
        </div>
        <div class="total">
          <span>Total</span>
          <span>{{ (o.total_cents/100) | currency:'EUR' }}</span>
        </div>
      </div>
    </ng-container>
  `
})
export class OrderDetailPage {
  private route = inject(ActivatedRoute);
  private svc = inject(OrderService);
  id = Number(this.route.snapshot.paramMap.get('id'));
  order$ = this.svc.get(this.id);
}
