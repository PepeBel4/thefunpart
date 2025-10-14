import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Order, OrderItemInput } from '../core/models';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class OrderService {
private api = inject(ApiService);


list(): Observable<Order[]> { return this.api.get<Order[]>('/orders'); }
get(id: number): Observable<Order> { return this.api.get<Order>(`/orders/${id}`); }
create(payload: { items: OrderItemInput[] }): Observable<Order> { return this.api.post<Order>('/orders', payload); }
}