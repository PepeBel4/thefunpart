import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from './order.service';
import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { TranslatePipe } from '../shared/translate.pipe';

type IconPath = {
  d: string;
  filled?: boolean;
  strokeWidth?: number;
};

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
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.08), rgba(var(--brand-green-rgb, 6, 193, 103), 0));
      border-radius: var(--radius-card);
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.15);
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
      background: linear-gradient(90deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.15), rgba(var(--brand-green-rgb, 6, 193, 103), 0.05));
      z-index: 0;
    }

    .step:first-child::before {
      display: none;
    }

    .step.completed::before {
      background: linear-gradient(90deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.6), rgba(var(--brand-green-rgb, 6, 193, 103), 0.3));
    }

    .step.active::before {
      background: linear-gradient(90deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.6), rgba(var(--brand-green-rgb, 6, 193, 103), 0.2));
    }

    .dot {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 999px;
      border: 2px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      background: var(--surface);
      display: grid;
      place-items: center;
      color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.7);
      z-index: 1;
      transition: background 200ms ease, border-color 200ms ease, color 200ms ease;
    }

    .dot svg {
      width: 1.25rem;
      height: 1.25rem;
      display: block;
    }

    .step.completed .dot {
      background: var(--brand-green);
      border-color: var(--brand-green);
      color: #fff;
      box-shadow: 0 8px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
    }

    .step.completed .dot svg {
      stroke: currentColor;
    }

    .step.active {
      color: var(--text-primary);
    }

    .step.active .dot {
      border-color: var(--brand-green);
      color: var(--brand-green);
      box-shadow: 0 6px 14px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
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
              <div class="dot">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <ng-container *ngFor="let path of pathsForState(state); trackBy: trackByIndex">
                    <path
                      [attr.d]="path.d"
                      [attr.fill]="path.filled ? 'currentColor' : 'none'"
                      [attr.stroke]="path.filled ? 'none' : 'currentColor'"
                      [attr.stroke-width]="path.strokeWidth ?? 1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </ng-container>
                </svg>
              </div>
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

  private readonly defaultIcon: IconPath[] = [
    { d: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', strokeWidth: 1.6 },
    { d: 'M9 12l2.5 2.5L15 11', strokeWidth: 1.8 }
  ];

  readonly stateIcons: Record<(typeof this.states)[number], IconPath[]> = {
    composing: [
      { d: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z', filled: true },
      {
        d: 'M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
      }
    ],
    sent: [
      { d: 'M2.5 12.5L21 3 11.5 21.5 10 14 2.5 12.5z', filled: true },
      { d: 'M10 14L21 3' }
    ],
    received: [
      { d: 'M4 7h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7z', strokeWidth: 1.6 },
      { d: 'M4 7l6.5 6a2 2 0 0 0 3 0L20 7', strokeWidth: 1.6 },
      { d: 'M8 4h8', strokeWidth: 1.6 }
    ],
    printed: [
      { d: 'M6 4h12v4H6z', filled: true },
      { d: 'M5 8h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2z', strokeWidth: 1.6 },
      { d: 'M9 14h6', strokeWidth: 1.6 }
    ],
    preparing: [
      { d: 'M3 10h18v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-6z', strokeWidth: 1.6 },
      { d: 'M7 7a5 5 0 0 1 10 0', strokeWidth: 1.6 }
    ],
    prepared: [
      { d: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z', strokeWidth: 1.6 },
      { d: 'M9 12.5l2 2 4-4', strokeWidth: 1.8 }
    ],
    distributed: [
      { d: 'M7 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z', strokeWidth: 1.6 },
      { d: 'M17 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z', strokeWidth: 1.6 },
      { d: 'M4 18a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2H4z', strokeWidth: 1.6 },
      { d: 'M12 20v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2H12z', strokeWidth: 1.6 }
    ]
  };

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

  pathsForState(state: string): IconPath[] {
    return this.stateIcons[state as (typeof this.states)[number]] ?? this.defaultIcon;
  }

  trackByIndex = (index: number) => index;
}
