import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { SalesPipelineReport } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private api = inject(ApiService);

  getSalesPipeline(
    restaurantId: number,
    startDate: string,
    endDate: string
  ): Observable<SalesPipelineReport> {
    const params = new HttpParams().set('start_date', startDate).set('end_date', endDate);

    return this.api.get<SalesPipelineReport>(`/restaurants/${restaurantId}/reports/sales_pipeline`, { params });
  }
}
