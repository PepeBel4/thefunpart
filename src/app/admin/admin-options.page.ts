import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuOptionsManagerComponent } from '../menu/menu-options-manager.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-options',
  imports: [AsyncPipe, NgIf, MenuOptionsManagerComponent, TranslatePipe],
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
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurantId$ | async as restaurantId">
      <header>
        <h3>{{ 'admin.options.heading' | translate: 'Menu options' }}</h3>
        <p>
          {{
            'admin.options.description'
              | translate: 'Create add-ons and extras guests can pick when ordering.'
          }}
        </p>
      </header>

      <app-menu-options-manager *ngIf="restaurantId !== null" [restaurantId]="restaurantId"></app-menu-options-manager>
    </section>
  `,
})
export class AdminOptionsPage {
  private context = inject(AdminRestaurantContextService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;
}
