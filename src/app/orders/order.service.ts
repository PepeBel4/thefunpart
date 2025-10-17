import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Observable } from 'rxjs';

import {
  Order,
  OrderItemInput,
  OrderPaymentResponse,
  OrderScenario,
  OrderTargetTimeType,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(ApiService);

  list(params: Record<string, unknown> = {}): Observable<Order[]> {
    return this.api.get<Order[]>('/orders', { params });
  }

  listForRestaurant(
    restaurantId: number,
    params: Record<string, unknown> = {}
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
  }): Observable<Order> {
    const body = {
      order: {
        restaurant_id: payload.restaurantId,
        order_items: payload.items,
        state: 'composing',
        scenario: payload.scenario,
        target_time_type: payload.targetTimeType,
        target_time_at: payload.targetTimeAt
      },
    };

    return this.api.post<Order>('/orders', body);
  }

  updateState(orderId: number, state: 'composing' | 'sent'): Observable<Order> {
    const body = {
      order: {
        state,
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

