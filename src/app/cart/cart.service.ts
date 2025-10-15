import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../core/models';

export interface CartLine { item: MenuItem; quantity: number; category?: string | null; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private _lines = signal<CartLine[]>([]);
  lines = computed(() => this._lines());
  count = computed(() => this._lines().reduce((a, l) => a + l.quantity, 0));
  subtotalCents = computed(() => this._lines().reduce((a, l) => a + l.item.price_cents * l.quantity, 0));

  add(item: MenuItem, category?: string | null) {
    const lines = [...this._lines()];
    const normalized = category ?? null;
    const found = lines.find(l => l.item.id === item.id && l.category === normalized);
    if (found) found.quantity += 1; else lines.push({ item, quantity: 1, category: normalized });
    this._lines.set(lines);
  }

  remove(itemId: number, category?: string | null) {
    const normalized = category ?? null;
    this._lines.set(this._lines().filter(l => !(l.item.id === itemId && l.category === normalized)));
  }
  changeQty(itemId: number, qty: number, category?: string | null) {
    const normalized = category ?? null;
    this._lines.set(
      this._lines().map(l =>
        l.item.id === itemId && l.category === normalized ? { ...l, quantity: Math.max(1, qty) } : l
      )
    );
  }
  clear() { this._lines.set([]); }
}
