import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Restaurant, SessionUser } from '../core/models';
import { RestaurantService } from './restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-restaurant-list',
  imports: [AsyncPipe, RouterLink, NgFor, NgIf, TranslatePipe],
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

    .profile-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1.1rem;
      padding: 1.4rem 1.6rem;
      border: 1px solid rgba(6, 193, 103, 0.28);
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.12), rgba(6, 193, 103, 0.03));
    }

    .profile-card .profile-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(6, 193, 103, 0.18);
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
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.14), transparent 60%);
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
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.2), rgba(6, 193, 103, 0.05));
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
      background: rgba(6, 193, 103, 0.12);
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
    <div class="grid" *ngIf="restaurants$ | async as restaurants">
      <a class="card" *ngFor="let r of restaurants" [routerLink]="['/restaurants', r.id]">
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
  private i18n = inject(TranslationService);
  private auth = inject(AuthService);
  private heroPhotoCache = new Map<number, string>();

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

  restaurants$ = this.svc.list().pipe(
    map((restaurants) =>
      restaurants.map((restaurant) => ({
        ...restaurant,
        heroPhoto: this.ensureHeroPhoto(restaurant),
      })),
    ),
  );

  shouldShowProfilePrompt(): boolean {
    const user = this.auth.user();
    if (!user) {
      return false;
    }

    return !this.hasCompletedProfile(user);
  }

  private hasCompletedProfile(user: SessionUser | null): boolean {
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

    return resolved || this.i18n.translate('restaurants.defaultDescription', 'Popular choices • Comfort food');
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
