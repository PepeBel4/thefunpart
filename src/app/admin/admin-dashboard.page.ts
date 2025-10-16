import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DEFAULT_BRAND_COLOR, normalizeHexColor } from '../core/color-utils';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [AsyncPipe, FormsModule, NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    header h2 {
      margin: 0;
      font-size: clamp(2.25rem, 4vw, 2.75rem);
      letter-spacing: -0.04em;
    }

    header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
      max-width: 540px;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .selection-card label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
    }

    .create-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(10, 10, 10, 0.08);
    }

    .create-form label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .create-form input {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.9);
    }

    .create-form button {
      align-self: flex-start;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      border: none;
      background: var(--brand-green, #06c167);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .create-form button:disabled {
      cursor: not-allowed;
      background: rgba(10, 10, 10, 0.2);
    }

    .create-form button:not(:disabled):hover {
      background: color-mix(in srgb, var(--brand-green) 85%, black);
    }

    .error-message {
      color: var(--brand-red, #c81e1e);
      margin: 0;
    }

    .section-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    nav.section-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0 0.25rem;
    }

    nav.section-nav a {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.6rem 1.1rem;
      border-radius: 999px;
      border: 1px solid transparent;
      background: rgba(10, 10, 10, 0.04);
      color: inherit;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s ease, border 0.2s ease, color 0.2s ease;
    }

    nav.section-nav a.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      color: color-mix(in srgb, var(--brand-green) 60%, black);
    }

    nav.section-nav a:hover {
      background: rgba(10, 10, 10, 0.08);
    }

    .empty-state {
      color: var(--text-secondary);
    }
  `],
  template: `
    <header>
      <h2>{{ 'admin.title' | translate: 'Restaurant admin' }}</h2>
      <p>
        {{
          'admin.subtitle'
            | translate:
                'Upload fresh visuals and keep track of recent orders — all in one convenient place.'
        }}
      </p>
    </header>

    <section class="card selection-card">
      <header>
        <h3>{{ 'admin.manage.heading' | translate: 'Manage restaurant' }}</h3>
        <p>{{ 'admin.manage.description' | translate: "Choose which location you'd like to update." }}</p>
      </header>

      <ng-container *ngIf="restaurants$ | async as restaurants">
        <ng-container *ngIf="restaurants.length; else noRestaurants">
          <ng-container *ngIf="selectedRestaurantId$ | async as selectedRestaurantId">
            <label>
              {{ 'admin.manage.select' | translate: 'Choose restaurant' }}
              <select [ngModel]="selectedRestaurantId" (ngModelChange)="onRestaurantChange($event)">
                <option *ngFor="let restaurant of restaurants" [value]="restaurant.id">
                  {{ restaurant.name }}
                </option>
              </select>
            </label>
          </ng-container>
        </ng-container>
      </ng-container>

      <form class="create-form" (ngSubmit)="createRestaurant()">
        <label>
          {{ 'admin.manage.add.label' | translate: 'Add a new restaurant' }}
          <input
            type="text"
            name="restaurantName"
            [(ngModel)]="newRestaurantName"
            [disabled]="creatingRestaurant"
            placeholder="{{ 'admin.manage.add.placeholder' | translate: 'Restaurant name' }}"
            required
          />
        </label>
        <label>
          {{ 'admin.manage.add.colorLabel' | translate: 'Primary color' }}
          <input
            type="color"
            name="restaurantColor"
            [(ngModel)]="newRestaurantColor"
            [disabled]="creatingRestaurant"
            required
          />
        </label>
        <button type="submit" [disabled]="creatingRestaurant || !newRestaurantName.trim()">
          {{
            creatingRestaurant
              ? ('admin.manage.add.creating' | translate: 'Creating…')
              : ('admin.manage.add.submit' | translate: 'Add restaurant')
          }}
        </button>
      </form>

      <p *ngIf="creationError" class="error-message">
        {{ 'admin.manage.add.error' | translate: 'Could not create restaurant. Please try again.' }}
      </p>

      <ng-template #noRestaurants>
        <p class="empty-state">{{ 'admin.manage.empty' | translate: 'No restaurants found.' }}</p>
      </ng-template>

      <p *ngIf="loading" class="empty-state">
        {{ 'admin.manage.loading' | translate: 'Loading restaurants…' }}
      </p>
    </section>

    <ng-container *ngIf="selectedRestaurantId$ | async as restaurantId; else managePlaceholder">
      <div class="section-shell" *ngIf="restaurantId !== null">
        <nav class="section-nav">
          <a routerLink="details" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            {{ 'admin.sections.details' | translate: 'Restaurant details' }}
          </a>
          <a routerLink="orders" routerLinkActive="active">
            {{ 'admin.sections.orders' | translate: 'Recent orders' }}
          </a>
          <a routerLink="photos" routerLinkActive="active">
            {{ 'admin.sections.photos' | translate: 'Restaurant photos' }}
          </a>
          <a routerLink="locations" routerLinkActive="active">
            {{ 'admin.sections.locations' | translate: 'Locations' }}
          </a>
          <a routerLink="menu" routerLinkActive="active">
            {{ 'admin.sections.menu' | translate: 'Manage menu' }}
          </a>
          <a routerLink="options" routerLinkActive="active">
            {{ 'admin.sections.options' | translate: 'Menu options' }}
          </a>
          <a routerLink="discounts" routerLinkActive="active">
            {{ 'admin.sections.discounts' | translate: 'Manage discounts' }}
          </a>
        </nav>

        <router-outlet></router-outlet>
      </div>
    </ng-container>

    <ng-template #managePlaceholder>
      <section class="card">
        <header>
          <h3>{{ 'admin.managePlaceholder.title' | translate: 'Manage restaurant content' }}</h3>
        </header>
        <p>
          {{
            'admin.managePlaceholder.description'
              | translate: 'Choose a restaurant above to start uploading photos and editing menus.'
          }}
        </p>
      </section>
    </ng-template>
  `,
})
export class AdminDashboardPage {
  private context = inject(AdminRestaurantContextService);

  restaurants$ = this.context.restaurants$;
  selectedRestaurantId$ = this.context.selectedRestaurantId$;
  loading = true;
  newRestaurantName = '';
  newRestaurantColor = DEFAULT_BRAND_COLOR;
  creatingRestaurant = false;
  creationError = false;

  constructor() {
    void this.context.loadRestaurants().finally(() => {
      this.loading = false;
    });
  }

  onRestaurantChange(value: string | number) {
    const id = Number(value);
    this.context.selectRestaurant(Number.isNaN(id) ? null : id);
  }

  async createRestaurant(): Promise<void> {
    const name = this.newRestaurantName.trim();
    if (!name || this.creatingRestaurant) {
      return;
    }

    this.creatingRestaurant = true;
    this.creationError = false;

    try {
      const color = normalizeHexColor(this.newRestaurantColor) ?? DEFAULT_BRAND_COLOR;
      await this.context.createRestaurant({ name, primary_color: color });
      this.newRestaurantName = '';
      this.newRestaurantColor = DEFAULT_BRAND_COLOR;
    } catch (error) {
      this.creationError = true;
    } finally {
      this.creatingRestaurant = false;
    }
  }
}
