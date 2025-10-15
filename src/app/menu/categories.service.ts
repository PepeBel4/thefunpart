import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuItemCategory } from '../core/models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private api = inject(ApiService);

  list(restaurantId?: number) {
    const query = restaurantId != null ? `?restaurant_id=${restaurantId}` : '';
    return this.api.get<MenuItemCategory[]>(`/categories${query}`);
  }
}
