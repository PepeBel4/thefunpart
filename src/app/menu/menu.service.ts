import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuItem } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = inject(ApiService);
  listByRestaurant(restaurantId: number) { return this.api.get<MenuItem[]>(`/menu_items?restaurant_id=${restaurantId}`); }
  get(id: number) { return this.api.get<MenuItem>(`/menu_items/${id}`); }
}
