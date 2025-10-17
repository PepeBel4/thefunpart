import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../core/api.service';

interface AiMenuItemSuggestionCategory {
  id?: number | null;
  name?: string | null;
  name_translations?: Record<string, string | null | undefined> | null;
}

interface AiMenuItemSuggestionAllergen {
  id?: number | null;
  name?: string | null;
  name_translations?: Record<string, string | null | undefined> | null;
}

interface AiMenuItemSuggestionResponse {
  suggested_categories?: (AiMenuItemSuggestionCategory | null | undefined)[] | null;
  suggested_allergens?: (AiMenuItemSuggestionAllergen | null | undefined)[] | null;
  suggested_price_band?: string | null;
  price_band?: string | null;
}

export interface MenuItemAiSuggestionCategory {
  id?: number;
  name?: string;
}

export interface MenuItemAiSuggestionAllergen {
  id?: number;
  name?: string;
}

export interface MenuItemAiSuggestions {
  categories: MenuItemAiSuggestionCategory[];
  allergens: MenuItemAiSuggestionAllergen[];
  priceBand: string | null;
}

@Injectable({ providedIn: 'root' })
export class MenuItemAiAssistantService {
  private readonly api = inject(ApiService);

  suggest(
    restaurantId: number,
    payload: { name: string; description?: string | null }
  ): Observable<MenuItemAiSuggestions | null> {
    const body = {
      name: payload.name,
      description: payload.description ?? null,
    };

    return this.api
      .post<AiMenuItemSuggestionResponse | null>(
        `/restaurants/${restaurantId}/menu_items/ai_suggestions`,
        body
      )
      .pipe(map(response => this.normalizeResponse(response)));
  }

  private normalizeResponse(
    response: AiMenuItemSuggestionResponse | null | undefined
  ): MenuItemAiSuggestions | null {
    if (!response) {
      return null;
    }

    const categories = this.normalizeCategories(response.suggested_categories);
    const allergens = this.normalizeAllergens(response.suggested_allergens);
    const priceBand = this.normalizePriceBand(
      response.suggested_price_band ?? response.price_band
    );

    if (!categories.length && !allergens.length && !priceBand) {
      return null;
    }

    return {
      categories,
      allergens,
      priceBand,
    };
  }

  private normalizeCategories(
    entries: ReadonlyArray<AiMenuItemSuggestionCategory | null | undefined> | null | undefined
  ): MenuItemAiSuggestionCategory[] {
    if (!entries?.length) {
      return [];
    }

    const seen = new Set<string>();
    const categories: MenuItemAiSuggestionCategory[] = [];

    for (const entry of entries) {
      if (!entry) {
        continue;
      }

      const id = typeof entry.id === 'number' ? entry.id : undefined;
      const name = this.normalizeText(entry.name) ?? this.extractFirstTranslation(entry.name_translations);

      if (id == null && !name) {
        continue;
      }

      const key = `${id ?? ''}::${(name ?? '').toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      categories.push({ id: id ?? undefined, name: name ?? undefined });
    }

    return categories;
  }

  private normalizeAllergens(
    entries: ReadonlyArray<AiMenuItemSuggestionAllergen | null | undefined> | null | undefined
  ): MenuItemAiSuggestionAllergen[] {
    if (!entries?.length) {
      return [];
    }

    const seen = new Set<string>();
    const allergens: MenuItemAiSuggestionAllergen[] = [];

    for (const entry of entries) {
      if (!entry) {
        continue;
      }

      const id = typeof entry.id === 'number' ? entry.id : undefined;
      const name = this.normalizeText(entry.name) ?? this.extractFirstTranslation(entry.name_translations);

      if (id == null && !name) {
        continue;
      }

      const key = `${id ?? ''}::${(name ?? '').toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      allergens.push({ id: id ?? undefined, name: name ?? undefined });
    }

    return allergens;
  }

  private normalizePriceBand(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private extractFirstTranslation(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    for (const candidate of Object.values(record)) {
      if (typeof candidate === 'string') {
        const normalized = candidate.trim();
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }
}
