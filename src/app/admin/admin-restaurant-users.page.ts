import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { AdminRestaurantUsersService, RestaurantUserFilters } from './admin-restaurant-users.service';
import { MenuService } from '../menu/menu.service';
import { MenuItem, RestaurantUser, RestaurantUserChurnRisk } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

interface RestaurantUserFilterFormValue {
  orderedFrom: string;
  orderedTo: string;
  menuItemId: string;
  churnRisk: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-restaurant-users',
  imports: [AsyncPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.75rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: clamp(1.25rem, 2.5vw, 1.75rem);
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    @media (min-width: 768px) {
      .card-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .card-header h3 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 1.9rem);
    }

    .card-header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    .restaurant-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: color-mix(in srgb, var(--brand-green) 65%, black);
      font-weight: 600;
      font-size: 0.85rem;
    }

    .restaurant-pill span {
      color: var(--text-primary);
    }

    form.filters {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.9rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.08));
      background: rgba(10, 10, 10, 0.04);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem 1rem;
    }

    .filters label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .filters label span {
      font-weight: 600;
      color: var(--text-primary);
    }

    .filters input,
    .filters select {
      padding: 0.55rem 0.75rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.12));
      font: inherit;
      background: var(--surface, #fff);
      color: inherit;
    }

    .filters input:focus,
    .filters select:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
    }

    .filters-actions {
      display: flex;
      justify-content: flex-end;
    }

    .filters-actions button {
      padding: 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.1);
      color: var(--brand-green, #06c167);
      cursor: pointer;
      font-weight: 600;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }

    .filters-actions button:hover,
    .filters-actions button:focus-visible {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      box-shadow: 0 6px 16px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      outline: none;
    }

    .form-error {
      margin: 0;
      color: var(--brand-red, #c81e1e);
      font-size: 0.9rem;
    }

    .state {
      color: var(--text-secondary);
      margin: 0;
    }

    .state.error {
      color: var(--brand-red, #c81e1e);
    }

    .state.empty {
      font-style: italic;
    }

    .users-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    article.user-card {
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 1rem;
      padding: 1.25rem;
      background: rgba(10, 10, 10, 0.02);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
    }

    article.user-card:hover {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      box-shadow: 0 10px 22px rgba(var(--brand-green-rgb, 6, 193, 103), 0.1);
      transform: translateY(-2px);
    }

    article.user-card header {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .user-title {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-title h4 {
      margin: 0;
      font-size: 1.1rem;
    }

    .muted {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .churn-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .churn-pill[data-risk='low'] {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green, #06c167);
    }

    .churn-pill[data-risk='medium'] {
      background: rgba(247, 144, 9, 0.18);
      color: #c76b00;
    }

    .churn-pill[data-risk='high'] {
      background: rgba(200, 30, 30, 0.18);
      color: #c81e1e;
    }

    dl {
      display: grid;
      gap: 0.5rem;
      margin: 0;
    }

    dl div {
      display: grid;
      gap: 0.15rem;
    }

    dt {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    dd {
      margin: 0;
      font-size: 0.95rem;
    }

    p.empty-state {
      margin: 0;
      color: var(--text-secondary);
    }
  `],
  template: `
    <ng-container *ngIf="selectedRestaurant$ | async as restaurant; else noRestaurant">
      <section class="card">
        <header class="card-header">
          <div>
            <h3>{{ 'admin.users.heading' | translate: 'Restaurant users' }}</h3>
            <p>
              {{
                'admin.users.description'
                  | translate:
                      'Review who has ordered recently and tailor retention efforts for loyal guests.'
              }}
            </p>
          </div>
          <div class="restaurant-pill">
            <span>{{ 'admin.users.restaurantLabel' | translate: 'Restaurant' }}:</span>
            <span>{{ restaurant.name }}</span>
          </div>
        </header>

        <form [formGroup]="filterForm" class="filters" novalidate>
          <div class="filters-grid">
            <label>
              <span>{{ 'admin.users.filters.timeframeFrom' | translate: 'Ordered from' }}</span>
              <input type="datetime-local" formControlName="orderedFrom" />
            </label>
            <label>
              <span>{{ 'admin.users.filters.timeframeTo' | translate: 'Ordered to' }}</span>
              <input type="datetime-local" formControlName="orderedTo" />
            </label>
            <label>
              <span>{{ 'admin.users.filters.menuItem' | translate: 'Menu item' }}</span>
              <select formControlName="menuItemId">
                <option value="">
                  {{ 'admin.users.filters.menuItem.all' | translate: 'All menu items' }}
                </option>
                <option *ngFor="let item of menuItems$ | async" [value]="item.id">
                  {{ item.name }}
                </option>
              </select>
            </label>
            <label>
              <span>{{ 'admin.users.filters.churnRisk' | translate: 'Churn risk' }}</span>
              <select formControlName="churnRisk">
                <option value="">
                  {{ 'admin.users.filters.churnRisk.all' | translate: 'All churn risks' }}
                </option>
                <option *ngFor="let option of churnRiskOptions" [value]="option.value">
                  {{ option.labelKey | translate: option.fallback }}
                </option>
              </select>
            </label>
          </div>

          <div class="filters-actions">
            <button type="button" (click)="resetFilters()">
              {{ 'admin.users.filters.reset' | translate: 'Clear filters' }}
            </button>
          </div>

          <p class="form-error" *ngIf="filterForm.errors?.['dateRange']">
            {{
              'admin.users.state.dateRangeError'
                | translate: 'The end date must be after the start date.'
            }}
          </p>
        </form>

        <p class="state" *ngIf="loading">
          {{ 'admin.users.state.loading' | translate: 'Loading users…' }}
        </p>

        <p class="state error" *ngIf="errorMessage">{{ errorMessage }}</p>

        <ng-container *ngIf="!loading && !errorMessage">
          <ng-container *ngIf="users$ | async as users">
            <p class="state empty" *ngIf="!users.length">
              {{ 'admin.users.state.empty' | translate: 'No users match these filters yet.' }}
            </p>

            <div class="users-grid" *ngIf="users.length">
              <article class="user-card" *ngFor="let user of users">
                <header>
                  <div class="user-title">
                    <h4>{{ formatUserName(user) }}</h4>
                    <p class="muted" *ngIf="user.email; else noEmail">{{ user.email }}</p>
                  </div>
                  <span *ngIf="user.churn_risk as risk" class="churn-pill" [attr.data-risk]="risk">
                    {{ ('admin.users.churnRisk.' + risk) | translate: churnRiskFallback(risk) }}
                  </span>
                </header>

                <dl>
                  <div *ngIf="user.last_order_at as lastOrder">
                    <dt>{{ 'admin.users.details.lastOrder' | translate: 'Last order' }}</dt>
                    <dd>{{ lastOrder | date: 'medium' }}</dd>
                  </div>
                  <div *ngIf="getOrderCount(user) as count">
                    <dt>{{ 'admin.users.details.orderCount' | translate: 'Total orders' }}</dt>
                    <dd>{{ count }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </ng-container>
        </ng-container>

        <ng-template #noEmail>
          <p class="muted">
            {{ 'admin.users.details.fallbackEmail' | translate: 'Not provided' }}
          </p>
        </ng-template>
      </section>
    </ng-container>

    <ng-template #noRestaurant>
      <p class="empty-state">
        {{ 'admin.users.noRestaurant' | translate: 'Select a restaurant to view user insights.' }}
      </p>
    </ng-template>
  `,
})
export class AdminRestaurantUsersPage {
  private restaurantContext = inject(AdminRestaurantContextService);
  private usersService = inject(AdminRestaurantUsersService);
  private menuService = inject(MenuService);
  private fb = inject(FormBuilder);

  readonly selectedRestaurant$ = this.restaurantContext.selectedRestaurant$;

  private readonly dateRangeValidator: ValidatorFn = (control: AbstractControl) => {
    const value = control.value as Partial<RestaurantUserFilterFormValue>;
    if (!value) {
      return null;
    }

    const from = value.orderedFrom ? new Date(value.orderedFrom) : null;
    const to = value.orderedTo ? new Date(value.orderedTo) : null;

    if (!from || !to) {
      return null;
    }

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return null;
    }

    return to.getTime() >= from.getTime() ? null : { dateRange: true };
  };

  private readonly defaultFilters: RestaurantUserFilterFormValue = {
    orderedFrom: '',
    orderedTo: '',
    menuItemId: '',
    churnRisk: '',
  };

  filterForm = this.fb.group(
    {
      orderedFrom: [''],
      orderedTo: [''],
      menuItemId: [''],
      churnRisk: [''],
    },
    { validators: this.dateRangeValidator }
  );

  loading = false;
  errorMessage: string | null = null;

  readonly churnRiskOptions: {
    value: RestaurantUserChurnRisk;
    labelKey: string;
    fallback: string;
  }[] = [
    {
      value: 'low',
      labelKey: 'admin.users.churnRisk.low',
      fallback: 'Low risk',
    },
    {
      value: 'medium',
      labelKey: 'admin.users.churnRisk.medium',
      fallback: 'Medium risk',
    },
    {
      value: 'high',
      labelKey: 'admin.users.churnRisk.high',
      fallback: 'High risk',
    },
  ];

  readonly menuItems$ = this.restaurantContext.selectedRestaurantId$.pipe(
    switchMap(id => {
      if (id === null) {
        return of([] as MenuItem[]);
      }

      return this.menuService.listByRestaurant(id).pipe(
        catchError(() => of([] as MenuItem[]))
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly filters$ = this.filterForm.valueChanges.pipe(
    startWith(this.getFormValue()),
    map(() => this.getFormValue()),
    debounceTime(250),
    filter(() => this.filterForm.valid),
    map(formValue => {
      const filters = this.normalizeFilters(formValue);
      return { filters, key: JSON.stringify(filters) };
    }),
    distinctUntilChanged((a, b) => a.key === b.key),
    map(result => result.filters)
  );

  readonly users$ = combineLatest([this.restaurantContext.selectedRestaurantId$, this.filters$]).pipe(
    switchMap(([restaurantId, filters]) => {
      if (restaurantId === null) {
        this.loading = false;
        return of([] as RestaurantUser[]);
      }

      this.loading = true;
      this.errorMessage = null;

      return this.usersService.list(restaurantId, filters).pipe(
        tap(() => {
          this.loading = false;
        }),
        catchError(error => {
          this.loading = false;
          this.errorMessage = this.resolveErrorMessage(error);
          return of([] as RestaurantUser[]);
        })
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private previousRestaurantId: number | null = null;

  constructor() {
    this.restaurantContext.selectedRestaurantId$
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(id => {
        if (id !== this.previousRestaurantId) {
          this.previousRestaurantId = id;
          this.filterForm.reset(this.defaultFilters);
        }
      });

    this.filterForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.errorMessage = null;
    });
  }

  resetFilters(): void {
    this.filterForm.reset(this.defaultFilters);
  }

  formatUserName(user: RestaurantUser): string {
    const firstName = (user.first_name ?? user.firstName ?? '').trim();
    const lastName = (user.last_name ?? user.lastName ?? '').trim();
    const combined = [firstName, lastName].filter(Boolean).join(' ');

    if (combined) {
      return combined;
    }

    if (user.email) {
      return user.email;
    }

    return `Customer #${user.id}`;
  }

  getOrderCount(user: RestaurantUser): number | null {
    const count = user.order_count ?? user.orders_count ?? user.total_orders;
    return typeof count === 'number' ? count : null;
  }

  churnRiskFallback(risk: string): string {
    switch (risk) {
      case 'high':
        return 'High risk';
      case 'medium':
        return 'Medium risk';
      case 'low':
        return 'Low risk';
      default:
        return risk;
    }
  }

  private getFormValue(): RestaurantUserFilterFormValue {
    const raw = this.filterForm.value as Partial<RestaurantUserFilterFormValue>;
    return {
      orderedFrom: raw.orderedFrom ?? '',
      orderedTo: raw.orderedTo ?? '',
      menuItemId: raw.menuItemId ?? '',
      churnRisk: raw.churnRisk ?? '',
    };
  }

  private normalizeFilters(value: RestaurantUserFilterFormValue): RestaurantUserFilters {
    const filters: RestaurantUserFilters = {};

    if (value.orderedFrom) {
      filters.ordered_from = this.toIsoString(value.orderedFrom);
    }

    if (value.orderedTo) {
      filters.ordered_to = this.toIsoString(value.orderedTo);
    }

    if (value.menuItemId) {
      const parsed = Number(value.menuItemId);
      if (!Number.isNaN(parsed)) {
        filters.menu_item_id = parsed;
      }
    }

    if (value.churnRisk) {
      filters.churn_risk = value.churnRisk as RestaurantUserChurnRisk;
    }

    return filters;
  }

  private toIsoString(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString();
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const responseError =
        typeof error.error === 'string'
          ? error.error
          : typeof error.error?.error === 'string'
            ? error.error.error
            : null;

      if (responseError) {
        return responseError;
      }
    }

    return 'Unable to load users for this restaurant. Please try again.';
  }
}
