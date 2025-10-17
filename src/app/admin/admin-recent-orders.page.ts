import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, switchMap, tap } from 'rxjs';
import { Order } from '../core/models';
import { OrderService } from '../orders/order.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-recent-orders',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe, TranslatePipe],
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

    .orders-shell {
      display: grid;
      grid-template-columns: minmax(0, 2.25fr) minmax(0, 1.5fr);
      gap: 1.5rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.05);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .order-card:hover {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      box-shadow: 0 12px 28px rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
    }

    .order-card.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.45);
      box-shadow: 0 16px 30px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
    }

    .order-card header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-weight: 600;
    }

    .status-line {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: color-mix(in srgb, var(--brand-green) 70%, black);
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.01em;
    }

    .meta {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .advance {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.95rem;
      border-radius: 999px;
      background: var(--brand-green);
      border: none;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, box-shadow 0.2s ease;
    }

    .advance:disabled {
      cursor: not-allowed;
      background: rgba(10, 10, 10, 0.25);
      box-shadow: none;
    }

    .advance:not(:disabled):hover {
      background: color-mix(in srgb, var(--brand-green) 80%, black);
      box-shadow: 0 10px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
    }

    .order-detail {
      background: rgba(255, 255, 255, 0.85);
      border-radius: 1rem;
      border: 1px solid rgba(10, 10, 10, 0.08);
      padding: clamp(1.25rem, 2vw, 1.75rem);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: var(--shadow-soft);
    }

    .order-detail header h4 {
      margin: 0;
      font-size: clamp(1.35rem, 2.2vw, 1.65rem);
    }

    .order-detail header p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .detail-status {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .status-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .status-steps li {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.75rem;
      align-items: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      position: relative;
      padding-left: 0.3rem;
    }

    .status-steps li::before {
      content: '';
      position: absolute;
      left: 0.6rem;
      top: -0.8rem;
      bottom: calc(100% - 1.1rem);
      width: 2px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
    }

    .status-steps li:first-child::before {
      display: none;
    }

    .status-steps li.completed {
      color: color-mix(in srgb, var(--brand-green) 55%, black);
    }

    .status-steps li.active {
      color: var(--text-primary);
      font-weight: 600;
    }

    .status-steps .dot {
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.15);
      border: 2px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      display: inline-block;
    }

    .status-steps li.completed .dot {
      background: var(--brand-green);
      border-color: var(--brand-green);
    }

    .status-steps li.active .dot {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
      border-color: var(--brand-green);
    }

    .detail-meta {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    @media (max-width: 1000px) {
      .orders-shell {
        grid-template-columns: 1fr;
      }

      .order-detail {
        order: -1;
      }
    }
  `],
  template: `
    <section class="card" *ngIf="orders$ | async as orders">
      <header>
        <h3>{{ 'admin.orders.heading' | translate: 'Recent orders' }}</h3>
        <p>{{ 'admin.orders.description' | translate: 'Review recent activity to keep operations running smoothly.' }}</p>
      </header>

      <ng-container *ngIf="orders.length; else emptyOrders">
        <ng-container *ngIf="selectedOrderId$ | async as selectedId">
          <div class="orders-shell">
            <div class="orders-list">
              <article
                class="order-card"
                *ngFor="let order of orders"
                (click)="selectOrder(order)"
                [class.active]="order.id === selectedId"
              >
                <header>
                  <span>
                    #{{ order.id }} ·
                    {{ order.restaurant?.name || ('admin.orders.unknownRestaurant' | translate: 'Unknown restaurant') }}
                  </span>
                  <span>{{ order.total_cents / 100 | currency:'EUR' }}</span>
                </header>
                <div class="meta">
                  {{ 'admin.orders.placed' | translate: 'Placed {{date}}': { date: (order.created_at | date:'medium') || '' } }}
                </div>
                <div class="status-line">
                  <span>{{ 'admin.orders.currentStatus' | translate: 'Current status' }}</span>
                  <span class="status-chip">{{ displayState(order) | titlecase }}</span>
                </div>
                <div class="meta" *ngIf="order.user?.email">
                  {{ 'admin.orders.customer' | translate: 'Customer: {{email}}': { email: order.user?.email || '' } }}
                </div>
                <button
                  type="button"
                  class="advance"
                  *ngIf="nextState(order) as next"
                  (click)="advanceOrder(order, next, $event)"
                  [disabled]="isUpdating(order.id)"
                >
                  {{ 'admin.orders.advance' | translate: 'Advance to {{state}}': { state: next | titlecase } }}
                </button>
              </article>
            </div>

            <aside class="order-detail" *ngIf="selectedOrder$ | async as selected">
              <header>
                <h4>{{ 'admin.orders.detailTitle' | translate: 'Order #{{id}}': { id: selected.id } }}</h4>
                <p>{{ 'admin.orders.detailSubtitle' | translate: 'Placed {{date}}': { date: (selected.created_at | date:'medium') || '' } }}</p>
              </header>

              <div class="detail-status">
                <div class="status-header">
                  <span>{{ 'admin.orders.currentStatus' | translate: 'Current status' }}</span>
                  <span class="status-chip">{{ displayState(selected) | titlecase }}</span>
                </div>
                <ul class="status-steps">
                  <li
                    *ngFor="let state of states"
                    [class.completed]="isCompleted(state, selected)"
                    [class.active]="isActive(state, selected)"
                  >
                    <span class="dot"></span>
                    <span class="label">{{ state | titlecase }}</span>
                  </li>
                </ul>
              </div>

              <div class="detail-meta">
                <div>
                  {{ 'admin.orders.total' | translate: 'Total' }}:
                  {{ selected.total_cents / 100 | currency:'EUR' }}
                </div>
                <div *ngIf="selected.user?.email">
                  {{ 'admin.orders.customer' | translate: 'Customer: {{email}}': { email: selected.user?.email || '' } }}
                </div>
                <div>
                  {{ 'admin.orders.detailRestaurant' | translate: 'Restaurant' }}:
                  {{ selected.restaurant?.name || ('admin.orders.unknownRestaurant' | translate: 'Unknown restaurant') }}
                </div>
              </div>

              <button
                type="button"
                class="advance"
                *ngIf="nextState(selected) as next"
                (click)="advanceOrder(selected, next)"
                [disabled]="isUpdating(selected.id)"
              >
                {{ 'admin.orders.advance' | translate: 'Advance to {{state}}': { state: next | titlecase } }}
              </button>
            </aside>
          </div>
        </ng-container>
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

  private readonly refresh$ = new BehaviorSubject<number>(Date.now());
  private readonly selectedOrderIdSubject = new BehaviorSubject<number | null>(null);
  readonly selectedOrderId$ = this.selectedOrderIdSubject.asObservable();

  readonly states = [
    'composing',
    'sent',
    'received',
    'printed',
    'preparing',
    'prepared',
    'distributed',
  ] as const;

  private readonly updatingOrders = new Set<number>();

  readonly orders$ = combineLatest([this.context.selectedRestaurant$, this.refresh$]).pipe(
    switchMap(([restaurant]) =>
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

            const normalized =
              typeof candidate === 'string' ? Number(candidate) : candidate;

            if (typeof normalized !== 'number' || Number.isNaN(normalized)) {
              return false;
            }

            return normalized === restaurantId;
          });

          return filtered.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        }),
        tap(filtered => {
          const current = this.selectedOrderIdSubject.value;
          if (!filtered.length) {
            this.selectedOrderIdSubject.next(null);
            return;
          }

          if (current === null || !filtered.some(order => order.id === current)) {
            this.selectedOrderIdSubject.next(filtered[0]?.id ?? null);
          }
        })
      )
    )
  );

  readonly selectedOrder$ = combineLatest([this.orders$, this.selectedOrderId$]).pipe(
    map(([orders, selectedId]) => orders.find(order => order.id === selectedId) ?? null)
  );

  displayState(order: Order): string {
    return this.currentState(order) ?? order.state ?? order.status ?? 'unknown';
  }

  selectOrder(order: Order): void {
    this.selectedOrderIdSubject.next(order.id);
  }

  nextState(order: Order): (typeof this.states)[number] | null {
    const current = this.currentState(order);
    if (current === null) {
      return this.states[0];
    }

    const index = this.states.indexOf(current);
    if (index === -1 || index === this.states.length - 1) {
      return null;
    }

    return this.states[index + 1];
  }

  isCompleted(state: (typeof this.states)[number], order: Order): boolean {
    const current = this.currentState(order);
    if (current === null) {
      return false;
    }

    return this.states.indexOf(state) < this.states.indexOf(current);
  }

  isActive(state: (typeof this.states)[number], order: Order): boolean {
    const current = this.currentState(order);
    if (current === null) {
      return state === this.states[0];
    }

    return current === state;
  }

  isUpdating(orderId: number): boolean {
    return this.updatingOrders.has(orderId);
  }

  advanceOrder(order: Order, next: (typeof this.states)[number], event?: Event): void {
    event?.stopPropagation();
    if (this.isUpdating(order.id)) {
      return;
    }

    this.updatingOrders.add(order.id);
    this.orderService.updateState(order.id, next).subscribe({
      next: () => {
        this.updatingOrders.delete(order.id);
        this.refresh$.next(Date.now());
      },
      error: () => {
        this.updatingOrders.delete(order.id);
      },
    });
  }

  private currentState(order: Order): (typeof this.states)[number] | null {
    const candidate = (order.state ?? order.status) as string | undefined;
    return this.isFlowState(candidate) ? candidate : null;
  }

  private isFlowState(value: unknown): value is (typeof this.states)[number] {
    return this.states.includes(value as (typeof this.states)[number]);
  }
}
