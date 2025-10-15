import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Allergen } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AllergensService {
  private api = inject(ApiService);

  list() {
    return this.api.get<Allergen[]>('/allergens');
  }
}
