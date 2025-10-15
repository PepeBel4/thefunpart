import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Chain, Restaurant, RestaurantUpdateInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private api = inject(ApiService);

  private normalizeRestaurant(restaurant: RestaurantApiResponse): Restaurant {
    const { chain, chains, ...rest } = restaurant;

    const combinedChains = [
      ...(Array.isArray(chains) ? chains.filter((item): item is Chain => !!item) : []),
      ...(chain ? [chain] : []),
    ];

    const uniqueChains = Array.from(new Map(combinedChains.map(item => [item.id, item])).values());

    return {
      ...rest,
      chains: uniqueChains,
    };
  }

  list() {
    return this.api
      .get<RestaurantApiResponse[]>('/restaurants')
      .pipe(map(restaurants => restaurants.map(restaurant => this.normalizeRestaurant(restaurant))));
  }

  get(id: number) {
    return this.api
      .get<RestaurantApiResponse>(`/restaurants/${id}`)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  uploadPhotos(id: number, files: File[]): Observable<Restaurant> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.api
      .post<RestaurantApiResponse>(`/restaurants/${id}/photos`, formData)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  deletePhoto(restaurantId: number, photoId: number): Observable<Restaurant> {
    return this.api
      .delete<RestaurantApiResponse>(`/restaurants/${restaurantId}/photos/${photoId}`)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  update(restaurantId: number, payload: RestaurantUpdateInput): Observable<Restaurant> {
    return this.api
      .put<RestaurantApiResponse>(`/restaurants/${restaurantId}`, payload)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }
}

type RestaurantApiResponse = Omit<Restaurant, 'chains'> & {
  chains?: Chain[] | null;
  chain?: Chain | null;
};
