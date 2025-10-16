import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MenuManagerComponent } from '../menu/menu-manager.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-menu',
  imports: [AsyncPipe, NgIf, MenuManagerComponent, TranslatePipe],
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
        <h3>{{ 'admin.menu.heading' | translate: 'Manage menu' }}</h3>
        <p>
          {{ 'admin.menu.description' | translate: 'Update dishes, pricing, and availability in real-time.' }}
        </p>
      </header>

      <app-menu-manager *ngIf="restaurantId !== null" [restaurantId]="restaurantId"></app-menu-manager>
    </section>
  `,
})
export class AdminMenuPage {
  private context = inject(AdminRestaurantContextService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;
}
