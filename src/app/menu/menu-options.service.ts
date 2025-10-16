import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MenuOption } from '../core/models';

export interface MenuOptionInput {
  title: string;
  name?: string;
  description?: string | null;
  price_cents?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MenuOptionsService {
  private api = inject(ApiService);

  listByRestaurant(restaurantId: number): Observable<MenuOption[]> {
    return this.api.get<MenuOption[]>(`/options?restaurant_id=${restaurantId}`);
  }

  create(restaurantId: number, payload: MenuOptionInput): Observable<MenuOption> {
    return this.api.post<MenuOption>('/options', {
      option: { ...payload, restaurant_id: restaurantId },
    });
  }

  update(id: number, payload: MenuOptionInput): Observable<MenuOption> {
    return this.api.put<MenuOption>(`/options/${id}`, { option: payload });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/options/${id}`);
  }
}
