import { Component } from '@angular/core';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-chain-analytics',
  imports: [TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.75rem, 3vw, 2.25rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    p {
      margin: 0;
      color: var(--text-secondary);
    }
  `],
  template: `
    <section class="card">
      <header>
        <h3>{{ 'admin.chain.analytics.title' | translate: 'Analytics overview' }}</h3>
      </header>
      <p>
        {{
          'admin.chain.analytics.description'
            | translate:
                'Chain-wide performance dashboards will live here. In the meantime, review restaurant analytics for deeper insights.'
        }}
      </p>
    </section>
  `,
})
export class AdminChainAnalyticsPage {}
