import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Card } from '../core/models';

@Injectable({ providedIn: 'root' })
export class CardService {
  private api = inject(ApiService);

  list(): Observable<Card[]> {
    return this.api.get<Card[]>('/cards');
  }
}
