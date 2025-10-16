import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import { AiSuggestedMenuItem } from '../core/models';

type AiSuggestionResponse = {
  ai_suggested_menu_items?: AiSuggestionApiItem[] | null;
};

type AiSuggestionApiItem = {
  id?: number;
  name?: string;
  price_cents?: number;
  discounted_price_cents?: number | null;
  description?: string | null;
  reason?: string | null;
  photo_url?: string | null;
  photo_urls?: (string | null | undefined)[] | null;
  photos?: { url?: string | null }[] | null;
  menu_item?: {
    id?: number;
    name?: string;
    price_cents?: number;
    discounted_price_cents?: number | null;
    description?: string | null;
    photo_url?: string | null;
    photo_urls?: (string | null | undefined)[] | null;
    photos?: { url?: string | null }[] | null;
  } | null;
};

@Injectable({ providedIn: 'root' })
export class RestaurantAiSuggestionsService {
  private api = inject(ApiService);

  fetch(
    restaurantId: number,
    payload: {
      selectedMenuItemIds: number[];
      candidateMenuItemIds?: number[];
    }
  ): Observable<AiSuggestedMenuItem[]> {
    const body: {
      selected_menu_item_ids: number[];
      candidate_menu_item_ids?: number[];
    } = {
      selected_menu_item_ids: payload.selectedMenuItemIds,
    };

    if (payload.candidateMenuItemIds?.length) {
      body.candidate_menu_item_ids = payload.candidateMenuItemIds;
    }

    return this.api
      .post<AiSuggestionResponse>(`/restaurants/${restaurantId}/ai_suggestions`, body)
      .pipe(
        map(response =>
          (response.ai_suggested_menu_items ?? [])
            .map(item => this.normalizeSuggestion(item))
            .filter((item): item is AiSuggestedMenuItem => item !== null)
        )
      );
  }

  private normalizeSuggestion(item: AiSuggestionApiItem | null | undefined): AiSuggestedMenuItem | null {
    if (!item) {
      return null;
    }

    const fallbackPhotoUrl = this.extractPhotoUrl(item.photos, item.photo_urls, item.photo_url);

    if ('menu_item' in item && item.menu_item) {
      const menuItem = item.menu_item;

      if (
        typeof menuItem?.id === 'number' &&
        typeof menuItem?.name === 'string' &&
        typeof menuItem?.price_cents === 'number'
      ) {
        const photoUrl =
          this.extractPhotoUrl(menuItem.photos, menuItem.photo_urls, menuItem.photo_url) ??
          fallbackPhotoUrl;

        return {
          id: menuItem.id,
          name: menuItem.name,
          price_cents: menuItem.price_cents,
          discounted_price_cents: menuItem.discounted_price_cents ?? null,
          description: menuItem.description ?? null,
          reason: item.reason ?? null,
          photo_url: photoUrl,
        };
      }

      return null;
    }

    if (
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price_cents === 'number'
    ) {
      const photoUrl = fallbackPhotoUrl;

      return {
        id: item.id,
        name: item.name,
        price_cents: item.price_cents,
        discounted_price_cents: item.discounted_price_cents ?? null,
        description: item.description ?? null,
        reason: item.reason ?? null,
        photo_url: photoUrl,
      };
    }

    return null;
  }

  private extractPhotoUrl(
    photos?: ReadonlyArray<{ url?: string | null }> | null,
    photoUrls?: ReadonlyArray<string | null | undefined> | null,
    directPhotoUrl?: string | null | undefined
  ): string | null {
    if (photos?.length) {
      for (const photo of photos) {
        if (typeof photo?.url === 'string' && photo.url.trim()) {
          return photo.url;
        }
      }
    }

    if (photoUrls?.length) {
      for (const url of photoUrls) {
        if (typeof url === 'string' && url.trim()) {
          return url;
        }
      }
    }

    if (typeof directPhotoUrl === 'string' && directPhotoUrl.trim()) {
      return directPhotoUrl;
    }

    return null;
  }
}

