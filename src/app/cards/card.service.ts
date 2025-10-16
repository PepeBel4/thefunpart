import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Card } from '../core/models';

@Injectable({ providedIn: 'root' })
export class CardService {
  private api = inject(ApiService);
  private cards$ = this.api.get<Card[]>('/cards').pipe(shareReplay({ bufferSize: 1, refCount: true }));

  list(): Observable<Card[]> {
    return this.cards$;
  }

  findForRestaurant(restaurantId: number, chainId?: number | null): Observable<Card | null> {
    return this.list().pipe(
      map(cards => {
        const restaurantCard = cards.find(card => {
          const targetRestaurantId = card.restaurant_id ?? card.restaurant?.id ?? null;
          return targetRestaurantId === restaurantId;
        });

        if (restaurantCard) {
          return restaurantCard;
        }

        if (chainId == null) {
          return null;
        }

        return this.pickCardForChain(cards, chainId);
      })
    );
  }

  findForChain(chainId: number): Observable<Card | null> {
    return chainId > 0
      ? this.list().pipe(map(cards => this.pickCardForChain(cards, chainId)))
      : of(null);
  }

  private pickCardForChain(cards: Card[], chainId: number): Card | null {
    return (
      cards.find(card => {
        const targetChainId = card.chain_id ?? card.chain?.id ?? null;
        return targetChainId === chainId;
      }) ?? null
    );
  }
}
