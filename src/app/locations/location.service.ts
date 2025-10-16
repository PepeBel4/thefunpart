import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Location, LocationInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = inject(ApiService);

  listForRestaurant(restaurantId: number) {
    return this.api.get<Location[]>('/locations', {
      params: {
        locatable_type: 'Restaurant',
        locatable_id: restaurantId,
      },
    });
  }

  createForRestaurant(restaurantId: number, payload: LocationInput) {
    return this.api.post<Location>('/locations', {
      location: {
        ...payload,
        locatable_type: 'Restaurant',
        locatable_id: restaurantId,
      },
    });
  }

  update(id: number, payload: LocationInput) {
    return this.api.put<Location>(`/locations/${id}`, {
      location: payload,
    });
  }

  delete(id: number) {
    return this.api.delete<void>(`/locations/${id}`);
  }
}
