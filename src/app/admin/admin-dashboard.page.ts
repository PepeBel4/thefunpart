import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, filter, firstValueFrom, shareReplay, switchMap, tap } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { Restaurant } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, FormsModule, NgFor, NgIf],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    header h2 {
      margin: 0;
      font-size: clamp(2.25rem, 4vw, 2.75rem);
      letter-spacing: -0.04em;
    }

    header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
      max-width: 540px;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 2rem;
    }

    .card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .card header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .card header h3 {
      margin: 0;
      font-size: 1.5rem;
    }

    label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .photo-grid figure {
      margin: 0;
      border-radius: 0.85rem;
      overflow: hidden;
      aspect-ratio: 4/3;
      background: rgba(10, 10, 10, 0.04);
    }

    .photo-grid img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .upload-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .upload-controls button {
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      border-radius: 999px;
      padding: 0.65rem 1.4rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(6, 193, 103, 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .upload-controls button:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(6, 193, 103, 0.28);
    }

    .file-info {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .status {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .status.error {
      color: #d14343;
    }

    .status.success {
      color: var(--brand-green);
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .orders-list .order-card {
      background: rgba(6, 193, 103, 0.05);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(6, 193, 103, 0.18);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .orders-list .order-card header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-weight: 600;
    }

    .orders-list .meta {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    @media (max-width: 980px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <header>
      <h2>Restaurant admin</h2>
      <p>Upload fresh visuals and keep track of recent orders — all in one convenient place.</p>
    </header>

    <div class="grid">
      <section class="card">
        <header>
          <h3>Restaurant photos</h3>
          <p>Keep your storefront up to date by refreshing the gallery.</p>
        </header>

        <ng-container *ngIf="restaurants$ | async as restaurants; else loading">
          <ng-container *ngIf="restaurants.length; else noRestaurants">
            <label>
              Choose restaurant
              <select [ngModel]="selectedRestaurantId" (ngModelChange)="onRestaurantChange($event)">
                <option *ngFor="let restaurant of restaurants" [value]="restaurant.id">{{ restaurant.name }}</option>
              </select>
            </label>

            <ng-container *ngIf="selectedRestaurant$ | async as restaurant">
              <div class="photo-grid" *ngIf="restaurant.photo_urls?.length">
                <figure *ngFor="let url of restaurant.photo_urls">
                  <img [src]="url" [alt]="restaurant.name + ' photo'" loading="lazy" />
                </figure>
              </div>

              <div class="upload-controls">
                <input type="file" #photoInput multiple accept="image/*" (change)="onPhotoSelection(photoInput.files)" [disabled]="uploading" />
                <button type="button" (click)="uploadPhotos()" [disabled]="!selectedPhotos.length || uploading">
                  {{ uploading ? 'Uploading…' : 'Upload photos' }}
                </button>
                <span class="file-info" *ngIf="selectedPhotos.length">{{ selectedPhotos.length }} file{{ selectedPhotos.length === 1 ? '' : 's' }} ready</span>
              </div>

              <div *ngIf="statusMessage" class="status" [class.error]="statusType === 'error'" [class.success]="statusType === 'success'">
                {{ statusMessage }}
              </div>
            </ng-container>
          </ng-container>
        </ng-container>

        <ng-template #loading>
          <p>Loading restaurants…</p>
        </ng-template>
        <ng-template #noRestaurants>
          <p>No restaurants found.</p>
        </ng-template>
      </section>

      <section class="card">
        <header>
          <h3>Recent orders</h3>
          <p>Review recent activity to keep operations running smoothly.</p>
        </header>

        <ng-container *ngIf="orders$ | async as orders; else loadingOrders">
          <ng-container *ngIf="orders.length; else emptyOrders">
            <div class="orders-list">
              <article class="order-card" *ngFor="let order of orders">
                <header>
                  <span>#{{ order.id }} · {{ order.restaurant?.name || 'Unknown restaurant' }}</span>
                  <span>{{ order.total_cents / 100 | currency:'EUR' }}</span>
                </header>
                <div class="meta">
                  Placed {{ order.created_at | date:'medium' }} · Status: {{ order.status }}
                </div>
                <div class="meta" *ngIf="order.user?.email">Customer: {{ order.user?.email }}</div>
              </article>
            </div>
          </ng-container>
        </ng-container>
        <ng-template #loadingOrders>
          <p>Loading orders…</p>
        </ng-template>
        <ng-template #emptyOrders>
          <p>No orders yet.</p>
        </ng-template>
      </section>
    </div>
  `
})
export class AdminDashboardPage {
  private restaurantService = inject(RestaurantService);
  private orderService = inject(OrderService);

  restaurants$: Observable<Restaurant[]> = this.restaurantService.list().pipe(
    tap(restaurants => {
      if (restaurants.length && this.selectedRestaurantId === null) {
        const firstId = restaurants[0].id;
        this.selectedRestaurantId = firstId;
        this.selectedRestaurantIdSubject.next(firstId);
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private selectedRestaurantIdSubject = new BehaviorSubject<number | null>(null);
  selectedRestaurantId: number | null = null;

  selectedRestaurant$ = this.selectedRestaurantIdSubject.pipe(
    filter((id): id is number => id !== null),
    switchMap(id => this.restaurantService.get(id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  orders$ = this.orderService.list();

  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  onRestaurantChange(value: string | number) {
    const id = Number(value);
    this.selectedRestaurantId = id;
    this.selectedRestaurantIdSubject.next(id);
    this.resetUploadState();
  }

  onPhotoSelection(files: FileList | null) {
    this.selectedPhotos = files ? Array.from(files) : [];
    this.statusMessage = '';
    this.statusType = '';
  }

  async uploadPhotos() {
    if (!this.selectedPhotos.length || this.uploading || this.selectedRestaurantId === null) {
      return;
    }

    this.uploading = true;
    this.statusMessage = '';
    this.statusType = '';

    try {
      await firstValueFrom(this.restaurantService.uploadPhotos(this.selectedRestaurantId, this.selectedPhotos));
      this.selectedPhotos = [];
      this.statusMessage = 'Photos uploaded successfully!';
      this.statusType = 'success';
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
    } catch (err) {
      console.error(err);
      this.statusMessage = 'Something went wrong while uploading photos. Please try again.';
      this.statusType = 'error';
    } finally {
      this.uploading = false;
    }
  }

  private resetUploadState() {
    this.selectedPhotos = [];
    this.statusMessage = '';
    this.statusType = '';
    this.uploading = false;
  }
}
