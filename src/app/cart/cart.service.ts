import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../core/models';

export interface CartCategorySelection {
  id: number | null;
  label?: string | null;
}

export interface CartLine { item: MenuItem; quantity: number; category?: CartCategorySelection | null; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private _lines = signal<CartLine[]>([]);
  lines = computed(() => this._lines());
  count = computed(() => this._lines().reduce((a, l) => a + l.quantity, 0));
  subtotalCents = computed(() => this._lines().reduce((a, l) => a + l.item.price_cents * l.quantity, 0));

  add(item: MenuItem, category?: CartCategorySelection | null) {
    const lines = [...this._lines()];
    const normalized = this.normalizeCategory(category);
    const found = lines.find(
      l =>
        l.item.id === item.id &&
        (l.category?.id ?? null) === (normalized?.id ?? null)
    );

    if (found) {
      found.quantity += 1;
      if (normalized?.label && !found.category?.label) {
        found.category = { id: normalized.id, label: normalized.label };
      }
    } else {
      lines.push({ item, quantity: 1, category: normalized ?? undefined });
    }

    this._lines.set(lines);
  }

  remove(itemId: number, category?: CartCategorySelection | null) {
    const normalizedId = category?.id ?? null;
    this._lines.set(
      this._lines().filter(
        l => !(l.item.id === itemId && (l.category?.id ?? null) === normalizedId)
      )
    );
  }

  changeQty(itemId: number, qty: number, category?: CartCategorySelection | null) {
    const normalizedId = category?.id ?? null;
    this._lines.set(
      this._lines().map(l =>
        l.item.id === itemId && (l.category?.id ?? null) === normalizedId
          ? { ...l, quantity: Math.max(1, qty) }
          : l
      )
    );
  }
  clear() { this._lines.set([]); }

  private normalizeCategory(category?: CartCategorySelection | null): CartCategorySelection | null {
    if (!category) {
      return null;
    }

    const id = category.id ?? null;
    const label = category.label?.trim();

    return { id, label: label ?? null };
  }
}
