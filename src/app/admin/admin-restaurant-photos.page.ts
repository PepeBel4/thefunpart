import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { firstValueFrom, tap } from 'rxjs';
import { RestaurantPhoto } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-restaurant-photos',
  imports: [AsyncPipe, NgFor, NgIf, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      position: relative;
    }

    .photo-grid img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-grid button.remove-photo {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      border: 0;
      border-radius: 999px;
      background: rgba(16, 16, 16, 0.72);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .photo-grid button.remove-photo:hover {
      background: rgba(16, 16, 16, 0.85);
    }

    .photo-grid button.remove-photo[disabled] {
      opacity: 0.7;
      cursor: default;
    }

    .upload-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .upload-controls button {
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      border-radius: 999px;
      padding: 0.65rem 1.4rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .upload-controls button:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
    }

    .upload-controls button[disabled] {
      opacity: 0.7;
      cursor: default;
      box-shadow: none;
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
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurant$ | async as restaurant">
      <header>
        <h3>{{ 'admin.photos.heading' | translate: 'Restaurant photos' }}</h3>
        <p>
          {{ 'admin.photos.description' | translate: 'Keep your storefront up to date by refreshing the gallery.' }}
        </p>
      </header>

      <div class="photo-grid" *ngIf="restaurant.photos?.length; else emptyGallery">
        <figure *ngFor="let photo of restaurant.photos">
          <img [src]="photo.url" [alt]="restaurant.name + ' photo'" loading="lazy" />
          <button
            type="button"
            class="remove-photo"
            (click)="removePhoto(photo)"
            [disabled]="removingPhotoId === photo.id"
          >
            {{
              removingPhotoId === photo.id
                ? ('admin.photos.removing' | translate: 'Removing…')
                : ('admin.photos.remove' | translate: 'Remove')
            }}
          </button>
        </figure>
      </div>

      <ng-template #emptyGallery>
        <p>{{ 'admin.photos.empty' | translate: 'No photos yet. Upload a few to showcase the space.' }}</p>
      </ng-template>

      <div class="upload-controls">
        <input type="file" #photoInput multiple accept="image/*" (change)="onPhotoSelection(photoInput.files)" [disabled]="uploading" />
        <button type="button" (click)="uploadPhotos()" [disabled]="!selectedPhotos.length || uploading">
          {{
            uploading
              ? ('admin.photos.uploading' | translate: 'Uploading…')
              : ('admin.photos.upload' | translate: 'Upload photos')
          }}
        </button>
        <span class="file-info" *ngIf="selectedPhotos.length">
          {{
            selectedPhotos.length === 1
              ? ('admin.photos.readyOne' | translate: '1 file ready')
              : ('admin.photos.readyMany' | translate: '{{count}} files ready': { count: selectedPhotos.length })
          }}
        </span>
      </div>

      <div *ngIf="statusMessage" class="status" [class.error]="statusType === 'error'" [class.success]="statusType === 'success'">
        {{ statusMessage }}
      </div>
    </section>
  `,
})
export class AdminRestaurantPhotosPage {
  private context = inject(AdminRestaurantContextService);
  private restaurantService = inject(RestaurantService);
  private i18n = inject(TranslationService);

  readonly selectedRestaurant$ = this.context.selectedRestaurant$.pipe(
    tap(() => {
      this.resetUploadState();
    })
  );

  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';
  removingPhotoId: number | null = null;

  onPhotoSelection(files: FileList | null) {
    this.selectedPhotos = files ? Array.from(files) : [];
    this.statusMessage = '';
    this.statusType = '';
  }

  async uploadPhotos() {
    const restaurantId = this.context.selectedRestaurantId;
    if (!this.selectedPhotos.length || this.uploading || restaurantId === null) {
      return;
    }

    this.uploading = true;
    this.statusMessage = '';
    this.statusType = '';

    try {
      await firstValueFrom(this.restaurantService.uploadPhotos(restaurantId, this.selectedPhotos));
      this.selectedPhotos = [];
      this.statusMessage = this.i18n.translate(
        'restaurantDetail.photosUploaded',
        'Photos uploaded successfully!'
      );
      this.statusType = 'success';
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.statusMessage = this.i18n.translate(
        'restaurantDetail.photosError',
        'Something went wrong while uploading photos. Please try again.'
      );
      this.statusType = 'error';
    } finally {
      this.uploading = false;
    }
  }

  async removePhoto(photo: RestaurantPhoto) {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null || this.removingPhotoId !== null) {
      return;
    }

    if (!confirm(this.i18n.translate('restaurantDetail.removePhotoConfirm', 'Remove this photo?'))) {
      return;
    }

    this.removingPhotoId = photo.id;
    this.statusMessage = '';
    this.statusType = '';

    try {
      await firstValueFrom(this.restaurantService.deletePhoto(restaurantId, photo.id));
      this.statusMessage = this.i18n.translate('restaurantDetail.photoRemoved', 'Photo removed.');
      this.statusType = 'success';
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.statusMessage = this.i18n.translate(
        'restaurantDetail.photoRemoveError',
        'Unable to remove the photo. Please try again.'
      );
      this.statusType = 'error';
    } finally {
      this.removingPhotoId = null;
    }
  }

  private resetUploadState() {
    this.selectedPhotos = [];
    this.statusMessage = '';
    this.statusType = '';
    this.uploading = false;
    this.removingPhotoId = null;
  }
}
