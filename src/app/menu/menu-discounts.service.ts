import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuItemDiscount, MenuItemDiscountInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuDiscountsService {
  private api = inject(ApiService);

  list(params: Record<string, unknown> = {}) {
    return this.api.get<MenuItemDiscount[]>('/menu_item_discounts', { params });
  }

  create(payload: MenuItemDiscountInput) {
    return this.api.post<MenuItemDiscount>('/menu_item_discounts', {
      menu_item_discount: payload,
    });
  }

  update(id: number, payload: MenuItemDiscountInput) {
    return this.api.put<MenuItemDiscount>(`/menu_item_discounts/${id}`, {
      menu_item_discount: payload,
    });
  }

  delete(id: number) {
    return this.api.delete<void>(`/menu_item_discounts/${id}`);
  }
}
