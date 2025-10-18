import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { RestaurantUser, RestaurantUserChurnRisk } from '../core/models';

export interface RestaurantUserFilters {
  searchTerm?: string;
  orderedFrom?: string;
  orderedTo?: string;
  menuItemId?: number;
  churnRisk?: RestaurantUserChurnRisk;
}

export type RestaurantUserSortColumn =
  | 'name'
  | 'email'
  | 'created_at'
  | 'first_order_at'
  | 'last_order_at'
  | 'churn_risk';

export interface RestaurantUserSort {
  column: RestaurantUserSortColumn;
  direction: 'asc' | 'desc';
}

export interface RestaurantUserQuery {
  filters?: RestaurantUserFilters;
  sort?: RestaurantUserSort | null;
}

@Injectable({ providedIn: 'root' })
export class AdminRestaurantUsersService {
  private api = inject(ApiService);

  list(restaurantId: number, query: RestaurantUserQuery = {}): Observable<RestaurantUser[]> {
    let params = new HttpParams();

    const { filters = {}, sort = null } = query;

    const ransackParams: Record<string, string> = {};

    if (filters.searchTerm) {
      ransackParams['first_name_or_last_name_or_email_cont'] = filters.searchTerm;
    }

    if (filters.orderedFrom) {
      ransackParams['orders_created_at_gteq'] = filters.orderedFrom;
    }

    if (filters.orderedTo) {
      ransackParams['orders_created_at_lteq'] = filters.orderedTo;
    }

    if (typeof filters.menuItemId === 'number') {
      ransackParams['orders_menu_item_id_eq'] = String(filters.menuItemId);
    }

    if (filters.churnRisk) {
      ransackParams['churn_risk_eq'] = filters.churnRisk;
    }

    const sortExpression = this.resolveSortExpression(sort);
    if (sortExpression) {
      ransackParams['s'] = sortExpression;
    }

    Object.entries(ransackParams).forEach(([key, value]) => {
      params = params.set(`q[${key}]`, value);
    });

    return this.api.get<RestaurantUser[]>(`/restaurants/${restaurantId}/users`, { params });
  }

  private resolveSortExpression(sort: RestaurantUserSort | null): string | null {
    if (!sort) {
      return null;
    }

    const direction = sort.direction === 'desc' ? 'desc' : 'asc';

    switch (sort.column) {
      case 'name':
        return `last_name ${direction}, first_name ${direction}`;
      case 'email':
        return `email ${direction}`;
      case 'created_at':
        return `created_at ${direction}`;
      case 'first_order_at':
        return `first_order_at ${direction}`;
      case 'last_order_at':
        return `last_order_at ${direction}`;
      case 'churn_risk':
        return `churn_risk ${direction}`;
      default:
        return null;
    }
  }
}
