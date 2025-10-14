import { Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RestaurantService } from './restaurant.service';

@Component({
  standalone: true,
  selector: 'app-restaurant-list',
  imports: [AsyncPipe, RouterLink, NgFor, NgIf],
  styles: [`
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .card { border:1px solid #eee; padding:1rem; border-radius:12px; }
    a { text-decoration:none; color:inherit; }
  `],
  template: `
    <h2>Restaurants</h2>
    <div class="grid" *ngIf="restaurants$ | async as restaurants">
      <a class="card" *ngFor="let r of restaurants" [routerLink]="['/restaurants', r.id]">
        <h3>{{ r.name }}</h3>
        <p>{{ r.description }}</p>
      </a>
    </div>
  `
})
export class RestaurantListPage {
  private svc = inject(RestaurantService);
  restaurants$ = this.svc.list();
}
