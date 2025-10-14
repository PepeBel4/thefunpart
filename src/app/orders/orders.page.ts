import { Component, inject } from '@angular/core';
import { OrderService } from './order.service';
import { AsyncPipe, DatePipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-orders',
  imports: [AsyncPipe, DatePipe, CurrencyPipe, RouterLink, NgFor, NgIf],
  template: `
    <h2>Your Orders</h2>
    <div *ngIf="orders$ | async as orders">
      <div *ngFor="let o of orders" style="border:1px solid #eee; padding:1rem; border-radius:12px; margin-bottom:.75rem;">
        <div><strong>#{{ o.id }}</strong> — {{ o.status }} — {{ o.created_at | date:'short' }}</div>
        <div>Total: {{ (o.total_cents/100) | currency:'EUR' }}</div>
        <a [routerLink]="['/orders', o.id]">View</a>
      </div>
    </div>
  `
})
export class OrdersPage {
  private svc = inject(OrderService);
  orders$ = this.svc.list();
}