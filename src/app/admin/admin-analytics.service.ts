import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { SalesPipelineReport } from '../core/models';

interface SalesPipelineResponse {
  sales_pipeline?: SalesPipelineReport;
}

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private api = inject(ApiService);

  getSalesPipeline(
    restaurantId: number,
    params: { startDate: string; endDate: string }
  ): Observable<SalesPipelineReport> {
    return this.api
      .get<SalesPipelineReport | SalesPipelineResponse>(`/restaurants/${restaurantId}/sales_pipeline`, {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
        },
      })
      .pipe(
        map(response => {
          if (response && typeof response === 'object' && 'sales_pipeline' in response) {
            const nested = (response as SalesPipelineResponse).sales_pipeline;
            if (!nested) {
              throw new Error('Invalid sales pipeline response');
            }
            return nested;
          }

          if (response && typeof response === 'object' && 'timeframe' in response) {
            return response as SalesPipelineReport;
          }

          throw new Error('Invalid sales pipeline response');
        })
      );
  }
}
