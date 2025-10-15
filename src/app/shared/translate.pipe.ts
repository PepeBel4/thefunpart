import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../core/translation.service';

type TranslateParams = Record<string, string | number | boolean>;

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(key: string, fallback?: string, params?: TranslateParams): string {
    const safeFallback = fallback ?? key;
    return this.i18n.translate(key, safeFallback, params);
  }
}
