import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { RatingInput, Review } from './models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private api = inject(ApiService);

  createRating(payload: RatingInput): Observable<Review> {
    return this.api.post<Review>('/ratings', { rating: payload });
  }

  listRatings(rateableType: RatingInput['rateable_type'], rateableId: number): Observable<Review[]> {
    return this.api.get<Review[]>('/ratings', {
      params: {
        rateable_type: rateableType,
        rateable_id: String(rateableId),
      },
    });
  }
}
