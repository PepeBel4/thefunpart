import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MenuItemOption, MenuItemOptionInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuItemOptionsService {
  private api = inject(ApiService);

  listByRestaurant(restaurantId: number): Observable<MenuItemOption[]> {
    return this.api.get<MenuItemOption[]>(`/menu_item_options?restaurant_id=${restaurantId}`);
  }

  create(payload: MenuItemOptionInput): Observable<MenuItemOption> {
    return this.api.post<MenuItemOption>('/menu_item_options', { menu_item_option: payload });
  }

  update(id: number, payload: MenuItemOptionInput): Observable<MenuItemOption> {
    return this.api.put<MenuItemOption>(`/menu_item_options/${id}`, { menu_item_option: payload });
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/menu_item_options/${id}`);
  }
}
