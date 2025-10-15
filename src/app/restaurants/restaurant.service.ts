import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Restaurant, RestaurantUpdateInput } from '../core/models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private api = inject(ApiService);

  list() { return this.api.get<Restaurant[]>('/restaurants'); }
  get(id: number) { return this.api.get<Restaurant>(`/restaurants/${id}`); }

  uploadPhotos(id: number, files: File[]): Observable<Restaurant> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.api.post<Restaurant>(`/restaurants/${id}/photos`, formData);
  }

  deletePhoto(restaurantId: number, photoId: number): Observable<Restaurant> {
    return this.api.delete<Restaurant>(`/restaurants/${restaurantId}/photos/${photoId}`);
  }

  update(restaurantId: number, payload: RestaurantUpdateInput): Observable<Restaurant> {
    return this.api.put<Restaurant>(`/restaurants/${restaurantId}`, payload);
  }
}
