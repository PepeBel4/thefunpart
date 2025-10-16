import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuItemOptionsManagerComponent } from '../menu/menu-item-options-manager.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-menu-options',
  imports: [AsyncPipe, NgIf, MenuItemOptionsManagerComponent, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurantId$ | async as restaurantId">
      <header>
        <h3>{{ 'admin.options.heading' | translate: 'Menu item options' }}</h3>
        <p>
          {{
            'admin.options.description'
              | translate: 'Create optional add-ons and extras for your dishes.'
          }}
        </p>
      </header>

      <ng-container *ngIf="restaurantId !== null; else noRestaurantSelected">
        <app-menu-item-options-manager [restaurantId]="restaurantId"></app-menu-item-options-manager>
      </ng-container>

      <ng-template #noRestaurantSelected>
        <p class="empty-state">
          {{
            'admin.options.noRestaurant'
              | translate: 'Select a restaurant to manage menu item options.'
          }}
        </p>
      </ng-template>
    </section>
  `,
})
export class AdminMenuOptionsPage {
  private context = inject(AdminRestaurantContextService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;
}
