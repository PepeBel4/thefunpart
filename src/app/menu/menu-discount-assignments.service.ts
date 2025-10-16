import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import {
  MenuItemDiscountAssignment,
  MenuItemDiscountAssignmentInput,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuDiscountAssignmentsService {
  private api = inject(ApiService);

  list(params: Record<string, unknown> = {}) {
    return this.api.get<MenuItemDiscountAssignment[]>(
      '/menu_item_discount_assignments',
      { params }
    );
  }

  create(payload: MenuItemDiscountAssignmentInput) {
    return this.api.post<MenuItemDiscountAssignment>(
      '/menu_item_discount_assignments',
      {
        menu_item_discount_assignment: payload,
      }
    );
  }

  update(id: number, payload: MenuItemDiscountAssignmentInput) {
    return this.api.put<MenuItemDiscountAssignment>(
      `/menu_item_discount_assignments/${id}`,
      {
        menu_item_discount_assignment: payload,
      }
    );
  }

  delete(id: number) {
    return this.api.delete<void>(`/menu_item_discount_assignments/${id}`);
  }
}
