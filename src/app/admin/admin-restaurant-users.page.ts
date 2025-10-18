import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
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

interface UsersState {
  users: RestaurantUser[];
  loading: boolean;
  error: string | null;
}

@Component({
  standalone: true,
  selector: 'app-admin-restaurant-users',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
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

    .muted {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    p.empty-state {
      margin: 0;
      color: var(--text-secondary);
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li.user-row {
      list-style: none;
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.85rem 1rem;
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 0.85rem;
      background: rgba(10, 10, 10, 0.02);
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    li.user-row:hover {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      box-shadow: 0 8px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.08);
    }

    .user-main {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 1.05rem;
    }

    .user-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .user-meta span {
      white-space: nowrap;
    }

    .churn-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.75rem;
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

    .pagination {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    @media (min-width: 640px) {
      .pagination {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .pagination-summary {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .pagination-controls button {
      border: 1px solid rgba(10, 10, 10, 0.15);
      background: rgba(10, 10, 10, 0.04);
      color: inherit;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 150ms ease, border-color 150ms ease;
    }

    .pagination-controls button:hover:not(:disabled),
    .pagination-controls button:focus-visible:not(:disabled) {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      outline: none;
    }

    .pagination-controls button.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      color: var(--brand-green, #06c167);
      font-weight: 600;
    }

    .pagination-controls button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

        <ng-container *ngIf="usersState$ | async as state">
          <p class="state" *ngIf="state.loading">
            {{ 'admin.users.state.loading' | translate: 'Loading users…' }}
          </p>

          <p class="state error" *ngIf="state.error">{{ state.error }}</p>

          <ng-container *ngIf="!state.loading && !state.error">
            <p class="state empty" *ngIf="!state.users.length">
              {{ 'admin.users.state.empty' | translate: 'No users match these filters yet.' }}
            </p>

            <ng-container *ngIf="state.users.length as total">
              <ul class="users-list">
                <li class="user-row" *ngFor="let user of paginate(state.users); trackBy: trackByUserId">
                  <div class="user-main">
                    <span class="user-name">{{ formatUserName(user) }}</span>
                    <p class="muted" *ngIf="user.email; else noEmail">{{ user.email }}</p>
                    <div class="user-meta">
                      <span *ngIf="user.last_order_at as lastOrder">
                        {{ 'admin.users.details.lastOrder' | translate: 'Last order' }}:
                        <strong>{{ lastOrder | date: 'medium' }}</strong>
                      </span>
                      <span *ngIf="getOrderCount(user) as count">
                        {{ 'admin.users.details.orderCount' | translate: 'Total orders' }}:
                        <strong>{{ count }}</strong>
                      </span>
                      <span *ngIf="getLoyaltyPointsInfo(user) as loyalty">
                        {{ 'admin.users.details.loyaltyPoints' | translate: 'Loyalty points' }}:
                        <strong>{{ loyalty.value }}</strong>
                      </span>
                      <span *ngIf="getCreditInfo(user) as credit">
                        {{ 'admin.users.details.credit' | translate: 'Account credit' }}:
                        <strong>{{ credit.euros | currency: 'EUR' }}</strong>
                      </span>
                    </div>
                  </div>
                  <span *ngIf="user.churn_risk as risk" class="churn-pill" [attr.data-risk]="risk">
                    {{ ('admin.users.churnRisk.' + risk) | translate: churnRiskFallback(risk) }}
                  </span>
                </li>
              </ul>

              <footer class="pagination">
                <span class="pagination-summary">
                  {{
                    'admin.users.pagination.summary'
                      | translate:
                          'Showing {{from}}–{{to}} of {{total}} users': paginationSummaryParams(total)
                  }}
                </span>

                <nav
                  class="pagination-controls"
                  aria-label="User list pagination"
                  *ngIf="total > pageSize"
                >
                  <button type="button" (click)="goToPreviousPage(total)" [disabled]="currentPage === 1">
                    {{ 'admin.users.pagination.previous' | translate: 'Previous' }}
                  </button>

                  <ng-container *ngFor="let page of pageNumbers(total)">
                    <button
                      type="button"
                      (click)="goToPage(page, total)"
                      [class.active]="page === currentPage"
                    >
                      {{ page }}
                    </button>
                  </ng-container>

                  <button
                    type="button"
                    (click)="goToNextPage(total)"
                    [disabled]="currentPage >= totalPages(total)"
                  >
                    {{ 'admin.users.pagination.next' | translate: 'Next' }}
                  </button>
                </nav>
              </footer>
            </ng-container>
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

  readonly pageSize = 10;
  currentPage = 1;

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
    tap(() => {
      this.currentPage = 1;
    }),
    map(result => result.filters)
  );

  readonly usersState$ = combineLatest([this.restaurantContext.selectedRestaurantId$, this.filters$]).pipe(
    switchMap(([restaurantId, filters]) => {
      if (restaurantId === null) {
        return of<UsersState>({ users: [], loading: false, error: null });
      }

      return this.usersService.list(restaurantId, filters).pipe(
        map(users => ({ users, loading: false, error: null }) as UsersState),
        startWith<UsersState>({ users: [], loading: true, error: null }),
        catchError(error =>
          of<UsersState>({
            users: [],
            loading: false,
            error: this.resolveErrorMessage(error),
          })
        )
      );
    }),
    tap(state => {
      if (!state.loading) {
        this.ensureValidPage(state.users.length);
      }
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

  }

  resetFilters(): void {
    this.filterForm.reset(this.defaultFilters);
  }

  paginate(users: RestaurantUser[]): RestaurantUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return users.slice(start, end);
  }

  goToPage(page: number, total: number): void {
    const totalPages = this.totalPages(total);
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage !== this.currentPage) {
      this.currentPage = nextPage;
    }
  }

  goToPreviousPage(total: number): void {
    this.goToPage(this.currentPage - 1, total);
  }

  goToNextPage(total: number): void {
    this.goToPage(this.currentPage + 1, total);
  }

  pageNumbers(total: number): number[] {
    const pages = this.totalPages(total);
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  paginationSummaryParams(total: number): { from: number; to: number; total: number } {
    return {
      from: this.pageStart(total),
      to: this.pageEnd(total),
      total,
    };
  }

  totalPages(total: number): number {
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  }

  trackByUserId(_: number, user: RestaurantUser): number {
    return user.id;
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

  getLoyaltyPointsInfo(user: RestaurantUser): { value: number } | null {
    const points = user.loyalty_points ?? user.loyaltyPoints;
    return typeof points === 'number' ? { value: points } : null;
  }

  getCreditInfo(user: RestaurantUser): { cents: number; euros: number } | null {
    const cents = user.credit_cents ?? user.creditCents;
    return typeof cents === 'number' ? { cents, euros: cents / 100 } : null;
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

  private pageStart(total: number): number {
    if (total === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  private pageEnd(total: number): number {
    if (total === 0) {
      return 0;
    }

    return Math.min(this.currentPage * this.pageSize, total);
  }

  private ensureValidPage(total: number): void {
    const totalPages = this.totalPages(total);
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
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
