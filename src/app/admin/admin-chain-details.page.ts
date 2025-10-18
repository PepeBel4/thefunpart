import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminChainContextService } from './admin-chain-context.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-chain-details',
  imports: [AsyncPipe, NgIf, TranslatePipe],
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
      gap: 1.25rem;
    }

    dl {
      margin: 0;
      display: grid;
      grid-template-columns: minmax(0, 160px) 1fr;
      row-gap: 0.5rem;
      column-gap: 1.25rem;
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
