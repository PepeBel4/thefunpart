import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { SalesPipelineReport } from '../core/models';

export interface SalesPipelineQuery {
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class AdminSalesPipelineService {
  private api = inject(ApiService);

  getReport(restaurantId: number, query: SalesPipelineQuery): Observable<SalesPipelineReport> {
    const params = {
      start_date: query.startDate,
      end_date: query.endDate,
    };

    return this.api.get<SalesPipelineReport>(`/restaurants/${restaurantId}/reports/sales_pipeline`, {
      params,
    });
  }
}
