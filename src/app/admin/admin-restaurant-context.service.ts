import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, shareReplay, switchMap } from 'rxjs';
import { Restaurant, RestaurantCreateInput } from '../core/models';
import { RestaurantService } from '../restaurants/restaurant.service';

@Injectable({ providedIn: 'root' })
export class AdminRestaurantContextService {
  private restaurantService = inject(RestaurantService);

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([]);
  private readonly storageKey = 'admin.selectedRestaurantId';
  private readonly storage = this.resolveStorage();
  private selectedRestaurantIdSubject = new BehaviorSubject<number | null>(
    this.restoreSelectedRestaurantId()
  );

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
      this.setSelectedRestaurantId(null);
    }
  }

  selectRestaurant(id: number | null): void {
    if (id === null || Number.isNaN(id)) {
      this.setSelectedRestaurantId(null);
      return;
    }

    const current = this.restaurantsSubject.value;
    const exists = current.some(restaurant => restaurant.id === id);

    if (!exists) {
      void this.loadRestaurants().then(() => {
        if (this.restaurantsSubject.value.some(restaurant => restaurant.id === id)) {
          this.setSelectedRestaurantId(id);
        }
      });
      return;
    }

    this.setSelectedRestaurantId(id);
  }

  refreshSelectedRestaurant(): void {
    const current = this.selectedRestaurantIdSubject.value;
    if (current !== null) {
      this.setSelectedRestaurantId(current);
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

  async createRestaurant(payload: RestaurantCreateInput): Promise<Restaurant> {
    try {
      const restaurant = await firstValueFrom(this.restaurantService.create(payload));
      const restaurants = this.restaurantsSubject.value;
      this.restaurantsSubject.next([...restaurants, restaurant]);
      this.setSelectedRestaurantId(restaurant.id);
      return restaurant;
    } catch (error) {
      console.error('Failed to create restaurant', error);
      throw error;
    }
  }

  private ensureSelectedRestaurant(restaurants: Restaurant[]): void {
    if (!restaurants.length) {
      this.setSelectedRestaurantId(null);
      return;
    }

    const current = this.selectedRestaurantIdSubject.value;

    if (current === null) {
      this.setSelectedRestaurantId(restaurants[0].id);
      return;
    }

    const stillExists = restaurants.some(restaurant => restaurant.id === current);
    if (!stillExists) {
      this.setSelectedRestaurantId(restaurants[0].id);
    }
  }

  get selectedRestaurantId(): number | null {
    return this.selectedRestaurantIdSubject.value;
  }

  private setSelectedRestaurantId(id: number | null): void {
    this.selectedRestaurantIdSubject.next(id);
    this.persistSelectedRestaurantId(id);
  }

  private persistSelectedRestaurantId(id: number | null): void {
    if (!this.storage) {
      return;
    }

    try {
      if (id === null) {
        this.storage.removeItem(this.storageKey);
      } else {
        this.storage.setItem(this.storageKey, String(id));
      }
    } catch (error) {
      // Ignore storage persistence errors
    }
  }

  private restoreSelectedRestaurantId(): number | null {
    if (!this.storage) {
      return null;
    }

    try {
      const storedValue = this.storage.getItem(this.storageKey);
      if (storedValue === null) {
        return null;
      }

      const parsed = Number(storedValue);
      return Number.isNaN(parsed) ? null : parsed;
    } catch (error) {
      return null;
    }
  }

  private resolveStorage(): Storage | null {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    try {
      const storage = globalThis.localStorage;
      const testKey = '__admin_restaurant_context__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      return null;
    }
  }
}
