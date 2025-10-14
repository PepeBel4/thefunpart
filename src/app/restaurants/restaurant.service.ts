import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Restaurant } from '../core/models';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private api = inject(ApiService);

  list() { return this.api.get<Restaurant[]>('/restaurants'); }
  get(id: number) { return this.api.get<Restaurant>(`/restaurants/${id}`); }
}
