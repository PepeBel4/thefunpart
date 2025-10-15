import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import { AsyncPipe, CurrencyPipe, NgIf, NgFor, NgStyle, DOCUMENT } from '@angular/common';
import { MenuItem, Restaurant } from '../core/models';
import { Observable, firstValueFrom, map, of, shareReplay, startWith, switchMap, timer } from 'rxjs';
import { CartCategorySelection, CartService } from '../cart/cart.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';

type MenuCategoryGroup = {
  name: string;
  anchor: string;
  items: MenuItem[];
  cartCategory: CartCategorySelection | null;
};

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf, TranslatePipe, NgStyle],
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
      border-bottom: 1px solid rgba(10, 10, 10, 0.08);
    }

    .category-nav button {
      border: 0;
      background: none;
      padding: 0;
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
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
    }

    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.12), transparent 60%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .card:hover::after {
      opacity: 1;
    }

    .price {
      font-weight: 700;
      font-size: 1.1rem;
    }

    button {
      align-self: flex-start;
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      border-radius: 12px;
      padding: 0.6rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(6, 193, 103, 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 32px rgba(6, 193, 103, 0.28);
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
            <div class="card" *ngFor="let m of category.items">
              <h4>{{ m.name }}</h4>
              <p>
                {{
                  m.description ||
                    ('restaurantDetail.customerFavourite' | translate: 'Customer favourite')
                }}
              </p>
              <span class="price">{{ (m.price_cents / 100) | currency:'EUR' }}</span>
              <button (click)="addToCart(m, category.cartCategory)">
                {{ 'restaurantDetail.addToCart' | translate: 'Add to cart' }}
              </button>
            </div>
          </div>
        </section>
      </ng-container>

    </ng-container>
  `
})
export class RestaurantDetailPage {
  private route = inject(ActivatedRoute);
  private menuSvc = inject(MenuService);
  private rSvc = inject(RestaurantService);
  private cart = inject(CartService);
  private document = inject(DOCUMENT);
  private i18n = inject(TranslationService);

  id = Number(this.route.snapshot.paramMap.get('id'));
  restaurant$: Observable<Restaurant> = this.rSvc.get(this.id).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  menuCategories$: Observable<MenuCategoryGroup[]> = this.menuSvc
    .listByRestaurant(this.id)
    .pipe(map(items => this.organizeMenu(items)));

  defaultHeroBackground = 'linear-gradient(135deg, rgba(6, 193, 103, 0.32), rgba(4, 47, 26, 0.68))';
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

  constructor() {
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
    this.menuCategories$ = this.menuSvc.listByRestaurant(this.id).pipe(map(items => this.organizeMenu(items)));
  }

  addToCart(item: MenuItem, category: CartCategorySelection | null) {
    this.cart.add(item, category);
  }

  scrollTo(anchor: string) {
    this.document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getRestaurantName(restaurant: Restaurant): string {
    return this.resolveRestaurantField(restaurant.name, restaurant.name_translations) || restaurant.name;
  }

  getRestaurantDescription(restaurant: Restaurant): string {
    const resolved = this.resolveRestaurantField(restaurant.description, restaurant.description_translations);
    return (
      resolved ||
      this.i18n.translate('restaurantDetail.descriptionFallback', 'Fresh meals, crafted for delivery.')
    );
  }

  private organizeMenu(items: MenuItem[]): MenuCategoryGroup[] {
    const grouped = new Map<string, MenuCategoryGroup>();
    const fallback: MenuItem[] = [];

    items.forEach(item => {
      if (item.categories?.length) {
        let assignedToCategory = false;

        item.categories.forEach(category => {
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
        });

        if (!assignedToCategory) {
          fallback.push(item);
        }
      } else {
        fallback.push(item);
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
