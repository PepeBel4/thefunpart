import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../core/api.service';
import { AiSuggestedMenuItem } from '../core/models';

type AiSuggestionResponse = {
  ai_suggested_menu_items?: AiSuggestedMenuItem[] | null;
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
          (response.ai_suggested_menu_items ?? []).filter(
            (item): item is AiSuggestedMenuItem => !!item && !!item.menu_item
          )
        )
      );
  }
}

