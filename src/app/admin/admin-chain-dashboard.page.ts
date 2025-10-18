import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminChainContextService } from './admin-chain-context.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-admin-chain-dashboard',
  imports: [AsyncPipe, FormsModule, NgFor, NgIf, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2.25rem;
    }

    header.page-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-title {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    header.page-header h2 {
      margin: 0;
      font-size: clamp(2.1rem, 4vw, 2.65rem);
      letter-spacing: -0.04em;
    }

    header.page-header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    .chain-select {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 320px;
    }

    .chain-select label {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .chain-select select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
    }

    .section-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    nav.section-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 0 0.25rem;
    }

    nav.section-nav a {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.6rem 1.1rem;
      border-radius: 999px;
      border: 1px solid transparent;
      background: rgba(10, 10, 10, 0.04);
      color: inherit;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s ease, border 0.2s ease, color 0.2s ease;
    }

    nav.section-nav a.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      color: color-mix(in srgb, var(--brand-green) 60%, black);
    }

    nav.section-nav a:hover {
      background: rgba(10, 10, 10, 0.08);
    }

    .empty-state {
      color: var(--text-secondary);
    }

    .empty-state.small {
      font-size: 0.9rem;
      white-space: nowrap;
    }
  `],
  template: `
    <header class="page-header">
      <div class="header-title">
        <h2>{{ 'admin.chain.title' | translate: 'Chain admin' }}</h2>
        <p>
          {{
            'admin.chain.subtitle'
              | translate: 'Manage shared chain settings and oversee every restaurant that belongs to it.'
          }}
        </p>
      </div>

      <div class="chain-select" *ngIf="chains$ | async as chains">
        <label for="admin-chain-select">
          {{ 'admin.chain.select' | translate: 'Choose chain' }}
        </label>
        <select
          id="admin-chain-select"
          [ngModel]="selectedChainId"
          (ngModelChange)="onChainChange($event)"
          [disabled]="!chains.length"
        >
          <option *ngFor="let chain of chains" [value]="chain.id">
            {{ chain.name }}
          </option>
        </select>
        <span *ngIf="!chains.length" class="empty-state small">
          {{ 'admin.chain.empty' | translate: 'No chains available.' }}
        </span>
      </div>
    </header>

    <p *ngIf="loading" class="empty-state">
      {{ 'admin.chain.loading' | translate: 'Loading chains…' }}
    </p>

    <ng-container *ngIf="selectedChainId$ | async as chainId; else managePlaceholder">
      <div class="section-shell" *ngIf="chainId !== null; else managePlaceholder">
        <nav class="section-nav">
          <a routerLink="details" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            {{ 'admin.chain.sections.details' | translate: 'Chain details' }}
          </a>
          <a routerLink="restaurants" routerLinkActive="active">
            {{ 'admin.chain.sections.restaurants' | translate: 'Restaurants' }}
          </a>
          <a routerLink="analytics" routerLinkActive="active">
            {{ 'admin.chain.sections.analytics' | translate: 'Analytics' }}
          </a>
        </nav>

        <router-outlet></router-outlet>
      </div>
    </ng-container>

    <ng-template #managePlaceholder>
      <section class="card">
        <header>
          <h3>{{ 'admin.chain.placeholder.title' | translate: 'Manage chain content' }}</h3>
        </header>
        <p>
          {{
            'admin.chain.placeholder.description'
              | translate: 'Select one of your assigned chains above to start managing its settings.'
          }}
        </p>
      </section>
    </ng-template>
  `,
})
export class AdminChainDashboardPage {
  private context = inject(AdminChainContextService);

  readonly chains$ = this.context.chains$;
  readonly selectedChainId$ = this.context.selectedChainId$;

  loading = true;
  selectedChainId: number | null = null;

  constructor() {
    void this.context
      .loadChains()
      .finally(() => {
        this.loading = false;
      });

    this.selectedChainId$
      .pipe(takeUntilDestroyed())
      .subscribe(id => {
        this.selectedChainId = id;
      });
  }

  onChainChange(value: string | number): void {
    const parsed = Number(value);
    this.context.selectChain(Number.isNaN(parsed) ? null : parsed);
  }
}
