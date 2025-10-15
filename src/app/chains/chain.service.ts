import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Chain } from '../core/models';

interface ChainInput {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ChainService {
  private api = inject(ApiService);

  list(): Observable<Chain[]> {
    return this.api.get<Chain[]>('/chains');
  }

  create(payload: ChainInput): Observable<Chain> {
    return this.api.post<Chain>('/chains', payload);
  }

  addChainToRestaurant(restaurantId: number, chainId: number): Observable<void> {
    return this.api.post<void>(`/restaurants/${restaurantId}/chains`, { chain_id: chainId });
  }

  removeChainFromRestaurant(restaurantId: number, chainId: number): Observable<void> {
    return this.api.delete<void>(`/restaurants/${restaurantId}/chains/${chainId}`);
  }
}
