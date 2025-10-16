import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MenuOption } from '../core/models';

export interface MenuOptionItemInput {
  id?: number;
  menu_item_option_id?: number;
  menu_item_id: number;
  price_modifier_type: string | null;
  price_modifier_amount_cents: number | null;
  price_modifier_percentage: number | null;
}

export interface MenuOptionInput {
  title: string;
  category_id: number;
  min_selections: number;
  max_selections: number;
  option_items?: MenuOptionItemInput[];
}

@Injectable({ providedIn: 'root' })
export class MenuOptionsService {
  private api = inject(ApiService);

  listByRestaurant(restaurantId: number): Observable<MenuOption[]> {
    return this.api.get<MenuOption[]>(`/options?restaurant_id=${restaurantId}`);
  }

  create(restaurantId: number, payload: MenuOptionInput): Observable<MenuOption> {
    const option = { ...payload, restaurant_id: restaurantId } as MenuOptionInput & {
      restaurant_id: number;
    };
    if (!option.option_items || !option.option_items.length) {
      delete option.option_items;
    }

    return this.api.post<MenuOption>('/options', { option });
  }

  update(id: number, payload: MenuOptionInput): Observable<MenuOption> {
    const option: MenuOptionInput = { ...payload };
    if (!option.option_items || !option.option_items.length) {
      delete option.option_items;
    }

    return this.api.put<MenuOption>(`/options/${id}`, { option });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/options/${id}`);
  }
}
