import { Component, effect, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, DecimalPipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map, shareReplay } from 'rxjs';
import { Location, MenuItem, Restaurant, SessionUser, UserProfile } from '../core/models';
import { RestaurantService } from './restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AuthService } from '../core/auth.service';
import { ProfileService } from '../core/profile.service';
import { RESTAURANT_CUISINES, normalizeRestaurantCuisines } from './cuisines';
import { MenuService } from '../menu/menu.service';
import { CardOverviewComponent } from '../cards/card-overview.component';

type DiscountHighlight = {
  restaurant: RestaurantListItem;
  item: MenuItem;
  currentPriceCents: number;
  originalPriceCents: number;
  savingsCents: number;
  savingsPercent: number | null;
};

type RestaurantSortOption = 'recommended' | 'nameAsc' | 'nameDesc' | 'distance';

type RestaurantListItem = Restaurant & { heroPhoto?: string | undefined; distanceKm?: number | null };

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'error';

type GeolocationState = {
  status: GeolocationStatus;
  message: string | null;
};

const ICON_DEFAULT_PLATE = 'M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12a6 6 0 0 1 0-12z';
const ICON_PIZZA = 'M12 3l8 18H4L12 3zm0 5.5c-1.933 0-3.5 1.567-3.5 3.5S10.067 15.5 12 15.5s3.5-1.567 3.5-3.5S13.933 8.5 12 8.5zm0 2c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5z';
const ICON_BURGER = 'M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H4V6zm-1 6c0-1.105.895-2 2-2h14c1.105 0 2 .895 2 2v2H3v-2zm1 5v-2h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z';
const ICON_SUSHI = 'M12 4c4.418 0 8 2.239 8 5s-3.582 5-8 5-8-2.239-8-5 3.582-5 8-5zm0 2c-2.761 0-5 1.343-5 3s2.239 3 5 3 5-1.343 5-3-2.239-3-5-3zm-7 9h14v2H5v-2z';
const ICON_TACO = 'M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8v5H4v-5zm2 0v3h12v-3c0-3.314-2.686-6-6-6s-6 2.686-6 6z';
const ICON_BOWL = 'M4 6h16v2a8 8 0 0 1-16 0V6zm0 11h16v2H4v-2z';
const ICON_LEAF = 'M12 2c3.866 0 7 3.134 7 7 0 5.523-4.477 10-10 10H5v-2c3.866 0 7-3.134 7-7V2z';
const ICON_FISH = 'M3 12c2.5-4 6.5-6 11-6 1.657 0 3 1.343 3 3 2.761 0 5 1.791 5 4s-2.239 4-5 4c0 1.657-1.343 3-3 3-4.5 0-8.5-2-11-6zm11-2c-.828 0-1.5.672-1.5 1.5S13.172 13 14 13s1.5-.672 1.5-1.5S14.828 10 14 10z';
const ICON_FLAME = 'M12 2c2.761 3.495 5 6.504 5 9.5 0 3.038-2.462 5.5-5.5 5.5S6 14.538 6 11.5c0-2.27 1.5-4.5 4-6.5-.057 2.094.833 3.785 2 5 0-2.5 0-4.5 0-8z';
const ICON_DRUM = 'M5 9a7 7 0 0 1 14 0c0 3.866-3.134 7-7 7-.69 0-1.36-.098-2-.28L9 21H7l-1-6V9z';
const ICON_CUP = 'M6 4h12v6a6 6 0 0 1-6 6h-2v2h6v2H8v-4a4 4 0 0 1-4-4V4h2zm2 2v6a2 2 0 0 0 4 0V6H8z';
const ICON_CAKE = 'M5 21V10h14v11H5zm7-17a3 3 0 0 1 3 3v1H9V7a3 3 0 0 1 3-3zm0-4 2 3h-4l2-3z';
const ICON_ICECREAM = 'M12 2a4 4 0 0 1 4 4c0 .35-.045.69-.13 1.014A3 3 0 0 1 17 10c0 1.657-1.343 3-3 3h-4c-1.657 0-3-1.343-3-3 0-1.08.57-2.027 1.43-2.586A3.99 3.99 0 0 1 8 6a4 4 0 0 1 4-4zm-2 13h4l-2 7-2-7z';
const ICON_SANDWICH = 'M3 7 12 2l9 5v10l-9 5-9-5V7zm9 11 5-2.778V9.778L12 7 7 9.778v5.444L12 18z';
const ICON_BASKET = 'M6 9 9 3h6l3 6h4v2h-1.181l-1.636 9.818A3 3 0 0 1 16.228 24H7.772a3 3 0 0 1-2.955-2.182L3.181 11H2V9h4zm2.118 0h7.764L13.5 5h-3l-2.382 4zM6.2 11l1.5 9h8.6l1.5-9H6.2z';

const CUISINE_ICON_PATHS = new Map<string, string>([
  ['pizza', ICON_PIZZA],
  ['italian', ICON_PIZZA],
  ['burgers', ICON_BURGER],
  ['fast food', ICON_BURGER],
  ['america', ICON_BURGER],
  ['sushi', ICON_SUSHI],
  ['japanase', ICON_SUSHI],
  ['poke', ICON_SUSHI],
  ['seafood', ICON_FISH],
  ['hawaiian', ICON_FISH],
  ['caribbean', ICON_FISH],
  ['mexican', ICON_TACO],
  ['wings', ICON_DRUM],
  ['bbq', ICON_FLAME],
  ['street food', ICON_FLAME],
  ['asian', ICON_BOWL],
  ['thai', ICON_BOWL],
  ['korean', ICON_BOWL],
  ['chinese', ICON_BOWL],
  ['indian', ICON_BOWL],
  ['vietnamese', ICON_BOWL],
  ['comfort food', ICON_BOWL],
  ['soul food', ICON_BOWL],
  ['soup', ICON_BOWL],
  ['desserts', ICON_CAKE],
  ['bakery', ICON_CAKE],
  ['ice cream', ICON_ICECREAM],
  ['breakfast', ICON_CAKE],
  ['coffee', ICON_CUP],
  ['bubble tea', ICON_CUP],
  ['smoothies', ICON_CUP],
  ['healthy', ICON_LEAF],
  ['vegan', ICON_LEAF],
  ['halal', ICON_LEAF],
  ['kosher', ICON_LEAF],
  ['sandwich', ICON_SANDWICH],
  ['grocery', ICON_BASKET],
]);

const POPULAR_CUISINES = new Set<string>([
  'pizza',
  'burgers',
  'sushi',
  'mexican',
  'thai',
  'indian',
  'korean',
  'bbq',
  'comfort food',
  'desserts',
  'vegan',
  'healthy',
  'seafood',
  'coffee',
  'ice cream',
]);

@Component({
  standalone: true,
  selector: 'app-restaurant-list',
  imports: [AsyncPipe, RouterLink, NgFor, NgIf, TitleCasePipe, TranslatePipe, CurrencyPipe, DecimalPipe, CardOverviewComponent],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    h2 {
      font-size: clamp(2rem, 3vw, 2.65rem);
      font-weight: 700;
      letter-spacing: -0.04em;
    }

    .subhead {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .filters-panel {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: var(--radius-card);
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.05);
      box-shadow: var(--shadow-soft);
    }

    .filters-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .filters-header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-width: 32rem;
    }

    .filters-header h3 {
      margin: 0;
    }

    .filters-subtitle {
      color: var(--text-secondary);
      font-size: 0.92rem;
      line-height: 1.45;
      margin: 0;
    }

    .filters-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .filters-actions button {
      appearance: none;
      border: none;
      background: none;
      color: var(--brand-green);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }

    .filters-body {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .filters-layout {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
      align-items: start;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-section h4 {
      margin: 0;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
    }

    .grouped-cuisines {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }

    .cuisine-group {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .group-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary, rgba(10, 10, 10, 0.45));
    }

    .empty-state {
      padding: 1.5rem;
      text-align: center;
      border-radius: var(--radius-card);
      background: rgba(10, 10, 10, 0.02);
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .sort-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .sort-group select {
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(10, 10, 10, 0.02);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .sort-group .distance-hint {
      margin-top: 0.35rem;
      font-size: 0.8rem;
      line-height: 1.4;
      color: var(--text-secondary);
    }

    .sort-group .distance-hint.error {
      color: var(--status-danger, #d14343);
    }

    .filters-footer {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    @media (max-width: 1024px) {
      .filters-panel {
        padding: 1.25rem;
      }

      .filters-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .filters-panel {
        gap: 1.25rem;
      }

      .filters-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-layout {
        gap: 1.25rem;
      }

      .filters-footer {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .discounts-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.4rem 1.6rem;
      border-radius: var(--radius-card);
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.08), rgba(var(--brand-green-rgb, 6, 193, 103), 0.02));
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
      box-shadow: var(--shadow-soft);
    }

    .discounts-header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .discounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }

    a.discount-card {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 1rem 1.2rem;
      border-radius: var(--radius-card);
      text-decoration: none;
      color: inherit;
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.06);
      box-shadow: var(--shadow-soft);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    a.discount-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
    }

    .discount-chip {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
      color: var(--brand-green);
      font-weight: 600;
      font-size: 0.8rem;
      letter-spacing: 0.02em;
    }

    .discount-card .item-name {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
    }

    .discount-card .restaurant-name {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .discount-prices {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
    }

    .discount-prices .current {
      font-weight: 700;
      font-size: 1.05rem;
    }

    .discount-prices .original {
      color: var(--text-secondary);
      text-decoration: line-through;
    }

    .profile-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1.1rem;
      padding: 1.4rem 1.6rem;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.12), rgba(var(--brand-green-rgb, 6, 193, 103), 0.03));
    }

    .profile-card .profile-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }

    .profile-card .card-body h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .profile-card .card-body p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .profile-card .cta {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      color: var(--brand-green);
    }

    .profile-card .cta::after {
      content: '›';
      font-size: 1.1rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.5rem;
    }

    @media (min-width: 900px) {
      .grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    a.card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.4rem;
      border-radius: var(--radius-card);
      background: var(--surface);
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
    }

    a.card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.14), transparent 60%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    a.card:hover {
      transform: translateY(-4px);
      box-shadow: 0 22px 45px rgba(15, 23, 42, 0.12);
    }

    a.card:hover::after {
      opacity: 1;
    }

    .card-media {
      position: relative;
      width: 100%;
      aspect-ratio: 3 / 2;
      border-radius: calc(var(--radius-card) - 6px);
      overflow: hidden;
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.2), rgba(var(--brand-green-rgb, 6, 193, 103), 0.05));
      display: flex;
      align-items: center;
      justify-content: center;
      --logo-size: 3.1rem;
    }

    .card-media img,
    .card-media .placeholder {
      position: relative;
      z-index: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-media .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      color: rgba(10, 10, 10, 0.6);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .card-header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .card-header h3 {
      margin: 0;
    }

    .card-header p {
      margin: 0;
      color: var(--text-secondary);
    }

    .card-logo {
      position: absolute;
      left: 0.55rem;
      bottom: 0.55rem;
      width: calc(var(--logo-size));
      height: calc(var(--logo-size));
      padding: 0.35rem;
      border-radius: 18px;
      //background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: -1px 1px 20px 9px rgb(255, 255, 255);
      z-index: 2;
    }

    .card-logo img,
    .card-logo-initial {
      width: var(--logo-size);
      height: var(--logo-size);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-logo img {
      object-fit: cover;
    }

    .card-logo-initial {
      background: rgba(10, 10, 10, 0.08);
      font-weight: 700;
      font-size: 1.1rem;
      color: rgba(10, 10, 10, 0.65);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .cuisine-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .cuisine-tags li {
      background: rgba(10, 10, 10, 0.05);
      color: var(--text-secondary);
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green);
      font-weight: 600;
      font-size: 0.8rem;
    }
  `],
  template: `
    <div>
      <h2>{{ 'restaurants.heading' | translate: 'Discover near you' }}</h2>
      <p class="subhead">
        {{ 'restaurants.subheading' | translate: 'Hand-picked favourites delivering fast, just like the Uber Eats app.' }}
      </p>
    </div>
    <app-card-overview *ngIf="isLoggedIn()" />
    <ng-container *ngIf="discounts$ | async as discounts">
      <section class="discounts-section" *ngIf="discounts.length">
        <div class="discounts-header">
          <h3>{{ 'restaurants.discountsHeading' | translate: 'Limited-time deals' }}</h3>
          <p class="subhead">
            {{
              'restaurants.discountsSubheading'
                | translate: 'Tap a deal to jump straight to the menu item.'
            }}
          </p>
        </div>
        <div class="discounts-grid">
          <a
            class="discount-card"
            *ngFor="let deal of discounts"
            [routerLink]="['/restaurants', deal.restaurant.id]"
            [queryParams]="{ highlightItem: deal.item.id }"
          >
            <span class="discount-chip">
              {{ 'restaurants.saveLabel' | translate: 'Save' }}
              {{ (deal.savingsCents / 100) | currency:'EUR' }}
              <ng-container *ngIf="deal.savingsPercent !== null">
                ({{ deal.savingsPercent }}%)
              </ng-container>
            </span>
            <h4 class="item-name">{{ deal.item.name }}</h4>
            <p class="restaurant-name">{{ getRestaurantName(deal.restaurant) }}</p>
            <div class="discount-prices">
              <span class="current">{{ (deal.currentPriceCents / 100) | currency:'EUR' }}</span>
              <span class="original">{{ (deal.originalPriceCents / 100) | currency:'EUR' }}</span>
            </div>
          </a>
        </div>
      </section>
    </ng-container>
    <a
      class="card profile-card"
      routerLink="/profile"
      *ngIf="shouldShowProfilePrompt()"
    >
      <span class="profile-icon">👤</span>
      <div class="card-body">
        <h3>{{ 'profilePrompt.title' | translate: 'Complete your profile' }}</h3>
        <p>
          {{
            'profilePrompt.subtitle'
              | translate: 'Add your name, gender, and birth date for a more personal experience.'
          }}
        </p>
      </div>
      <span class="cta">{{ 'profilePrompt.action' | translate: 'Finish profile' }}</span>
    </a>
    <ng-container *ngIf="availableCuisines$ | async as cuisines">
      <section class="filters-panel" *ngIf="cuisines.length">
        <div class="filters-toolbar">
          <div class="filters-header">
            <h3>{{ 'restaurants.filters.title' | translate: 'Filter restaurants' }}</h3>
            <p class="filters-subtitle">
              {{
                'restaurants.filters.subtitle'
                  | translate: 'Search by cuisine or browse popular picks to find exactly what you\'re craving.'
              }}
            </p>
          </div>
          <div class="filters-actions" *ngIf="hasActiveCuisineFilters()">
            <span>{{ 'restaurants.filters.active' | translate: 'Filters applied' }}</span>
            <button type="button" (click)="clearCuisineFilters()">
              {{ 'restaurants.filters.clear' | translate: 'Clear cuisines' }}
            </button>
          </div>
        </div>
        <div class="filters-body">
          <div class="filters-search">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M11 4a7 7 0 1 1-4.95 11.95l-3.5 3.5-1.06-1.06 3.5-3.5A7 7 0 0 1 11 4m0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
                fill="currentColor"
              />
            </svg>
            <input
              type="search"
              autocomplete="off"
              [value]="cuisineSearch()"
              (input)="onCuisineSearch($any($event.target).value)"
              [placeholder]="
                'restaurants.filters.searchPlaceholder' | translate: 'Search cuisines (e.g. Thai, Vegan)'
              "
              [attr.aria-label]="'restaurants.filters.searchLabel' | translate: 'Search cuisines'"
            />
            <button type="button" class="clear-search" *ngIf="isSearching()" (click)="clearCuisineSearch()">
              {{ 'restaurants.filters.searchClear' | translate: 'Clear' }}
            </button>
          </div>
          <ng-container *ngIf="isSearching(); else defaultCuisineView">
            <ng-container *ngIf="getCuisineSearchResults(cuisines) as results; else noCuisineMatches">
              <div class="filter-section" *ngIf="results.length; else noCuisineMatches">
                <h4>{{ 'restaurants.filters.searchResults' | translate: 'Matching cuisines' }}</h4>
                <div class="chip-list">
                  <button
                    type="button"
                    class="filter-chip"
                    [class.active]="isCuisineSelected(cuisine)"
                    (click)="toggleCuisine(cuisine)"
                    *ngFor="let cuisine of results"
                    [attr.aria-pressed]="isCuisineSelected(cuisine)"
                  >
                    <span class="chip-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path [attr.d]="getCuisineIconPath(cuisine)" fill="currentColor" />
                      </svg>
                    </span>
                    <span class="chip-label">{{ cuisine | titlecase }}</span>
                  </button>
                </div>
              </div>
            </ng-container>
          </ng-container>
          <ng-template #defaultCuisineView>
            <div class="filters-layout">
              <ng-container *ngIf="getPopularCuisines(cuisines) as popular">
                <div class="filter-section" *ngIf="popular.length">
                  <h4>{{ 'restaurants.filters.popular' | translate: 'Popular choices' }}</h4>
                  <div class="chip-list">
                    <button
                      type="button"
                      class="filter-chip"
                      [class.active]="isCuisineSelected(cuisine)"
                      (click)="toggleCuisine(cuisine)"
                      *ngFor="let cuisine of popular"
                      [attr.aria-pressed]="isCuisineSelected(cuisine)"
                    >
                      <span class="chip-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false">
                          <path [attr.d]="getCuisineIconPath(cuisine)" fill="currentColor" />
                        </svg>
                      </span>
                      <span class="chip-label">{{ cuisine | titlecase }}</span>
                    </button>
                  </div>
                </div>
              </ng-container>
              <div class="filter-section">
                <h4>{{ 'restaurants.filters.all' | translate: 'All cuisines' }}</h4>
                <ng-container *ngIf="getCuisineGroups(cuisines) as groups">
                  <div class="grouped-cuisines" *ngIf="groups.length">
                    <div class="cuisine-group" *ngFor="let group of groups">
                      <span class="group-title">{{ group.label }}</span>
                      <div class="chip-list">
                        <button
                          type="button"
                          class="filter-chip"
                          [class.active]="isCuisineSelected(cuisine)"
                          (click)="toggleCuisine(cuisine)"
                          *ngFor="let cuisine of group.cuisines"
                          [attr.aria-pressed]="isCuisineSelected(cuisine)"
                        >
                          <span class="chip-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                              <path [attr.d]="getCuisineIconPath(cuisine)" fill="currentColor" />
                            </svg>
                          </span>
                          <span class="chip-label">{{ cuisine | titlecase }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
          </ng-template>
          <ng-template #noCuisineMatches>
            <div class="empty-state">
              <p>
                {{
                  'restaurants.filters.noMatches'
                    | translate: 'No cuisines match your search. Try a different term.'
                }}
              </p>
            </div>
          </ng-template>
        </div>
        <div class="filters-footer">
          <div class="sort-group">
            <label for="restaurant-sort">{{ 'restaurants.sort.label' | translate: 'Sort by' }}</label>
            <select id="restaurant-sort" [value]="getSortOrder()" (change)="onSortChange($any($event.target).value)">
              <option value="recommended">
                {{ 'restaurants.sort.recommended' | translate: 'Recommended' }}
              </option>
              <option value="nameAsc">{{ 'restaurants.sort.nameAsc' | translate: 'Name (A-Z)' }}</option>
              <option value="nameDesc">{{ 'restaurants.sort.nameDesc' | translate: 'Name (Z-A)' }}</option>
              <option value="distance">{{ 'restaurants.sort.distance' | translate: 'Distance' }}</option>
            </select>
            <div class="distance-hint" *ngIf="shouldShowDistanceHint()" [class.error]="isDistanceHintError()">
              {{ getDistanceHintMessage() }}
            </div>
          </div>
        </div>
      </section>
    </ng-container>
    <div class="grid" *ngIf="restaurants$ | async as restaurants">
      <a class="card" *ngFor="let r of restaurants" [routerLink]="['/restaurants', r.id]">
        <div class="card-media">
          <ng-container *ngIf="r.heroPhoto; else placeholder">
            <img [src]="r.heroPhoto" [alt]="getRestaurantName(r)" loading="lazy" />
          </ng-container>
          <ng-template #placeholder>
            <span class="placeholder">{{ getRestaurantInitial(r) }}</span>
          </ng-template>
          <ng-container *ngIf="r.logo_url as logoUrl; else logoFallback">
            <div class="card-logo">
              <img [src]="logoUrl" [alt]="getRestaurantName(r) + ' logo'" loading="lazy" />
            </div>
          </ng-container>
          <ng-template #logoFallback>
            <div class="card-logo">
              <div class="card-logo-initial">{{ getRestaurantInitial(r) }}</div>
            </div>
          </ng-template>
        </div>
          <div class="card-body">
            <div class="card-header">
              <h3>{{ getRestaurantName(r) }}</h3>
              <p>{{ getRestaurantDescription(r) }}</p>
            </div>
            <ul class="cuisine-tags" *ngIf="r.cuisines?.length">
              <li *ngFor="let cuisine of r.cuisines">{{ cuisine | titlecase }}</li>
            </ul>
            <div class="meta">
              <span class="pill">{{ 'restaurants.express' | translate: 'Express' }}</span>
              <span>{{ 'restaurants.duration' | translate: '20-30 min' }}</span>
              <span>€€</span>
              <span *ngIf="r.distanceKm !== null && r.distanceKm !== undefined">
                {{ r.distanceKm | number:'1.0-1' }} {{ 'restaurants.sort.distanceSuffix' | translate: 'km away' }}
              </span>
            </div>
        </div>
      </a>
    </div>
  `
})
export class RestaurantListPage {
  private svc = inject(RestaurantService);
  private menu = inject(MenuService);
  private i18n = inject(TranslationService);
  private auth = inject(AuthService);
  private profile = inject(ProfileService);
  private heroPhotoCache = new Map<number, string>();
  private readonly defaultCuisineIconPath = ICON_DEFAULT_PLATE;
  private selectedCuisinesSubject = new BehaviorSubject<string[]>([]);
  private sortOrderSubject = new BehaviorSubject<RestaurantSortOption>('recommended');
  private userLocationSubject = new BehaviorSubject<UserLocation | null>(null);
  private geolocationState = signal<GeolocationState>({ status: 'idle', message: null });
  private hasDeniedGeolocation = false;
  private profilePromptState = signal<{ loading: boolean; profile: UserProfile | null }>({
    loading: false,
    profile: null,
  });
  cuisineSearch = signal('');

  constructor() {
    effect(() => {
      const user = this.auth.user();

      if (!user || this.hasCompletedProfile(user)) {
        this.profilePromptState.set({ loading: false, profile: null });
        return;
      }

      this.profilePromptState.set({ loading: true, profile: null });

      const subscription = this.profile
        .getProfile()
        .subscribe({
          next: (profile) => {
            this.profilePromptState.set({ loading: false, profile });
            this.auth.updateSessionUser({
              firstName: profile.firstName,
              lastName: profile.lastName,
              gender: profile.gender,
              birthDate: profile.birthDate,
            });
          },
          error: () => {
            this.profilePromptState.set({ loading: false, profile: null });
          },
        });

      return () => subscription.unsubscribe();
    });
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  toggleCuisine(cuisine: string): void {
    const current = this.selectedCuisinesSubject.value;
    const exists = current.includes(cuisine);
    const next = exists ? current.filter(item => item !== cuisine) : [...current, cuisine];
    this.selectedCuisinesSubject.next(next);
  }

  isCuisineSelected(cuisine: string): boolean {
    return this.selectedCuisinesSubject.value.includes(cuisine);
  }

  hasActiveCuisineFilters(): boolean {
    return this.selectedCuisinesSubject.value.length > 0;
  }

  clearCuisineFilters(): void {
    this.selectedCuisinesSubject.next([]);
  }

  onCuisineSearch(value: string): void {
    this.cuisineSearch.set(value ?? '');
  }

  clearCuisineSearch(): void {
    this.cuisineSearch.set('');
  }

  isSearching(): boolean {
    return this.getCuisineSearchTerm().length > 0;
  }

  getCuisineSearchResults(cuisines: string[]): string[] {
    if (!Array.isArray(cuisines)) {
      return [];
    }

    const query = this.getCuisineSearchTerm();
    if (!query) {
      return cuisines.slice();
    }

    return cuisines.filter(cuisine => this.matchesCuisineQuery(cuisine, query));
  }

  getPopularCuisines(cuisines: string[]): string[] {
    if (!Array.isArray(cuisines)) {
      return [];
    }

    const query = this.getCuisineSearchTerm();

    return cuisines.filter(
      cuisine => POPULAR_CUISINES.has(cuisine) && this.matchesCuisineQuery(cuisine, query),
    );
  }

  getCuisineGroups(cuisines: string[]): { label: string; cuisines: string[] }[] {
    if (!Array.isArray(cuisines) || !cuisines.length) {
      return [];
    }

    const query = this.getCuisineSearchTerm();
    const includePopular = query.length > 0;
    const groups = new Map<string, string[]>();

    for (const cuisine of cuisines) {
      if (!this.matchesCuisineQuery(cuisine, query)) {
        continue;
      }

      if (!includePopular && POPULAR_CUISINES.has(cuisine)) {
        continue;
      }

      const label = this.getCuisineGroupLabel(cuisine);
      const list = groups.get(label);
      if (list) {
        list.push(cuisine);
      } else {
        groups.set(label, [cuisine]);
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, list]) => ({
        label,
        cuisines: list.slice().sort((a, b) => a.localeCompare(b)),
      }));
  }

  getCuisineIconPath(cuisine: string): string {
    const key = (cuisine ?? '').trim().toLowerCase();
    if (!key) {
      return this.defaultCuisineIconPath;
    }

    return CUISINE_ICON_PATHS.get(key) ?? this.defaultCuisineIconPath;
  }

  getSortOrder(): RestaurantSortOption {
    return this.sortOrderSubject.value;
  }

  onSortChange(value: string): void {
    if (!this.isRestaurantSortOption(value)) {
      return;
    }

    this.sortOrderSubject.next(value);

    if (value === 'distance') {
      this.ensureUserLocationRequested();
    }
  }

  shouldShowDistanceHint(): boolean {
    return this.getSortOrder() === 'distance';
  }

  getDistanceHintMessage(): string {
    const state = this.geolocationState();

    if (state.status === 'idle' || !state.message) {
      return this.i18n.translate(
        'restaurants.sort.distanceExplainer',
        'We use your location to show nearby restaurants first.',
      );
    }

    return state.message;
  }

  isDistanceHintError(): boolean {
    const status = this.geolocationState().status;
    return status === 'denied' || status === 'unsupported' || status === 'error';
  }

  private getCuisineSearchTerm(): string {
    return this.cuisineSearch().trim().toLowerCase();
  }

  private matchesCuisineQuery(cuisine: string, query: string = this.getCuisineSearchTerm()): boolean {
    if (!query) {
      return true;
    }

    return (cuisine ?? '').toLowerCase().includes(query);
  }

  private getCuisineGroupLabel(cuisine: string): string {
    const first = (cuisine ?? '').trim().charAt(0).toUpperCase();
    return first && /[A-Z]/.test(first) ? first : '#';
  }

  private isRestaurantSortOption(value: string): value is RestaurantSortOption {
    return value === 'recommended' || value === 'nameAsc' || value === 'nameDesc' || value === 'distance';
  }

  private ensureUserLocationRequested(): void {
    const currentState = this.geolocationState();
    if (currentState.status === 'requesting') {
      return;
    }

    if (this.userLocationSubject.value) {
      this.geolocationState.set({
        status: 'granted',
        message: this.i18n.translate(
          'restaurants.sort.distanceActive',
          'Showing nearest restaurants first.',
        ),
      });
      return;
    }

    if (this.hasDeniedGeolocation) {
      this.geolocationState.set({
        status: 'denied',
        message: this.i18n.translate(
          'restaurants.sort.distanceDenied',
          'Location access is blocked. Update your browser settings to enable it.',
        ),
      });
      return;
    }

    if (!this.canUseGeolocation()) {
      this.geolocationState.set({
        status: 'unsupported',
        message: this.i18n.translate(
          'restaurants.sort.distanceUnsupported',
          'Location access is not supported in this browser.',
        ),
      });
      return;
    }

    this.geolocationState.set({
      status: 'requesting',
      message: this.i18n.translate('restaurants.sort.distanceRequesting', 'Fetching your location…'),
    });

    navigator.geolocation.getCurrentPosition(
      position => this.handleGeolocationSuccess(position),
      error => this.handleGeolocationError(error),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 },
    );
  }

  private handleGeolocationSuccess(position: GeolocationPosition): void {
    const coords = position.coords;
    const location: UserLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: typeof coords.accuracy === 'number' ? coords.accuracy : null,
    };

    this.hasDeniedGeolocation = false;
    this.userLocationSubject.next(location);
    this.geolocationState.set({
      status: 'granted',
      message: this.i18n.translate(
        'restaurants.sort.distanceActive',
        'Showing nearest restaurants first.',
      ),
    });
  }

  private handleGeolocationError(error: GeolocationPositionError): void {
    let status: GeolocationStatus = 'error';
    let message = this.i18n.translate(
      'restaurants.sort.distanceUnavailable',
      'We could not access your location. Showing recommended order instead.',
    );

    if (error.code === error.PERMISSION_DENIED) {
      status = 'denied';
      this.hasDeniedGeolocation = true;
      message = this.i18n.translate(
        'restaurants.sort.distanceDenied',
        'Location access is blocked. Update your browser settings to enable it.',
      );
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      message = this.i18n.translate(
        'restaurants.sort.distanceUnavailable',
        'We could not access your location. Showing recommended order instead.',
      );
    } else if (error.code === error.TIMEOUT) {
      message = this.i18n.translate(
        'restaurants.sort.distanceTimeout',
        'Getting your location took too long. Please try again.',
      );
    }

    this.geolocationState.set({ status, message });
  }

  private canUseGeolocation(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined';
  }

  private computeAvailableCuisines(restaurants: RestaurantListItem[]): string[] {
    const available = new Set<string>();

    for (const restaurant of restaurants) {
      for (const cuisine of restaurant.cuisines ?? []) {
        if (cuisine) {
          available.add(cuisine.toLowerCase());
        }
      }
    }

    const prioritized = RESTAURANT_CUISINES.filter(cuisine => available.has(cuisine));
    const extras = Array.from(available).filter(cuisine => !RESTAURANT_CUISINES.includes(cuisine));

    return [...prioritized, ...extras];
  }

  private filterByCuisine(
    restaurants: RestaurantListItem[],
    cuisines: string[],
  ): RestaurantListItem[] {
    if (!cuisines.length) {
      return restaurants;
    }

    const selected = new Set(cuisines.map(cuisine => cuisine.toLowerCase()));

    return restaurants.filter(restaurant => {
      const restaurantCuisines = restaurant.cuisines ?? [];
      return restaurantCuisines.some(cuisine => selected.has(cuisine.toLowerCase()));
    });
  }

  private sortRestaurants(
    restaurants: RestaurantListItem[],
    sortOrder: RestaurantSortOption,
    userLocation: UserLocation | null,
  ): RestaurantListItem[] {
    if (sortOrder === 'distance') {
      if (!userLocation) {
        return restaurants.map(restaurant => ({ ...restaurant, distanceKm: null }));
      }

      const annotated = restaurants.map(restaurant => ({
        ...restaurant,
        distanceKm: this.computeDistanceToRestaurant(restaurant, userLocation),
      }));

      annotated.sort((a, b) => {
        const aDistance = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
        const bDistance = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;

        if (aDistance === bDistance) {
          return this.getRestaurantName(a).localeCompare(this.getRestaurantName(b), undefined, {
            sensitivity: 'base',
          });
        }

        return aDistance - bDistance;
      });

      return annotated;
    }

    const sanitized = restaurants.map(restaurant => ({ ...restaurant, distanceKm: null }));

    if (sortOrder === 'recommended') {
      return sanitized;
    }

    sanitized.sort((a, b) => {
      const comparison = this.getRestaurantName(a).localeCompare(this.getRestaurantName(b), undefined, {
        sensitivity: 'base',
      });

      return sortOrder === 'nameAsc' ? comparison : -comparison;
    });

    return sanitized;
  }

  private computeDistanceToRestaurant(restaurant: RestaurantListItem, origin: UserLocation): number | null {
    const locations = this.getRestaurantLocations(restaurant);
    let closest: number | null = null;

    for (const location of locations) {
      const latitude = this.normalizeCoordinate(location.latitude);
      const longitude = this.normalizeCoordinate(location.longitude);

      if (latitude === null || longitude === null) {
        continue;
      }

      const distance = this.haversineDistance(origin.latitude, origin.longitude, latitude, longitude);

      if (closest === null || distance < closest) {
        closest = distance;
      }
    }

    return closest;
  }

  private getRestaurantLocations(restaurant: RestaurantListItem): Location[] {
    return Array.isArray(restaurant.locations) ? restaurant.locations : [];
  }

  private normalizeCoordinate(value: number | string | null | undefined): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private ensureHeroPhoto(restaurant: Restaurant): string | undefined {
    const cached = this.heroPhotoCache.get(restaurant.id);
    if (cached) {
      return cached;
    }

    const photos = restaurant.photos;
    if (!photos?.length) {
      return undefined;
    }

    const choice = photos[Math.floor(Math.random() * photos.length)]?.url;
    if (!choice) {
      return undefined;
    }

    this.heroPhotoCache.set(restaurant.id, choice);
    return choice;
  }

  private hasDiscount(item: MenuItem): boolean {
    const discounted = item.discounted_price_cents;
    return typeof discounted === 'number' && discounted >= 0 && discounted < item.price_cents;
  }

  private toDiscountHighlight(
    restaurant: RestaurantListItem,
    item: MenuItem,
  ): DiscountHighlight | null {
    if (!this.hasDiscount(item)) {
      return null;
    }

    const discounted = item.discounted_price_cents;
    if (typeof discounted !== 'number') {
      return null;
    }

    const original = item.price_cents;
    const current = discounted;
    const savings = Math.max(original - current, 0);

    if (savings <= 0) {
      return null;
    }

    const percent = original > 0 ? Math.round((savings / original) * 100) : null;

    return {
      restaurant,
      item,
      currentPriceCents: current,
      originalPriceCents: original,
      savingsCents: savings,
      savingsPercent: percent,
    };
  }

  private allRestaurants$: Observable<RestaurantListItem[]> = this.svc.list().pipe(
    map(restaurants =>
      restaurants.map(restaurant => ({
        ...restaurant,
        heroPhoto: this.ensureHeroPhoto(restaurant),
        cuisines: normalizeRestaurantCuisines(restaurant.cuisines),
      })),
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  availableCuisines$: Observable<string[]> = this.allRestaurants$.pipe(
    map(restaurants => this.computeAvailableCuisines(restaurants)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  restaurants$: Observable<RestaurantListItem[]> = combineLatest([
    this.allRestaurants$,
    this.selectedCuisinesSubject.asObservable(),
    this.sortOrderSubject.asObservable(),
    this.userLocationSubject.asObservable(),
  ]).pipe(
    map(([restaurants, selectedCuisines, sortOrder, userLocation]) => {
      const filtered = this.filterByCuisine(restaurants, selectedCuisines);
      return this.sortRestaurants(filtered, sortOrder, userLocation);
    })
  );

  discounts$ = combineLatest([
    this.allRestaurants$,
    this.menu.listDiscounted(),
  ]).pipe(
    map(([restaurants, items]) => {
      const restaurantMap = new Map(restaurants.map(restaurant => [restaurant.id, restaurant]));

      return items
        .map(item => {
          const restaurant = restaurantMap.get(item.restaurant_id);
          if (!restaurant) {
            return null;
          }

          return this.toDiscountHighlight(restaurant, item);
        })
        .filter((highlight): highlight is DiscountHighlight => Boolean(highlight))
        .sort((a, b) => {
          if (a.savingsPercent != null && b.savingsPercent != null && a.savingsPercent !== b.savingsPercent) {
            return b.savingsPercent - a.savingsPercent;
          }

          return b.savingsCents - a.savingsCents;
        });
    })
  );

  shouldShowProfilePrompt(): boolean {
    const user = this.auth.user();
    if (!user) {
      return false;
    }

    if (this.hasCompletedProfile(user)) {
      return false;
    }

    const state = this.profilePromptState();
    if (state.loading) {
      return false;
    }

    return !this.hasCompletedProfile(state.profile);
  }

  private hasCompletedProfile(
    user:
      | {
          firstName?: string | null;
          lastName?: string | null;
          gender?: string | null;
          birthDate?: string | null;
        }
      | null
      | undefined,
  ): boolean {
    if (!user) {
      return false;
    }

    return Boolean(user.firstName && user.lastName && user.gender && user.birthDate);
  }

  getRestaurantName(restaurant: Restaurant): string {
    return this.resolveRestaurantField(restaurant.name, restaurant.name_translations) || restaurant.name;
  }

  getRestaurantDescription(restaurant: Restaurant): string {
    const resolved = this.resolveRestaurantField(
      restaurant.description,
      restaurant.description_translations
    );

    const fallback = this.i18n.translate(
      'restaurants.defaultDescription',
      'Popular choices • Comfort food'
    );

    return this.formatRestaurantPreviewDescription(resolved || fallback);
  }

  getRestaurantInitial(restaurant: Restaurant): string {
    const name = this.getRestaurantName(restaurant) || restaurant.name || '';
    return name.trim().charAt(0) || '?';
  }

  private resolveRestaurantField(
    fallback: string | undefined,
    translations: Record<string, string> | undefined
  ): string {
    if (translations && Object.keys(translations).length) {
      const candidates = this.buildLocaleCandidates();

      for (const locale of candidates) {
        const localized = this.tryResolveTranslation(translations, locale);
        if (localized) {
          return localized;
        }
      }

      for (const value of Object.values(translations)) {
        if (value?.trim()) {
          return value.trim();
        }
      }
    }

    return fallback?.trim() ?? '';
  }

  private formatRestaurantPreviewDescription(description: string): string {
    const limit = 100;
    const normalized = description.replace(/\s+/g, ' ').trim();

    if (normalized.length <= limit) {
      return normalized;
    }

    const softBoundary = limit + 15;
    const nextWhitespace = normalized.indexOf(' ', limit);
    if (nextWhitespace !== -1 && nextWhitespace <= softBoundary) {
      return this.appendEllipsis(normalized.slice(0, nextWhitespace));
    }

    const previousWhitespace = normalized.lastIndexOf(' ', limit);
    if (previousWhitespace !== -1) {
      return this.appendEllipsis(normalized.slice(0, previousWhitespace));
    }

    return this.appendEllipsis(normalized.slice(0, limit));
  }

  private appendEllipsis(value: string): string {
    const trimmed = value.replace(/[\s.,;:!?-]+$/, '').trim();
    const safeValue = trimmed || value.trim() || value;
    return safeValue + '…';
  }

  private buildLocaleCandidates(): string[] {
    const candidates = new Set<string>();
    const localeValue = this.i18n.currentLocale();
    const currentLocale = localeValue ? localeValue.toLowerCase() : '';
    const currentLanguage = this.i18n.currentLanguageCode().toLowerCase();

    if (currentLocale) {
      candidates.add(currentLocale);
      const [languagePart] = currentLocale.split('-');
      if (languagePart) {
        candidates.add(languagePart);
      }
    }

    if (currentLanguage) {
      candidates.add(currentLanguage);
    }

    candidates.add('en');

    return Array.from(candidates);
  }

  private tryResolveTranslation(translations: Record<string, string>, locale: string): string | null {
    const variations = new Set<string>();
    const trimmed = locale.trim();

    if (!trimmed) {
      return null;
    }

    variations.add(trimmed);
    variations.add(trimmed.toLowerCase());
    variations.add(trimmed.toUpperCase());

    if (trimmed.includes('-')) {
      const [language, region] = trimmed.split('-');
      const lowerLanguage = language.toLowerCase();
      const lowerRegion = region?.toLowerCase();
      const upperRegion = region?.toUpperCase();

      variations.add(language);
      variations.add(lowerLanguage);

      if (lowerRegion) {
        variations.add(`${lowerLanguage}-${lowerRegion}`);
        variations.add(`${lowerLanguage}-${upperRegion}`);
      }
    }

    for (const variant of variations) {
      const value = translations[variant];
      if (value?.trim()) {
        return value.trim();
      }
    }

    return null;
  }
}
