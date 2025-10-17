import { Injectable, signal, computed, effect } from '@angular/core';
import { MenuItem, OrderScenario, OrderTargetTimeType } from '../core/models';

export interface CartCategorySelection {
  id: number | null;
  label?: string | null;
}

export interface CartLine {
  item: MenuItem;
  quantity: number;
  category?: CartCategorySelection | null;
  remark?: string | null;
}

export interface CartRestaurant {
  id: number;
  name?: string | null;
  primaryColor?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'cart-state';
  private readonly storage = this.getStorage();

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

  private _orderRemark = signal<string | null>(null);
  orderRemark = computed(() => this._orderRemark());

  constructor() {
    this.restore();

    if (this.storage) {
      effect(
        () => {
          const storage = this.storage;
          if (!storage) {
            return;
          }

          const payload = {
            lines: this._lines().map(line => ({
              item: line.item,
              quantity: line.quantity,
              category: line.category ?? null,
              remark: line.remark ?? null,
            })),
            scenario: this._scenario(),
            targetTimeType: this._targetTimeType(),
            targetTimeInput: this._targetTimeInput(),
            restaurant: this._restaurant(),
            orderRemark: this._orderRemark(),
          };

          try {
            if (
              !payload.lines.length &&
              payload.scenario === 'takeaway' &&
              payload.targetTimeType === 'asap' &&
              payload.targetTimeInput === null &&
              (payload.restaurant === null || payload.restaurant === undefined) &&
              (payload.orderRemark === null || payload.orderRemark === undefined)
            ) {
              storage.removeItem(this.storageKey);
            } else {
              storage.setItem(this.storageKey, JSON.stringify(payload));
            }
          } catch (error) {
            // Ignore storage write errors (e.g. quota exceeded)
          }
        },
        { allowSignalWrites: true }
      );
    }
  }

  add(
    item: MenuItem,
    category?: CartCategorySelection | null,
    restaurant?: CartRestaurant | null,
    quantity = 1
  ) {
    const lines = [...this._lines()];
    const normalized = this.normalizeCategory(category);
    const normalizedRestaurant = this.normalizeRestaurant(restaurant, item.restaurant_id);
    const currentRestaurant = this._restaurant();

    if (currentRestaurant && currentRestaurant.id !== normalizedRestaurant.id) {
      throw new Error('cart:restaurant-mismatch');
    }

    if (!currentRestaurant) {
      this._restaurant.set(normalizedRestaurant);
    } else {
      const next: CartRestaurant = { ...currentRestaurant };
      if (normalizedRestaurant.name && normalizedRestaurant.name !== currentRestaurant.name) {
        next.name = normalizedRestaurant.name;
      }
      if (normalizedRestaurant.primaryColor !== currentRestaurant.primaryColor) {
        next.primaryColor = normalizedRestaurant.primaryColor ?? null;
      }
      this._restaurant.set(next);
    }

    const found = lines.find(
      l =>
        l.item.id === item.id &&
        (l.category?.id ?? null) === (normalized?.id ?? null)
    );

    const qtyToAdd = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

    if (found) {
      found.quantity += qtyToAdd;
      if (normalized?.label && !found.category?.label) {
        found.category = { id: normalized.id, label: normalized.label };
      }
    } else {
      lines.push({ item, quantity: qtyToAdd, category: normalized ?? undefined });
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

  setOrderRemark(value: string | null | undefined) {
    const normalized = this.normalizeRemark(value);
    this._orderRemark.set(normalized);
  }

  setLineRemark(
    itemId: number,
    remark: string | null | undefined,
    category?: CartCategorySelection | null
  ) {
    const normalizedId = category?.id ?? null;
    const normalizedRemark = this.normalizeRemark(remark);

    this._lines.set(
      this._lines().map(line =>
        line.item.id === itemId && (line.category?.id ?? null) === normalizedId
          ? normalizedRemark === line.remark
            ? line
            : { ...line, remark: normalizedRemark }
          : line
      )
    );
  }

  clear() {
    this._lines.set([]);
    this._scenario.set('takeaway');
    this._targetTimeType.set('asap');
    this._targetTimeInput.set(null);
    this._orderRemark.set(null);
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

  private normalizeRestaurant(
    restaurant: CartRestaurant | null | undefined,
    fallbackId: number
  ): CartRestaurant {
    const id = restaurant?.id ?? fallbackId;
    const name = restaurant?.name?.trim();
    const color = this.normalizeColor(restaurant?.primaryColor ?? null);

    return {
      id,
      name: name?.length ? name : null,
      primaryColor: color,
    };
  }

  private normalizeColor(color: string | null): string | null {
    const value = color?.trim();
    if (!value) {
      return null;
    }

    const match = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) {
      return null;
    }

    const hex = match[1];
    const normalized = hex.length === 3
      ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      : `#${hex}`;

    return normalized.toLowerCase();
  }

  private restore() {
    if (!this.storage) {
      return;
    }

    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<{
        lines: CartLine[];
        scenario: OrderScenario;
        targetTimeType: OrderTargetTimeType;
        targetTimeInput: string | null;
        restaurant: CartRestaurant | null;
        orderRemark: string | null;
      }>;

      let restoredLines: CartLine[] | null = null;

      if (Array.isArray(parsed.lines)) {
        restoredLines = parsed.lines
          .filter(line => line?.item && Number.isFinite(line.quantity))
          .map(line => ({
            item: line.item,
            quantity: Math.max(1, Math.floor(line.quantity ?? 1)),
            category: this.normalizeCategory(line.category) ?? undefined,
            remark: this.normalizeRemark(line.remark),
          }));

        if (restoredLines.length) {
          this._lines.set(restoredLines);
        }
      }

      let restoredRestaurant: CartRestaurant | null = null;
      if (parsed.restaurant && typeof parsed.restaurant.id === 'number') {
        restoredRestaurant = this.normalizeRestaurant(
          parsed.restaurant,
          parsed.restaurant.id
        );
        this._restaurant.set(restoredRestaurant);
      }

      if (!restoredRestaurant && restoredLines?.length) {
        const firstLine = restoredLines[0];
        this._restaurant.set(
          this.normalizeRestaurant(parsed.restaurant ?? null, firstLine.item.restaurant_id)
        );
      }

      if (parsed.scenario && this.scenarioOptions.includes(parsed.scenario)) {
        this._scenario.set(parsed.scenario);
      }

      if (
        parsed.targetTimeType &&
        this.targetTimeTypeOptions.includes(parsed.targetTimeType)
      ) {
        this._targetTimeType.set(parsed.targetTimeType);
      }

      if (typeof parsed.targetTimeInput === 'string' || parsed.targetTimeInput === null) {
        this._targetTimeInput.set(parsed.targetTimeInput);
      }

      if (typeof parsed.orderRemark === 'string' || parsed.orderRemark === null) {
        this._orderRemark.set(this.normalizeRemark(parsed.orderRemark));
      }
    } catch (error) {
      // Ignore malformed storage data
    }
  }

  private normalizeRemark(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private getStorage(): Storage | null {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    try {
      const storage = globalThis.localStorage;
      const testKey = '__cart_service_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      return null;
    }
  }
}
