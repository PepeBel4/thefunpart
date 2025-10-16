import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { map, switchMap } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-recent-orders',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: rgba(6, 193, 103, 0.05);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(6, 193, 103, 0.18);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .order-card header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-weight: 600;
    }

    .meta {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
  `],
  template: `
    <section class="card" *ngIf="orders$ | async as orders">
      <header>
        <h3>{{ 'admin.orders.heading' | translate: 'Recent orders' }}</h3>
        <p>{{ 'admin.orders.description' | translate: 'Review recent activity to keep operations running smoothly.' }}</p>
      </header>

      <ng-container *ngIf="orders.length; else emptyOrders">
        <div class="orders-list">
          <article class="order-card" *ngFor="let order of orders">
            <header>
              <span>
                #{{ order.id }} ·
                {{ order.restaurant?.name || ('admin.orders.unknownRestaurant' | translate: 'Unknown restaurant') }}
              </span>
              <span>{{ order.total_cents / 100 | currency:'EUR' }}</span>
            </header>
            <div class="meta">
              {{
                'admin.orders.meta'
                  | translate: 'Placed {{date}} · Status: {{status}}': {
                      date: (order.created_at | date:'medium') || '',
                      status: order.status
                    }
              }}
            </div>
            <div class="meta" *ngIf="order.user?.email">
              {{ 'admin.orders.customer' | translate: 'Customer: {{email}}': { email: order.user?.email || '' } }}
            </div>
          </article>
        </div>
      </ng-container>

      <ng-template #emptyOrders>
        <p>{{ 'admin.orders.empty' | translate: 'No orders yet.' }}</p>
      </ng-template>
    </section>
  `,
})
export class AdminRecentOrdersPage {
  private context = inject(AdminRestaurantContextService);
  private orderService = inject(OrderService);

  readonly orders$ = this.context.selectedRestaurant$.pipe(
    switchMap(restaurant =>
      this.orderService.list().pipe(
        map(orders =>
          orders
            .filter(order => order.restaurant?.id === restaurant.id)
            .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        )
      )
    )
  );
}
