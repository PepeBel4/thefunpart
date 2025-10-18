import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Chain, Restaurant, RestaurantCreateInput, RestaurantUpdateInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private api = inject(ApiService);

  private normalizeRestaurant(restaurant: RestaurantApiResponse): Restaurant {
    const { chain, chains, logo, reviews, ratings, ...rest } = restaurant;

    const normalizedChain = chain ?? (Array.isArray(chains) ? chains.find(item => !!item) ?? null : null);
    const normalizedLogoUrl = rest.logo_url ?? logo?.url ?? null;
    const normalizedRatings = ratings ?? reviews ?? null;
    const normalizedReviews = reviews ?? ratings ?? null;

    return {
      ...rest,
      logo: logo ?? null,
      logo_url: normalizedLogoUrl,
      chain: normalizedChain ?? null,
      ratings: normalizedRatings,
      reviews: normalizedReviews,
    };
  }

  list() {
    return this.api
      .get<RestaurantApiResponse[]>('/restaurants')
      .pipe(map(restaurants => restaurants.map(restaurant => this.normalizeRestaurant(restaurant))));
  }

  get(identifier: number | string) {
    return this.api
      .get<RestaurantApiResponse>(`/restaurants/${identifier}`)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  uploadPhotos(id: number, files: File[]): Observable<Restaurant> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return this.api
      .post<RestaurantApiResponse>(`/restaurants/${id}/photos`, formData)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  uploadLogo(id: number, file: File): Observable<Restaurant> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.api
      .post<RestaurantApiResponse>(`/restaurants/${id}/logo`, formData)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

  deleteLogo(id: number): Observable<Restaurant> {
    return this.api
      .delete<RestaurantApiResponse>(`/restaurants/${id}/logo`)
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

  create(payload: RestaurantCreateInput): Observable<Restaurant> {
    return this.api
      .post<RestaurantApiResponse>('/restaurants', payload)
      .pipe(map(restaurant => this.normalizeRestaurant(restaurant)));
  }

}

type RestaurantApiResponse = Omit<Restaurant, 'chain'> & {
  chains?: Chain[] | null;
  chain?: Chain | null;
};
