import { Component, DestroyRef, HostListener, OnDestroy, effect, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import {
  AsyncPipe,
  CurrencyPipe,
  DecimalPipe,
  NgClass,
  NgIf,
  NgFor,
  NgStyle,
  DOCUMENT,
  TitleCasePipe,
} from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Allergen,
  Card,
  Location,
  LocationOpeningHour,
  LocationOpeningHourException,
  MenuItem,
  RatingSummary,
  Restaurant,
  Review,
  RatingInput,
} from '../core/models';
import {
  BehaviorSubject,
  Observable,
  catchError,
  combineLatest,
  finalize,
  firstValueFrom,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { CartCategorySelection, CartRestaurant, CartService } from '../cart/cart.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { RatingsService } from '../core/ratings.service';
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

type ReviewFormGroup = FormGroup<{
  rating: FormControl<number | null>;
  comment: FormControl<string>;
}>;

type ReviewStatus = 'success' | 'error' | '';

type MenuItemReviewState = {
  submitting: boolean;
  status: ReviewStatus;
};

type RatingSource = {
  rating_summary?: RatingSummary | null;
  rating_average?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  ratings_count?: number | null;
  total_ratings?: number | null;
  count?: number | null;
  reviews?: Review[] | null;
  ratings?: Review[] | null;
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
  state: 'open' | 'closed';
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
    DecimalPipe,
    NgClass,
    NgFor,
    NgIf,
    TranslatePipe,
    NgStyle,
    ReactiveFormsModule,
    MenuItemPhotoSliderComponent,
    AllergenIconComponent,
    TitleCasePipe,
  ],
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
            <ng-container *ngIf="getRestaurantRatingSource(r) as restaurantRating">
              <ng-container *ngIf="hasRatings(restaurantRating); else heroRatingEmpty">
                <span class="hero-rating">
                  <span aria-hidden="true">⭐</span>
                  <span class="value">{{ formatAverageRating(restaurantRating) }}</span>
                  <span class="count">{{ getRatingCountLabel(restaurantRating) }}</span>
                </span>
              </ng-container>
            </ng-container>
            <ng-template #heroRatingEmpty>
              <span class="hero-rating muted">
                {{ 'restaurantDetail.ratingNoReviews' | translate: 'No reviews yet' }}
              </span>
            </ng-template>
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
                  <div
                    class="hero-hours-exception"
                    *ngFor="let exception of counterLocation.exceptions"
                    [ngClass]="exception.state"
                  >
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
      <section class="reviews">
        <div class="reviews-header">
          <h3>{{ 'restaurantDetail.reviewsHeading' | translate: 'What people are saying' }}</h3>
          <ng-container *ngIf="getRestaurantRatingSource(r) as restaurantRating">
            <span class="rating-chip rating-chip-large" *ngIf="hasRatings(restaurantRating)">
              <span aria-hidden="true">⭐</span>
              <span class="value">{{ formatAverageRating(restaurantRating) }}</span>
              <span class="count">{{ getRatingCountLabel(restaurantRating) }}</span>
            </span>
          </ng-container>
        </div>
        <ng-container *ngIf="getDisplayableReviews(r.reviews ?? r.ratings) as restaurantReviews">
          <ul class="review-list" *ngIf="restaurantReviews.length; else restaurantReviewsEmpty">
            <li class="review-card" *ngFor="let review of restaurantReviews">
              <div class="review-header">
                <span class="review-rating" *ngIf="getReviewRating(review) as rating">
                  ⭐ {{ rating | number:'1.0-1' }}
                </span>
                <span class="review-author">{{ getReviewAuthor(review) }}</span>
                <span class="review-date" *ngIf="getFormattedReviewDate(review) as reviewDate">
                  {{ 'restaurantDetail.reviewedOn' | translate: 'Reviewed on {{date}}' : { date: reviewDate } }}
                </span>
              </div>
              <p class="review-comment" *ngIf="getReviewComment(review) as comment">
                {{ comment }}
              </p>
            </li>
          </ul>
        </ng-container>
        <ng-template #restaurantReviewsEmpty>
          <p class="review-empty">
            {{ 'restaurantDetail.reviewsEmpty' | translate: 'No comments yet.' }}
          </p>
        </ng-template>
        <form
          class="review-form"
          [formGroup]="restaurantReviewForm"
          (ngSubmit)="submitRestaurantReview()"
          novalidate
        >
          <h4>{{ 'restaurantDetail.reviewFormHeading' | translate: 'Share your experience' }}</h4>
          <div class="form-field">
            <label for="restaurant-review-rating">
              {{ 'restaurantDetail.reviewFormRatingLabel' | translate: 'Your rating' }}
            </label>
            <select id="restaurant-review-rating" formControlName="rating">
              <option [ngValue]="null">
                {{
                  'restaurantDetail.reviewFormRatingPlaceholder'
                    | translate: 'Select a rating'
                }}
              </option>
              <option *ngFor="let rating of ratingOptions" [ngValue]="rating">
                {{ rating }} ★
              </option>
            </select>
            <p
              class="form-error"
              *ngIf="
                restaurantReviewForm.controls.rating.touched &&
                restaurantReviewForm.controls.rating.hasError('required')
              "
            >
              {{ 'restaurantDetail.reviewFormRatingRequired' | translate: 'Please select a rating.' }}
            </p>
          </div>
          <div class="form-field">
            <label for="restaurant-review-comment">
              {{ 'restaurantDetail.reviewFormCommentLabel' | translate: 'Your comment' }}
            </label>
            <textarea
              id="restaurant-review-comment"
              formControlName="comment"
              [attr.maxlength]="reviewCommentMaxLength"
              [attr.placeholder]="
                'restaurantDetail.reviewFormCommentPlaceholder'
                  | translate
                    : 'Tell other guests about your visit (optional)'
              "
            ></textarea>
            <p
              class="form-error"
              *ngIf="
                restaurantReviewForm.controls.comment.touched &&
                restaurantReviewForm.controls.comment.hasError('maxlength')
              "
            >
              {{
                'restaurantDetail.reviewFormCommentTooLong'
                  | translate
                    : 'Comments must be {{max}} characters or fewer.'
                    : { max: reviewCommentMaxLength }
              }}
            </p>
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="restaurantReviewSubmitting()">
              {{
                restaurantReviewSubmitting()
                  ? (
                      'restaurantDetail.reviewFormSubmitting'
                        | translate: 'Submitting…'
                    )
                  : (
                      'restaurantDetail.reviewFormSubmit'
                        | translate: 'Submit review'
                    )
              }}
            </button>
            <p
              class="form-status success"
              *ngIf="restaurantReviewStatus() === 'success'"
              aria-live="polite"
            >
              {{ 'restaurantDetail.reviewFormSuccess' | translate: 'Thanks for your feedback!' }}
            </p>
            <p
              class="form-status error"
              *ngIf="restaurantReviewStatus() === 'error'"
              aria-live="polite"
            >
              {{
                'restaurantDetail.reviewFormError'
                  | translate: 'Unable to submit your review. Please try again.'
              }}
            </p>
          </div>
        </form>
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
              <ng-container *ngIf="getMenuItemRatingSource(m) as menuItemRating">
                <span class="rating-chip" *ngIf="hasRatings(menuItemRating)">
                  <span aria-hidden="true">⭐</span>
                  <span class="value">{{ formatAverageRating(menuItemRating) }}</span>
                  <span class="count">{{ getRatingCountLabel(menuItemRating) }}</span>
                </span>
              </ng-container>
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
            [attr.aria-describedby]="
              menuItemModalTab() === 'details'
                ? 'menu-item-tabpanel-details-' + menuItemContext.item.id
                : 'menu-item-tabpanel-reviews-' + menuItemContext.item.id
            "
            (click)="$event.stopPropagation()"
          >
            <div class="menu-item-modal-content">
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
              <div
                class="modal-tabs"
                role="tablist"
                [attr.aria-label]="
                  'restaurantDetail.menuItemTabsLabel' | translate: 'Menu item sections'
                "
              >
                <button
                  type="button"
                  class="modal-tab"
                  role="tab"
                  [class.active]="menuItemModalTab() === 'details'"
                  (click)="setMenuItemModalTab('details')"
                  [attr.id]="'menu-item-tab-details-' + menuItemContext.item.id"
                  [attr.aria-selected]="menuItemModalTab() === 'details' ? 'true' : 'false'"
                  [attr.aria-controls]="'menu-item-tabpanel-details-' + menuItemContext.item.id"
                  [attr.tabindex]="menuItemModalTab() === 'details' ? 0 : -1"
                >
                  {{ 'restaurantDetail.menuItemTabDetails' | translate: 'Details' }}
                </button>
                <button
                  type="button"
                  class="modal-tab"
                  role="tab"
                  [class.active]="menuItemModalTab() === 'reviews'"
                  (click)="setMenuItemModalTab('reviews')"
                  [attr.id]="'menu-item-tab-reviews-' + menuItemContext.item.id"
                  [attr.aria-selected]="menuItemModalTab() === 'reviews' ? 'true' : 'false'"
                  [attr.aria-controls]="'menu-item-tabpanel-reviews-' + menuItemContext.item.id"
                  [attr.tabindex]="menuItemModalTab() === 'reviews' ? 0 : -1"
                >
                  {{ 'restaurantDetail.menuItemTabReviews' | translate: 'Reviews' }}
                </button>
              </div>
              <section
                class="modal-tabpanel"
                role="tabpanel"
                [attr.id]="'menu-item-tabpanel-details-' + menuItemContext.item.id"
                [attr.aria-labelledby]="'menu-item-tab-details-' + menuItemContext.item.id"
                *ngIf="menuItemModalTab() === 'details'"
              >
                <ng-container *ngIf="hasDiscount(menuItemContext.item); else detailsRegularPrice">
                  <div class="price-group">
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
                </ng-container>
                <ng-template #detailsRegularPrice>
                  <div class="price-group">
                    <span class="price">
                      {{ (menuItemContext.item.price_cents / 100) | currency:'EUR' }}
                    </span>
                  </div>
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
              </section>
              <section
                class="modal-tabpanel"
                role="tabpanel"
                [attr.id]="'menu-item-tabpanel-reviews-' + menuItemContext.item.id"
                [attr.aria-labelledby]="'menu-item-tab-reviews-' + menuItemContext.item.id"
                *ngIf="menuItemModalTab() === 'reviews'"
              >
                <ng-container *ngIf="getMenuItemRatingSource(menuItemContext.item) as menuItemRating">
                  <span class="rating-chip rating-chip-large" *ngIf="hasRatings(menuItemRating)">
                    <span aria-hidden="true">⭐</span>
                    <span class="value">{{ formatAverageRating(menuItemRating) }}</span>
                    <span class="count">{{ getRatingCountLabel(menuItemRating) }}</span>
                  </span>
                </ng-container>
                <section class="review-section">
                  <h4>{{ 'restaurantDetail.menuItemReviewsHeading' | translate: 'Guest comments' }}</h4>
                  <ng-container
                    *ngIf="
                      getDisplayableReviews(
                        menuItemContext.item.reviews ?? menuItemContext.item.ratings
                      ) as itemReviews
                    "
                  >
                    <ul class="review-list" *ngIf="itemReviews.length; else menuItemReviewsEmpty">
                      <li class="review-card" *ngFor="let review of itemReviews">
                        <div class="review-header">
                          <span class="review-rating" *ngIf="getReviewRating(review) as rating">
                            ⭐ {{ rating | number:'1.0-1' }}
                          </span>
                          <span class="review-author">{{ getReviewAuthor(review) }}</span>
                          <span class="review-date" *ngIf="getFormattedReviewDate(review) as reviewDate">
                            {{
                              'restaurantDetail.reviewedOn'
                                | translate: 'Reviewed on {{date}}'
                                : { date: reviewDate }
                            }}
                          </span>
                        </div>
                        <p class="review-comment" *ngIf="getReviewComment(review) as comment">
                          {{ comment }}
                        </p>
                      </li>
                    </ul>
                  </ng-container>
                  <ng-template #menuItemReviewsEmpty>
                    <p class="review-empty">
                      {{
                        'restaurantDetail.menuItemReviewsEmpty'
                          | translate: 'No comments for this item yet.'
                      }}
                    </p>
                  </ng-template>
                  <form
                    class="review-form"
                    [formGroup]="getMenuItemReviewForm(menuItemContext.item.id)"
                    (ngSubmit)="submitMenuItemReview(menuItemContext.item)"
                    novalidate
                  >
                    <ng-container *ngIf="getMenuItemReviewForm(menuItemContext.item.id) as itemReviewForm">
                      <h4>{{ 'restaurantDetail.menuItemReviewFormHeading' | translate: 'Review this item' }}</h4>
                      <div class="form-field">
                        <label [attr.for]="'menu-item-review-rating-' + menuItemContext.item.id">
                          {{ 'restaurantDetail.reviewFormRatingLabel' | translate: 'Your rating' }}
                        </label>
                        <select
                          [id]="'menu-item-review-rating-' + menuItemContext.item.id"
                          formControlName="rating"
                        >
                          <option [ngValue]="null">
                            {{
                              'restaurantDetail.reviewFormRatingPlaceholder'
                                | translate: 'Select a rating'
                            }}
                          </option>
                          <option *ngFor="let rating of ratingOptions" [ngValue]="rating">
                            {{ rating }} ★
                          </option>
                        </select>
                        <p
                          class="form-error"
                          *ngIf="
                            itemReviewForm.controls.rating.touched &&
                            itemReviewForm.controls.rating.hasError('required')
                          "
                        >
                          {{ 'restaurantDetail.reviewFormRatingRequired' | translate: 'Please select a rating.' }}
                        </p>
                      </div>
                      <div class="form-field">
                        <label [attr.for]="'menu-item-review-comment-' + menuItemContext.item.id">
                          {{ 'restaurantDetail.reviewFormCommentLabel' | translate: 'Your comment' }}
                        </label>
                        <textarea
                          [id]="'menu-item-review-comment-' + menuItemContext.item.id"
                          formControlName="comment"
                          [attr.maxlength]="reviewCommentMaxLength"
                          [attr.placeholder]="
                            'restaurantDetail.reviewFormCommentPlaceholder'
                              | translate
                                : 'Tell other guests about your visit (optional)'
                          "
                        ></textarea>
                        <p
                          class="form-error"
                          *ngIf="
                            itemReviewForm.controls.comment.touched &&
                            itemReviewForm.controls.comment.hasError('maxlength')
                          "
                        >
                          {{
                            'restaurantDetail.reviewFormCommentTooLong'
                              | translate
                                : 'Comments must be {{max}} characters or fewer.'
                                : { max: reviewCommentMaxLength }
                          }}
                        </p>
                      </div>
                      <div class="form-actions">
                        <button
                          type="submit"
                          [disabled]="isMenuItemReviewSubmitting(menuItemContext.item.id)"
                        >
                          {{
                            isMenuItemReviewSubmitting(menuItemContext.item.id)
                              ? (
                                  'restaurantDetail.reviewFormSubmitting'
                                    | translate: 'Submitting…'
                                )
                              : (
                                  'restaurantDetail.reviewFormSubmit'
                                    | translate: 'Submit review'
                                )
                          }}
                        </button>
                        <p
                          class="form-status success"
                          *ngIf="getMenuItemReviewStatus(menuItemContext.item.id) === 'success'"
                          aria-live="polite"
                        >
                          {{ 'restaurantDetail.reviewFormSuccess' | translate: 'Thanks for your feedback!' }}
                        </p>
                        <p
                          class="form-status error"
                          *ngIf="getMenuItemReviewStatus(menuItemContext.item.id) === 'error'"
                          aria-live="polite"
                        >
                          {{
                            'restaurantDetail.reviewFormError'
                              | translate: 'Unable to submit your review. Please try again.'
                          }}
                        </p>
                      </div>
                    </ng-container>
                  </form>
                </section>
              </section>
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
  private ratingsSvc = inject(RatingsService);
  private cart = inject(CartService);
  private document = inject(DOCUMENT);
  private i18n = inject(TranslationService);
  private cards = inject(CardService);
  private cardSpotlight = inject(CardSpotlightService);
  private brandColor = inject(BrandColorService);
  private locations = inject(LocationService);
  private sanitizer = inject(DomSanitizer);
  private fb = inject(FormBuilder);
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
  private restaurantReload$ = new BehaviorSubject<void>(undefined);
  private restaurantRequest$ = this.restaurantReload$.pipe(
    switchMap(() => this.rSvc.get(this.id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private restaurantRatings$ = this.restaurantReload$.pipe(
    switchMap(() =>
      this.ratingsSvc
        .listRatings('restaurant', this.id)
        .pipe(catchError(() => of([])))
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  restaurant$: Observable<Restaurant> = combineLatest([
    this.restaurantRequest$,
    this.restaurantRatings$,
  ]).pipe(
    map(([restaurant, ratings]) => this.mergeRestaurantRatings(restaurant, ratings)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  private searchTerm$ = new BehaviorSubject<string>('');
  menuCategories$: Observable<MenuCategoryGroup[]> = this.createMenuCategoriesStream();
  searchTerm = '';
  menuItemModal = signal<MenuItemModalContext | null>(null);
  menuItemModalTab = signal<'details' | 'reviews'>('details');
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
  readonly ratingOptions = [5, 4, 3, 2, 1];
  readonly reviewCommentMaxLength = 1000;
  restaurantReviewForm: ReviewFormGroup = this.createReviewForm();
  restaurantReviewSubmitting = signal(false);
  restaurantReviewStatus = signal<ReviewStatus>('');
  private menuItemReviewForms = new Map<number, ReviewFormGroup>();
  private menuItemReviewStatuses = signal<Record<number, MenuItemReviewState>>({});
  private menuItemRatingsCache = new Map<number, Review[]>();
  private pendingMenuItemRatings = new Set<number>();
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
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.restaurant$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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

    this.restaurantReviewForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.restaurantReviewStatus()) {
          this.restaurantReviewStatus.set('');
        }
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
    this.restaurantReload$.complete();
    this.menuItemReviewForms.clear();
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
      this.triggerRestaurantReload();
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

  getRestaurantRatingSource(restaurant: Restaurant): RatingSource {
    return this.buildRatingSourceFromEntity(
      restaurant as unknown as Record<string, unknown>,
      restaurant.rating_summary ?? null,
      restaurant.reviews ?? restaurant.ratings ?? null,
      restaurant.ratings ?? null
    );
  }

  getMenuItemRatingSource(item: MenuItem): RatingSource {
    return this.buildRatingSourceFromEntity(
      item as unknown as Record<string, unknown>,
      item.rating_summary ?? null,
      item.reviews ?? item.ratings ?? null,
      item.ratings ?? null
    );
  }

  hasRatings(source?: RatingSummary | RatingSource | null): boolean {
    return (
      this.resolveCombinedRatingCount(source) > 0 &&
      this.resolveCombinedRatingAverage(source) !== null
    );
  }

  getDisplayableReviews(reviews?: Review[] | null): Review[] {
    if (!Array.isArray(reviews)) {
      return [];
    }

    return reviews.filter(review => this.getReviewRating(review) !== null || this.getReviewComment(review) !== null);
  }

  hasReviews(reviews?: Review[] | null): boolean {
    return this.getDisplayableReviews(reviews).length > 0;
  }

  formatAverageRating(source?: RatingSummary | RatingSource | null): string {
    const average = this.resolveCombinedRatingAverage(source);
    if (average === null) {
      return '–';
    }

    const rounded = Math.round(average * 10) / 10;
    return rounded.toFixed(1);
  }

  getRatingCountLabel(source?: RatingSummary | RatingSource | null): string {
    const count = this.resolveCombinedRatingCount(source);
    if (count <= 0) {
      return this.i18n.translate('restaurantDetail.ratingNoReviews', 'No reviews yet');
    }

    const key = count === 1 ? 'restaurantDetail.ratingCountOne' : 'restaurantDetail.ratingCountMany';
    const fallback = count === 1 ? '{{count}} review' : '{{count}} reviews';
    return this.i18n.translate(key, fallback, { count });
  }

  getReviewRating(review: Review): number | null {
    if (!review || typeof review !== 'object') {
      return null;
    }

    const candidates = [review.rating, review.score, review.value];
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  getReviewAuthor(review: Review): string {
    const user = review?.user;
    const nameCandidates: Array<string | null | undefined> = [];

    if (user) {
      if (typeof user.name === 'string') {
        nameCandidates.push(user.name);
      }

      const combined = [user.first_name, user.last_name]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' ')
        .trim();

      if (combined.length) {
        nameCandidates.push(combined);
      }
    }

    nameCandidates.push(review?.author_name, review?.reviewer_name);

    for (const candidate of nameCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return this.i18n.translate('restaurantDetail.reviewAnonymous', 'Anonymous');
  }

  getReviewComment(review: Review): string | null {
    if (!review || typeof review !== 'object') {
      return null;
    }

    const candidates = [review.comment, review.body, review.text];
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    return null;
  }

  getFormattedReviewDate(review: Review): string | null {
    if (!review || typeof review !== 'object') {
      return null;
    }

    const candidates = [review.created_at, review.updated_at];
    for (const candidate of candidates) {
      const formatted = this.formatReviewDate(candidate);
      if (formatted) {
        return formatted;
      }
    }

    return null;
  }

  submitRestaurantReview() {
    if (this.restaurantReviewSubmitting()) {
      return;
    }

    if (this.restaurantReviewForm.invalid) {
      this.restaurantReviewForm.markAllAsTouched();
      return;
    }

    const payload = this.buildRatingPayload('restaurant', this.id, this.restaurantReviewForm.getRawValue());
    this.restaurantReviewSubmitting.set(true);
    this.restaurantReviewStatus.set('');

    this.ratingsSvc
      .createRating(payload)
      .pipe(finalize(() => this.restaurantReviewSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.restaurantReviewForm.reset({ rating: null, comment: '' });
          this.restaurantReviewStatus.set('success');
          this.triggerRestaurantReload();
        },
        error: () => {
          this.restaurantReviewStatus.set('error');
        },
      });
  }

  submitMenuItemReview(item: MenuItem) {
    const form = this.getMenuItemReviewForm(item.id);
    if (this.isMenuItemReviewSubmitting(item.id)) {
      return;
    }

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const payload = this.buildRatingPayload('menu_item', item.id, form.getRawValue());
    this.updateMenuItemReviewState(item.id, { submitting: true, status: '' });

    this.ratingsSvc
      .createRating(payload)
      .pipe(
        switchMap(() => this.menuSvc.get(item.id)),
        finalize(() => this.updateMenuItemReviewState(item.id, { submitting: false }))
      )
      .subscribe({
        next: updatedItem => {
          form.reset({ rating: null, comment: '' });
          this.updateMenuItemReviewState(item.id, { status: 'success' });
          const currentModal = this.menuItemModal();
          if (currentModal?.item.id === item.id) {
            this.menuItemModal.set({ ...currentModal, item: updatedItem });
          }
          this.menuItemRatingsCache.delete(item.id);
          this.ensureMenuItemRatings(updatedItem);
          this.refreshMenu();
        },
        error: () => {
          this.updateMenuItemReviewState(item.id, { status: 'error' });
        },
      });
  }

  getMenuItemReviewForm(itemId: number): ReviewFormGroup {
    if (!this.menuItemReviewForms.has(itemId)) {
      const form = this.createReviewForm();
      form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.clearMenuItemReviewStatus(itemId);
        });
      this.menuItemReviewForms.set(itemId, form);
    }

    return this.menuItemReviewForms.get(itemId)!;
  }

  isMenuItemReviewSubmitting(itemId: number): boolean {
    return this.menuItemReviewStatuses()[itemId]?.submitting ?? false;
  }

  getMenuItemReviewStatus(itemId: number): ReviewStatus {
    return this.menuItemReviewStatuses()[itemId]?.status ?? '';
  }

  private ensureMenuItemRatings(item: MenuItem) {
    const itemId = item.id;
    if (!Number.isFinite(itemId)) {
      return;
    }

    if (this.hasReviews(item.reviews ?? item.ratings ?? null)) {
      return;
    }

    if (this.pendingMenuItemRatings.has(itemId)) {
      return;
    }

    const cached = this.menuItemRatingsCache.get(itemId);
    if (cached) {
      this.applyMenuItemRatings(itemId, cached);
      return;
    }

    this.pendingMenuItemRatings.add(itemId);

    this.ratingsSvc
      .listRatings('menu_item', itemId)
      .pipe(
        take(1),
        catchError(() => of([] as Review[]))
      )
      .subscribe({
        next: ratings => {
          this.menuItemRatingsCache.set(itemId, ratings);
          this.applyMenuItemRatings(itemId, ratings);
        },
        error: () => {
          // Swallow errors; the UI will simply show no ratings.
        },
        complete: () => {
          this.pendingMenuItemRatings.delete(itemId);
        },
      });
  }

  private applyMenuItemRatings(itemId: number, ratings: Review[]) {
    const modal = this.menuItemModal();
    if (modal?.item.id === itemId) {
      const existingReviews = modal.item.reviews;
      this.menuItemModal.set({
        ...modal,
        item: {
          ...modal.item,
          ratings,
          reviews: this.hasReviews(existingReviews) ? existingReviews : ratings,
        },
      });
    }
  }

  private createReviewForm(): ReviewFormGroup {
    return this.fb.group({
      rating: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      comment: this.fb.control<string>('', {
        validators: [Validators.maxLength(this.reviewCommentMaxLength)],
        nonNullable: true,
      }),
    });
  }

  private buildRatingPayload(
    rateableType: RatingInput['rateable_type'],
    rateableId: number,
    value: { rating: number | null; comment: string }
  ): RatingInput {
    const normalizedScore =
      typeof value.rating === 'number' && Number.isFinite(value.rating)
        ? Math.min(5, Math.max(1, Math.round(value.rating)))
        : 1;
    const comment = typeof value.comment === 'string' ? value.comment.trim() : '';

    return {
      rateable_type: rateableType,
      rateable_id: rateableId,
      score: normalizedScore,
      comment: comment.length ? comment : null,
    };
  }

  private updateMenuItemReviewState(itemId: number, patch: Partial<MenuItemReviewState>) {
    this.menuItemReviewStatuses.update(current => {
      const next = { ...current };
      const existing = next[itemId] ?? { submitting: false, status: '' as ReviewStatus };
      next[itemId] = { ...existing, ...patch };
      return next;
    });
  }

  private clearMenuItemReviewStatus(itemId: number) {
    const state = this.menuItemReviewStatuses()[itemId];
    if (state?.status) {
      this.updateMenuItemReviewState(itemId, { status: '' });
    }
  }

  private triggerRestaurantReload() {
    this.restaurantReload$.next(undefined);
  }

  private mergeRestaurantRatings(restaurant: Restaurant, ratings: Review[]): Restaurant {
    const hasExistingReviews = this.hasReviews(restaurant.reviews ?? restaurant.ratings ?? null);
    const normalizedReviews = hasExistingReviews ? restaurant.reviews : ratings;

    return {
      ...restaurant,
      ratings,
      reviews: normalizedReviews ?? ratings ?? [],
    };
  }

  private buildRatingSourceFromEntity(
    entity: Record<string, unknown>,
    summary: RatingSummary | null,
    reviews?: Review[] | null,
    ratings?: Review[] | null
  ): RatingSource {
    return {
      rating_summary: summary,
      rating_average: this.coerceNumber(entity['rating_average']),
      average_rating: this.coerceNumber(entity['average_rating']),
      avg_rating: this.coerceNumber(entity['avg_rating']),
      rating: this.coerceNumber(entity['rating']),
      rating_count: this.coerceNumber(entity['rating_count']),
      ratings_count: this.coerceNumber(entity['ratings_count']),
      total_ratings: this.coerceNumber(entity['total_ratings']),
      count: this.coerceNumber(entity['count']),
      reviews: reviews ?? null,
      ratings: ratings ?? null,
    };
  }

  private resolveCombinedRatingAverage(source?: RatingSummary | RatingSource | null): number | null {
    if (!source) {
      return null;
    }

    const record = source as Record<string, unknown>;
    const hasContainer = this.hasRatingContainerProps(record);
    const summary = hasContainer
      ? ((record['rating_summary'] as RatingSummary | null) ?? null)
      : (source as RatingSummary | null);

    const averageFromSummary = this.resolveRatingAverage(summary);
    if (averageFromSummary !== null) {
      return averageFromSummary;
    }

    if (hasContainer) {
      const container = source as RatingSource;
      const candidates = [
        container.rating_average,
        container.average_rating,
        container.avg_rating,
        container.rating,
      ];

      for (const candidate of candidates) {
        const value = this.coerceNumber(candidate);
        if (value !== null) {
          return value;
        }
      }

      const computed = this.computeAverageFromReviews(container.reviews ?? container.ratings ?? null);
      if (computed !== null) {
        return computed;
      }
    }

    return null;
  }

  private resolveCombinedRatingCount(source?: RatingSummary | RatingSource | null): number {
    if (!source) {
      return 0;
    }

    const record = source as Record<string, unknown>;
    const hasContainer = this.hasRatingContainerProps(record);
    const summary = hasContainer
      ? ((record['rating_summary'] as RatingSummary | null) ?? null)
      : (source as RatingSummary | null);

    const countFromSummary = this.resolveRatingCount(summary);
    if (!hasContainer) {
      return countFromSummary;
    }

    if (countFromSummary > 0) {
      return countFromSummary;
    }

    const container = source as RatingSource;
    const candidates = [
      container.rating_count,
      container.ratings_count,
      container.total_ratings,
      container.count,
    ];

    for (const candidate of candidates) {
      const value = this.coerceNumber(candidate);
      if (value !== null && value > 0) {
        return Math.trunc(value);
      }
    }

    const computed = this.countRatingsFromReviews(container.reviews ?? container.ratings ?? null);
    if (computed > 0) {
      return computed;
    }

    return countFromSummary;
  }

  private resolveRatingAverage(summary?: RatingSummary | null): number | null {
    if (!summary || typeof summary !== 'object') {
      return null;
    }

    const candidates = [
      summary.average_rating,
      summary.avg_rating,
      summary.rating,
      summary.value,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private resolveRatingCount(summary?: RatingSummary | null): number {
    if (!summary || typeof summary !== 'object') {
      return 0;
    }

    const candidates = [
      summary.rating_count,
      summary.ratings_count,
      summary.total_ratings,
      summary.count,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
        return candidate;
      }
    }

    return 0;
  }

  private computeAverageFromReviews(reviews?: Review[] | null): number | null {
    if (!Array.isArray(reviews) || !reviews.length) {
      return null;
    }

    let total = 0;
    let count = 0;

    reviews.forEach(review => {
      const rating = this.getReviewRating(review);
      if (rating !== null) {
        total += rating;
        count += 1;
      }
    });

    if (!count) {
      return null;
    }

    return total / count;
  }

  private countRatingsFromReviews(reviews?: Review[] | null): number {
    if (!Array.isArray(reviews) || !reviews.length) {
      return 0;
    }

    let count = 0;

    reviews.forEach(review => {
      if (this.getReviewRating(review) !== null) {
        count += 1;
      }
    });

    return count;
  }

  private coerceNumber(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  private hasRatingContainerProps(record: Record<string, unknown>): boolean {
    return 'rating_summary' in record || 'reviews' in record || 'ratings' in record;
  }

  private formatReviewDate(value?: string | null): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(this.i18n.currentLocale(), {
      dateStyle: 'medium',
    }).format(date);
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
    this.menuItemModalTab.set('details');

    if (!alreadyOpen) {
      this.lockBodyScroll();
    }

    this.ensureMenuItemRatings(item);
  }

  closeMenuItemModal() {
    if (!this.menuItemModal()) {
      return;
    }

    this.menuItemModal.set(null);
    this.menuItemModalTab.set('details');
    this.unlockBodyScroll();
  }

  setMenuItemModalTab(tab: 'details' | 'reviews') {
    if (this.menuItemModalTab() === tab) {
      return;
    }

    this.menuItemModalTab.set(tab);
    if (tab === 'reviews') {
      const context = this.menuItemModal();
      if (context) {
        this.ensureMenuItemRatings(context.item);
      }
    }
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
        state: interval ? 'open' : 'closed',
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
