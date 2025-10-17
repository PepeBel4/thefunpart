import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

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
      gap: 1.25rem;
    }

    .filters {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .filters .filter-grid {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.75rem 1rem;
    }

    .filters label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .filters input,
    .filters select {
      background: var(--surface-elevated, #fff);
      border: 1px solid rgba(10, 10, 10, 0.12);
      border-radius: 0.75rem;
      padding: 0.5rem 0.75rem;
      font: inherit;
      color: inherit;
    }

    .filters input:focus,
    .filters select:focus {
      outline: 2px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      outline-offset: 1px;
    }

    .filters .filter-actions {
      display: flex;
      gap: 0.5rem;
    }

    .filters button {
      border: none;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.15);
      color: rgb(var(--brand-green-rgb, 6, 193, 103));
      font-weight: 600;
      padding: 0.4rem 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .filters button:hover {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
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

      <form
        class="filters"
        [formGroup]="filterForm"
        (ngSubmit)="$event.preventDefault()"
        aria-label="{{ 'admin.orders.filters.aria' | translate: 'Filter orders' }}"
      >
        <div class="filter-grid">
          <label>
            <span>{{ 'admin.orders.filters.orderId' | translate: 'Order ID' }}</span>
            <input type="number" formControlName="id" inputmode="numeric" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.status' | translate: 'Status' }}</span>
            <input type="text" formControlName="status" list="order-status-suggestions" />
            <datalist id="order-status-suggestions">
              <option *ngFor="let status of statusSuggestions" [value]="status"></option>
            </datalist>
          </label>

          <label>
            <span>{{ 'admin.orders.filters.state' | translate: 'State' }}</span>
            <input type="text" formControlName="state" list="order-state-suggestions" />
            <datalist id="order-state-suggestions">
              <option *ngFor="let state of stateSuggestions" [value]="state"></option>
            </datalist>
          </label>

          <label>
            <span>{{ 'admin.orders.filters.paymentState' | translate: 'Payment state' }}</span>
            <input type="text" formControlName="payment_state" list="order-payment-state-suggestions" />
            <datalist id="order-payment-state-suggestions">
              <option *ngFor="let paymentState of paymentStateSuggestions" [value]="paymentState"></option>
            </datalist>
          </label>

          <label>
            <span>{{ 'admin.orders.filters.scenario' | translate: 'Scenario' }}</span>
            <input type="text" formControlName="scenario" list="order-scenario-suggestions" />
            <datalist id="order-scenario-suggestions">
              <option *ngFor="let scenario of scenarioSuggestions" [value]="scenario"></option>
            </datalist>
          </label>

          <label>
            <span>{{ 'admin.orders.filters.targetTimeType' | translate: 'Target time type' }}</span>
            <input type="text" formControlName="target_time_type" list="order-target-time-type-suggestions" />
            <datalist id="order-target-time-type-suggestions">
              <option *ngFor="let targetTimeType of targetTimeTypeSuggestions" [value]="targetTimeType"></option>
            </datalist>
          </label>

          <label>
            <span>{{ 'admin.orders.filters.customerEmail' | translate: 'Customer email' }}</span>
            <input type="email" formControlName="user_email" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.minTotal' | translate: 'Min total (€)' }}</span>
            <input type="number" formControlName="min_total_cents" inputmode="numeric" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.maxTotal' | translate: 'Max total (€)' }}</span>
            <input type="number" formControlName="max_total_cents" inputmode="numeric" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.createdFrom' | translate: 'Created from' }}</span>
            <input type="date" formControlName="created_from" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.createdTo' | translate: 'Created to' }}</span>
            <input type="date" formControlName="created_to" />
          </label>

          <label>
            <span>{{ 'admin.orders.filters.sort' | translate: 'Sort by' }}</span>
            <select formControlName="sort">
              <option *ngFor="let option of sortOptions" [value]="option.value">
                {{ option.translationKey | translate: option.fallback }}
              </option>
            </select>
          </label>
        </div>

        <div class="filter-actions">
          <button type="button" (click)="resetFilters()">
            {{ 'admin.orders.resetFilters' | translate: 'Reset filters' }}
          </button>
        </div>
      </form>

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
  private fb = inject(FormBuilder);

  readonly statusSuggestions = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
  readonly stateSuggestions = ['composing', 'sent'];
  readonly paymentStateSuggestions = ['pending', 'authorized', 'paid', 'failed'];
  readonly scenarioSuggestions = ['delivery', 'pickup', 'dine_in'];
  readonly targetTimeTypeSuggestions = ['asap', 'scheduled'];
  readonly sortOptions = [
    { value: 'created_at desc', translationKey: 'admin.orders.sort.newest', fallback: 'Newest first' },
    { value: 'created_at asc', translationKey: 'admin.orders.sort.oldest', fallback: 'Oldest first' },
    { value: 'total_cents desc', translationKey: 'admin.orders.sort.totalHigh', fallback: 'Highest total' },
    { value: 'total_cents asc', translationKey: 'admin.orders.sort.totalLow', fallback: 'Lowest total' },
  ];

  private readonly defaultFilters = {
    id: '',
    status: '',
    state: '',
    payment_state: '',
    scenario: '',
    target_time_type: '',
    user_email: '',
    min_total_cents: '',
    max_total_cents: '',
    created_from: '',
    created_to: '',
    sort: 'created_at desc',
  } as const;

  readonly filterForm = this.fb.nonNullable.group({
    id: [this.defaultFilters.id],
    status: [this.defaultFilters.status],
    state: [this.defaultFilters.state],
    payment_state: [this.defaultFilters.payment_state],
    scenario: [this.defaultFilters.scenario],
    target_time_type: [this.defaultFilters.target_time_type],
    user_email: [this.defaultFilters.user_email],
    min_total_cents: [this.defaultFilters.min_total_cents],
    max_total_cents: [this.defaultFilters.max_total_cents],
    created_from: [this.defaultFilters.created_from],
    created_to: [this.defaultFilters.created_to],
    sort: [this.defaultFilters.sort],
  });

  private filters$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.getRawValue()),
    debounceTime(300),
    map(value => this.buildQueryParams(value)),
    distinctUntilChanged((previous, current) => this.compareParams(previous, current))
  );

  readonly orders$ = combineLatest([this.context.selectedRestaurant$, this.filters$]).pipe(
    switchMap(([restaurant, params]) =>
      this.orderService.listForRestaurant(restaurant.id, params)
    ),
    map(orders => orders ?? [])
  );

  resetFilters(): void {
    this.filterForm.reset(this.defaultFilters);
  }

  private buildQueryParams(value: Record<string, unknown>): Record<string, string> {
    const params: Record<string, string> = {};

    const assign = (
      key: string,
      formKey: keyof typeof this.defaultFilters,
      formatter?: (input: string) => string
    ) => {
      const raw = value[formKey];

      if (raw === undefined || raw === null) {
        return;
      }

      const trimmed = String(raw).trim();
      if (!trimmed) {
        return;
      }

      params[`q[${key}]`] = formatter ? formatter(trimmed) : trimmed;
    };

    assign('id_eq', 'id');
    assign('status_eq', 'status');
    assign('state_eq', 'state');
    assign('payment_state_eq', 'payment_state');
    assign('scenario_eq', 'scenario');
    assign('target_time_type_eq', 'target_time_type');
    assign('user_email_cont', 'user_email');

    assign('total_cents_gteq', 'min_total_cents', input => this.toCents(input));
    assign('total_cents_lteq', 'max_total_cents', input => this.toCents(input));
    assign('created_at_gteq', 'created_from');
    assign('created_at_lteq', 'created_to');

    const sortValue = value['sort'];
    if (typeof sortValue === 'string' && sortValue.trim()) {
      params['q[s]'] = sortValue.trim();
    }

    return params;
  }

  private toCents(value: string): string {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value;
    }

    return Math.round(numeric * 100).toString();
  }

  private compareParams(
    previous: Record<string, string>,
    current: Record<string, string>
  ): boolean {
    const previousEntries = Object.entries(previous).sort(([a], [b]) => a.localeCompare(b));
    const currentEntries = Object.entries(current).sort(([a], [b]) => a.localeCompare(b));

    if (previousEntries.length !== currentEntries.length) {
      return false;
    }

    return previousEntries.every(([key, value], index) => {
      const [currentKey, currentValue] = currentEntries[index];
      return key === currentKey && value === currentValue;
    });
  }
}
