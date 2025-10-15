import { Injectable, signal, computed } from '@angular/core';
import { MenuItem, OrderScenario, OrderTargetTimeType } from '../core/models';

export interface CartCategorySelection {
  id: number | null;
  label?: string | null;
}

export interface CartLine { item: MenuItem; quantity: number; category?: CartCategorySelection | null; }

export interface CartRestaurant {
  id: number;
  name?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private _lines = signal<CartLine[]>([]);
  lines = computed(() => this._lines());
  count = computed(() => this._lines().reduce((a, l) => a + l.quantity, 0));
  subtotalCents = computed(() =>
    this._lines().reduce((a, l) => a + this.getPriceCents(l.item) * l.quantity, 0)
  );

  private _restaurant = signal<CartRestaurant | null>(null);
  restaurant = computed(() => this._restaurant());

  readonly scenarioOptions: OrderScenario[] = ['takeaway', 'delivery', 'eatin'];
  readonly targetTimeTypeOptions: OrderTargetTimeType[] = ['asap', 'scheduled'];

  private _scenario = signal<OrderScenario>('takeaway');
  scenario = computed(() => this._scenario());

  private _targetTimeType = signal<OrderTargetTimeType>('asap');
  targetTimeType = computed(() => this._targetTimeType());

  private _targetTimeInput = signal<string | null>(null);
  targetTimeInput = computed(() => this._targetTimeInput());
  targetTime = computed(() => {
    const value = this._targetTimeInput();
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  });

  requiresTargetTime = computed(() => this._targetTimeType() === 'scheduled');
  hasValidTargetTime = computed(() => !this.requiresTargetTime() || this.targetTime() !== null);

  add(item: MenuItem, category?: CartCategorySelection | null, restaurant?: CartRestaurant | null) {
    const lines = [...this._lines()];
    const normalized = this.normalizeCategory(category);
    const normalizedRestaurant = this.normalizeRestaurant(restaurant, item.restaurant_id);
    const currentRestaurant = this._restaurant();

    if (currentRestaurant && currentRestaurant.id !== normalizedRestaurant.id) {
      throw new Error('cart:restaurant-mismatch');
    }

    if (!currentRestaurant) {
      this._restaurant.set(normalizedRestaurant);
    } else if (normalizedRestaurant.name && normalizedRestaurant.name !== currentRestaurant.name) {
      this._restaurant.set({ ...currentRestaurant, name: normalizedRestaurant.name });
    }

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
    const next = this._lines().filter(
      l => !(l.item.id === itemId && (l.category?.id ?? null) === normalizedId)
    );

    this._lines.set(next);

    if (!next.length) {
      this._restaurant.set(null);
    }
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

  setScenario(value: OrderScenario) {
    if (this.scenarioOptions.includes(value)) {
      this._scenario.set(value);
    }
  }

  setTargetTimeType(value: OrderTargetTimeType) {
    if (this.targetTimeTypeOptions.includes(value)) {
      this._targetTimeType.set(value);
      if (value === 'asap') {
        this._targetTimeInput.set(null);
      }
    }
  }

  setTargetTimeInput(value: string | null) {
    const trimmed = value?.trim();
    this._targetTimeInput.set(trimmed ? trimmed : null);
  }

  clear() {
    this._lines.set([]);
    this._scenario.set('takeaway');
    this._targetTimeType.set('asap');
    this._targetTimeInput.set(null);
    this._restaurant.set(null);
  }

  private getPriceCents(item: MenuItem): number {
    const discounted = item.discounted_price_cents ?? undefined;
    if (typeof discounted === 'number' && discounted >= 0) {
      return discounted;
    }

    return item.price_cents;
  }

  private normalizeCategory(category?: CartCategorySelection | null): CartCategorySelection | null {
    if (!category) {
      return null;
    }

    const id = category.id ?? null;
    const label = category.label?.trim();

    return { id, label: label ?? null };
  }

  private normalizeRestaurant(restaurant: CartRestaurant | null | undefined, fallbackId: number): CartRestaurant {
    const id = restaurant?.id ?? fallbackId;
    const name = restaurant?.name?.trim();

    return {
      id,
      name: name?.length ? name : null,
    };
  }
}
