import { Component, inject } from '@angular/core';
import { OrderService } from './order.service';
import { AsyncPipe, DatePipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-orders',
  imports: [AsyncPipe, DatePipe, CurrencyPipe, RouterLink, NgFor, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    h2 {
      font-size: clamp(2rem, 3vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      margin-bottom: 0.25rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 1.5rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .card header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green);
      font-weight: 600;
      font-size: 0.85rem;
    }

    .meta {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .remark {
      margin-top: 0.35rem;
      padding: 0.65rem 0.75rem;
      border-radius: 0.75rem;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.08);
      color: var(--text-primary);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    a.view-link {
      align-self: flex-start;
      text-decoration: none;
      color: var(--brand-green);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    a.view-link::after {
      content: '›';
      font-size: 1.1rem;
    }
  `],
  template: `
    <section>
      <h2>{{ 'orders.title' | translate: 'Your orders' }}</h2>
      <p class="meta">{{ 'orders.subtitle' | translate: 'Track deliveries and revisit your favourite meals.' }}</p>
    </section>
    <div class="orders-list" *ngIf="orders$ | async as orders">
      <div class="card" *ngFor="let o of orders">
        <header>
          <div>
            <strong>#{{ o.id }}</strong>
            <span class="meta">— {{ o.created_at | date:'short' }}</span>
          </div>
          <span class="status">{{ o.status }}</span>
        </header>
        <div class="meta">
          {{ 'orders.totalLabel' | translate: 'Total:' }} {{ (o.total_cents/100) | currency:'EUR' }}
        </div>
        <div class="remark" *ngIf="o.remark">{{ o.remark }}</div>
        <a class="view-link" [routerLink]="['/orders', o.id]">
          {{ 'orders.view' | translate: 'View details' }}
        </a>
      </div>
    </div>
  `
})
export class OrdersPage {
  private svc = inject(OrderService);
  orders$ = this.svc.list();
}
