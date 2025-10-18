import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';

import {
  Order,
  OrderItemInput,
  OrderPaymentResponse,
  OrderScenario,
  OrderStatus,
  OrderTargetTimeType,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(ApiService);

  list(params: { userId?: number } = {}): Observable<Order[]> {
    const query: Record<string, string | number | boolean> = {};

    if (typeof params.userId === 'number') {
      query['user_id'] = params.userId;
    }

    const options = Object.keys(query).length ? { params: query } : undefined;

    return this.api.get<Order[]>('/orders', options);
  }

  listForRestaurant(
    restaurantId: number,
    params?: Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>
  ): Observable<Order[]> {
    return this.api.get<Order[]>(`/restaurants/${restaurantId}/orders`, {
      params,
    });
  }

  get(id: number): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  create(payload: {
    restaurantId: number;
    items: OrderItemInput[];
    scenario: OrderScenario;
    targetTimeType: OrderTargetTimeType;
    targetTimeAt: string | null;
    remark?: string | null;
  }): Observable<Order> {
    const body = {
      order: {
        restaurant_id: payload.restaurantId,
        order_items: payload.items.map(item => ({
          ...item,
          remark: item.remark ?? null,
        })),
        status: 'composing',
        scenario: payload.scenario,
        target_time_type: payload.targetTimeType,
        target_time_at: payload.targetTimeAt,
        remark: payload.remark ?? null,
      },
    };

    return this.api.post<Order>('/orders', body);
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<Order> {
    const body = {
      order: {
        status,
      },
    };

    return this.api.put<Order>(`/orders/${orderId}`, body);
  }

  createPayment(
    orderId: number,
    params: {
      amountCents: number;
      description?: string;
      redirectUrl?: string;
      webhookUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): Observable<OrderPaymentResponse> {
    const body = {
      payment: {
        amount_cents: params.amountCents,
        description: params.description,
        redirect_url: params.redirectUrl,
        webhook_url: params.webhookUrl,
        metadata: params.metadata,
      },
    };

    return this.api.post<OrderPaymentResponse>(`/orders/${orderId}/payments`, body);
  }
}

