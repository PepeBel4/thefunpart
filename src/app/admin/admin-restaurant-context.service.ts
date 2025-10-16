import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, shareReplay, switchMap } from 'rxjs';
import { Restaurant } from '../core/models';
import { RestaurantService } from '../restaurants/restaurant.service';

@Injectable({ providedIn: 'root' })
export class AdminRestaurantContextService {
  private restaurantService = inject(RestaurantService);

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([]);
  private selectedRestaurantIdSubject = new BehaviorSubject<number | null>(null);

  readonly restaurants$ = this.restaurantsSubject.asObservable();
  readonly selectedRestaurantId$ = this.selectedRestaurantIdSubject.asObservable();

  readonly selectedRestaurant$ = this.selectedRestaurantId$.pipe(
    filter((id): id is number => id !== null),
    switchMap(id => this.restaurantService.get(id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  async loadRestaurants(): Promise<void> {
    try {
      const restaurants = await firstValueFrom(this.restaurantService.list());
      this.restaurantsSubject.next(restaurants);
      this.ensureSelectedRestaurant(restaurants);
    } catch (err) {
      console.error('Failed to load restaurants', err);
      this.restaurantsSubject.next([]);
      this.selectedRestaurantIdSubject.next(null);
    }
  }

  selectRestaurant(id: number | null): void {
    if (id === null || Number.isNaN(id)) {
      this.selectedRestaurantIdSubject.next(null);
      return;
    }

    const current = this.restaurantsSubject.value;
    const exists = current.some(restaurant => restaurant.id === id);

    if (!exists) {
      void this.loadRestaurants().then(() => {
        if (this.restaurantsSubject.value.some(restaurant => restaurant.id === id)) {
          this.selectedRestaurantIdSubject.next(id);
        }
      });
      return;
    }

    this.selectedRestaurantIdSubject.next(id);
  }

  refreshSelectedRestaurant(): void {
    const current = this.selectedRestaurantIdSubject.value;
    if (current !== null) {
      this.selectedRestaurantIdSubject.next(current);
    }
  }

  updateRestaurantInList(updated: Restaurant): void {
    const restaurants = this.restaurantsSubject.value;
    const index = restaurants.findIndex(restaurant => restaurant.id === updated.id);

    if (index === -1) {
      this.restaurantsSubject.next([...restaurants, updated]);
      return;
    }

    const next = [...restaurants];
    next[index] = updated;
    this.restaurantsSubject.next(next);
  }

  private ensureSelectedRestaurant(restaurants: Restaurant[]): void {
    if (!restaurants.length) {
      this.selectedRestaurantIdSubject.next(null);
      return;
    }

    const current = this.selectedRestaurantIdSubject.value;

    if (current === null) {
      this.selectedRestaurantIdSubject.next(restaurants[0].id);
      return;
    }

    const stillExists = restaurants.some(restaurant => restaurant.id === current);
    if (!stillExists) {
      this.selectedRestaurantIdSubject.next(restaurants[0].id);
    }
  }

  get selectedRestaurantId(): number | null {
    return this.selectedRestaurantIdSubject.value;
  }
}
