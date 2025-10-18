import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminChainContextService } from './admin-chain-context.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-chain-details',
  imports: [AsyncPipe, NgIf, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    header {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    header h3 {
      margin: 0;
      font-size: clamp(1.35rem, 3vw, 1.6rem);
      letter-spacing: -0.02em;
    }

    header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    dl {
      margin: 0;
      display: grid;
      gap: 0.75rem;
    }

    dt {
      font-weight: 600;
      color: var(--text-secondary);
    }

    dd {
      margin: 0;
      font-weight: 600;
    }

    .empty-state {
      color: var(--text-secondary);
    }
  `],
  template: `
    <ng-container *ngIf="chain$ | async as chain; else emptyState">
      <section class="card">
        <header>
          <h3>{{ 'admin.chain.details.title' | translate: 'Chain overview' }}</h3>
          <p>
            {{
              'admin.chain.details.subtitle'
                | translate: 'A quick snapshot of the selected chain information.'
            }}
          </p>
        </header>

        <dl>
          <dt>{{ 'admin.chain.details.name' | translate: 'Chain name' }}</dt>
          <dd>{{ chain.name }}</dd>

          <dt>{{ 'admin.chain.details.identifier' | translate: 'Identifier' }}</dt>
          <dd>#{{ chain.id }}</dd>
        </dl>
      </section>
    </ng-container>

    <ng-template #emptyState>
      <p class="empty-state">
        {{ 'admin.chain.details.empty' | translate: 'Select a chain to view its details.' }}
      </p>
    </ng-template>
  `,
})
export class AdminChainDetailsPage {
  private context = inject(AdminChainContextService);

  readonly chain$ = this.context.selectedChain$;
}
