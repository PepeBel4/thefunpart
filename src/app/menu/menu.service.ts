import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuItem, MenuItemInput } from '../core/models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private api = inject(ApiService);
  listByRestaurant(restaurantId: number) { return this.api.get<MenuItem[]>(`/menu_items?restaurant_id=${restaurantId}`); }
  get(id: number) { return this.api.get<MenuItem>(`/menu_items/${id}`); }
  create(restaurantId: number, payload: MenuItemInput) {
    return this.api.post<MenuItem>('/menu_items', { menu_item: { ...payload, restaurant_id: restaurantId } });
  }
  update(id: number, payload: MenuItemInput) {
    return this.api.put<MenuItem>(`/menu_items/${id}`, { menu_item: payload });
  }
  delete(id: number) {
    return this.api.delete<void>(`/menu_items/${id}`);
  }
  uploadPhotos(menuItemId: number, files: File[]): Observable<MenuItem> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.api.post<MenuItem>(`/menu_items/${menuItemId}/photos`, formData);
  }
  deletePhoto(menuItemId: number, photoId: number): Observable<MenuItem> {
    return this.api.delete<MenuItem>(`/menu_items/${menuItemId}/photos/${photoId}`);
  }
}
