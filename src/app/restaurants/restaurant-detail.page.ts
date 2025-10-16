import { Component, HostListener, OnDestroy, effect, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import { AsyncPipe, CurrencyPipe, NgIf, NgFor, NgStyle, DOCUMENT, TitleCasePipe } from '@angular/common';
import { Allergen, Card, MenuItem, Restaurant } from '../core/models';
import { Observable, combineLatest, firstValueFrom, map, of, shareReplay, startWith, switchMap, tap, timer } from 'rxjs';
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

type MenuCategoryGroup = {
  name: string;
  anchor: string;
  items: MenuItem[];
  cartCategory: CartCategorySelection | null;
  cartCategoriesByItemId?: Record<number, CartCategorySelection | null>;
};

type PendingCartAddition = {
  item: MenuItem;
  category: CartCategorySelection | null;
  incomingRestaurant: CartRestaurant;
  currentRestaurantName: string;
  incomingRestaurantName: string;
  quantity: number;
};

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf, TranslatePipe, NgStyle, MenuItemPhotoSliderComponent, AllergenIconComponent, TitleCasePipe],
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

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      font-weight: 700;
      letter-spacing: -0.045em;
      margin: 0;
    }

    .hero-content p {
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

    .category-nav {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
      position: sticky;
      top: 0;
      z-index: 20;
      padding: 0.75rem 0;
      background: transparent;
    }

    .category-nav button {
      border: 1px solid var(--border-soft);
      background: var(--surface);
      border-radius: 999px;
      padding: 0.45rem 1rem;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .category-nav button:hover,
    .category-nav button:focus {
      color: var(--brand-green);
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

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
    }

    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.12), transparent 60%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .card.highlighted {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.14), var(--shadow-soft);
    }

    .card:hover::after {
      opacity: 1;
    }

    .price {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .price-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .allergen-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .allergen-badges .badge {
      background: rgba(229, 62, 62, 0.12);
      color: #8f1e1e;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      line-height: 1;
    }

    .allergen-badges .badge app-allergen-icon {
      --allergen-icon-bg: rgba(229, 62, 62, 0.2);
      --allergen-icon-border: rgba(143, 30, 30, 0.24);
    }

    .price-group .price.discounted {
      color: var(--brand-green);
      font-size: 1.25rem;
    }

    .price-group .price.original {
      text-decoration: line-through;
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .discount-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: color-mix(in srgb, var(--brand-green) 65%, black);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.14);
      padding: 0.3rem 0.6rem;
      border-radius: 999px;
    }

    .quantity-controls {
      display: inline-flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-soft);
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.08);
      color: var(--text-primary);
      font-weight: 600;
      width: fit-content;
    }

    .quantity-controls .quantity-button {
      background: transparent;
      border: 0;
      color: inherit;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      width: 1.75rem;
      height: 1.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
    }

    .quantity-controls .quantity-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .quantity-controls .quantity-button:not(:disabled):hover,
    .quantity-controls .quantity-button:not(:disabled):focus {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      outline: none;
    }

    .quantity-controls .quantity-button:focus-visible {
      outline: 2px solid var(--brand-green);
      outline-offset: 2px;
    }

    .quantity-controls .quantity-display {
      min-width: 1.5rem;
      text-align: center;
    }

    .card button {
      align-self: flex-start;
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      border-radius: 12px;
      padding: 0.6rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card button:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
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
        <div class="hero-content">
          <h2 class="hero-title">{{ getRestaurantName(r) }}</h2>
          <p>
            {{ getRestaurantDescription(r) }}
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
        </div>
      </section>
      <ng-container *ngIf="(menuCategories$ | async) as menuCategories">
        <h3 *ngIf="menuCategories.length">{{ 'restaurants.menuHeading' | translate: 'Menu' }}</h3>
        <nav class="category-nav" *ngIf="menuCategories.length">
          <button type="button" *ngFor="let category of menuCategories" (click)="scrollTo(category.anchor)">
            {{ category.name }}
          </button>
        </nav>
        <section class="menu-section" *ngFor="let category of menuCategories" [attr.id]="category.anchor">
          <h4>{{ category.name }}</h4>
          <div class="menu-grid">
            <div
              class="card glass-panel"
              *ngFor="let m of category.items"
              [attr.id]="getMenuItemAnchor(m)"
              [class.highlighted]="shouldHighlightMenuItem(m)"
            >
              <app-menu-item-photo-slider
                *ngIf="m.photos?.length"
                [photos]="m.photos"
                [itemName]="m.name"
              ></app-menu-item-photo-slider>
              <h4>{{ m.name }}</h4>
              <p>
                {{
                  m.description ||
                    ('restaurantDetail.customerFavourite' | translate: 'Customer favourite')
                }}
              </p>
              <div class="price-group" *ngIf="hasDiscount(m); else regularPrice">
                <span class="price discounted">
                  {{ (getCurrentPriceCents(m) / 100) | currency:'EUR' }}
                </span>
                <span class="price original">
                  {{ (m.price_cents / 100) | currency:'EUR' }}
                </span>
                <span class="discount-pill">
                  {{ 'restaurantDetail.discountBadge' | translate: 'Special offer' }}
                </span>
              </div>
              <ng-template #regularPrice>
                <span class="price">{{ (m.price_cents / 100) | currency:'EUR' }}</span>
              </ng-template>
              <div class="allergen-badges" *ngIf="m.allergens?.length">
                <ng-container *ngFor="let allergen of m.allergens">
                  <ng-container *ngIf="resolveAllergenLabel(allergen) as allergenLabel">
                    <span class="badge">
                      <app-allergen-icon [allergen]="allergen"></app-allergen-icon>
                      <span>{{ allergenLabel }}</span>
                    </span>
                  </ng-container>
                </ng-container>
              </div>
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
                (click)="addToCart(m, resolveCartCategory(category, m), r, getQuantity(m.id))"
              >
                {{ 'restaurantDetail.addToCart' | translate: 'Add to cart' }}
              </button>
            </div>
          </div>
        </section>
      </ng-container>

    </ng-container>

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
  private highlightMenuItemId$ = this.route.queryParamMap.pipe(
    map(params => this.parseHighlightParam(params.get('highlightItem'))),
    startWith(this.parseHighlightParam(this.route.snapshot.queryParamMap.get('highlightItem')))
  );
  private highlightMenuItemId: number | null = null;
  private highlightScrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private highlightRetryTimeout: ReturnType<typeof setTimeout> | null = null;

  id = Number(this.route.snapshot.paramMap.get('id'));
  restaurant$: Observable<Restaurant> = this.rSvc.get(this.id).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  menuCategories$: Observable<MenuCategoryGroup[]> = this.createMenuCategoriesStream();

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

  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  private restaurantMismatchContext = signal<PendingCartAddition | null>(null);
  restaurantMismatchState = computed(() => this.restaurantMismatchContext());
  private bodyOverflowBackup: string | null = null;
  private itemQuantities = signal<Record<number, number>>({});

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
    this.unlockBodyScroll();
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

  private createMenuCategoriesStream(): Observable<MenuCategoryGroup[]> {
    return combineLatest([
      this.menuSvc.listByRestaurant(this.id).pipe(map(items => this.organizeMenu(items))),
      this.highlightMenuItemId$,
    ]).pipe(
      tap(([, highlightId]) => {
        this.highlightMenuItemId = highlightId;
        if (highlightId != null) {
          this.scheduleHighlightScroll(highlightId);
        }
      }),
      map(([categories]) => categories)
    );
  }

  hasDiscount(item: MenuItem): boolean {
    const discounted = item.discounted_price_cents;
    return typeof discounted === 'number' && discounted >= 0 && discounted < item.price_cents;
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
    quantity: number
  ) {
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
    if (this.bodyOverflowBackup === null) {
      const currentOverflow = this.document.body.style.overflow;
      this.bodyOverflowBackup = currentOverflow ?? '';
      this.document.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll() {
    if (this.bodyOverflowBackup !== null) {
      if (this.bodyOverflowBackup.length) {
        this.document.body.style.overflow = this.bodyOverflowBackup;
      } else {
        this.document.body.style.removeProperty('overflow');
      }
      this.bodyOverflowBackup = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event) {
    if (this.restaurantMismatchContext()) {
      event.preventDefault();
      this.dismissRestaurantMismatch();
    }
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
}
