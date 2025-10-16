import { Component, effect, inject, signal } from '@angular/core';
import { AsyncPipe, CurrencyPipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';
import { MenuItem, Restaurant, SessionUser, UserProfile } from '../core/models';
import { RestaurantService } from './restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AuthService } from '../core/auth.service';
import { ProfileService } from '../core/profile.service';
import { normalizeRestaurantCuisines } from './cuisines';
import { MenuService } from '../menu/menu.service';
import { CardOverviewComponent } from '../cards/card-overview.component';

type DiscountHighlight = {
  restaurant: Restaurant;
  item: MenuItem;
  currentPriceCents: number;
  originalPriceCents: number;
  savingsCents: number;
  savingsPercent: number | null;
};

@Component({
  standalone: true,
  selector: 'app-restaurant-list',
  imports: [AsyncPipe, RouterLink, NgFor, NgIf, TitleCasePipe, TranslatePipe, CurrencyPipe, CardOverviewComponent],
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
      border: 1px solid var(--surface-border);
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
    }

    .card-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-media .placeholder {
      font-size: 2rem;
      font-weight: 700;
      color: rgba(10, 10, 10, 0.6);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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
      background: var(--surface-border);
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
      class="card glass-panel profile-card"
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
    <div class="grid" *ngIf="restaurants$ | async as restaurants">
      <a class="card glass-panel" *ngFor="let r of restaurants" [routerLink]="['/restaurants', r.id]">
        <div class="card-media">
          <ng-container *ngIf="r.heroPhoto; else placeholder">
            <img [src]="r.heroPhoto" [alt]="getRestaurantName(r)" loading="lazy" />
          </ng-container>
          <ng-template #placeholder>
            <span class="placeholder">{{ getRestaurantInitial(r) }}</span>
          </ng-template>
        </div>
          <div class="card-body">
            <h3>{{ getRestaurantName(r) }}</h3>
            <p>
              {{ getRestaurantDescription(r) }}
            </p>
            <ul class="cuisine-tags" *ngIf="r.cuisines?.length">
              <li *ngFor="let cuisine of r.cuisines">{{ cuisine | titlecase }}</li>
            </ul>
            <div class="meta">
              <span class="pill">{{ 'restaurants.express' | translate: 'Express' }}</span>
              <span>{{ 'restaurants.duration' | translate: '20-30 min' }}</span>
              <span>€€</span>
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
  private profilePromptState = signal<{ loading: boolean; profile: UserProfile | null }>({
    loading: false,
    profile: null,
  });

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

  private toDiscountHighlight(restaurant: Restaurant, item: MenuItem): DiscountHighlight | null {
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

  restaurants$ = this.svc.list().pipe(
    map((restaurants) =>
      restaurants.map((restaurant) => ({
        ...restaurant,
        heroPhoto: this.ensureHeroPhoto(restaurant),
        cuisines: normalizeRestaurantCuisines(restaurant.cuisines),
      })),
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  discounts$ = combineLatest([
    this.restaurants$,
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
