import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  debounceTime
} from 'rxjs';
import { Order, OrderStatus, OrderScenario, OrderTargetTimeType } from '../core/models';
import { OrderService } from '../orders/order.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

type SelectedOrderState = {
  orderId: number | null;
  order: Order | null;
  loading: boolean;
  error: boolean;
};

type OrderFilterFormValue = {
  id: string;
  status: string;
  paymentState: string;
  scenario: string;
  targetTimeType: string;
  userEmail: string;
  minTotal: string;
  maxTotal: string;
  dateFrom: string;
  dateTo: string;
  sort: string;
};

@Component({
  standalone: true,
  selector: 'app-admin-recent-orders',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
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

    .filters {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.9rem;
      border: 1px solid var(--border-soft);
      background: rgba(10, 10, 10, 0.04);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem 1rem;
    }

    .filters label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .filters label span {
      font-weight: 600;
      color: var(--text-primary, inherit);
    }

    .filters input,
    .filters select {
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-soft);
      font: inherit;
      background: var(--surface);
      color: inherit;
    }

    .filters input:focus,
    .filters select:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
    }

    .filters-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filters button[type='button'] {
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green, #06c167);
      cursor: pointer;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }

    .filters button[type='button']:hover,
    .filters button[type='button']:focus-visible {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      box-shadow: 0 6px 16px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      outline: none;
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

    .empty-orders {
      display: grid;
      place-items: center;
      padding: 1.5rem;
      border-radius: 0.9rem;
      border: 1px dashed var(--border-soft);
      color: var(--text-secondary);
      background: rgba(10, 10, 10, 0.02);
      text-align: center;
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

    .order-card .remark {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-radius: 0.75rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      line-height: 1.4;
      color: var(--text-primary);
    }

    .status-current {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      padding: 0.35rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      color: var(--brand-green, #06c167);
      align-self: flex-start;
    }

    .status-timeline {
      list-style: none;
      margin: clamp(0.75rem, 2vw, 1rem) 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: clamp(0.75rem, 2vw, 1rem);
    }

    .status-timeline-step {
      display: grid;
      grid-template-columns: auto 1fr;
      column-gap: 0.75rem;
      align-items: flex-start;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .status-marker {
      position: relative;
      display: flex;
      justify-content: center;
      width: 1rem;
      min-height: 1rem;
    }

    .status-dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      border: 2px solid var(--border-soft);
      background: var(--surface);
      box-sizing: border-box;
      transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
    }

    .status-connector {
      position: absolute;
      left: 50%;
      top: 0.75rem;
      bottom: calc(-1 * clamp(0.75rem, 2vw, 1rem));
      width: 2px;
      transform: translateX(-50%);
      background: var(--border-soft);
      transition: background-color 150ms ease;
    }

    .status-label {
      display: block;
      line-height: 1.2;
    }

    .status-timeline-step.completed .status-dot {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.95);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.65);
    }

    .status-timeline-step.completed .status-connector {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
    }

    .status-timeline-step.completed .status-label {
      color: var(--text-primary);
    }

    .status-timeline-step.current .status-dot {
      background: var(--brand-green, #06c167);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.65);
      box-shadow: 0 0 0 4px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
    }

    .status-timeline-step.current .status-label {
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
      flex-direction: column;
      gap: 0.45rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-soft);
    }

    .items-list li:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .items-list .item-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .items-list .item-remark {
      background: rgba(10, 10, 10, 0.04);
      border-radius: 0.6rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .order-remark {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.1);
      border-radius: 1rem;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .order-remark h3 {
      margin: 0;
      font-size: 1rem;
    }

    .order-remark p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.45;
      color: var(--text-primary);
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
        <div class="layout">
          <div class="orders-panel">
            <form class="filters" [formGroup]="filterForm" (submit)="$event.preventDefault()">
              <div class="filters-grid">
                <label>
                  <span>{{ 'admin.orders.filters.orderId' | translate: 'Order ID' }}</span>
                  <input type="number" inputmode="numeric" formControlName="id" placeholder="e.g. 1201" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.status' | translate: 'Status' }}</span>
                  <select formControlName="status">
                    <option *ngFor="let option of statusOptions" [value]="option.value">
                      {{ option.labelKey | translate: option.fallback }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.paymentState' | translate: 'Payment state' }}</span>
                  <input type="text" formControlName="paymentState" placeholder="e.g. paid" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.scenario' | translate: 'Scenario' }}</span>
                  <select formControlName="scenario">
                    <option *ngFor="let option of scenarioOptions" [value]="option.value">
                      {{ option.labelKey | translate: option.fallback }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.timing' | translate: 'Target time' }}</span>
                  <select formControlName="targetTimeType">
                    <option *ngFor="let option of targetTimeTypeOptions" [value]="option.value">
                      {{ option.labelKey | translate: option.fallback }}
                    </option>
                  </select>
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.customer' | translate: 'Customer email' }}</span>
                  <input type="email" formControlName="userEmail" placeholder="name@example.com" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.minTotal' | translate: 'Minimum total (€)' }}</span>
                  <input type="number" formControlName="minTotal" step="0.01" min="0" placeholder="0.00" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.maxTotal' | translate: 'Maximum total (€)' }}</span>
                  <input type="number" formControlName="maxTotal" step="0.01" min="0" placeholder="0.00" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.dateFrom' | translate: 'From date' }}</span>
                  <input type="date" formControlName="dateFrom" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.dateTo' | translate: 'To date' }}</span>
                  <input type="date" formControlName="dateTo" />
                </label>
                <label>
                  <span>{{ 'admin.orders.filters.sort' | translate: 'Sort by' }}</span>
                  <select formControlName="sort">
                    <option *ngFor="let option of sortOptions" [value]="option.value">
                      {{ option.labelKey | translate: option.fallback }}
                    </option>
                  </select>
                </label>
              </div>
              <div class="filters-actions">
                <button type="button" (click)="clearFilters()">
                  {{ 'admin.orders.filters.reset' | translate: 'Reset filters' }}
                </button>
              </div>
            </form>

            <ng-container *ngIf="orders.length; else emptyOrders">
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
                        | translate: 'Placed {{date}}': {
                            date: (order.created_at | date:'medium') || ''
                          }
                    }}
                  </div>
                  <div class="status-current" aria-label="Current status">
                    {{
                      formatStatus(resolveStatus(order))
                        || ('admin.orders.statusUnknown' | translate: 'Status unknown')
                    }}
                  </div>
                  <div class="remark" *ngIf="order.remark">{{ order.remark }}</div>
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
            </ng-container>
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

                  <div class="order-remark" *ngIf="selected.remark">
                    <h3>{{ 'orderDetail.orderRemarkHeading' | translate: 'Order note' }}</h3>
                    <p>{{ selected.remark }}</p>
                  </div>

                  <ol class="status-timeline" aria-label="Order status progression">
                          <li
                            class="status-timeline-step"
                            *ngFor="let status of statusFlow; let last = last"
                            [class.completed]="isStatusCompleted(resolveStatus(selected), status)"
                            [class.current]="isCurrentStatus(resolveStatus(selected), status)"
                          >
                            <div class="status-marker">
                              <span class="status-dot"></span>
                              <span class="status-connector" *ngIf="!last"></span>
                            </div>
                            <span class="status-label">{{ formatStatus(status) }}</span>
                          </li>
                        </ol>
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
                          <div class="item-line">
                            <span>
                              {{ item.menu_item?.name || ('#' + item.menu_item_id) }} × {{ item.quantity }}
                            </span>
                            <span>
                              {{ ((item.price_cents * item.quantity) / 100) | currency:'EUR' }}
                            </span>
                          </div>
                          <div class="item-remark" *ngIf="item.remark">{{ item.remark }}</div>
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

      <ng-template #emptyOrders>
        <div class="empty-orders">
          <p>{{ 'admin.orders.empty' | translate: 'No orders yet.' }}</p>
        </div>
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
  private fb = inject(FormBuilder);

  private readonly defaultFilters: OrderFilterFormValue = {
    id: '',
    status: '',
    paymentState: '',
    scenario: '',
    targetTimeType: '',
    userEmail: '',
    minTotal: '',
    maxTotal: '',
    dateFrom: '',
    dateTo: '',
    sort: 'created_at desc',
  };

  readonly filterForm = this.fb.nonNullable.group({
    id: this.defaultFilters.id,
    status: this.defaultFilters.status,
    paymentState: this.defaultFilters.paymentState,
    scenario: this.defaultFilters.scenario,
    targetTimeType: this.defaultFilters.targetTimeType,
    userEmail: this.defaultFilters.userEmail,
    minTotal: this.defaultFilters.minTotal,
    maxTotal: this.defaultFilters.maxTotal,
    dateFrom: this.defaultFilters.dateFrom,
    dateTo: this.defaultFilters.dateTo,
    sort: this.defaultFilters.sort,
  });

  readonly statusOptions: ReadonlyArray<{ value: string; labelKey: string; fallback: string }> = [
    { value: '', labelKey: 'admin.orders.filters.status.any', fallback: 'Any status' },
    { value: 'pending', labelKey: 'admin.orders.filters.status.pending', fallback: 'Pending' },
    { value: 'confirmed', labelKey: 'admin.orders.filters.status.confirmed', fallback: 'Confirmed' },
    { value: 'preparing', labelKey: 'admin.orders.filters.status.preparing', fallback: 'Preparing' },
    { value: 'delivered', labelKey: 'admin.orders.filters.status.delivered', fallback: 'Delivered' },
  ];

  readonly scenarioOptions: ReadonlyArray<{ value: '' | OrderScenario; labelKey: string; fallback: string }> = [
    { value: '', labelKey: 'admin.orders.filters.scenario.any', fallback: 'Any scenario' },
    { value: 'takeaway', labelKey: 'admin.orders.filters.scenario.takeaway', fallback: 'Takeaway' },
    { value: 'delivery', labelKey: 'admin.orders.filters.scenario.delivery', fallback: 'Delivery' },
    { value: 'eatin', labelKey: 'admin.orders.filters.scenario.eatin', fallback: 'Eat in' },
  ];

  readonly targetTimeTypeOptions: ReadonlyArray<{
    value: '' | OrderTargetTimeType;
    labelKey: string;
    fallback: string;
  }> = [
    { value: '', labelKey: 'admin.orders.filters.timing.any', fallback: 'Any timing' },
    { value: 'asap', labelKey: 'admin.orders.filters.timing.asap', fallback: 'ASAP' },
    { value: 'scheduled', labelKey: 'admin.orders.filters.timing.scheduled', fallback: 'Scheduled' },
  ];

  readonly sortOptions: ReadonlyArray<{ value: string; labelKey: string; fallback: string }> = [
    { value: 'created_at desc', labelKey: 'admin.orders.filters.sort.newest', fallback: 'Newest first' },
    { value: 'created_at asc', labelKey: 'admin.orders.filters.sort.oldest', fallback: 'Oldest first' },
    { value: 'total_cents desc', labelKey: 'admin.orders.filters.sort.highestTotal', fallback: 'Highest total' },
    { value: 'total_cents asc', labelKey: 'admin.orders.filters.sort.lowestTotal', fallback: 'Lowest total' },
    { value: 'status asc', labelKey: 'admin.orders.filters.sort.statusAsc', fallback: 'Status A → Z' },
    { value: 'status desc', labelKey: 'admin.orders.filters.sort.statusDesc', fallback: 'Status Z → A' },
  ];

  private readonly refreshOrders = new BehaviorSubject<void>(undefined);
  private readonly selectedOrderRefresh = new BehaviorSubject<void>(undefined);
  private readonly updatingOrderIds = new Set<number>();

  private selectedOrderId = new BehaviorSubject<number | null>(null);
  private readonly selectedOrderId$ = this.selectedOrderId.asObservable();

  private readonly filterParams$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.getRawValue()),
    debounceTime(200),
    map(value => this.buildQueryParams(value))
  );

  readonly orders$ = combineLatest([
    this.context.selectedRestaurant$,
    this.filterParams$,
    this.refreshOrders.asObservable(),
  ]).pipe(
    switchMap(([restaurant, params, refreshTrigger]) => {
      void refreshTrigger;
      return this.orderService.listForRestaurant(restaurant.id, params).pipe(
        map(orders => orders ?? []),
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
        }),
        catchError(error => {
          console.error('Failed to load restaurant orders', error);
          this.selectedOrderId.next(null);
          return of<Order[]>([]);
        })
      );
    }),
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
  }

  clearFilters(): void {
    this.filterForm.reset(this.defaultFilters);
  }

  trackByOrderId(_: number, order: Order): number {
    return order.id;
  }

  private buildQueryParams(value: Partial<OrderFilterFormValue>): Record<string, string> {
    const params: Record<string, string> = {};
    const q: Record<string, string> = {};

    const trimmedId = value.id?.trim() ?? '';
    if (trimmedId) {
      const parsedId = Number.parseInt(trimmedId, 10);
      if (!Number.isNaN(parsedId)) {
        q['id_eq'] = String(parsedId);
      }
    }

    if (value.status) {
      q['status_eq'] = value.status;
    }

    const paymentState = value.paymentState?.trim() ?? '';
    if (paymentState) {
      q['payment_state_eq'] = paymentState;
    }

    if (value.scenario) {
      q['scenario_eq'] = value.scenario;
    }

    if (value.targetTimeType) {
      q['target_time_type_eq'] = value.targetTimeType;
    }

    const email = value.userEmail?.trim() ?? '';
    if (email) {
      q['user_email_cont'] = email;
    }

    const minTotal = Number.parseFloat(value.minTotal ?? '');
    if (!Number.isNaN(minTotal)) {
      q['total_cents_gteq'] = String(Math.round(minTotal * 100));
    }

    const maxTotal = Number.parseFloat(value.maxTotal ?? '');
    if (!Number.isNaN(maxTotal)) {
      q['total_cents_lteq'] = String(Math.round(maxTotal * 100));
    }

    if (value.dateFrom) {
      const from = new Date(value.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        q['created_at_gteq'] = from.toISOString();
      }
    }

    if (value.dateTo) {
      const to = new Date(value.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setUTCHours(23, 59, 59, 999);
        q['created_at_lteq'] = to.toISOString();
      }
    }

    for (const [key, val] of Object.entries(q)) {
      params[`q[${key}]`] = val;
    }

    const sort = value.sort ?? this.defaultFilters.sort;
    if (sort) {
      params['q[s]'] = sort;
    }

    return params;

  }
  
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

  isCurrentStatus(currentStatus: string | null | undefined, status: OrderStatus): boolean {
    return this.normalizeStatus(currentStatus ?? '') === status;
  }

  isStatusCompleted(currentStatus: string | null | undefined, status: OrderStatus): boolean {
    const normalized = this.normalizeStatus(currentStatus ?? '');
    const currentIndex = this.statusFlow.findIndex(step => step === normalized);
    const stepIndex = this.statusFlow.findIndex(step => step === status);

    if (currentIndex === -1 || stepIndex === -1) {
      return false;
    }

    return stepIndex < currentIndex;
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
