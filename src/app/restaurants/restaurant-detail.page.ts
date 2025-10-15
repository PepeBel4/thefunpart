import { Component, LOCALE_ID, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../menu/menu.service';
import { RestaurantService } from './restaurant.service';
import { AsyncPipe, CurrencyPipe, NgIf, NgFor, DOCUMENT } from '@angular/common';
import { MenuItem, Restaurant } from '../core/models';
import { Observable, firstValueFrom, map } from 'rxjs';
import { CartService } from '../cart/cart.service';

type MenuCategoryGroup = { name: string; anchor: string; items: MenuItem[]; value: string | null };

@Component({
  standalone: true,
  selector: 'app-restaurant-detail',
  imports: [AsyncPipe, CurrencyPipe, NgFor, NgIf],
  styles: [`
    :host {
      display: block;
    }

    .hero {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2.5rem clamp(1.5rem, 4vw, 3rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
    }

    .hero-title {
      font-size: clamp(2.25rem, 4vw, 3rem);
      font-weight: 700;
      letter-spacing: -0.045em;
      margin: 0;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      color: var(--text-secondary);
    }

    .hero-meta span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .tag {
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
    }

    h3 {
      margin-top: 0;
      font-size: 1.5rem;
    }

    .photos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .photo-card {
      position: relative;
      border-radius: var(--radius-card);
      overflow: hidden;
      background: var(--surface);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      aspect-ratio: 4 / 3;
    }

    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .category-nav {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }

    .category-nav button {
      border: 1px solid var(--border-soft);
      background: var(--surface);
      border-radius: 999px;
      padding: 0.45rem 1rem;
      cursor: pointer;
      font-weight: 600;
      color: var(--text-secondary);
      transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }

    .category-nav button:hover {
      background: rgba(6, 193, 103, 0.12);
      color: var(--brand-green);
      box-shadow: 0 6px 16px rgba(6, 193, 103, 0.16);
    }

    .menu-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
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
      }

      .menu-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <ng-container *ngIf="(restaurant$ | async) as r">
      <section class="hero">
        <h2 class="hero-title">{{ r.name }}</h2>
        <p>{{ r.description || 'Fresh meals, crafted for delivery.' }}</p>
        <div class="hero-meta">
          <span class="tag">Popular</span>
          <span>⭐ 4.8</span>
          <span>20-30 min</span>
          <span>Free delivery over €15</span>
        </div>
      </section>

      <section *ngIf="r.photo_urls?.length" class="photos">
        <figure class="photo-card" *ngFor="let url of r.photo_urls">
          <img [src]="url" [alt]="r.name + ' photo'" loading="lazy" />
        </figure>
      </section>
      <ng-container *ngIf="(menuCategories$ | async) as menuCategories">
        <h3 *ngIf="menuCategories.length">Menu</h3>
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
              <p>{{ m.description || 'Customer favourite' }}</p>
              <span class="price">{{ (m.price_cents / 100) | currency:'EUR' }}</span>
              <button (click)="addToCart(m, category.value)">Add to cart</button>
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
  private locale = inject(LOCALE_ID);

  id = Number(this.route.snapshot.paramMap.get('id'));
  restaurant$: Observable<Restaurant> = this.rSvc.get(this.id);
  menuCategories$: Observable<MenuCategoryGroup[]> = this.menuSvc
    .listByRestaurant(this.id)
    .pipe(map(items => this.organizeMenu(items)));

  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

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
      this.statusMessage = 'Photos uploaded successfully!';
      this.statusType = 'success';
      this.restaurant$ = this.rSvc.get(this.id);
      this.refreshMenu();
    } catch (err) {
      console.error(err);
      this.statusMessage = 'Something went wrong while uploading photos. Please try again.';
      this.statusType = 'error';
    } finally {
      this.uploading = false;
    }
  }

  refreshMenu() {
    this.menuCategories$ = this.menuSvc.listByRestaurant(this.id).pipe(map(items => this.organizeMenu(items)));
  }

  addToCart(item: MenuItem, categoryName: string | null) {
    this.cart.add(item, categoryName);
  }

  scrollTo(anchor: string) {
    this.document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              value: label,
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
        name: 'Other items',
        anchor: 'category-uncategorized',
        items: fallback,
        value: null,
      });
    }

    return result;
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
    const normalized = (this.locale ?? '').toString().trim().toLowerCase();
    const candidates = new Set<string>();

    if (normalized) {
      candidates.add(normalized);
      const [languagePart] = normalized.split('-');
      if (languagePart) {
        candidates.add(languagePart);
      }
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
