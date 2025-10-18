import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminChainContextService } from './admin-chain-context.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { Restaurant } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

interface ChainRestaurantsStateIdle {
  status: 'idle';
}

interface ChainRestaurantsStateLoading {
  status: 'loading';
  chainName: string;
}

interface ChainRestaurantsStateReady {
  status: 'ready';
  chainName: string;
  restaurants: Restaurant[];
}

interface ChainRestaurantsStateEmpty {
  status: 'empty';
  chainName: string;
}

interface ChainRestaurantsStateError {
  status: 'error';
  chainName: string;
}

type ChainRestaurantsState =
  | ChainRestaurantsStateIdle
  | ChainRestaurantsStateLoading
  | ChainRestaurantsStateReady
  | ChainRestaurantsStateEmpty
  | ChainRestaurantsStateError;

@Component({
  standalone: true,
  selector: 'app-admin-chain-restaurants',
  imports: [AsyncPipe, NgFor, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.75rem, 3vw, 2.25rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.75rem;
    }

    li {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.75rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid rgba(10, 10, 10, 0.08);
      background: rgba(255, 255, 255, 0.7);
    }

    li h4 {
      margin: 0;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
    }

    li span {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .empty-state {
      color: var(--text-secondary);
    }
  `],
  template: `
    <section class="card" *ngIf="state$ | async as state">
      <header>
        <h3>{{ 'admin.chain.restaurants.title' | translate: 'Chain restaurants' }}</h3>
        <p>
          {{
            'admin.chain.restaurants.subtitle'
              | translate: 'Review all restaurants that operate under this chain.'
          }}
        </p>
      </header>

      <ng-container *ngIf="state.status === 'idle'">
        <p class="empty-state">
          {{ 'admin.chain.restaurants.idle' | translate: 'Select a chain to see its restaurants.' }}
        </p>
      </ng-container>

      <ng-container *ngIf="state.status === 'loading'">
        <p class="empty-state">
          {{ 'admin.chain.restaurants.loading' | translate: 'Loading restaurants…' }}
        </p>
      </ng-container>

      <ng-container *ngIf="state.status === 'error'">
        <p class="empty-state">
          {{
            'admin.chain.restaurants.error'
              | translate: 'We could not load the restaurants for this chain. Please try again.'
          }}
        </p>
      </ng-container>

      <ng-container *ngIf="state.status === 'empty'">
        <p class="empty-state">
          {{
            'admin.chain.restaurants.empty'
              | translate: 'There are no restaurants assigned to this chain yet.'
          }}
        </p>
      </ng-container>

      <ng-container *ngIf="isReadyState(state)">
        <ul>
          <li *ngFor="let restaurant of state.restaurants">
            <h4>{{ restaurant.name }}</h4>
            <span>#{{ restaurant.id }}</span>
          </li>
        </ul>
      </ng-container>
    </section>
  `,
})
export class AdminChainRestaurantsPage {
  private context = inject(AdminChainContextService);
  private restaurants = inject(RestaurantService);

  readonly state$ = this.context.selectedChain$.pipe(
    switchMap(chain => {
      if (!chain) {
        return of<ChainRestaurantsState>({ status: 'idle' });
      }

      return this.restaurants.list().pipe(
        map(restaurants => {
          const belonging = restaurants.filter(restaurant => {
            const chainId = restaurant.chain?.id ?? restaurant.chain_id ?? null;
            return chainId === chain.id;
          });

          if (!belonging.length) {
            return { status: 'empty', chainName: chain.name } as ChainRestaurantsState;
          }

          return {
            status: 'ready',
            chainName: chain.name,
            restaurants: belonging.sort((a, b) => a.name.localeCompare(b.name)),
          } as ChainRestaurantsState;
        }),
        startWith<ChainRestaurantsState>({ status: 'loading', chainName: chain.name }),
        catchError(() =>
          of<ChainRestaurantsState>({ status: 'error', chainName: chain.name })
        )
      );
    })
  );

  isReadyState(state: ChainRestaurantsState): state is ChainRestaurantsStateReady {
    return state.status === 'ready';
  }
}
