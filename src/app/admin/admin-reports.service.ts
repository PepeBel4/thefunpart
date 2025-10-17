import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';

export interface SalesPipelineResponse {
  timeframe: {
    start_date: string;
    end_date: string;
  };
  totals: {
    orders: number;
    revenue_cents: number;
    average_order_value_cents?: number | null;
  };
  status_breakdown: Array<{
    status: string;
    order_count: number;
  }>;
  status_progression: Array<{
    status: string;
    order_count: number;
  }>;
  scenario_breakdown: Array<{
    scenario: string;
    order_count: number;
    revenue_cents?: number | null;
  }>;
  target_time_type_breakdown: Array<{
    target_time_type: string;
    order_count: number;
  }>;
  daily_totals: Array<{
    date: string;
    order_count: number;
    revenue_cents: number;
  }>;
  top_items?: Array<{
    name: string;
    quantity: number;
    revenue_cents: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AdminReportsService {
  private api = inject(ApiService);

  getSalesPipeline(
    restaurantId: number,
    params?: { startDate?: string; endDate?: string }
  ): Observable<SalesPipelineResponse> {
    const query: Record<string, string> = {};

    if (params?.startDate) {
      query['start_date'] = params.startDate;
    }

    if (params?.endDate) {
      query['end_date'] = params.endDate;
    }

    return this.api.get<SalesPipelineResponse>(
      `/restaurants/${restaurantId}/reports/sales_pipeline`,
      Object.keys(query).length > 0
        ? {
            params: query,
          }
        : undefined
    );
  }
}
