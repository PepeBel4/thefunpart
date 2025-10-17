import { Component, HostListener, OnDestroy, effect, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import { AsyncPipe, CurrencyPipe, NgClass, NgIf, NgFor, NgStyle, DOCUMENT, TitleCasePipe } from '@angular/common';
import {
  Allergen,
  Card,
  Location,
  LocationOpeningHour,
  LocationOpeningHourException,
  MenuItem,
  Restaurant,
} from '../core/models';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { CartCategorySelection, CartRestaurant, CartService } from '../cart/cart.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { MenuItemPhotoSliderComponent } from './menu-item-photo-slider.component';
import { AllergenIconComponent } from '../shared/allergen-icon.component';
import { CardService } from '../cards/card.service';
import { CardSpotlightEntry, CardSpotlightService } from '../cards/card-spotlight.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { normalizeRestaurantCuisines } from './cuisines';
import { BrandColorService } from '../core/brand-color.service';
import { LocationService } from '../locations/location.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type MenuCategoryGroup = {
  name: string;
  anchor: string;
  items: MenuItem[];
  cartCategory: CartCategorySelection | null;
  cartCategoriesByItemId?: Record<number, CartCategorySelection | null>;
};

type CartFlightAnimation = {
  id: number;
  quantity: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  arcHeight: number;
};

type PendingCartAddition = {
  item: MenuItem;
  category: CartCategorySelection | null;
  incomingRestaurant: CartRestaurant;
  currentRestaurantName: string;
  incomingRestaurantName: string;
  quantity: number;
};

type MenuItemModalContext = {
  item: MenuItem;
  category: CartCategorySelection | null;
  restaurant: Restaurant;
};

type CounterLocationStatusViewModel = {
  state: 'open' | 'closed' | 'closingSoon' | 'openingSoon';
  headline: string;
  detail: string | null;
};

type CounterLocationScheduleEntry = {
  dayLabel: string;
  intervals: string[];
  closed: boolean;
  isToday: boolean;
  exceptionLabel: string | null;
};

type CounterLocationExceptionEntry = {
  dateLabel: string;
  statusLabel: string;
  reasonLabel: string | null;
};

type CounterLocationViewModel = {
  location: Location;
  telephone: string | null;
  email: string | null;
  addressLines: string[];
  mapUrl: SafeResourceUrl | null;
  hasDetails: boolean;
  status: CounterLocationStatusViewModel | null;
  currentTimeLabel: string | null;
  schedule: CounterLocationScheduleEntry[];
  exceptions: CounterLocationExceptionEntry[];
};

type OpeningInterval = {
  openMinutes: number;
  closeMinutes: number;
};

type ScheduledInterval = {
  start: Date;
  end: Date;
  dateKey: string;
  dayOfWeek: number;
  isException: boolean;
};

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    NgClass,
    NgFor,
    NgIf,
    TranslatePipe,
    NgStyle,
    MenuItemPhotoSliderComponent,
    AllergenIconComponent,
    TitleCasePipe,
  ],
  styles: [`
    :host {
      display: block;
    }

    .hero {
      position: relative;
      border-radius: var(--radius-card);
      padding: clamp(2rem, 5vw, 3.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.06);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 1rem;
      margin-bottom: 2.5rem;
      min-height: clamp(280px, 45vw, 420px);
      overflow: hidden;
      background-color: var(--surface);
      background-size: cover;
      background-position: center;
      transition: background-image 0.8s ease-in-out;
      color: #f6f6f6;
    }

    .hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(140deg, rgba(4, 24, 16, 0.75) 0%, rgba(4, 24, 16, 0.35) 55%, rgba(4, 24, 16, 0.6) 100%);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      max-width: 540px;
    }


    .hero-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      row-gap: 0.65rem;
    }

    .hero-identity {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1 1 auto;
      min-width: 0;
    }

    .hero-logo {
      flex: 0 0 auto;
      width: clamp(64px, 10vw, 96px);
      aspect-ratio: 1;
      border-radius: 22%;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.18);
      padding: 0.35rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.24);
    }

    .hero-title {
      font-size: clamp(2.25rem, 4.8vw, 3.6rem);
      font-weight: 700;
      letter-spacing: -0.045em;
      margin: 0;
      flex: 1 1 16rem;
      min-width: 0;
      line-height: 1.05;
      word-break: break-word;
    }

    .hero-info-button {
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.18);
      color: rgba(255, 255, 255, 0.92);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
      position: absolute;
      top: 1rem;
      right: 1rem;
      z-index: 2;
    }

    .hero-info-button:hover,
    .hero-info-button:focus {
      background: rgba(255, 255, 255, 0.28);
      transform: translateY(-1px);
    }

    .hero-info-button:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.9);
      outline-offset: 2px;
    }

    .hero-info-button span {
      font-weight: 700;
      font-size: 1.25rem;
      line-height: 1;
    }

    .hero-description {
      margin: 0;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.88);
    }

    .hero-cuisines {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      margin: 0;
      padding: 0;
      list-style: none;
      color: rgba(255, 255, 255, 0.85);
    }

    .hero-cuisines li {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(6px);
      color: #fff;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      color: rgba(255, 255, 255, 0.78);
    }

    .hero-meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .hero-hours {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.14);
      border-radius: clamp(14px, 3vw, 18px);
      border: 1px solid rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .hero-hours-status {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.75rem;
    }

    .hero-hours-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 999px;
      font-weight: 600;
      letter-spacing: 0.01em;
      background: rgba(31, 201, 115, 0.18);
      border: 1px solid rgba(31, 201, 115, 0.45);
      color: #eafff4;
      text-transform: uppercase;
      font-size: 0.8rem;
    }

    .hero-hours-badge.closed {
      background: rgba(241, 73, 73, 0.18);
      border-color: rgba(241, 73, 73, 0.5);
      color: #ffeaea;
    }

    .hero-hours-badge.opening-soon {
      background: rgba(255, 183, 77, 0.2);
      border-color: rgba(255, 183, 77, 0.55);
      color: #fff4e3;
    }

    .hero-hours-badge.closing-soon {
      background: rgba(255, 143, 107, 0.22);
      border-color: rgba(255, 143, 107, 0.55);
      color: #fff1eb;
    }

    .hero-hours-current-time {
      font-size: 0.9rem;
      opacity: 0.85;
    }

    .hero-hours-detail {
      font-size: 0.95rem;
      opacity: 0.92;
    }

    .hero-hours-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .hero-hours-day {
      padding: 0.75rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-height: 96px;
    }

    .hero-hours-day.today {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.32);
    }

    .hero-hours-day-title {
      font-weight: 600;
      letter-spacing: 0.01em;
      font-size: 0.9rem;
    }

    .hero-hours-day-interval {
      font-size: 0.95rem;
      opacity: 0.92;
    }

    .hero-hours-day-empty {
      font-size: 0.9rem;
      opacity: 0.7;
    }

    .hero-hours-day-exception {
      font-size: 0.85rem;
      opacity: 0.85;
    }

    .hero-hours-exceptions {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .hero-hours-exceptions h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .hero-hours-exceptions-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .hero-hours-exception {
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: grid;
      gap: 0.25rem;
    }

    .hero-hours-exception strong {
      font-weight: 600;
    }

    .hero-hours-exception p {
      margin: 0;
      font-size: 0.9rem;
    }

    .hero-hours-empty {
      font-size: 0.95rem;
      opacity: 0.8;
    }

    .tag {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      backdrop-filter: blur(6px);
    }

    h3 {
      margin-top: 0;
      font-size: 1.5rem;
    }

    .menu-search {
      position: relative;
      width: 100%;
      display: inline-flex;
      align-items: center;
    }

    .menu-search input {
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 999px;
      padding: 0.65rem 1rem 0.65rem 2.65rem;
      font: inherit;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(8px);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      width: 100%;
    }

    .menu-search input::placeholder {
      color: rgba(16, 24, 18, 0.45);
    }

    .menu-search input:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--brand-green) 65%, transparent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-green) 30%, transparent);
      background: rgba(255, 255, 255, 0.92);
    }

    .menu-search-icon {
      position: absolute;
      left: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
      color: rgba(16, 24, 18, 0.7);
      pointer-events: none;
    }

    .menu-empty {
      margin: 2.5rem 0;
      padding: 2rem;
      text-align: center;
      border-radius: var(--radius-card);
      background: rgba(4, 24, 16, 0.04);
      color: rgba(16, 24, 18, 0.7);
      font-weight: 500;
    }

    .category-nav {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
      position: sticky;
      top: 0;
      z-index: 20;
      padding: clamp(0.75rem, 1vw, 1.25rem) 0;
      //background: linear-gradient(to bottom, rgba(245, 247, 246, 0.92), rgba(245, 247, 246, 0.86));
      //backdrop-filter: blur(12px);
    }

    .category-nav-surface {
      width: min(980px, 100%);
      //background: rgba(255, 255, 255, 0.82);
      backdrop-filter: blur(18px) saturate(130%);
      border-radius: 22px;
      border: 1px solid rgba(255, 255, 255, 0.75);
      box-shadow: 0 12px 36px rgba(12, 32, 22, 0.12);
      padding: clamp(0.85rem, 1.6vw, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: clamp(0.75rem, 1.5vw, 1rem);
    }

    .category-nav-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      justify-content: center;
    }

    .category-nav button {
      border: 1px solid rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.66);
      border-radius: 999px;
      padding: 0.45rem 1rem;
      cursor: pointer;
      font-weight: 600;
      color: rgba(16, 24, 18, 0.72);
      transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      backdrop-filter: blur(6px);
    }

    .category-nav button:hover,
    .category-nav button:focus {
      color: var(--brand-green);
      background: rgba(255, 255, 255, 0.9);
      border-color: color-mix(in srgb, var(--brand-green) 35%, rgba(255, 255, 255, 0.7));
    }

    .category-nav button:focus-visible {
      outline: 2px solid var(--brand-green);
      outline-offset: 2px;
    }

    .menu-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
      scroll-margin-top: clamp(4.5rem, 10vh, 7rem);
    }

    .menu-section:last-child {
      margin-bottom: 0;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: #0418108c;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1200;
      padding: 1.5rem;
      backdrop-filter: blur(2px);
    }

    .modal {
      background: var(--surface, #ffffff);
      border-radius: 24px;
      max-width: 480px;
      width: min(100%, 480px);
      padding: clamp(1.75rem, 4vw, 2.5rem);
      box-shadow: 0 24px 64px #041e1266;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }



    .modal h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .modal p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .modal-button {
      border-radius: 999px;
      padding: 0.85rem 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }

    .modal-button.primary {
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: none;
      box-shadow: 0 16px 32px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
    }

    .modal-button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 20px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.32);
    }

    .modal-button.secondary {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
    }

    .modal-button.secondary:hover {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.1);
    }

    @media (max-width: 720px) {
      .hero {
        padding: 2rem 1.5rem;
        min-height: 240px;
      }

      .hero-header {
        align-items: flex-start;
      }

      .hero-logo {
        width: 56px;
      }

      .hero-info-button {
        width: 40px;
        height: 40px;
        top: 1.5rem;
        right: 1.5rem;
      }

      .hero-hours {
        padding: 1rem;
        gap: 0.75rem;
      }

      .menu-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <ng-container *ngIf="(restaurant$ | async) as r">
      <section
        class="hero"
        [ngStyle]="{ 'background-image': (heroBackground$ | async) || defaultHeroBackground }"
      >

        <button
              type="button"
              class="hero-info-button"
              (click)="openInfoModal()"
              aria-haspopup="dialog"
              [attr.aria-label]="getInfoButtonLabel(r)"
            >
              <span aria-hidden="true">i</span>
            </button>

        <div class="hero-content">
          <div class="hero-header">
            <div class="hero-identity">
              <img
                *ngIf="r.logo?.url as logoUrl"
                class="hero-logo"
                [src]="logoUrl"
                [alt]="getRestaurantName(r) + ' logo'"
                loading="lazy"
              />
              <h2 class="hero-title">{{ getRestaurantName(r) }}</h2>
            </div>
          </div>
          <p class="hero-description">
            {{ getRestaurantSummary(r) }}
          </p>
          <ul class="hero-cuisines" *ngIf="getRestaurantCuisines(r) as cuisines">
            <li *ngFor="let cuisine of cuisines">{{ cuisine | titlecase }}</li>
          </ul>
          <div class="hero-meta">
            <span class="tag">{{ 'restaurantDetail.tagPopular' | translate: 'Popular' }}</span>
            <span>⭐ 4.8</span>
            <span>{{ 'restaurants.duration' | translate: '20-30 min' }}</span>
            <span>{{ 'restaurants.freeDelivery' | translate: 'Free delivery over €15' }}</span>
          </div>
          <ng-container *ngIf="counterLocationVm$ | async as counterLocation">
            <div
              class="hero-hours"
              *ngIf="counterLocation && (counterLocation.schedule.length || counterLocation.status || counterLocation.exceptions.length)"
            >
              <div class="hero-hours-status" *ngIf="counterLocation.status as status">
                <span
                  class="hero-hours-badge"
                  [ngClass]="{
                    closed: status.state === 'closed',
                    'opening-soon': status.state === 'openingSoon',
                    'closing-soon': status.state === 'closingSoon'
                  }"
                >
                  {{ status.headline }}
                </span>
                <span class="hero-hours-detail" *ngIf="status.detail as detail">{{ detail }}</span>
              </div>
              <div
                class="hero-hours-current-time"
                *ngIf="counterLocation.currentTimeLabel as currentTimeLabel"
              >
                {{ currentTimeLabel }}
              </div>
              <ng-container *ngIf="counterLocation.schedule.length; else heroHoursScheduleEmpty">
                <div class="hero-hours-grid">
                  <div
                    class="hero-hours-day"
                    *ngFor="let day of counterLocation.schedule"
                    [class.today]="day.isToday"
                  >
                    <span class="hero-hours-day-title">{{ day.dayLabel }}</span>
                    <ng-container *ngIf="day.intervals.length; else heroHoursClosed">
                      <div class="hero-hours-day-interval" *ngFor="let interval of day.intervals">
                        {{ interval }}
                      </div>
                    </ng-container>
                    <span
                      class="hero-hours-day-exception"
                      *ngIf="day.exceptionLabel as exceptionLabel"
                    >
                      {{ exceptionLabel }}
                    </span>
                  </div>
                </div>
              </ng-container>
              <ng-template #heroHoursScheduleEmpty>
                <p class="hero-hours-empty">
                  {{
                    'restaurantDetail.openingHoursUnavailable'
                      | translate: 'Opening hours are not available.'
                  }}
                </p>
              </ng-template>
              <ng-template #heroHoursClosed>
                <span class="hero-hours-day-empty">
                  {{ 'restaurantDetail.openingHoursClosed' | translate: 'Closed' }}
                </span>
              </ng-template>
              <div class="hero-hours-exceptions" *ngIf="counterLocation.exceptions.length">
                <h4>
                  {{
                    'restaurantDetail.openingHoursExceptionsHeading'
                      | translate: 'Exceptions & special openings'
                  }}
                </h4>
                <div class="hero-hours-exceptions-list">
                  <div class="hero-hours-exception" *ngFor="let exception of counterLocation.exceptions">
                    <strong>{{ exception.dateLabel }}</strong>
                    <p>{{ exception.statusLabel }}</p>
                    <p *ngIf="exception.reasonLabel as reasonLabel">{{ reasonLabel }}</p>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </section>
      <ng-container *ngIf="(menuCategories$ | async) as menuCategories">
        <h3 *ngIf="menuCategories.length || searchTerm">
          {{ 'restaurants.menuHeading' | translate: 'Menu' }}
        </h3>
        <nav class="category-nav" *ngIf="menuCategories.length || searchTerm">
          <div class="category-nav-surface">
            <div class="menu-search">
              <svg class="menu-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" stroke-width="2"></circle>
                <line
                  x1="16"
                  y1="16"
                  x2="20.5"
                  y2="20.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                ></line>
              </svg>
              <input
                type="search"
                id="restaurant-menu-search"
                [value]="searchTerm"
                (input)="onSearchTermChange($any($event.target).value)"
                [attr.placeholder]="'restaurantDetail.searchMenuPlaceholder' | translate: 'Search menu items'"
                [attr.aria-label]="'restaurantDetail.searchMenu' | translate: 'Search menu'"
              />
            </div>
            <div class="category-nav-buttons" *ngIf="menuCategories.length">
              <button type="button" *ngFor="let category of menuCategories" (click)="scrollTo(category.anchor)">
                {{ category.name }}
              </button>
            </div>
          </div>
        </nav>
        <section class="menu-section" *ngFor="let category of menuCategories" [attr.id]="category.anchor">
          <h4>{{ category.name }}</h4>
          <div class="menu-grid">
            <div
              class="card"
              *ngFor="let m of category.items"
              [attr.id]="getMenuItemAnchor(m)"
              [class.highlighted]="shouldHighlightMenuItem(m)"
            >
              <button
                type="button"
                class="card-info-button"
                (click)="openMenuItemModal(m, category, r)"
                [attr.aria-label]="
                  'restaurantDetail.menuItemInfoLabel'
                    | translate: 'View details for {{name}}'
                    : { name: m.name }
                "
              >
                <span aria-hidden="true">i</span>
              </button>
              <div class="card-media" *ngIf="getPrimaryPhotoUrl(m) as photoUrl">
                <img [src]="photoUrl" [alt]="m.name" loading="lazy" />
              </div>
              <h4>{{ m.name }}</h4>
              <p>
                {{
                  m.description ||
                    ('restaurantDetail.customerFavourite' | translate: 'Customer favourite')
                }}
              </p>
              <div class="price-group" *ngIf="hasDiscount(m); else cardRegularPrice">
                <span class="price discounted">
                  {{ (getCurrentPriceCents(m) / 100) | currency:'EUR' }}
                </span>
                <span class="price original">
                  {{ (m.price_cents / 100) | currency:'EUR' }}
                </span>
              </div>
              <ng-template #cardRegularPrice>
                <span class="price">{{ (m.price_cents / 100) | currency:'EUR' }}</span>
              </ng-template>
              <div class="quantity-controls" role="group" aria-label="{{ 'cart.quantity' | translate: 'Quantity' }}">
                <button
                  type="button"
                  class="quantity-button"
                  (click)="changeQuantity(m.id, -1)"
                  [disabled]="getQuantity(m.id) === 1"
                  [attr.aria-label]="'cart.decrease' | translate: 'Decrease quantity'"
                >
                  −
                </button>
                <span class="quantity-display" aria-live="polite">{{ getQuantity(m.id) }}</span>
                <button
                  type="button"
                  class="quantity-button"
                  (click)="changeQuantity(m.id, 1)"
                  [attr.aria-label]="'cart.increase' | translate: 'Increase quantity'"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                (click)="addToCart(m, resolveCartCategory(category, m), r, getQuantity(m.id), $event)"
              >
                {{ 'restaurantDetail.addToCart' | translate: 'Add to cart' }}
              </button>
            </div>
          </div>
        </section>
        <div class="menu-empty" *ngIf="!menuCategories.length && searchTerm">
          {{ 'restaurantDetail.menuSearchEmpty' | translate: 'No menu items match your search.' }}
        </div>
      </ng-container>

      <ng-container *ngIf="menuItemModal() as menuItemContext">
        <div class="modal-backdrop" (click)="closeMenuItemModal()">
          <div
            class="modal menu-item-modal"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'menu-item-modal-title-' + menuItemContext.item.id"
            [attr.aria-describedby]="'menu-item-modal-description-' + menuItemContext.item.id"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              class="modal-close-button"
              (click)="closeMenuItemModal()"
              [attr.aria-label]="'restaurantDetail.infoModalClose' | translate: 'Close'"
            >
              <span aria-hidden="true">×</span>
            </button>
            <div *ngIf="menuItemContext.item.photos?.length">
              <app-menu-item-photo-slider
                [photos]="menuItemContext.item.photos"
                [itemName]="menuItemContext.item.name"
              ></app-menu-item-photo-slider>
            </div>
            <h3 id="menu-item-modal-title-{{ menuItemContext.item.id }}">
              {{ menuItemContext.item.name }}
            </h3>
            <div class="price-group" *ngIf="hasDiscount(menuItemContext.item); else modalRegularPrice">
              <span class="price discounted">
                {{ (getCurrentPriceCents(menuItemContext.item) / 100) | currency:'EUR' }}
              </span>
              <span class="price original">
                {{ (menuItemContext.item.price_cents / 100) | currency:'EUR' }}
              </span>
              <span class="discount-pill">
                {{ 'restaurantDetail.discountBadge' | translate: 'Special offer' }}
              </span>
            </div>
            <ng-template #modalRegularPrice>
              <span class="price">{{ (menuItemContext.item.price_cents / 100) | currency:'EUR' }}</span>
            </ng-template>
            <p id="menu-item-modal-description-{{ menuItemContext.item.id }}">
              {{
                menuItemContext.item.description ||
                  ('restaurantDetail.customerFavourite' | translate: 'Customer favourite')
              }}
            </p>
            <div *ngIf="menuItemContext.item.allergens?.length">
              <h4>{{ 'restaurantDetail.menuItemAllergensHeading' | translate: 'Allergens' }}</h4>
              <div class="allergen-badges">
                <ng-container *ngFor="let allergen of menuItemContext.item.allergens">
                  <ng-container *ngIf="resolveAllergenLabel(allergen) as allergenLabel">
                    <span class="badge">
                      <app-allergen-icon [allergen]="allergen"></app-allergen-icon>
                      <span>{{ allergenLabel }}</span>
                    </span>
                  </ng-container>
                </ng-container>
              </div>
            </div>
            <div class="modal-actions">
              <div class="quantity-controls" role="group" aria-label="{{ 'cart.quantity' | translate: 'Quantity' }}">
                <button
                  type="button"
                  class="quantity-button"
                  (click)="changeQuantity(menuItemContext.item.id, -1)"
                  [disabled]="getQuantity(menuItemContext.item.id) === 1"
                  [attr.aria-label]="'cart.decrease' | translate: 'Decrease quantity'"
                >
                  −
                </button>
                <span class="quantity-display" aria-live="polite">{{ getQuantity(menuItemContext.item.id) }}</span>
                <button
                  type="button"
                  class="quantity-button"
                  (click)="changeQuantity(menuItemContext.item.id, 1)"
                  [attr.aria-label]="'cart.increase' | translate: 'Increase quantity'"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                class="modal-button primary"
                (click)="addMenuItemToCartFromModal(menuItemContext, $event)"
              >
                {{ 'restaurantDetail.addToCart' | translate: 'Add to cart' }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="infoModalOpen()">
        <div class="modal-backdrop" (click)="closeInfoModal()">
          <div
            class="modal info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-info-modal-title"
            aria-describedby="restaurant-info-modal-description"
            (click)="$event.stopPropagation()"
          >
            <div class="info-modal-body">
              <h3 id="restaurant-info-modal-title">{{ getRestaurantName(r) }}</h3>
              <p id="restaurant-info-modal-description" class="info-modal-description">
                {{ getRestaurantDescription(r) }}
              </p>
              <section class="info-modal-section">
                <h4>{{ 'restaurantDetail.counterLocationTitle' | translate: 'Counter location' }}</h4>
                <ng-container *ngIf="counterLocationVm$ | async as counterLocation; else counterLocationEmpty">
                  <p class="info-location-name">
                    {{ getCounterLocationDisplayName(counterLocation, r) }}
                  </p>
                  <ng-container *ngIf="counterLocation.hasDetails; else counterLocationEmpty">
                    <dl class="info-location-details">
                      <div *ngIf="counterLocation.telephone as telephone">
                        <dt>{{ 'restaurantDetail.counterLocationPhone' | translate: 'Telephone' }}</dt>
                        <dd><a [href]="buildTelephoneLink(telephone)">{{ telephone }}</a></dd>
                      </div>
                      <div *ngIf="counterLocation.email as email">
                        <dt>{{ 'restaurantDetail.counterLocationEmail' | translate: 'Email' }}</dt>
                        <dd><a [href]="buildEmailLink(email)">{{ email }}</a></dd>
                      </div>
                      <div *ngIf="counterLocation.addressLines.length">
                        <dt>{{ 'restaurantDetail.counterLocationAddress' | translate: 'Address' }}</dt>
                        <dd>
                          <div *ngFor="let line of counterLocation.addressLines">{{ line }}</div>
                        </dd>
                      </div>
                      <div *ngIf="counterLocation.mapUrl as mapUrl">
                        <dt>{{ 'restaurantDetail.counterLocationMapLabel' | translate: 'Map view' }}</dt>
                        <dd>
                          <div class="info-location-map">
                            <iframe
                              [src]="mapUrl"
                              loading="lazy"
                              referrerpolicy="no-referrer-when-downgrade"
                              title="{{ 'restaurantDetail.counterLocationTitle' | translate: 'Counter location' }}"
                            ></iframe>
                            <a
                              class="map-link"
                              [href]="buildMapLink(counterLocation.location)"
                              target="_blank"
                              rel="noopener"
                            >
                              {{ 'restaurantDetail.counterLocationDirections' | translate: 'Open in OpenStreetMap' }}
                            </a>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </ng-container>
                </ng-container>
              </section>
            </div>
            <div class="modal-actions">
              <button type="button" class="modal-button primary" (click)="closeInfoModal()">
                {{ 'restaurantDetail.infoModalClose' | translate: 'Close' }}
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #counterLocationEmpty>
        <p class="info-modal-empty">
          {{
            'restaurantDetail.counterLocationUnavailable'
              | translate: 'Counter location details are not available.'
          }}
        </p>
      </ng-template>

    </ng-container>

    <div class="cart-flight-layer" aria-hidden="true">
      <div
        class="cart-flight"
        *ngFor="let flight of cartFlights()"
        [style.--start-x]="flight.startX + 'px'"
        [style.--start-y]="flight.startY + 'px'"
        [style.--delta-x]="flight.deltaX + 'px'"
        [style.--delta-y]="flight.deltaY + 'px'"
        [style.--arc-height]="flight.arcHeight + 'px'"
      >
        <span class="cart-flight-badge">+{{ flight.quantity }}</span>
      </div>
    </div>

    <ng-container *ngIf="restaurantMismatchState() as mismatch">
      <div class="modal-backdrop" (click)="dismissRestaurantMismatch()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-mismatch-title"
          aria-describedby="cart-mismatch-description"
          (click)="$event.stopPropagation()"
        >
          <h3 id="cart-mismatch-title">
            {{ 'cart.newOrderConfirmTitle' | translate: 'Start a new order?' }}
          </h3>
          <p id="cart-mismatch-description">
            {{
              'cart.newOrderConfirmMessage'
                | translate
                  : 'Your cart has items from {{current}}. Empty the cart and start a new order with {{next}}?'
                  : { current: mismatch.currentRestaurantName, next: mismatch.incomingRestaurantName }
            }}
          </p>
          <div class="modal-actions">
            <button type="button" class="modal-button secondary" (click)="dismissRestaurantMismatch()">
              {{ 'cart.newOrderConfirmCancel' | translate: 'Keep current order' }}
            </button>
            <button type="button" class="modal-button primary" (click)="confirmRestaurantMismatch()">
              {{ 'cart.newOrderConfirmAccept' | translate: 'Start new order' }}
            </button>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class RestaurantDetailPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private menuSvc = inject(MenuService);
  private rSvc = inject(RestaurantService);
  private cart = inject(CartService);
  private document = inject(DOCUMENT);
  private i18n = inject(TranslationService);
  private cards = inject(CardService);
  private cardSpotlight = inject(CardSpotlightService);
  private brandColor = inject(BrandColorService);
  private locations = inject(LocationService);
  private sanitizer = inject(DomSanitizer);
  private highlightMenuItemId$ = this.route.queryParamMap.pipe(
    map(params => this.parseHighlightParam(params.get('highlightItem'))),
    startWith(this.parseHighlightParam(this.route.snapshot.queryParamMap.get('highlightItem')))
  );
  private highlightMenuItemId: number | null = null;
  private highlightScrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private highlightRetryTimeout: ReturnType<typeof setTimeout> | null = null;
  private nextCartFlightId = 0;
  private cartFlightTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  id = Number(this.route.snapshot.paramMap.get('id'));
  restaurant$: Observable<Restaurant> = this.rSvc.get(this.id).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  private searchTerm$ = new BehaviorSubject<string>('');
  menuCategories$: Observable<MenuCategoryGroup[]> = this.createMenuCategoriesStream();
  searchTerm = '';
  menuItemModal = signal<MenuItemModalContext | null>(null);
  infoModalOpen = signal(false);
  counterLocationVm$: Observable<CounterLocationViewModel | null> = this.locations.listForRestaurant(this.id).pipe(
    map(locations => this.pickCounterLocation(locations)),
    map(location => (location ? this.buildCounterLocationVm(location) : null)),
    catchError(() => {
      return of(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  defaultHeroBackground =
    'linear-gradient(135deg, color-mix(in srgb, var(--brand-green) 32%, transparent), color-mix(in srgb, var(--brand-green) 68%, black))';
  heroBackground$: Observable<string> = this.restaurant$.pipe(
    switchMap(restaurant => {
      const photos = restaurant.photos?.map(photo => photo.url).filter(Boolean) ?? [];

      if (!photos.length) {
        return of(this.defaultHeroBackground);
      }

      return timer(0, 6000).pipe(
        map(index => `linear-gradient(140deg, rgba(4, 24, 16, 0.78), rgba(4, 47, 26, 0.45)), url('${photos[index % photos.length]}')`)
      );
    }),
    startWith(this.defaultHeroBackground)
  );

  private readonly restaurantSummaryLength = 160;
  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  private restaurantMismatchContext = signal<PendingCartAddition | null>(null);
  restaurantMismatchState = computed(() => this.restaurantMismatchContext());
  private bodyOverflowBackup: string | null = null;
  private modalLockCount = 0;
  private itemQuantities = signal<Record<number, number>>({});
  cartFlights = signal<CartFlightAnimation[]>([]);

  constructor() {
    this.restaurant$
      .pipe(
        takeUntilDestroyed(),
        switchMap(restaurant =>
          this.cards
            .findForRestaurant(restaurant.id, restaurant.chain?.id ?? restaurant.chain_id ?? null)
            .pipe(map(card => ({ restaurant, card })))
        )
      )
      .subscribe(({ restaurant, card }) => {
        if (card) {
          this.cardSpotlight.set(this.presentSpotlightEntry(restaurant, card));
        } else {
          this.cardSpotlight.clear();
        }

        this.brandColor.setOverride(restaurant.primary_color ?? null);
      });

    let initial = true;
    effect(() => {
      this.i18n.languageSignal();
      if (initial) {
        initial = false;
        return;
      }
      this.refreshMenu();
    });
  }

  ngOnDestroy(): void {
    this.brandColor.reset();
    this.cardSpotlight.clear();
    if (this.highlightScrollTimeout) {
      clearTimeout(this.highlightScrollTimeout);
      this.highlightScrollTimeout = null;
    }
    if (this.highlightRetryTimeout) {
      clearTimeout(this.highlightRetryTimeout);
      this.highlightRetryTimeout = null;
    }
    this.cartFlightTimeouts.forEach(timeout => clearTimeout(timeout));
    this.cartFlightTimeouts.clear();
    this.cartFlights.set([]);
    this.unlockBodyScroll();
    this.searchTerm$.complete();
    if (this.menuItemModal()) {
      this.closeMenuItemModal();
    }
    if (this.infoModalOpen()) {
      this.closeInfoModal();
    }
    if (this.restaurantMismatchContext()) {
      this.closeRestaurantMismatchModal();
    }
    while (this.modalLockCount > 0) {
      this.unlockBodyScroll();
    }
  }

  onPhotoSelection(files: FileList | null) {
    this.selectedPhotos = files ? Array.from(files) : [];
    this.statusMessage = '';
    this.statusType = '';
  }

  async uploadPhotos() {
    if (!this.selectedPhotos.length || this.uploading) { return; }

    this.uploading = true;
    this.statusMessage = '';
    this.statusType = '';

    try {
      await firstValueFrom(this.rSvc.uploadPhotos(this.id, this.selectedPhotos));
      this.selectedPhotos = [];
      this.statusMessage = this.i18n.translate(
        'restaurantDetail.photosUploaded',
        'Photos uploaded successfully!'
      );
      this.statusType = 'success';
      this.restaurant$ = this.rSvc.get(this.id);
      this.refreshMenu();
    } catch (err) {
      console.error(err);
      this.statusMessage = this.i18n.translate(
        'restaurantDetail.photosError',
        'Something went wrong while uploading photos. Please try again.'
      );
      this.statusType = 'error';
    } finally {
      this.uploading = false;
    }
  }

  refreshMenu() {
    this.menuCategories$ = this.createMenuCategoriesStream();
  }

  onSearchTermChange(value: string) {
    const term = value ?? '';
    this.searchTerm = term;
    this.searchTerm$.next(term);
  }

  private createMenuCategoriesStream(): Observable<MenuCategoryGroup[]> {
    return combineLatest([
      this.menuSvc.listByRestaurant(this.id).pipe(map(items => this.organizeMenu(items))),
      this.highlightMenuItemId$,
      this.searchTerm$.pipe(map(term => term.trim().toLowerCase())),
    ]).pipe(
      tap(([, highlightId]) => {
        this.highlightMenuItemId = highlightId;
        if (highlightId != null) {
          this.scheduleHighlightScroll(highlightId);
        }
      }),
      map(([categories, _highlightId, searchTerm]) => {
        if (!searchTerm) {
          return categories;
        }

        return categories
          .map(category => ({
            ...category,
            items: category.items.filter(item => this.matchesSearchTerm(item, searchTerm)),
          }))
          .filter(category => category.items.length);
      })
    );
  }

  private matchesSearchTerm(item: MenuItem, searchTerm: string): boolean {
    if (!searchTerm) {
      return true;
    }

    const values = [item.name, item.description]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map(value => value.toLowerCase());

    return values.some(value => value.includes(searchTerm));
  }

  hasDiscount(item: MenuItem): boolean {
    const discounted = item.discounted_price_cents;
    return typeof discounted === 'number' && discounted >= 0 && discounted < item.price_cents;
  }

  getPrimaryPhotoUrl(item: MenuItem): string | null {
    const photos = item.photos;
    if (!photos?.length) {
      return null;
    }

    for (const photo of photos) {
      const url = photo?.url;
      if (url) {
        return url;
      }
    }

    return null;
  }

  getCurrentPriceCents(item: MenuItem): number {
    const discounted = item.discounted_price_cents;
    if (typeof discounted === 'number' && discounted >= 0) {
      return discounted;
    }

    return item.price_cents;
  }

  getQuantity(itemId: number): number {
    return this.itemQuantities()[itemId] ?? 1;
  }

  changeQuantity(itemId: number, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    this.itemQuantities.update(current => {
      const next = { ...current };
      const existing = next[itemId] ?? 1;
      const updated = Math.max(1, existing + Math.trunc(delta));

      if (updated === 1) {
        delete next[itemId];
      } else {
        next[itemId] = updated;
      }

      return next;
    });
  }

  private resetQuantity(itemId: number) {
    this.itemQuantities.update(current => {
      if (!(itemId in current)) {
        return current;
      }

      const { [itemId]: _removed, ...rest } = current;
      return rest;
    });
  }

  addToCart(
    item: MenuItem,
    category: CartCategorySelection | null,
    restaurant: Restaurant,
    quantity: number,
    event?: Event
  ) {
    const triggerRect = this.resolveTriggerRect(event);
    const cartRestaurant = this.cart.restaurant();
    const incomingRestaurantName = this.getRestaurantName(restaurant);
    const incomingRestaurant: CartRestaurant = {
      id: restaurant.id,
      name: incomingRestaurantName,
      primaryColor: restaurant.primary_color ?? null,
    };

    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      const currentName =
        cartRestaurant.name || this.i18n.translate('cart.restaurantFallback', 'this restaurant');

      this.openRestaurantMismatchModal({
        item,
        category: category ?? null,
        incomingRestaurant,
        currentRestaurantName: currentName,
        incomingRestaurantName,
        quantity,
      });

      return;
    }

    this.cart.add(item, category, incomingRestaurant, quantity);
    this.resetQuantity(item.id);
    if (triggerRect) {
      this.launchCartFlight(quantity, triggerRect);
    }
  }

  openMenuItemModal(item: MenuItem, group: MenuCategoryGroup, restaurant: Restaurant) {
    const alreadyOpen = this.menuItemModal() !== null;
    this.menuItemModal.set({
      item,
      category: this.resolveCartCategory(group, item),
      restaurant,
    });

    if (!alreadyOpen) {
      this.lockBodyScroll();
    }
  }

  closeMenuItemModal() {
    if (!this.menuItemModal()) {
      return;
    }

    this.menuItemModal.set(null);
    this.unlockBodyScroll();
  }

  addMenuItemToCartFromModal(context: MenuItemModalContext, event: Event) {
    this.addToCart(context.item, context.category, context.restaurant, this.getQuantity(context.item.id), event);
    this.closeMenuItemModal();
  }

  confirmRestaurantMismatch() {
    const pending = this.restaurantMismatchContext();
    if (!pending) {
      return;
    }

    this.cart.clear();
    this.cart.add(
      pending.item,
      pending.category,
      pending.incomingRestaurant,
      pending.quantity
    );
    this.resetQuantity(pending.item.id);
    this.closeRestaurantMismatchModal();
  }

  dismissRestaurantMismatch() {
    this.closeRestaurantMismatchModal();
  }

  private resolveTriggerRect(event?: Event): DOMRect | null {
    if (!event) {
      return null;
    }

    const target = event.currentTarget;
    if (target instanceof Element) {
      return target.getBoundingClientRect();
    }

    return null;
  }

  private launchCartFlight(quantity: number, triggerRect: DOMRect) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    const targetRect = this.getCartTargetRect();
    if (!targetRect) {
      return;
    }

    const badgeSize = 36;
    const startX = triggerRect.left + triggerRect.width / 2 - badgeSize / 2;
    const startY = triggerRect.top + triggerRect.height / 2 - badgeSize / 2;
    const endX = targetRect.left + targetRect.width / 2 - badgeSize / 2;
    const endY = targetRect.top + targetRect.height / 2 - badgeSize / 2;
    const id = ++this.nextCartFlightId;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.hypot(deltaX, deltaY);
    const arcHeight = Math.min(280, Math.max(110, distance * 0.42));

    const flight: CartFlightAnimation = {
      id,
      quantity,
      startX,
      startY,
      deltaX,
      deltaY,
      arcHeight,
    };

    this.cartFlights.update(current => [...current, flight]);

    const timeout = setTimeout(() => {
      this.cartFlights.update(current => current.filter(entry => entry.id !== id));
      this.cartFlightTimeouts.delete(id);
    }, 1150);

    this.cartFlightTimeouts.set(id, timeout);
  }

  private getCartTargetRect(): DOMRect | null {
    const cartElement = this.document.querySelector('.cart-pill');
    if (cartElement instanceof HTMLElement) {
      const rect = cartElement.getBoundingClientRect();
      if (rect.width || rect.height) {
        return rect;
      }
    }

    return null;
  }

  private openRestaurantMismatchModal(context: PendingCartAddition) {
    this.restaurantMismatchContext.set(context);
    this.lockBodyScroll();
  }

  private closeRestaurantMismatchModal() {
    if (this.restaurantMismatchContext()) {
      this.restaurantMismatchContext.set(null);
    }
    this.unlockBodyScroll();
  }

  private lockBodyScroll() {
    if (this.modalLockCount === 0) {
      const currentOverflow = this.document.body.style.overflow;
      this.bodyOverflowBackup = currentOverflow ?? '';
      this.document.body.style.overflow = 'hidden';
    }

    this.modalLockCount++;
  }

  private unlockBodyScroll() {
    if (this.modalLockCount === 0) {
      return;
    }

    this.modalLockCount--;

    if (this.modalLockCount === 0) {
      if (this.bodyOverflowBackup && this.bodyOverflowBackup.length) {
        this.document.body.style.overflow = this.bodyOverflowBackup;
      } else {
        this.document.body.style.removeProperty('overflow');
      }
      this.bodyOverflowBackup = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (this.menuItemModal()) {
      event.preventDefault();
      this.closeMenuItemModal();
      return;
    }

    if (this.infoModalOpen()) {
      event.preventDefault();
      this.closeInfoModal();
      return;
    }

    if (this.restaurantMismatchContext()) {
      event.preventDefault();
      this.dismissRestaurantMismatch();
    }
  }

  openInfoModal() {
    if (this.infoModalOpen()) {
      return;
    }

    this.infoModalOpen.set(true);
    this.lockBodyScroll();
  }

  closeInfoModal() {
    if (!this.infoModalOpen()) {
      return;
    }

    this.infoModalOpen.set(false);
    this.unlockBodyScroll();
  }

  scrollTo(anchor: string) {
    this.document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getMenuItemAnchor(item: MenuItem): string {
    return this.buildMenuItemAnchorById(item.id);
  }

  resolveCartCategory(group: MenuCategoryGroup, item: MenuItem): CartCategorySelection | null {
    if (group.cartCategoriesByItemId) {
      const key = item.id;
      if (Object.prototype.hasOwnProperty.call(group.cartCategoriesByItemId, key)) {
        return group.cartCategoriesByItemId[key] ?? null;
      }
    }

    return group.cartCategory ?? null;
  }

  shouldHighlightMenuItem(item: MenuItem): boolean {
    return this.highlightMenuItemId === item.id || this.isHighlightedMenuItem(item);
  }

  private isHighlightedMenuItem(item: MenuItem): boolean {
    return Boolean(item.is_highlighted);
  }

  private scheduleHighlightScroll(menuItemId: number) {
    if (this.highlightScrollTimeout) {
      clearTimeout(this.highlightScrollTimeout);
      this.highlightScrollTimeout = null;
    }

    this.highlightScrollTimeout = setTimeout(() => {
      this.highlightScrollTimeout = null;
      this.tryScrollToMenuItem(menuItemId);
    }, 120);
  }

  private tryScrollToMenuItem(menuItemId: number, attempt = 0) {
    const anchor = this.buildMenuItemAnchorById(menuItemId);
    const target = this.document.getElementById(anchor);

    if (!target) {
      if (attempt < 5) {
        if (this.highlightRetryTimeout) {
          clearTimeout(this.highlightRetryTimeout);
        }
        this.highlightRetryTimeout = setTimeout(() => {
          this.highlightRetryTimeout = null;
          this.tryScrollToMenuItem(menuItemId, attempt + 1);
        }, 150);
      }
      return;
    }

    if (this.highlightRetryTimeout) {
      clearTimeout(this.highlightRetryTimeout);
      this.highlightRetryTimeout = null;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private parseHighlightParam(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private buildMenuItemAnchorById(id: number): string {
    return `menu-item-${id}`;
  }

  getRestaurantName(restaurant: Restaurant): string {
    return this.resolveRestaurantField(restaurant.name, restaurant.name_translations) || restaurant.name;
  }

  getRestaurantCuisines(restaurant: Restaurant): string[] | undefined {
    return normalizeRestaurantCuisines(restaurant.cuisines);
  }

  getRestaurantDescription(restaurant: Restaurant): string {
    const resolved = this.resolveRestaurantField(restaurant.description, restaurant.description_translations);
    return (
      resolved ||
      this.i18n.translate('restaurantDetail.descriptionFallback', 'Fresh meals, crafted for delivery.')
    );
  }

  getRestaurantSummary(restaurant: Restaurant): string {
    const description = this.getRestaurantDescription(restaurant).trim();

    if (description.length <= this.restaurantSummaryLength) {
      return description;
    }

    const truncated = description.slice(0, this.restaurantSummaryLength);
    const lastWhitespace = truncated.lastIndexOf(' ');
    const base = lastWhitespace > 60 ? truncated.slice(0, lastWhitespace) : truncated;
    const sanitized = base.replace(/[\s,.;:!\-]+$/u, '').trimEnd();

    return `${sanitized.length ? sanitized : truncated.trimEnd()}…`;
  }

  getInfoButtonLabel(restaurant: Restaurant): string {
    return this.i18n.translate(
      'restaurantDetail.infoButtonLabel',
      'More information about {{name}}',
      { name: this.getRestaurantName(restaurant) }
    );
  }

  getCounterLocationDisplayName(counterLocation: CounterLocationViewModel, restaurant: Restaurant): string {
    const name = counterLocation.location.name?.trim();
    return name && name.length ? name : this.getRestaurantName(restaurant);
  }

  private presentSpotlightEntry(restaurant: Restaurant, card: Card): CardSpotlightEntry {
    const type: 'restaurant' | 'chain' = card.chain_id || card.chain ? 'chain' : 'restaurant';
    const restaurantName = this.getRestaurantName(restaurant);
    const preferredTitle =
      (type === 'chain' ? card.chain?.name : card.restaurant?.name) ??
      card.restaurant?.name ??
      restaurantName ??
      'Loyalty card';
    const title = preferredTitle.trim() || 'Loyalty card';

    return {
      id: card.id,
      type,
      title,
      subtitle: type === 'chain' ? restaurantName : null,
      loyaltyPoints: card.loyalty_points,
      creditCents: card.credit_cents,
      heroPhoto: this.pickSpotlightHeroPhoto(restaurant),
      placeholderInitial: this.buildSpotlightInitial(title),
      linkCommands: this.buildSpotlightLinkCommands(type, card, restaurant),
    };
  }

  private buildSpotlightLinkCommands(
    type: 'restaurant' | 'chain',
    card: Card,
    restaurant: Restaurant
  ): (string | number)[] | null {
    const restaurantId = card.restaurant_id ?? card.restaurant?.id ?? restaurant.id ?? null;
    const chainId = card.chain_id ?? card.chain?.id ?? restaurant.chain?.id ?? restaurant.chain_id ?? null;

    if (type === 'chain' && chainId != null) {
      return ['/chains', chainId];
    }

    if (restaurantId != null) {
      return ['/restaurants', restaurantId];
    }

    if (chainId != null) {
      return ['/chains', chainId];
    }

    return null;
  }

  private pickSpotlightHeroPhoto(restaurant: Restaurant): string | null {
    const candidates: string[] = [];

    if (restaurant.photos?.length) {
      candidates.push(...restaurant.photos.map(photo => photo.url).filter((url): url is string => Boolean(url)));
    }

    if (restaurant.photo_urls?.length) {
      candidates.push(...restaurant.photo_urls.filter((url): url is string => Boolean(url)));
    }

    if (!candidates.length) {
      return null;
    }

    return candidates[0] ?? null;
  }

  private buildSpotlightInitial(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      return '?';
    }

    const [firstWord] = trimmed.split(/\s+/);
    return firstWord?.charAt(0).toUpperCase() ?? '?';
  }

  private organizeMenu(items: MenuItem[]): MenuCategoryGroup[] {
    const grouped = new Map<string, MenuCategoryGroup>();
    const fallback: MenuItem[] = [];
    const primaryCategoryByItem = new Map<number, CartCategorySelection | null>();

    items.forEach(item => {
      const categories = item.categories;

      if (categories?.length) {
        let assignedToCategory = false;

        categories.forEach(category => {
          const label = this.getCategoryLabel(category);

          if (!label) {
            return;
          }

          const key = category.id != null ? `id-${category.id}` : `name-${label.toLowerCase()}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              name: label,
              anchor: this.buildAnchor(category, label),
              items: [],
              cartCategory: { id: category.id ?? null, label },
            });
          }

          grouped.get(key)!.items.push(item);
          assignedToCategory = true;

          if (!primaryCategoryByItem.has(item.id)) {
            primaryCategoryByItem.set(item.id, { id: category.id ?? null, label });
          }
        });

        if (!assignedToCategory) {
          fallback.push(item);
          if (!primaryCategoryByItem.has(item.id)) {
            primaryCategoryByItem.set(item.id, null);
          }
        }
      } else {
        fallback.push(item);
        if (!primaryCategoryByItem.has(item.id)) {
          primaryCategoryByItem.set(item.id, null);
        }
      }
    });

    const result = Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));

    if (fallback.length) {
      result.push({
        name: this.i18n.translate('restaurants.otherItems', 'Other items'),
        anchor: 'category-uncategorized',
        items: fallback,
        cartCategory: null,
      });
    }

    const highlightedItems = items.filter(item => this.isHighlightedMenuItem(item));

    console.log(highlightedItems);
    
    if (highlightedItems.length) {
      const cartCategoriesByItemId: Record<number, CartCategorySelection | null> = {};

      highlightedItems.forEach(item => {
        const selection = primaryCategoryByItem.has(item.id)
          ? primaryCategoryByItem.get(item.id) ?? null
          : null;
        cartCategoriesByItemId[item.id] = selection;
      });

      result.unshift({
        name: this.i18n.translate('restaurantDetail.highlightedHeading', 'Highlights'),
        anchor: 'category-highlighted',
        items: highlightedItems,
        cartCategory: null,
        cartCategoriesByItemId,
      });
    }

    console.log(result);

    return result;
  }

  private resolveRestaurantField(
    fallback: string | undefined,
    translations: Record<string, string> | undefined
  ): string {
    if (translations && Object.keys(translations).length) {
      const localeCandidates = this.buildLocaleCandidates();

      for (const locale of localeCandidates) {
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

  private buildAnchor(category: NonNullable<MenuItem['categories']>[number], fallbackName: string) {
    if (category.id != null) {
      return `category-${category.id}`;
    }

    const base = fallbackName ?? '';
    const slug = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `category-${slug || 'general'}`;
  }

  private getCategoryLabel(category: NonNullable<MenuItem['categories']>[number]): string | null {
    if (!category) {
      return null;
    }

    const directName = category.name?.trim();
    if (directName) {
      return directName;
    }

    const translations = category.name_translations;
    if (!translations) {
      return null;
    }

    const localeCandidates = this.buildLocaleCandidates();

    for (const locale of localeCandidates) {
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

    return null;
  }

  resolveAllergenLabel(allergen: Allergen | undefined): string {
    if (!allergen) {
      return '';
    }

    const direct = allergen.name?.trim();
    if (direct) {
      return direct;
    }

    const translations = allergen.name_translations;
    if (translations) {
      const localeCandidates = this.buildLocaleCandidates();

      for (const locale of localeCandidates) {
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

    return '';
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

  buildTelephoneLink(telephone: string): string {
    const normalized = telephone.replace(/[^0-9+]/g, '');
    return `tel:${normalized}`;
  }

  buildEmailLink(email: string): string {
    return `mailto:${email.trim()}`;
  }

  buildMapLink(location: Location): string {
    const latitude = this.parseCoordinate(location.latitude);
    const longitude = this.parseCoordinate(location.longitude);
    if (latitude != null && longitude != null) {
      const lat = latitude.toFixed(6);
      const lon = longitude.toFixed(6);
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
    }

    const parts = [
      location.address_line1,
      location.address_line2,
      location.postal_code,
      location.city,
      location.state,
      location.country,
      location.name,
    ]
      .map(part => part?.trim())
      .filter((part): part is string => Boolean(part));

    const query = parts.join(', ');
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
  }

  private pickCounterLocation(locations: Location[]): Location | null {
    if (!locations.length) {
      return null;
    }

    const normalized = (value: string | null | undefined) => value?.toLowerCase().trim() ?? '';

    const preferredOrder = ['counter', 'pickup', 'takeaway'];

    for (const keyword of preferredOrder) {
      const match = locations.find(location => normalized(location.location_type).includes(keyword));
      if (match) {
        return match;
      }
    }

    return locations[0];
  }

  private buildCounterLocationVm(location: Location): CounterLocationViewModel {
    const telephone = this.extractLocationTelephone(location);
    const email = location.email?.trim() || null;
    const addressLines = this.buildAddressLines(location);
    const mapUrl = this.buildMapUrl(location);
    const hasDetails =
      Boolean(telephone) ||
      Boolean(email) ||
      addressLines.length > 0 ||
      mapUrl !== null;
    const openingHours = this.getLocationOpeningHours(location);
    const openingHourExceptions = this.getLocationOpeningHourExceptions(location);
    const now = new Date();
    const weeklySchedule = this.buildWeeklySchedule(openingHours);
    const exceptionsByDate = this.buildExceptionMap(openingHourExceptions);
    const status = this.buildCounterLocationStatus(now, weeklySchedule, exceptionsByDate);
    const schedule = this.buildCounterLocationScheduleEntries(weeklySchedule, exceptionsByDate, now);
    const exceptions = this.buildCounterLocationExceptionEntries(openingHourExceptions, now);
    const currentTimeLabel = this.buildCurrentTimeLabel(now);

    return {
      location,
      telephone,
      email,
      addressLines,
      mapUrl,
      hasDetails,
      status,
      currentTimeLabel,
      schedule,
      exceptions,
    };
  }

  private getLocationOpeningHours(location: Location): LocationOpeningHour[] {
    const record = location as Location & { opening_hours?: LocationOpeningHour[] | null };
    return Array.isArray(record.opening_hours) ? record.opening_hours.filter(Boolean) : [];
  }

  private getLocationOpeningHourExceptions(location: Location): LocationOpeningHourException[] {
    const record = location as Location & { opening_hour_exceptions?: LocationOpeningHourException[] | null };
    return Array.isArray(record.opening_hour_exceptions)
      ? record.opening_hour_exceptions.filter(Boolean)
      : [];
  }

  private buildWeeklySchedule(hours: LocationOpeningHour[]): Map<number, OpeningInterval[]> {
    const schedule = new Map<number, OpeningInterval[]>();

    for (const hour of hours) {
      const dayOfWeek = typeof hour.day_of_week === 'number' ? hour.day_of_week : Number(hour.day_of_week);
      if (!Number.isInteger(dayOfWeek)) {
        continue;
      }

      const opens = this.parseTimeToMinutes(hour.opens_at);
      const closes = this.parseTimeToMinutes(hour.closes_at);
      if (opens === null || closes === null) {
        continue;
      }

      const intervals = schedule.get(dayOfWeek) ?? [];
      intervals.push({ openMinutes: opens, closeMinutes: closes });
      schedule.set(dayOfWeek, intervals);
    }

    for (const intervals of schedule.values()) {
      intervals.sort((a, b) => a.openMinutes - b.openMinutes);
    }

    return schedule;
  }

  private buildExceptionMap(
    exceptions: LocationOpeningHourException[]
  ): Map<string, LocationOpeningHourException> {
    const map = new Map<string, LocationOpeningHourException>();
    for (const exception of exceptions) {
      if (exception?.date) {
        map.set(exception.date, exception);
      }
    }
    return map;
  }

  private buildCounterLocationStatus(
    now: Date,
    weeklySchedule: Map<number, OpeningInterval[]>,
    exceptions: Map<string, LocationOpeningHourException>
  ): CounterLocationStatusViewModel | null {
    const upcomingIntervals = this.buildUpcomingIntervals(now, weeklySchedule, exceptions);
    if (!upcomingIntervals.length) {
      return null;
    }

    const nowTime = now.getTime();
    const currentInterval = upcomingIntervals.find(
      interval => interval.start.getTime() <= nowTime && nowTime < interval.end.getTime()
    );

    const closingSoonThresholdMs = 45 * 60 * 1000;
    const openingSoonThresholdMs = 60 * 60 * 1000;

    if (currentInterval) {
      const timeUntilClose = currentInterval.end.getTime() - nowTime;
      const closeLabel = this.formatTimeFromDate(currentInterval.end);
      const detail = this.i18n.translate(
        'restaurantDetail.status.openUntil',
        'Open until {{time}}',
        { time: closeLabel }
      );
      const isClosingSoon = timeUntilClose <= closingSoonThresholdMs;
      const headlineKey = isClosingSoon
        ? 'restaurantDetail.status.closingSoon'
        : 'restaurantDetail.status.openNow';
      const headline = this.i18n.translate(
        headlineKey,
        isClosingSoon ? 'Closing soon' : 'Open now'
      );

      return {
        state: isClosingSoon ? 'closingSoon' : 'open',
        headline,
        detail,
      };
    }

    const nextInterval = upcomingIntervals.find(interval => interval.start.getTime() > nowTime);
    if (!nextInterval) {
      const headline = this.i18n.translate('restaurantDetail.status.closed', 'Closed now');
      return { state: 'closed', headline, detail: null };
    }

    const timeUntilOpen = nextInterval.start.getTime() - nowTime;
    const openLabel = this.formatTimeFromDate(nextInterval.start);
    const dayDiff = this.diffInDays(nextInterval.start, now);
    let detail: string;

    if (dayDiff === 0) {
      detail = this.i18n.translate('restaurantDetail.status.opensAt', 'Opens at {{time}}', {
        time: openLabel,
      });
    } else if (dayDiff === 1) {
      detail = this.i18n.translate(
        'restaurantDetail.status.opensTomorrow',
        'Opens tomorrow at {{time}}',
        { time: openLabel }
      );
    } else {
      const dayLabel = this.getWeekdayLabel(nextInterval.dayOfWeek);
      detail = this.i18n.translate(
        'restaurantDetail.status.opensOnDay',
        'Opens {{day}} at {{time}}',
        { day: dayLabel, time: openLabel }
      );
    }

    const isOpeningSoon = timeUntilOpen <= openingSoonThresholdMs;
    const headlineKey = isOpeningSoon
      ? 'restaurantDetail.status.openingSoon'
      : 'restaurantDetail.status.closed';
    const headline = this.i18n.translate(
      headlineKey,
      isOpeningSoon ? 'Opening soon' : 'Closed now'
    );

    return {
      state: isOpeningSoon ? 'openingSoon' : 'closed',
      headline,
      detail,
    };
  }

  private buildCounterLocationScheduleEntries(
    weeklySchedule: Map<number, OpeningInterval[]>,
    exceptions: Map<string, LocationOpeningHourException>,
    now: Date
  ): CounterLocationScheduleEntry[] {
    const entries: CounterLocationScheduleEntry[] = [];
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    const todayDay = now.getUTCDay();
    const todayKey = this.formatDateKey(now);
    const todayException = exceptions.get(todayKey) ?? null;
    const specialInterval = todayException ? this.convertExceptionToInterval(todayException) : null;

    for (const day of dayOrder) {
      const baseIntervals = weeklySchedule.get(day) ?? [];
      let intervals: OpeningInterval[] = baseIntervals;
      let exceptionLabel: string | null = null;

      if (day === todayDay && todayException) {
        if (todayException.closed || (!todayException.starts_at && !todayException.ends_at)) {
          intervals = [];
          exceptionLabel = this.i18n.translate(
            'restaurantDetail.openingHoursExceptionClosedToday',
            'Closed today (exception)'
          );
        } else if (specialInterval) {
          intervals = [specialInterval];
          exceptionLabel = this.i18n.translate(
            'restaurantDetail.openingHoursExceptionSpecialToday',
            'Special hours today'
          );
        }
      }

      const intervalLabels = intervals.map(interval =>
        this.formatTimeRange(interval.openMinutes, interval.closeMinutes)
      );

      entries.push({
        dayLabel: this.getWeekdayLabel(day),
        intervals: intervalLabels,
        closed: intervalLabels.length === 0,
        isToday: day === todayDay,
        exceptionLabel,
      });
    }

    return entries;
  }

  private buildCounterLocationExceptionEntries(
    exceptions: LocationOpeningHourException[],
    now: Date
  ): CounterLocationExceptionEntry[] {
    if (!exceptions.length) {
      return [];
    }

    const startOfToday = this.startOfDayUtc(now);
    const items = exceptions
      .map(exception => ({ exception, date: this.parseDateKey(exception.date) }))
      .filter((item): item is { exception: LocationOpeningHourException; date: Date } => {
        return Boolean(item.date && item.date.getTime() >= startOfToday.getTime());
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return items.map(item => {
      const interval = this.convertExceptionToInterval(item.exception);
      const statusLabel = interval
        ? this.i18n.translate(
            'restaurantDetail.openingHoursExceptionOpen',
            'Open {{time}}',
            { time: this.formatTimeRange(interval.openMinutes, interval.closeMinutes) }
          )
        : this.i18n.translate('restaurantDetail.openingHoursExceptionClosed', 'Closed');
      const reasonLabel = item.exception.reason?.trim()
        ? this.i18n.translate(
            'restaurantDetail.openingHoursExceptionReason',
            'Reason: {{reason}}',
            { reason: item.exception.reason.trim() }
          )
        : null;

      return {
        dateLabel: this.formatExceptionDateLabel(item.date, now),
        statusLabel,
        reasonLabel,
      };
    });
  }

  private buildCurrentTimeLabel(now: Date): string {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const formatted = formatter.format(now);
    return this.i18n.translate('restaurantDetail.currentTime', 'Current time: {{time}}', {
      time: formatted,
    });
  }

  private buildUpcomingIntervals(
    now: Date,
    weeklySchedule: Map<number, OpeningInterval[]>,
    exceptions: Map<string, LocationOpeningHourException>
  ): ScheduledInterval[] {
    const intervals: ScheduledInterval[] = [];
    const searchDays = 14;
    const start = this.startOfDayUtc(now);

    for (let offset = -1; offset < searchDays; offset++) {
      const dayDate = this.addDays(start, offset);
      const dateKey = this.formatDateKey(dayDate);
      const exception = exceptions.get(dateKey) ?? null;
      let dayIntervals: OpeningInterval[] = [];

      if (exception) {
        const interval = this.convertExceptionToInterval(exception);
        if (interval && !exception.closed) {
          dayIntervals = [interval];
        } else {
          dayIntervals = [];
        }
      } else {
        dayIntervals = weeklySchedule.get(dayDate.getUTCDay()) ?? [];
      }

      for (const interval of dayIntervals) {
        const startDate = this.createDateWithMinutes(dayDate, interval.openMinutes);
        let endDate = this.createDateWithMinutes(dayDate, interval.closeMinutes);
        if (endDate.getTime() <= startDate.getTime()) {
          endDate = this.addDays(endDate, 1);
        }

        intervals.push({
          start: startDate,
          end: endDate,
          dateKey,
          dayOfWeek: dayDate.getUTCDay(),
          isException: Boolean(exception),
        });
      }
    }

    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
    return intervals;
  }

  private convertExceptionToInterval(
    exception: LocationOpeningHourException
  ): OpeningInterval | null {
    if (exception.closed) {
      return null;
    }

    const opens = this.parseTimeToMinutes(exception.starts_at);
    const closes = this.parseTimeToMinutes(exception.ends_at);

    if (opens === null || closes === null) {
      return null;
    }

    return { openMinutes: opens, closeMinutes: closes };
  }

  private parseTimeToMinutes(value: string | null | undefined): number | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  private formatTimeRange(openMinutes: number, closeMinutes: number): string {
    return `${this.formatTime(openMinutes)} – ${this.formatTime(closeMinutes)}`;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const reference = new Date(Date.UTC(2000, 0, 1, hours, mins));
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    return formatter.format(reference);
  }

  private formatTimeFromDate(date: Date): string {
    return this.formatTime(date.getUTCHours() * 60 + date.getUTCMinutes());
  }

  private formatDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateKey(key: string | null | undefined): Date | null {
    if (!key) {
      return null;
    }

    const parts = key.split('-').map(part => Number.parseInt(part, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }

    const [year, month, day] = parts;
    return new Date(Date.UTC(year, month - 1, day));
  }

  private startOfDayUtc(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private createDateWithMinutes(baseDate: Date, minutes: number): Date {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return new Date(
      Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), hours, mins)
    );
  }

  private diffInDays(target: Date, reference: Date): number {
    const targetStart = this.startOfDayUtc(target);
    const referenceStart = this.startOfDayUtc(reference);
    const diffMs = targetStart.getTime() - referenceStart.getTime();
    return Math.round(diffMs / (24 * 60 * 60 * 1000));
  }

  private formatExceptionDateLabel(date: Date, now: Date): string {
    const relativeLabel = this.describeRelativeDay(date, now);
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const formattedDate = dateFormatter.format(date);
    return relativeLabel ? `${relativeLabel} · ${formattedDate}` : formattedDate;
  }

  private describeRelativeDay(date: Date, now: Date): string | null {
    const dayDiff = this.diffInDays(date, now);

    if (dayDiff === 0) {
      return this.i18n.translate('restaurantDetail.day.today', 'Today');
    }

    if (dayDiff === 1) {
      return this.i18n.translate('restaurantDetail.day.tomorrow', 'Tomorrow');
    }

    return null;
  }

  private getWeekdayLabel(day: number): string {
    switch (day) {
      case 0:
        return this.i18n.translate('restaurantDetail.weekday.sunday', 'Sunday');
      case 1:
        return this.i18n.translate('restaurantDetail.weekday.monday', 'Monday');
      case 2:
        return this.i18n.translate('restaurantDetail.weekday.tuesday', 'Tuesday');
      case 3:
        return this.i18n.translate('restaurantDetail.weekday.wednesday', 'Wednesday');
      case 4:
        return this.i18n.translate('restaurantDetail.weekday.thursday', 'Thursday');
      case 5:
        return this.i18n.translate('restaurantDetail.weekday.friday', 'Friday');
      case 6:
        return this.i18n.translate('restaurantDetail.weekday.saturday', 'Saturday');
      default:
        return '';
    }
  }

  private buildAddressLines(location: Location): string[] {
    const lines: string[] = [];

    if (location.address_line1?.trim()) {
      lines.push(location.address_line1.trim());
    }

    if (location.address_line2?.trim()) {
      lines.push(location.address_line2.trim());
    }

    const cityLineParts: string[] = [];
    if (location.postal_code?.trim()) {
      cityLineParts.push(location.postal_code.trim());
    }
    if (location.city?.trim()) {
      cityLineParts.push(location.city.trim());
    }

    if (cityLineParts.length) {
      lines.push(cityLineParts.join(' '));
    }

    const regionParts: string[] = [];
    if (location.state?.trim()) {
      regionParts.push(location.state.trim());
    }
    if (location.country?.trim()) {
      regionParts.push(location.country.trim());
    }

    if (regionParts.length) {
      lines.push(regionParts.join(', '));
    }

    return lines;
  }

  private buildMapUrl(location: Location): SafeResourceUrl | null {
    const latitude = this.parseCoordinate(location.latitude);
    const longitude = this.parseCoordinate(location.longitude);
    if (latitude == null || longitude == null) {
      return null;
    }

    const lat = latitude;
    const lon = longitude;
    const delta = 0.01;
    const left = (lon - delta).toFixed(6);
    const right = (lon + delta).toFixed(6);
    const top = (lat + delta).toFixed(6);
    const bottom = (lat - delta).toFixed(6);
    const markerLat = lat.toFixed(6);
    const markerLon = lon.toFixed(6);
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${markerLat}%2C${markerLon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private extractLocationTelephone(location: Location): string | null {
    const telephoneRecord = location as Location & { telephone_number?: string | null };
    const telephone = location.telephone_number ?? telephoneRecord.telephone_number ?? null;

    if (typeof telephone !== 'string') {
      return null;
    }

    const trimmed = telephone.trim();
    return trimmed.length ? trimmed : null;
  }

  private parseCoordinate(value: number | string | null | undefined): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}
