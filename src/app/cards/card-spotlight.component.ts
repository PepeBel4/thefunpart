import { CurrencyPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardSpotlightService } from './card-spotlight.service';

@Component({
  selector: 'app-card-spotlight',
  standalone: true,
  imports: [NgIf, CurrencyPipe, RouterLink],
  styles: [`
    :host {
      display: block;
    }

    .loyalty-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.35rem 1.4rem 1.6rem;
      border-radius: var(--radius-card);
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.18), rgba(var(--brand-green-rgb, 6, 193, 103), 0.04));
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.22);
      box-shadow: var(--shadow-soft);
      overflow: hidden;
    }

    .media {
      position: relative;
      border-radius: calc(var(--radius-card) - 10px);
      overflow: hidden;
      aspect-ratio: 3 / 2;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand-on-primary);
      font-size: 2.25rem;
      font-weight: 700;
    }

    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .label {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #045530;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      border-radius: 999px;
      padding: 0.25rem 0.65rem;
      align-self: flex-start;
    }

    h3 {
      margin: 0;
      font-size: 1.35rem;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .balances {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .balance {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.8rem 1rem;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.7);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    .balance-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .balance-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .cta {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      color: var(--brand-green);
      text-decoration: none;
    }

    .cta::after {
      content: '›';
      font-size: 1.1rem;
      line-height: 1;
    }

    @media (max-width: 980px) {
      .loyalty-card {
        padding: 1.1rem 1.2rem 1.35rem;
      }
    }
  `],
  template: `
    <section class="loyalty-card" *ngIf="spotlight() as card">
      <div class="media" *ngIf="card.heroPhoto; else placeholder">
        <img [src]="card.heroPhoto" [alt]="card.title" loading="lazy" />
      </div>
      <ng-template #placeholder>
        <div class="media placeholder">{{ card.placeholderInitial }}</div>
      </ng-template>
      <div class="content">
        <span class="label">{{ card.type === 'chain' ? 'Chain rewards' : 'Loyalty rewards' }}</span>
        <h3>{{ card.title }}</h3>
        <p *ngIf="card.subtitle">{{ card.subtitle }}</p>
        <div class="balances">
          <div class="balance">
            <span class="balance-label">Points</span>
            <span class="balance-value">{{ card.loyaltyPoints }}</span>
          </div>
          <div class="balance">
            <span class="balance-label">Credit</span>
            <span class="balance-value">{{ (card.creditCents / 100) | currency: 'EUR' }}</span>
          </div>
        </div>
        <a *ngIf="card.linkCommands" class="cta" [routerLink]="card.linkCommands">View details</a>
      </div>
    </section>
  `,
})
export class CardSpotlightComponent {
  private spotlightSvc = inject(CardSpotlightService);
  readonly spotlight = this.spotlightSvc.spotlight;
}
