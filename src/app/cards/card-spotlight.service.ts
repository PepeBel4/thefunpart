import { Injectable, computed, signal } from '@angular/core';

export interface CardSpotlightEntry {
  id: number;
  type: 'restaurant' | 'chain';
  title: string;
  subtitle: string | null;
  loyaltyPoints: number;
  creditCents: number;
  heroPhoto: string | null;
  placeholderInitial: string;
  linkCommands: (string | number)[] | null;
}

@Injectable({ providedIn: 'root' })
export class CardSpotlightService {
  private entry = signal<CardSpotlightEntry | null>(null);

  readonly spotlight = computed(() => this.entry());

  set(entry: CardSpotlightEntry | null) {
    this.entry.set(entry);
  }

  clear() {
    this.entry.set(null);
  }
}
