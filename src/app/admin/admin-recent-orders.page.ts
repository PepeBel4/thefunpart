import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { Order, OrderStatus } from '../core/models';
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
      position: sticky;
      top: clamp(1rem, 4vw, 2rem);
      align-self: flex-start;
      max-height: calc(100vh - clamp(1rem, 4vw, 2rem));
      overflow-y: auto;
      padding-right: 0.25rem;
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

    .status-flow {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }

    .status-step {
      border-radius: 999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(10, 10, 10, 0.06);
      color: var(--text-secondary);
      transition: background-color 150ms ease, color 150ms ease;
    }

    .status-step.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
      color: var(--brand-green, #06c167);
    }

    .status-step.current {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
      color: var(--brand-green, #06c167);
    }

    .advance-status-button {
      align-self: flex-start;
      border: none;
      border-radius: 999px;
      padding: 0.45rem 0.85rem;
      font-weight: 600;
      background: var(--brand-green, #06c167);
      color: white;
      cursor: pointer;
      transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .advance-status-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .advance-status-button:not(:disabled):hover,
    .advance-status-button:not(:disabled):focus-visible {
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
      outline: none;
    }

    .advance-status-button small {
      font-weight: 500;
      opacity: 0.85;
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
        position: static;
        max-height: none;
        overflow: visible;
        padding-right: 0;
      }

      .advance-status-button {
        width: 100%;
        justify-content: center;
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
                <div
                  class="order-card"
                  role="listitem"
                  tabindex="0"
                  *ngFor="let order of orders; trackBy: trackByOrderId"
                  (click)="selectOrder(order.id)"
                  (keydown.enter)="selectOrder(order.id)"
                  (keydown.space)="selectOrder(order.id); $event.preventDefault()"
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
                            status: formatStatus(resolveStatus(order))
                          }
                    }}
                  </div>
                  <div class="status-flow" aria-label="Order status progression">
                    <span
                      class="status-step"
                      *ngFor="let status of statusFlow"
                      [class.active]="isStatusActive(resolveStatus(order), status)"
                      [class.current]="isCurrentStatus(resolveStatus(order), status)"
                    >
                      {{ formatStatus(status) }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="advance-status-button"
                    *ngIf="getNextStatus(resolveStatus(order)) as nextStatus"
                    (click)="advanceOrderStatus(order, nextStatus, $event)"
                    [disabled]="isUpdating(order.id)"
                  >
                    {{
                      'admin.orders.advance'
                        | translate: 'Mark as'
                    }}
                    <small>{{ formatStatus(nextStatus) }}</small>
                  </button>
                  <div class="meta" *ngIf="order.user?.email">
                    {{
                      'admin.orders.customer'
                        | translate: 'Customer: {{email}}': { email: order.user?.email || '' }
                    }}
                  </div>
                </div>
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
                                  status: formatStatus(resolveStatus(selected)),
                                  date: (selected.created_at | date:'short') || ''
                                }
                          }}
                        </div>
                        <div class="status-flow" aria-label="Order status progression">
                          <span
                            class="status-step"
                            *ngFor="let status of statusFlow"
                            [class.active]="isStatusActive(resolveStatus(selected), status)"
                            [class.current]="isCurrentStatus(resolveStatus(selected), status)"
                          >
                            {{ formatStatus(status) }}
                          </span>
                        </div>
                        <button
                          type="button"
                          class="advance-status-button"
                          *ngIf="getNextStatus(resolveStatus(selected)) as nextStatus"
                          (click)="advanceOrderStatus(selected, nextStatus, $event)"
                          [disabled]="isUpdating(selected.id)"
                        >
                          {{ 'admin.orders.advance' | translate: 'Mark as' }}
                          <small>{{ formatStatus(nextStatus) }}</small>
                        </button>
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
  readonly statusFlow: OrderStatus[] = [
    'composing',
    'sent',
    'received',
    'printed',
    'preparing',
    'prepared',
    'distributed',
  ];

  private context = inject(AdminRestaurantContextService);
  private orderService = inject(OrderService);

  private readonly refreshOrders = new BehaviorSubject<void>(undefined);
  private readonly selectedOrderRefresh = new BehaviorSubject<void>(undefined);
  private readonly updatingOrderIds = new Set<number>();

  private selectedOrderId = new BehaviorSubject<number | null>(null);
  private readonly selectedOrderId$ = this.selectedOrderId.asObservable();

  readonly orders$ = this.context.selectedRestaurant$.pipe(
    switchMap(restaurant =>
      this.refreshOrders.pipe(
        switchMap(() =>
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
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedOrderState$ = combineLatest([
    this.selectedOrderId$.pipe(distinctUntilChanged()),
    this.selectedOrderRefresh,
  ]).pipe(
    switchMap(([orderId]) => {
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
    this.selectedOrderRefresh.next(undefined);
  }

  trackByOrderId = (_: number, order: { id: number }) => order.id;

  getNextStatus(currentStatus: string | null | undefined): OrderStatus | null {
    if (!currentStatus) {
      return this.statusFlow[0] ?? null;
    }

    const normalized = this.normalizeStatus(currentStatus);
    const currentIndex = this.statusFlow.findIndex(status => status === normalized);
    if (currentIndex === -1) {
      return null;
    }

    return this.statusFlow[currentIndex + 1] ?? null;
  }

  resolveStatus(order: { status?: string | null; state?: string | null } | null | undefined): string | null {
    if (!order) {
      return null;
    }

    return order.status ?? (order as { state?: string | null }).state ?? null;
  }

  isStatusActive(currentStatus: string | null | undefined, status: OrderStatus): boolean {
    const normalized = this.normalizeStatus(currentStatus ?? '');
    const currentIndex = this.statusFlow.findIndex(step => step === normalized);
    const stepIndex = this.statusFlow.findIndex(step => step === status);
    if (stepIndex === -1) {
      return false;
    }

    return currentIndex >= stepIndex;
  }

  isCurrentStatus(currentStatus: string | null | undefined, status: OrderStatus): boolean {
    return this.normalizeStatus(currentStatus ?? '') === status;
  }

  formatStatus(status: string | null | undefined): string {
    if (!status) {
      return '';
    }

    return status
      .toString()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  isUpdating(orderId: number): boolean {
    return this.updatingOrderIds.has(orderId);
  }

  advanceOrderStatus(order: Order, nextStatus: OrderStatus, event?: Event): void {
    event?.stopPropagation?.();
    event?.preventDefault?.();

    if (this.updatingOrderIds.has(order.id)) {
      return;
    }

    this.updatingOrderIds.add(order.id);

    this.orderService.updateStatus(order.id, nextStatus).subscribe({
      next: updatedOrder => {
        this.refreshOrders.next(undefined);
        this.selectedOrderRefresh.next(undefined);

        if (this.selectedOrderId.getValue() === updatedOrder.id) {
          this.selectedOrderId.next(updatedOrder.id);
        }

        this.updatingOrderIds.delete(order.id);
      },
      error: error => {
        console.error('Failed to update order status', error);
        this.updatingOrderIds.delete(order.id);
      },
    });
  }

  private normalizeStatus(status: string | null | undefined): OrderStatus | string {
    if (!status) {
      return '';
    }

    const lower = status.toLowerCase();
    const match = this.statusFlow.find(step => step === lower);
    return match ?? status;
  }
}
