import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from './order.service';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-order-detail',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe, TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    .status-progress {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, rgba(6, 193, 103, 0.08), rgba(6, 193, 103, 0));
      border-radius: var(--radius-card);
      border: 1px solid rgba(6, 193, 103, 0.15);
    }

    .steps {
      display: flex;
      gap: 0.5rem;
      flex: 1;
    }

    .step {
      position: relative;
      flex: 1;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step::before {
      content: '';
      position: absolute;
      top: 0.6rem;
      left: -50%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, rgba(6, 193, 103, 0.15), rgba(6, 193, 103, 0.05));
      z-index: 0;
    }

    .step:first-child::before {
      display: none;
    }

    .step.completed::before {
      background: linear-gradient(90deg, rgba(6, 193, 103, 0.6), rgba(6, 193, 103, 0.3));
    }

    .step.active::before {
      background: linear-gradient(90deg, rgba(6, 193, 103, 0.6), rgba(6, 193, 103, 0.2));
    }

    .dot {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 999px;
      border: 2px solid rgba(6, 193, 103, 0.4);
      background: var(--surface);
      display: grid;
      place-items: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: rgba(6, 193, 103, 0.7);
      z-index: 1;
      transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
    }

    .step.completed .dot {
      background: var(--brand-green);
      border-color: var(--brand-green);
      color: #fff;
      box-shadow: 0 8px 18px rgba(6, 193, 103, 0.25);
    }

    .step.active {
      color: var(--text-primary);
    }

    .step.active .dot {
      border-color: var(--brand-green);
      color: var(--brand-green);
      box-shadow: 0 6px 14px rgba(6, 193, 103, 0.2);
    }

    .label {
      text-transform: none;
      font-size: 0.75rem;
      letter-spacing: 0.02em;
      color: inherit;
    }

    .progress-caption {
      min-width: 120px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .progress-caption span {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    @media (max-width: 900px) {
      .status-progress {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .steps {
        width: 100%;
      }

      .step {
        font-size: 0.7rem;
      }
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
        <div class="status-progress" role="list" aria-label="Order progress">
          <div class="progress-caption">
            <div>{{ displayStatus(o.status) | titlecase }}</div>
            <span>Current status</span>
          </div>
          <div class="steps">
            <div
              class="step"
              role="listitem"
              *ngFor="let state of states; let i = index"
              [class.completed]="stateStatus(i, o.status) === 'completed'"
              [class.active]="stateStatus(i, o.status) === 'active'"
            >
              <div class="dot">{{ i + 1 }}</div>
              <div class="label">{{ state | titlecase }}</div>
            </div>
          </div>
        </div>
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
  id = Number(this.route.snapshot.paramMap.get('id'));
  order$ = this.svc.get(this.id);
  readonly states = [
    'composing',
    'sent',
    'received',
    'printed',
    'preparing',
    'prepared',
    'distributed'
  ] as const;

  currentStateIndex(status: string): number {
    return this.states.indexOf(status as (typeof this.states)[number]);
  }

  displayStatus(status: string): string {
    const idx = this.currentStateIndex(status);
    return idx >= 0 ? this.states[idx] : status;
  }

  stateStatus(index: number, status: string): 'completed' | 'active' | 'upcoming' {
    const currentIndex = this.currentStateIndex(status);
    if (currentIndex === -1) {
      return index === 0 ? 'active' : 'upcoming';
    }

    if (index < currentIndex) {
      return 'completed';
    }

    if (index === currentIndex) {
      return 'active';
    }

    return 'upcoming';
  }
}
