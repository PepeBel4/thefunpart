import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, map, of, switchMap, tap } from 'rxjs';
import { Card, Restaurant } from '../core/models';
import { RestaurantService } from '../restaurants/restaurant.service';
import { CardService } from '../cards/card.service';
import { CardSpotlightEntry, CardSpotlightService } from '../cards/card-spotlight.service';

interface ChainDetailState {
  status: 'loading' | 'ready' | 'empty' | 'error';
  chainName: string;
  restaurants: Restaurant[];
}

@Component({
  standalone: true,
  selector: 'app-chain-detail',
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault, RouterLink],
  styles: [`
    :host {
      display: block;
    }

    .chain-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .header h2 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.75rem);
      font-weight: 700;
      letter-spacing: -0.035em;
    }

    .header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .restaurant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.1rem;
    }

    a.restaurant-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.2rem 1.35rem;
      border-radius: var(--radius-card);
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.05);
      box-shadow: var(--shadow-soft);
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    a.restaurant-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
    }

    .restaurant-card h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .restaurant-card p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .restaurant-card .cta {
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      color: var(--brand-green);
    }

    .restaurant-card .cta::after {
      content: '›';
      font-size: 1.15rem;
      line-height: 1;
    }

    .state-card {
      padding: 1.4rem 1.6rem;
      border-radius: var(--radius-card);
      border: 1px dashed rgba(10, 10, 10, 0.16);
      background: rgba(10, 10, 10, 0.03);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      color: var(--text-secondary);
    }

    .state-card h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    @media (max-width: 720px) {
      .restaurant-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }

      a.restaurant-card {
        padding: 1rem 1.1rem;
      }
    }
  `],
  template: `
    <ng-container [ngSwitch]="state().status">
      <section class="chain-shell" *ngSwitchCase="'ready'">
        <div class="header">
          <h2>{{ state().chainName }}</h2>
          <p>Select a location to view its menu and rewards.</p>
        </div>
        <div class="restaurant-grid">
          <a
            class="restaurant-card"
            *ngFor="let restaurant of state().restaurants"
            [routerLink]="['/restaurants', restaurant.slug ?? restaurant.id]"
          >
            <h3>{{ restaurant.name }}</h3>
            <p *ngIf="restaurant.description as description">{{ description }}</p>
            <span class="cta">View restaurant</span>
          </a>
        </div>
      </section>
      <section class="state-card" *ngSwitchCase="'loading'">
        <h3>Loading chain details…</h3>
        <p>Please hold on while we find the restaurants for this chain.</p>
      </section>
      <section class="state-card" *ngSwitchCase="'empty'">
        <h3>No restaurants found</h3>
        <p>We couldn\'t find any restaurants assigned to this chain just yet.</p>
      </section>
      <section class="state-card" *ngSwitchCase="'error'">
        <h3>We couldn\'t load this chain</h3>
        <p>Please refresh the page or return to the home screen.</p>
      </section>
      <section class="state-card" *ngSwitchDefault>
        <h3>Chain overview</h3>
        <p>Fetching the latest information…</p>
      </section>
    </ng-container>
  `,
})
export class ChainDetailPage implements OnDestroy {
  private route = inject(ActivatedRoute);
  private restaurants = inject(RestaurantService);
  private cards = inject(CardService);
  private cardSpotlight = inject(CardSpotlightService);
  private chainCard: Card | null = null;
  private currentChainId: number | null = null;

  readonly state = signal<ChainDetailState>({ status: 'loading', chainName: 'Chain', restaurants: [] });

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map(params => Number(params.get('id'))),
        tap(chainId => {
          const validId = Number.isFinite(chainId) && chainId > 0 ? chainId : null;
          const chainName = validId ? `Chain #${validId}` : 'Chain';
          this.currentChainId = validId;
          if (validId == null) {
            this.chainCard = null;
            this.cardSpotlight.clear();
          }
          this.state.set({ status: 'loading', chainName, restaurants: [] });
        }),
        switchMap(chainId => {
          if (!Number.isFinite(chainId) || chainId <= 0) {
            const fallback = this.state().chainName || 'Chain';
            this.state.set({ status: 'error', chainName: fallback, restaurants: [] });
            return EMPTY;
          }

          return this.restaurants.list().pipe(
            map(restaurants => this.buildState(chainId, restaurants))
          );
        }),
        catchError(() => {
          const fallback = this.state().chainName || 'Chain';
          this.state.set({ status: 'error', chainName: fallback, restaurants: [] });
          return EMPTY;
        })
      )
      .subscribe(state => {
        this.state.set(state);
        this.updateChainSpotlight();
      });

    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map(params => Number(params.get('id'))),
        switchMap(chainId => {
          if (!Number.isFinite(chainId) || chainId <= 0) {
            return of(null);
          }

          return this.cards.findForChain(chainId);
        })
      )
      .subscribe(card => {
        this.chainCard = card;
        this.updateChainSpotlight();
      });
  }

  ngOnDestroy(): void {
    this.cardSpotlight.clear();
  }

  private updateChainSpotlight() {
    const snapshot = this.state();
    if (snapshot.status !== 'ready' || !this.chainCard) {
      this.cardSpotlight.clear();
      return;
    }

    this.cardSpotlight.set(this.presentChainSpotlight(snapshot, this.chainCard));
  }

  private presentChainSpotlight(state: ChainDetailState, card: Card): CardSpotlightEntry {
    const type: 'restaurant' | 'chain' = card.chain_id || card.chain ? 'chain' : 'restaurant';
    const titleSource =
      (type === 'chain' ? card.chain?.name : card.restaurant?.name) ??
      card.chain?.name ??
      card.restaurant?.name ??
      state.chainName ??
      'Loyalty card';
    const title = titleSource.trim() || 'Loyalty card';
    const subtitle =
      type === 'chain'
        ? this.buildChainSubtitle(state.restaurants.length)
        : card.restaurant?.name ?? null;

    return {
      id: card.id,
      type,
      title,
      subtitle,
      loyaltyPoints: card.loyalty_points,
      creditCents: card.credit_cents,
      heroPhoto: this.pickChainHeroPhoto(state.restaurants),
      placeholderInitial: this.buildSpotlightInitial(title),
      linkCommands: this.buildChainLinkCommands(type, card),
    };
  }

  private buildChainSubtitle(count: number): string | null {
    if (!count) {
      return null;
    }

    return count === 1 ? 'Valid at 1 location' : `Valid at ${count} locations`;
  }

  private buildChainLinkCommands(type: 'restaurant' | 'chain', card: Card): (string | number)[] | null {
    const chainId = card.chain_id ?? card.chain?.id ?? this.currentChainId;
    const restaurantId = card.restaurant_id ?? card.restaurant?.id ?? null;
    const restaurantSlug =
      card.restaurant?.slug ??
      (restaurantId != null
        ? this.state()
            .restaurants.find(restaurant => restaurant.id === restaurantId)?.slug ?? null
        : null);

    if (type === 'chain' && chainId != null) {
      return ['/chains', chainId];
    }

    if (restaurantSlug != null || restaurantId != null) {
      const segment = restaurantSlug ?? restaurantId;
      if (segment != null) {
        return ['/restaurants', segment];
      }
    }

    if (chainId != null) {
      return ['/chains', chainId];
    }

    return null;
  }

  private pickChainHeroPhoto(restaurants: Restaurant[]): string | null {
    for (const restaurant of restaurants) {
      const candidates = this.collectRestaurantPhotos(restaurant);
      if (candidates.length) {
        return candidates[0] ?? null;
      }
    }

    return null;
  }

  private collectRestaurantPhotos(restaurant: Restaurant): string[] {
    const candidates: string[] = [];

    if (restaurant.photos?.length) {
      candidates.push(...restaurant.photos.map(photo => photo.url).filter((url): url is string => Boolean(url)));
    }

    if (restaurant.photo_urls?.length) {
      candidates.push(...restaurant.photo_urls.filter((url): url is string => Boolean(url)));
    }

    return candidates;
  }

  private buildSpotlightInitial(title: string): string {
    const trimmed = title.trim();
    if (!trimmed) {
      return '?';
    }

    const [firstWord] = trimmed.split(/\s+/);
    return firstWord?.charAt(0).toUpperCase() ?? '?';
  }

  private buildState(chainId: number, restaurants: Restaurant[]): ChainDetailState {
    const belonging = restaurants.filter(restaurant => {
      const id = restaurant.chain?.id ?? restaurant.chain_id ?? null;
      return id === chainId;
    });

    if (!belonging.length) {
      return { status: 'empty', chainName: `Chain #${chainId}`, restaurants: [] };
    }

    const chainName = belonging[0]?.chain?.name?.trim() || `Chain #${chainId}`;

    return {
      status: 'ready',
      chainName,
      restaurants: belonging.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
