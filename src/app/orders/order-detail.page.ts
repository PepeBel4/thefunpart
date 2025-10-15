import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from './order.service';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { TranslatePipe } from '../shared/translate.pipe';
import { CartService } from '../cart/cart.service';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Order } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    h2 {
      font-size: clamp(2rem, 3vw, 2.5rem);
      font-weight: 700;
      margin: 0;
    }

    .meta {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    li {
      display: flex;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-soft);
    }

    li:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .total {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 1.05rem;
    }
  `],
  template: `
    <ng-container *ngIf="order$ | async as o">
      <div class="card">
        <div>
          <h2>{{ 'orderDetail.title' | translate: 'Order #{{id}}': { id: o.id } }}</h2>
          <div class="meta">
            {{
              'orderDetail.subtitle'
                | translate: '{{status}} • Placed {{date}}': {
                    status: o.status,
                    date: (o.created_at | date:'short') || ''
                  }
            }}
          </div>
        </div>
        <div>
          <h3>{{ 'orderDetail.itemsHeading' | translate: 'Items' }}</h3>
          <ul>
            <li *ngFor="let it of o.order_items">
              <span>
                {{ it.menu_item?.name || ('#' + it.menu_item_id) }} × {{ it.quantity }}
              </span>
              <span>{{ (it.price_cents/100) | currency:'EUR' }}</span>
            </li>
          </ul>
        </div>
        <div class="total">
          <span>{{ 'orderDetail.total' | translate: 'Total' }}</span>
          <span>{{ (o.total_cents/100) | currency:'EUR' }}</span>
        </div>
      </div>
    </ng-container>
  `
})
export class OrderDetailPage {
  private route = inject(ActivatedRoute);
  private svc = inject(OrderService);
  private cart = inject(CartService);
  id = Number(this.route.snapshot.paramMap.get('id'));
  order$: Observable<Order> = this.svc.get(this.id).pipe(
    switchMap(order => {
      const desiredState = this.resolveState(order);
      if (this.isFullyPaid(order)) {
        this.cart.clear();
      }

      if (!desiredState) {
        return of(order);
      }

      return this.svc.updateState(order.id, desiredState).pipe(
        tap(updated => {
          if (desiredState === 'sent' && this.isFullyPaid(updated)) {
            this.cart.clear();
          }
        })
      );
    })
  );

  private isFullyPaid(order: Order): boolean {
    const total = order.total_cents ?? 0;
    const paid = order.paid_cents ?? 0;
    const remaining = order.remaining_balance_cents;
    const paymentState = order.payment_state?.toLowerCase?.();

    if (typeof remaining === 'number') {
      return remaining <= 0;
    }

    if (total > 0 && paid >= total) {
      return true;
    }

    return paymentState === 'paid' || paymentState === 'succeeded' || paymentState === 'successful';
  }

  private resolveState(order: Order): 'sent' | 'composing' | null {
    const normalized = order.state?.toLowerCase?.();
    const fullyPaid = this.isFullyPaid(order);

    if (fullyPaid) {
      return normalized === 'sent' ? null : 'sent';
    }

    if (!normalized || normalized === 'sent' || normalized === 'composing') {
      return normalized === 'composing' ? null : 'composing';
    }

    return null;
  }
}
