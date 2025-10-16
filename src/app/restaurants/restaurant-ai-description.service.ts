import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiService } from '../core/api.service';

interface AiDescriptionTranslationResponse {
  translation?: string | { text?: string | null } | null;
  translated_text?: string | null;
  text?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RestaurantAiDescriptionService {
  private readonly api = inject(ApiService);

  translate(
    restaurantId: number,
    payload: { sourceLanguageCode: string; targetLanguageCode: string; text: string }
  ): Observable<string | null> {
    const body = {
      source_language_code: payload.sourceLanguageCode,
      target_language_code: payload.targetLanguageCode,
      text: payload.text,
    };

    return this.api
      .post<AiDescriptionTranslationResponse | null>(
        `/restaurants/${restaurantId}/ai_description_translations`,
        body
      )
      .pipe(map(response => this.normalizeTranslation(response)));
  }

  private normalizeTranslation(response: AiDescriptionTranslationResponse | null | undefined): string | null {
    if (!response) {
      return null;
    }

    if (typeof response.translated_text === 'string') {
      return response.translated_text;
    }

    if (typeof response.text === 'string') {
      return response.text;
    }

    if (typeof response.translation === 'string') {
      return response.translation;
    }

    if (response.translation && typeof response.translation === 'object') {
      const candidate = (response.translation as { text?: unknown }).text;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return null;
  }
}
