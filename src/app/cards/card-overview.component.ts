import {
  CurrencyPipe,
  NgFor,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgTemplateOutlet,
} from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';
import { Card, Restaurant } from '../core/models';
import { CardService } from './card.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { RouterLink } from '@angular/router';

interface CardOverviewEntry {
  id: number;
  type: 'restaurant' | 'chain';
  title: string;
  subtitle: string | null;
  loyaltyPoints: number;
  creditCents: number;
  creditEuros: number;
  heroPhoto: string | null;
  placeholderInitial: string;
  linkCommands: (string | number)[] | null;
}

interface CardOverviewState {
  status: 'loading' | 'ready' | 'empty' | 'error';
  cards: CardOverviewEntry[];
}

@Component({
  selector: 'app-card-overview',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }

    section.cards-shell {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem 1.75rem;
      border-radius: var(--radius-card);
      border: 1px solid rgba(6, 193, 103, 0.18);
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.14), rgba(6, 193, 103, 0.03));
      box-shadow: var(--shadow-soft);
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1rem 1.1rem 1.25rem;
      border-radius: calc(var(--radius-card) - 6px);
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.05);
      box-shadow: var(--shadow-soft);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
    }

    .card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(6, 193, 103, 0.12), transparent 70%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .card:hover::after {
      opacity: 1;
    }

    .card-media {
      position: relative;
      width: 100%;
      aspect-ratio: 4 / 3;
      border-radius: calc(var(--radius-card) - 10px);
      overflow: hidden;
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.14), rgba(6, 193, 103, 0.05));
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
      font-size: 2.25rem;
      font-weight: 700;
      color: rgba(10, 10, 10, 0.6);
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }

    .card-type {
      align-self: flex-start;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      background: rgba(6, 193, 103, 0.14);
      color: var(--brand-green);
      font-weight: 600;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .card-content h4 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .card-content p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .balances {
      margin-top: 0.75rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.75rem;
    }

    .metric {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.55rem 0.65rem;
      border-radius: 14px;
      background: rgba(6, 193, 103, 0.08);
    }

    .metric .label {
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }

    .metric .value {
      font-size: 1.05rem;
      font-weight: 700;
    }

    section.state-card {
      padding: 1.35rem 1.5rem;
      border-radius: var(--radius-card);
      border: 1px dashed rgba(10, 10, 10, 0.18);
      background: rgba(10, 10, 10, 0.02);
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    section.state-card h4 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
    }

    @media (max-width: 720px) {
      section.cards-shell {
        padding: 1.25rem 1.35rem;
      }

      .card {
        padding: 0.9rem 1rem 1.1rem;
      }
    }
  `],
  template: `
    <ng-container [ngSwitch]="state().status">
      <section class="cards-shell" *ngSwitchCase="'ready'">
        <div class="header">
          <h3>Your loyalty cards</h3>
          <p>Track your points and credit across your favourite spots.</p>
        </div>
        <div class="cards-grid">
          <ng-container *ngFor="let card of state().cards">
            <a
              *ngIf="card.linkCommands; else staticCard"
              class="card"
              [routerLink]="card.linkCommands"
              [attr.aria-label]="
                card.type === 'chain' ? 'View ' + card.title + ' restaurants' : 'View ' + card.title
              "
            >
              <ng-container *ngTemplateOutlet="cardContent; context: { $implicit: card }"></ng-container>
            </a>
            <ng-template #staticCard>
              <article class="card">
                <ng-container *ngTemplateOutlet="cardContent; context: { $implicit: card }"></ng-container>
              </article>
            </ng-template>
          </ng-container>
          <ng-template #cardContent let-card>
            <div class="card-media">
              <ng-container *ngIf="card.heroPhoto; else fallback">
                <img [src]="card.heroPhoto!" [alt]="card.title" loading="lazy" />
              </ng-container>
              <ng-template #fallback>
                <span class="placeholder">{{ card.placeholderInitial }}</span>
              </ng-template>
            </div>
            <div class="card-content">
              <span class="card-type">{{ card.type === 'chain' ? 'Chain card' : 'Restaurant card' }}</span>
              <h4>{{ card.title }}</h4>
              <p *ngIf="card.subtitle">Includes: {{ card.subtitle }}</p>
              <div class="balances">
                <div class="metric">
                  <span class="label">Loyalty points</span>
                  <span class="value">{{ card.loyaltyPoints }}</span>
                </div>
                <div class="metric">
                  <span class="label">Credit</span>
                  <span class="value">{{ card.creditEuros | currency:'EUR' }}</span>
                </div>
              </div>
            </div>
          </ng-template>
        </div>
      </section>
      <section class="state-card" *ngSwitchCase="'loading'">
        <h4>Loading your cards…</h4>
        <p>Hang tight while we fetch your latest balances.</p>
      </section>
      <section class="state-card" *ngSwitchCase="'empty'">
        <h4>No cards yet</h4>
        <p>Start earning rewards by adding a loyalty card from a participating restaurant.</p>
      </section>
      <section class="state-card" *ngSwitchCase="'error'">
        <h4>We couldn't load your cards</h4>
        <p>Please refresh the page or try again later.</p>
      </section>
      <section class="state-card" *ngSwitchDefault>
        <h4>Your cards</h4>
        <p>Stay tuned for updates.</p>
      </section>
    </ng-container>
  `
})
export class CardOverviewComponent {
  private cards = inject(CardService);
  private restaurants = inject(RestaurantService);
  private heroCache = new Map<number, string>();

  state = signal<CardOverviewState>({ status: 'loading', cards: [] });

  constructor() {
    this.cards
      .list()
      .pipe(
        takeUntilDestroyed(),
        tap(() => this.state.set({ status: 'loading', cards: [] })),
        switchMap(cards => {
          if (!cards.length) {
            this.state.set({ status: 'empty', cards: [] });
            return EMPTY;
          }

          return this.restaurants.list().pipe(
            map(restaurants => this.presentCards(cards, restaurants))
          );
        }),
        catchError(() => {
          this.state.set({ status: 'error', cards: [] });
          return EMPTY;
        })
      )
      .subscribe(presented => {
        if (!presented.length) {
          this.state.set({ status: 'empty', cards: [] });
          return;
        }

        this.state.set({ status: 'ready', cards: presented });
      });
  }

  private presentCards(cards: Card[], restaurants: Restaurant[]): CardOverviewEntry[] {
    return cards.map(card => this.presentCard(card, restaurants));
  }

  private presentCard(card: Card, restaurants: Restaurant[]): CardOverviewEntry {
    const type: 'restaurant' | 'chain' = card.chain_id || card.chain ? 'chain' : 'restaurant';
    const title = (card.restaurant?.name ?? card.chain?.name ?? 'Loyalty card').trim() || 'Loyalty card';
    const associatedRestaurant = this.resolveRestaurantForCard(card, restaurants);
    const subtitle = type === 'chain' ? associatedRestaurant?.name ?? null : null;
    const heroPhoto = this.ensureHeroPhoto(card.id, associatedRestaurant);

    return {
      id: card.id,
      type,
      title,
      subtitle,
      loyaltyPoints: card.loyalty_points,
      creditCents: card.credit_cents,
      creditEuros: card.credit_cents / 100,
      heroPhoto,
      placeholderInitial: this.buildInitial(title),
      linkCommands: this.buildLinkCommands(type, card, associatedRestaurant),
    };
  }

  private resolveRestaurantForCard(card: Card, restaurants: Restaurant[]): Restaurant | undefined {
    if (card.restaurant_id || card.restaurant?.id) {
      const targetId = card.restaurant_id ?? card.restaurant?.id ?? null;
      if (targetId != null) {
        const match = restaurants.find(restaurant => restaurant.id === targetId);
        if (match) {
          return match;
        }
      }
    }

    const chainId = card.chain_id ?? card.chain?.id ?? null;
    if (chainId != null) {
      const chainRestaurants = restaurants.filter(restaurant => {
        const fromChain = restaurant.chain?.id ?? restaurant.chain_id ?? null;
        return fromChain === chainId;
      });

      if (chainRestaurants.length) {
        const randomIndex = Math.floor(Math.random() * chainRestaurants.length);
        return chainRestaurants[randomIndex];
      }
    }

    return undefined;
  }

  private ensureHeroPhoto(cardId: number, restaurant: Restaurant | undefined): string | null {
    const cached = this.heroCache.get(cardId);
    if (cached) {
      return cached;
    }

    const photo = this.pickRestaurantPhoto(restaurant);
    if (photo) {
      this.heroCache.set(cardId, photo);
      return photo;
    }

    return null;
  }

  private pickRestaurantPhoto(restaurant: Restaurant | undefined): string | null {
    if (!restaurant) {
      return null;
    }

    const urls: string[] = [];
    if (restaurant.photos?.length) {
      urls.push(...restaurant.photos.map(photo => photo.url).filter((url): url is string => Boolean(url)));
    }
    if (restaurant.photo_urls?.length) {
      urls.push(...restaurant.photo_urls.filter((url): url is string => Boolean(url)));
    }

    if (!urls.length) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * urls.length);
    return urls[randomIndex] ?? null;
  }

  private buildInitial(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      return '?';
    }

    const [firstWord] = trimmed.split(/\s+/);
    return firstWord?.charAt(0).toUpperCase() ?? '?';
  }

  private buildLinkCommands(
    type: 'restaurant' | 'chain',
    card: Card,
    associatedRestaurant: Restaurant | undefined
  ): (string | number)[] | null {
    const restaurantId = card.restaurant_id ?? card.restaurant?.id ?? associatedRestaurant?.id ?? null;
    const chainId = card.chain_id ?? card.chain?.id ?? null;

    if (type === 'chain' && chainId != null) {
      return ['/chains', chainId];
    }

    if (type === 'restaurant' && restaurantId != null) {
      return ['/restaurants', restaurantId];
    }

    if (restaurantId != null) {
      return ['/restaurants', restaurantId];
    }

    return null;
  }
}
