import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { RestaurantUser, RestaurantUserChurnRisk } from '../core/models';

export interface RestaurantUserFilters {
  ordered_from?: string;
  ordered_to?: string;
  menu_item_id?: number;
  churn_risk?: RestaurantUserChurnRisk;
}

@Injectable({ providedIn: 'root' })
export class AdminRestaurantUsersService {
  private api = inject(ApiService);

  list(restaurantId: number, filters: RestaurantUserFilters = {}): Observable<RestaurantUser[]> {
    let params = new HttpParams();

    (Object.entries(filters) as [keyof RestaurantUserFilters, string | number | undefined][]).forEach(
      ([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        params = params.set(key, String(value));
      }
    );

    return this.api.get<RestaurantUser[]>(`/restaurants/${restaurantId}/users`, { params });
  }
}
