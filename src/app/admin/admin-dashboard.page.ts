import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { AdminUserRolesService } from './admin-user-roles.service';
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

    header.page-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      header.page-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1.5rem;
      }
    }

    header.page-header h2 {
      margin: 0;
      font-size: clamp(2.25rem, 4vw, 2.75rem);
      letter-spacing: -0.04em;
    }

    header.page-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
      max-width: 540px;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    @media (min-width: 576px) {
      .header-actions {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
      }
    }

    .restaurant-select {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .restaurant-select label {
      font-weight: 600;
      font-size: 0.95rem;
      white-space: nowrap;
    }

    select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
    }

    .add-restaurant-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      border: none;
      background: var(--brand-green, #06c167);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      text-decoration: none;
      white-space: nowrap;
    }

    .add-restaurant-button:hover {
      background: color-mix(in srgb, var(--brand-green) 85%, black);
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

    .empty-state.small {
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 1000;
    }

    .modal {
      background: var(--surface, #fff);
      border-radius: 1rem;
      padding: clamp(1.5rem, 3vw, 2rem);
      width: min(480px, 100%);
      box-shadow: var(--shadow-soft);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .modal header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .modal h3 {
      margin: 0;
      font-size: 1.4rem;
    }

    .modal p {
      margin: 0;
      color: var(--text-secondary);
    }

    .modal form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .modal label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .modal input {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.9);
    }

    .modal-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .modal-actions button {
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .modal-actions button[type='submit'] {
      background: var(--brand-green, #06c167);
      color: white;
    }

    .modal-actions button[type='submit']:hover:not(:disabled) {
      background: color-mix(in srgb, var(--brand-green) 85%, black);
    }

    .modal-actions button[type='submit']:disabled {
      cursor: not-allowed;
      background: rgba(10, 10, 10, 0.2);
    }

    .modal-actions .cancel-button {
      background: rgba(10, 10, 10, 0.08);
      color: inherit;
    }

    .modal-actions .cancel-button:hover {
      background: rgba(10, 10, 10, 0.12);
    }

    .error-message {
      color: var(--brand-red, #c81e1e);
      margin: 0;
    }
  `],
  template: `
    <header class="page-header">
      <div class="header-title">
        <h2>{{ 'admin.title' | translate: 'Restaurant admin' }}</h2>
        <p>
          {{
            'admin.subtitle'
              | translate:
                  'Upload fresh visuals and keep track of recent orders — all in one convenient place.'
          }}
        </p>
      </div>

      <div class="header-actions">
        <ng-container *ngIf="restaurants$ | async as restaurants">
          <ng-container *ngIf="restaurants.length; else noRestaurantsHeader">
            <ng-container *ngIf="selectedRestaurantId$ | async as selectedRestaurantId">
              <div class="restaurant-select">
                <label for="admin-restaurant-select">
                  {{ 'admin.manage.select' | translate: 'Choose restaurant' }}
                </label>
                <select
                  id="admin-restaurant-select"
                  [ngModel]="selectedRestaurantId"
                  (ngModelChange)="onRestaurantChange($event)"
                >
                  <option *ngFor="let restaurant of restaurants" [value]="restaurant.id">
                    {{ restaurant.name }}
                  </option>
                </select>
              </div>
            </ng-container>
          </ng-container>
        </ng-container>

        <button type="button" class="add-restaurant-button" (click)="openCreateModal()">
          + {{ 'admin.manage.add.trigger' | translate: 'Add new restaurant' }}
        </button>
      </div>
    </header>

    <ng-template #noRestaurantsHeader>
      <span class="empty-state small">
        {{ 'admin.manage.empty' | translate: 'No restaurants found.' }}
      </span>
    </ng-template>

    <p *ngIf="loading" class="empty-state">
      {{ 'admin.manage.loading' | translate: 'Loading restaurants…' }}
    </p>

    <div class="modal-backdrop" *ngIf="showCreateModal">
      <div class="modal" role="dialog" aria-modal="true">
        <header>
          <h3>{{ 'admin.manage.add.title' | translate: 'Create a new restaurant' }}</h3>
          <p>
            {{
              'admin.manage.add.helper'
                | translate: 'Give your restaurant a name to start managing its details.'
            }}
          </p>
        </header>

        <form (ngSubmit)="createRestaurant()">
          <label for="new-restaurant-name">
            {{ 'admin.manage.add.label' | translate: 'Restaurant name' }}
            <input
              id="new-restaurant-name"
              type="text"
              name="restaurantName"
              [(ngModel)]="newRestaurantName"
              [disabled]="creatingRestaurant"
              placeholder="{{ 'admin.manage.add.placeholder' | translate: 'Restaurant name' }}"
              required
              autocomplete="off"
            />
          </label>

          <div class="modal-actions">
            <button type="button" class="cancel-button" (click)="closeCreateModal()" [disabled]="creatingRestaurant">
              {{ 'common.cancel' | translate: 'Cancel' }}
            </button>
            <button type="submit" [disabled]="creatingRestaurant || !newRestaurantName.trim()">
              {{
                creatingRestaurant
                  ? ('admin.manage.add.creating' | translate: 'Creating…')
                  : ('admin.manage.add.submit' | translate: 'Add restaurant')
              }}
            </button>
          </div>
        </form>

        <p *ngIf="creationError" class="error-message">
          {{ 'admin.manage.add.error' | translate: 'Could not create restaurant. Please try again.' }}
        </p>
      </div>
    </div>

    <ng-container *ngIf="selectedRestaurantId$ | async as restaurantId; else managePlaceholder">
      <div class="section-shell" *ngIf="restaurantId !== null">
        <nav class="section-nav">
          <a routerLink="details" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            {{ 'admin.sections.details' | translate: 'Restaurant details' }}
          </a>
          <a routerLink="orders" routerLinkActive="active">
            {{ 'admin.sections.orders' | translate: 'Recent orders' }}
          </a>
          <a routerLink="users" routerLinkActive="active">
            {{ 'admin.sections.users' | translate: 'Restaurant users' }}
          </a>
          <a *ngIf="showUserRoleManagement" routerLink="user-roles" routerLinkActive="active">
            {{ 'admin.sections.userRoles' | translate: 'User roles' }}
          </a>
          <a routerLink="analytics" routerLinkActive="active">
            {{ 'admin.sections.analytics' | translate: 'Reports & analytics' }}
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
          <a routerLink="loyalty" routerLinkActive="active">
            {{ 'admin.sections.loyalty' | translate: 'Loyalty program' }}
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
  private userRolesService = inject(AdminUserRolesService);

  restaurants$ = this.context.restaurants$;
  selectedRestaurantId$ = this.context.selectedRestaurantId$;
  loading = true;
  newRestaurantName = '';
  creatingRestaurant = false;
  creationError = false;
  showCreateModal = false;
  showUserRoleManagement = false;

  constructor() {
    void this.context.loadRestaurants().finally(() => {
      this.loading = false;
    });

    void this.userRolesService
      .isCurrentUserSuperAdmin()
      .then(isSuperAdmin => {
        this.showUserRoleManagement = isSuperAdmin;
      })
      .catch(error => {
        console.error('Failed to determine user role permissions', error);
        this.showUserRoleManagement = false;
      });
  }

  onRestaurantChange(value: string | number) {
    const id = Number(value);
    this.context.selectRestaurant(Number.isNaN(id) ? null : id);
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.creationError = false;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newRestaurantName = '';
  }

  async createRestaurant(): Promise<void> {
    const name = this.newRestaurantName.trim();
    if (!name || this.creatingRestaurant) {
      return;
    }

    this.creatingRestaurant = true;
    this.creationError = false;

    try {
      await this.context.createRestaurant({ name });
      this.closeCreateModal();
    } catch (error) {
      this.creationError = true;
    } finally {
      this.creatingRestaurant = false;
    }
  }
}
