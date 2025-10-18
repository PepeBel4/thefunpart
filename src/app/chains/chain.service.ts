import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Chain } from '../core/models';

interface ChainInput {
  name: string;
}

interface ChainUpdateInput {
  name?: string;
  loyalty_program_enabled?: boolean;
  loyalty_points_earn_amount_cents?: number | null;
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

  update(id: number, payload: ChainUpdateInput): Observable<Chain> {
    return this.api.put<Chain>(`/chains/${id}`, payload);
  }
}
