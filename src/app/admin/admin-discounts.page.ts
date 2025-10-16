import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuDiscountManagerComponent } from '../menu/menu-discount-manager.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-discounts',
  imports: [AsyncPipe, NgIf, TranslatePipe, MenuDiscountManagerComponent],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }
  `],
  template: `
    <section class="card glass-panel" *ngIf="selectedRestaurantId$ | async as restaurantId">
      <header>
        <h3>{{ 'admin.discounts.heading' | translate: 'Manage discounts' }}</h3>
        <p>
          {{
            'admin.discounts.description'
              | translate:
                  'Plan time-limited promotions and reward loyal guests with targeted offers.'
          }}
        </p>
      </header>

      <ng-container *ngIf="restaurantId !== null; else noRestaurantSelected">
        <app-menu-discount-manager [restaurantId]="restaurantId"></app-menu-discount-manager>
      </ng-container>

      <ng-template #noRestaurantSelected>
        <p class="empty-state">
          {{
            'admin.discounts.noRestaurant'
              | translate:
                  'Select a restaurant to configure its discounts.'
          }}
        </p>
      </ng-template>
    </section>
  `,
})
export class AdminDiscountsPage {
  private context = inject(AdminRestaurantContextService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;
}
