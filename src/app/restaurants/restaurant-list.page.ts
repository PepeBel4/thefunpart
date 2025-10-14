import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Restaurant } from '../core/models';
import { RestaurantService } from './restaurant.service';

@Component({
  standalone: true,
  selector: 'app-restaurant-list',
  imports: [AsyncPipe, RouterLink, NgFor, NgIf],
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
      <h2>Discover near you</h2>
      <p class="subhead">Hand-picked favourites delivering fast, just like the Uber Eats app.</p>
    </div>
    <div class="grid" *ngIf="restaurants$ | async as restaurants">
      <a class="card" *ngFor="let r of restaurants" [routerLink]="['/restaurants', r.id]">
        <div class="card-media">
          <ng-container *ngIf="r.heroPhoto; else placeholder">
            <img [src]="r.heroPhoto" [alt]="r.name" loading="lazy" />
          </ng-container>
          <ng-template #placeholder>
            <span class="placeholder">{{ r.name.charAt(0) }}</span>
          </ng-template>
        </div>
        <div class="card-body">
          <h3>{{ r.name }}</h3>
          <p>{{ r.description || 'Popular choices • Comfort food' }}</p>
          <div class="meta">
            <span class="pill">Express</span>
            <span>20-30 min</span>
            <span>€€</span>
          </div>
        </div>
      </a>
    </div>
  `
})
export class RestaurantListPage {
  private svc = inject(RestaurantService);
  private heroPhotoCache = new Map<number, string>();

  private ensureHeroPhoto(restaurant: Restaurant): string | undefined {
    const cached = this.heroPhotoCache.get(restaurant.id);
    if (cached) {
      return cached;
    }

    const urls = restaurant.photo_urls;
    if (!urls?.length) {
      return undefined;
    }

    const choice = urls[Math.floor(Math.random() * urls.length)];
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
}
