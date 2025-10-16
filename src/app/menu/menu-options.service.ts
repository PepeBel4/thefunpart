import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MenuOption } from '../core/models';

export interface MenuOptionInput {
  name: string;
  description?: string | null;
  price_cents?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MenuOptionsService {
  private api = inject(ApiService);

  listByRestaurant(restaurantId: number): Observable<MenuOption[]> {
    return this.api.get<MenuOption[]>(`/menu_options?restaurant_id=${restaurantId}`);
  }

  create(restaurantId: number, payload: MenuOptionInput): Observable<MenuOption> {
    return this.api.post<MenuOption>('/menu_options', {
      menu_option: { ...payload, restaurant_id: restaurantId },
    });
  }

  update(id: number, payload: MenuOptionInput): Observable<MenuOption> {
    return this.api.put<MenuOption>(`/menu_options/${id}`, { menu_option: payload });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/menu_options/${id}`);
  }
}
