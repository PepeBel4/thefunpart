import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { Order } from '../core/models';
import { OrderService } from '../orders/order.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

type SelectedOrderState = {
  orderId: number | null;
  order: Order | null;
  loading: boolean;
  error: boolean;
};

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
      gap: clamp(1.25rem, 3vw, 1.75rem);
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
      gap: clamp(1.25rem, 3vw, 2rem);
      align-items: flex-start;
    }

    .orders-panel,
    .details-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .order-card {
      appearance: none;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.05);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease,
        background-color 150ms ease;
    }

    .order-card:hover,
    .order-card:focus-visible {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.15);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      outline: none;
    }

    .order-card.selected {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.5);
      box-shadow: 0 10px 22px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
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

    .details-card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.5rem, 3vw, 2.25rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: clamp(1rem, 2.5vw, 1.5rem);
    }

    .details-card h2 {
      font-size: clamp(1.75rem, 3vw, 2.4rem);
      font-weight: 700;
      margin: 0;
    }

    .items-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .items-list li {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-soft);
    }

    .items-list li:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .total {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 1.05rem;
    }

    .empty-details {
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--text-secondary);
      border: 1px dashed var(--border-soft);
      border-radius: var(--radius-card);
      padding: clamp(2rem, 4vw, 3rem);
      background: rgba(10, 10, 10, 0.02);
    }

    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .orders-panel {
        order: 2;
      }

      .details-panel {
        order: 1;
      }
    }
  `],
  template: `
    <section class="card" *ngIf="orders$ | async as orders">
      <header>
        <h3>{{ 'admin.orders.heading' | translate: 'Recent orders' }}</h3>
        <p>
          {{
            'admin.orders.description'
              | translate: 'Review recent activity to keep operations running smoothly.'
          }}
        </p>
      </header>

      <ng-container *ngIf="selectedOrderState$ | async as selectedState">
        <ng-container *ngIf="orders.length; else emptyOrders">
          <div class="layout">
            <div class="orders-panel">
              <div class="orders-list" role="list">
                <button
                  type="button"
                  class="order-card"
                  role="listitem"
                  *ngFor="let order of orders; trackBy: trackByOrderId"
                  (click)="selectOrder(order.id)"
                  [class.selected]="selectedState.orderId === order.id"
                >
                  <header>
                    <span>
                      #{{ order.id }} ·
                      {{
                        order.restaurant?.name
                          || ('admin.orders.unknownRestaurant' | translate: 'Unknown restaurant')
                      }}
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
                    {{
                      'admin.orders.customer'
                        | translate: 'Customer: {{email}}': { email: order.user?.email || '' }
                    }}
                  </div>
                </button>
              </div>
            </div>
            <aside class="details-panel">
              <ng-container *ngIf="selectedState.orderId !== null; else placeholder">
                <ng-container *ngIf="selectedState.loading; else detailsOrError">
                  <div class="empty-details">
                    <p>{{ 'admin.orders.loading' | translate: 'Loading order details…' }}</p>
                  </div>
                </ng-container>
                <ng-template #detailsOrError>
                  <ng-container *ngIf="!selectedState.error && selectedState.order as selected; else error">
                    <div class="details-card">
                      <div>
                        <h2>
                          {{ 'orderDetail.title' | translate: 'Order #{{id}}': { id: selected.id } }}
                        </h2>
                        <div class="meta">
                          {{
                            'orderDetail.subtitle'
                              | translate: '{{status}} • Placed {{date}}': {
                                  status: selected.status,
                                  date: (selected.created_at | date:'short') || ''
                                }
                          }}
                        </div>
                      </div>
                      <div>
                        <h3>{{ 'orderDetail.itemsHeading' | translate: 'Items' }}</h3>
                        <ul class="items-list">
                          <li *ngFor="let item of selected.order_items">
                            <span>
                              {{ item.menu_item?.name || ('#' + item.menu_item_id) }} × {{ item.quantity }}
                            </span>
                            <span>
                              {{ ((item.price_cents * item.quantity) / 100) | currency:'EUR' }}
                            </span>
                          </li>
                        </ul>
                      </div>
                      <div class="total">
                        <span>{{ 'orderDetail.total' | translate: 'Total' }}</span>
                        <span>{{ (selected.total_cents / 100) | currency:'EUR' }}</span>
                      </div>
                    </div>
                  </ng-container>
                </ng-template>
              </ng-container>
            </aside>
          </div>
        </ng-container>
      </ng-container>

      <ng-template #emptyOrders>
        <p>{{ 'admin.orders.empty' | translate: 'No orders yet.' }}</p>
      </ng-template>

      <ng-template #placeholder>
        <div class="empty-details">
          <p>{{ 'admin.orders.placeholder' | translate: 'Select an order to see its details.' }}</p>
        </div>
      </ng-template>

      <ng-template #error>
        <div class="empty-details">
          <p>
            {{
              'admin.orders.error'
                | translate: 'We could not load the order details. Please try again.'
            }}
          </p>
        </div>
      </ng-template>
    </section>
  `,
})
export class AdminRecentOrdersPage {
  private context = inject(AdminRestaurantContextService);
  private orderService = inject(OrderService);

  private selectedOrderId = new BehaviorSubject<number | null>(null);
  private readonly selectedOrderId$ = this.selectedOrderId.asObservable();

  readonly orders$ = this.context.selectedRestaurant$.pipe(
    switchMap(restaurant =>
      this.orderService.list().pipe(
        map(orders => {
          const restaurantId = restaurant.id;

          const filtered = (orders ?? []).filter(order => {
            const candidate =
              order.restaurant?.id ??
              (order as { restaurant_id?: number | string }).restaurant_id ??
              (order as { restaurantId?: number | string }).restaurantId ??
              null;

            if (candidate === null || candidate === undefined) {
              return false;
            }

            const normalized = typeof candidate === 'string' ? Number(candidate) : candidate;

            if (typeof normalized !== 'number' || Number.isNaN(normalized)) {
              return false;
            }

            return normalized === restaurantId;
          });

          return filtered.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        }),
        tap(orders => {
          const current = this.selectedOrderId.getValue();
          if (!orders.length) {
            if (current !== null) {
              this.selectedOrderId.next(null);
            }
            return;
          }

          if (!orders.some(order => order.id === current)) {
            this.selectedOrderId.next(orders[0]?.id ?? null);
          }
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedOrderState$ = this.selectedOrderId$.pipe(
    distinctUntilChanged(),
    switchMap(orderId => {
      if (orderId === null) {
        return of<SelectedOrderState>({
          orderId,
          order: null,
          loading: false,
          error: false,
        });
      }

      return this.orderService.get(orderId).pipe(
        map<Order, SelectedOrderState>(order => ({
          orderId,
          order: order ?? null,
          loading: false,
          error: false,
        })),
        startWith<SelectedOrderState>({
          orderId,
          order: null,
          loading: true,
          error: false,
        }),
        catchError(() =>
          of<SelectedOrderState>({
            orderId,
            order: null,
            loading: false,
            error: true,
          })
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  selectOrder(orderId: number): void {
    this.selectedOrderId.next(orderId);
  }

  trackByOrderId = (_: number, order: { id: number }) => order.id;
}
