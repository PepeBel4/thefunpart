import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from './order.service';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf],
  template: `
    <ng-container *ngIf="order$ | async as o">
      <h2>Order #{{ o.id }}</h2>
      <div>Status: {{ o.status }} • Placed: {{ o.created_at | date:'short' }}</div>
      <h3>Items</h3>
      <ul>
        <li *ngFor="let it of o.items">#{{ it.menu_item_id }} × {{ it.quantity }} — {{ (it.price_cents/100) | currency:'EUR' }}</li>
      </ul>
      <p><strong>Total:</strong> {{ (o.total_cents/100) | currency:'EUR' }}</p>
    </ng-container>
  `
})
export class OrderDetailPage {
  private route = inject(ActivatedRoute);
  private svc = inject(OrderService);
  id = Number(this.route.snapshot.paramMap.get('id'));
  order$ = this.svc.get(this.id);
}