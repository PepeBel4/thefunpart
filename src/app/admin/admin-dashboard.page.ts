import { AsyncPipe, CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, filter, firstValueFrom, shareReplay, switchMap, tap } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { Chain, Restaurant, RestaurantPhoto, RestaurantUpdateInput } from '../core/models';
import { ChainService } from '../chains/chain.service';
import { MenuManagerComponent } from '../menu/menu-manager.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [AsyncPipe, CurrencyPipe, DatePipe, FormsModule, MenuManagerComponent, NgFor, NgIf, TranslatePipe],
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

    .stack {
      display: flex;
      flex-direction: column;
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

    .details-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .language-fields {
      display: grid;
      gap: 1rem;
    }

    .language-card {
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 0.85rem;
      padding: clamp(1rem, 2vw, 1.25rem);
      background: rgba(255, 255, 255, 0.85);
      display: grid;
      gap: 0.75rem;
    }

    .language-card h4 {
      margin: 0;
      font-size: 1.05rem;
    }

    .details-form label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .details-form input,
    .details-form textarea {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font: inherit;
    }

    .details-form textarea {
      min-height: 96px;
      resize: vertical;
    }

    .chain-manager {
      border-top: 1px solid rgba(10, 10, 10, 0.08);
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chain-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chain-inputs {
      display: grid;
      gap: 0.5rem;
    }

    .chain-entry {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .chain-entry input {
      flex: 1 1 220px;
      min-width: 180px;
      padding: 0.55rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font: inherit;
    }

    .details-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .upload-controls button,
    .details-actions button,
    .chain-entry button {
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

    .upload-controls button:hover,
    .details-actions button:hover,
    .chain-entry button:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(6, 193, 103, 0.28);
    }

    .details-actions button[disabled],
    .chain-entry button[disabled] {
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
      <h2>{{ 'admin.title' | translate: 'Restaurant admin' }}</h2>
      <p>
        {{
          'admin.subtitle'
            | translate:
              'Upload fresh visuals and keep track of recent orders — all in one convenient place.'
        }}
      </p>
    </header>

    <div class="grid">
      <div class="stack">
        <section class="card">
          <header>
            <h3>{{ 'admin.manage.heading' | translate: 'Manage restaurant' }}</h3>
            <p>{{ 'admin.manage.description' | translate: "Choose which location you'd like to update." }}</p>
          </header>

          <ng-container *ngIf="restaurants$ | async as restaurants; else loading">
            <ng-container *ngIf="restaurants.length; else noRestaurants">
              <label>
                {{ 'admin.manage.select' | translate: 'Choose restaurant' }}
                <select [ngModel]="selectedRestaurantId" (ngModelChange)="onRestaurantChange($event)">
                  <option *ngFor="let restaurant of restaurants" [value]="restaurant.id">{{ restaurant.name }}</option>
                </select>
              </label>
            </ng-container>
          </ng-container>

          <ng-template #loading>
            <p>{{ 'admin.manage.loading' | translate: 'Loading restaurants…' }}</p>
          </ng-template>
          <ng-template #noRestaurants>
            <p>{{ 'admin.manage.empty' | translate: 'No restaurants found.' }}</p>
          </ng-template>
        </section>

        <ng-container *ngIf="selectedRestaurantId !== null; else managePlaceholder">
          <ng-container *ngIf="selectedRestaurant$ | async as restaurant">
            <section class="card">
              <header>
                <h3>{{ 'admin.details.heading' | translate: 'Restaurant details' }}</h3>
                <p>{{ 'admin.details.description' | translate: 'Edit the name and multi-language description guests see on the site.' }}</p>
              </header>

              <form class="details-form" (ngSubmit)="saveDetails()" novalidate>
                <label class="name-field" for="restaurant-name">
                  {{ 'admin.details.nameLabel' | translate: 'Restaurant name' }}
                  <input
                    id="restaurant-name"
                    name="name"
                    [(ngModel)]="detailsForm.name"
                    required
                    [attr.placeholder]="
                      'admin.details.namePlaceholder'
                        | translate: 'Enter the restaurant name'
                    "
                  />
                </label>

                <div class="chain-manager">
                  <div>
                    <h4 style="margin: 0; font-size: 1.1rem;">
                      {{ 'admin.chains.heading' | translate: 'Chain' }}
                    </h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                      {{
                        'admin.chains.description'
                          | translate: 'Add or remove the chain this restaurant belongs to.'
                      }}
                    </p>
                  </div>

                  <ng-container *ngIf="restaurantChain; else noChains">
                    <div class="chain-list">
                      <span class="admin-chain-pill">
                        {{ restaurantChain.name }}
                        <button
                          type="button"
                          (click)="removeChain(restaurantChain)"
                          [disabled]="removingChainId === restaurantChain.id"
                        >
                          {{
                            removingChainId === restaurantChain.id
                              ? ('admin.chains.removing' | translate: 'Removing…')
                              : ('admin.chains.remove' | translate: 'Remove')
                          }}
                        </button>
                      </span>
                    </div>
                  </ng-container>
                  <ng-template #noChains>
                    <p>{{ 'admin.chains.empty' | translate: 'Not part of a chain yet.' }}</p>
                  </ng-template>

                  <div class="chain-inputs">
                    <label>
                      {{ 'admin.chains.addExisting' | translate: 'Add existing chain' }}
                      <div class="chain-entry">
                        <input
                          type="text"
                          name="chain-entry"
                          [(ngModel)]="chainInput"
                          [attr.placeholder]="
                            'admin.chains.namePlaceholder'
                              | translate: 'Start typing to find or create a chain'
                          "
                          [attr.list]="chains.length ? 'chain-options' : null"
                          (keydown.enter)="addChainFromInput(); $event.preventDefault()"
                        />
                        <button
                          type="button"
                          (click)="addChainFromInput()"
                          [disabled]="addingChain || !chainInput.trim()"
                        >
                          {{
                            addingChain
                              ? ('admin.chains.creating' | translate: 'Saving…')
                              : chainInputMatchesExisting
                                ? ('admin.chains.addButton' | translate: 'Add chain')
                                : ('admin.chains.create' | translate: 'Create & add')
                          }}
                        </button>
                      </div>
                    </label>
                    <datalist id="chain-options" *ngIf="chains.length">
                      <option *ngFor="let chain of chains" [value]="chain.name"></option>
                    </datalist>
                  </div>

                  <span
                    *ngIf="chainMessage"
                    class="status"
                    [class.success]="chainMessageType === 'success'"
                    [class.error]="chainMessageType === 'error'"
                  >
                    {{ chainMessage }}
                  </span>
                </div>

                <div class="language-fields">
                  <div class="language-card" *ngFor="let language of languages">
                    <h4>{{ language.label }}</h4>

                    <label [attr.for]="'description-' + language.code">
                      {{
                        'admin.details.descriptionLabel'
                          | translate: 'Description ({{language}})': { language: language.label }
                      }}
                      <textarea
                        [id]="'description-' + language.code"
                        name="description-{{ language.code }}"
                        [(ngModel)]="detailsForm.descriptions[language.code]"
                        [attr.placeholder]="
                          'admin.details.descriptionPlaceholder'
                            | translate: 'Describe the restaurant in {{language}}': { language: language.label }
                        "
                      ></textarea>
                    </label>
                  </div>
                </div>

                <div class="details-actions">
                  <span
                    *ngIf="detailsMessage"
                    class="status"
                    [class.success]="detailsMessageType === 'success'"
                    [class.error]="detailsMessageType === 'error'"
                    >{{ detailsMessage }}</span
                  >
                  <button type="submit" [disabled]="detailsSaving">
                    {{
                      detailsSaving
                        ? ('admin.details.saving' | translate: 'Saving…')
                        : ('admin.details.save' | translate: 'Save details')
                    }}
                  </button>
                </div>
              </form>
            </section>

            <section class="card">
              <header>
                <h3>{{ 'admin.photos.heading' | translate: 'Restaurant photos' }}</h3>
                <p>{{ 'admin.photos.description' | translate: 'Keep your storefront up to date by refreshing the gallery.' }}</p>
              </header>

              <div class="photo-grid" *ngIf="restaurant.photos?.length">
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

            <app-menu-manager [restaurantId]="selectedRestaurantId!"></app-menu-manager>
          </ng-container>
        </ng-container>
      </div>

      <section class="card">
        <header>
          <h3>{{ 'admin.orders.heading' | translate: 'Recent orders' }}</h3>
          <p>{{ 'admin.orders.description' | translate: 'Review recent activity to keep operations running smoothly.' }}</p>
        </header>

        <ng-container *ngIf="orders$ | async as orders; else loadingOrders">
          <ng-container *ngIf="orders.length; else emptyOrders">
            <div class="orders-list">
              <article class="order-card" *ngFor="let order of orders">
                <header>
                  <span>
                    #{{ order.id }} ·
                    {{ order.restaurant?.name || ('admin.orders.unknownRestaurant' | translate: 'Unknown restaurant') }}
                  </span>
                  <span>{{ order.total_cents / 100 | currency:'EUR' }}</span>
                </header>
                <div class="meta">
                  {{
                    'admin.orders.meta'
                      | translate: 'Placed {{date}} · Status: {{status}}': {
                          date: (order.created_at | date:'medium') || '',
                          status: order.status
                        }
                  }}
                </div>
                <div class="meta" *ngIf="order.user?.email">
                  {{ 'admin.orders.customer' | translate: 'Customer: {{email}}': { email: order.user?.email || '' } }}
                </div>
              </article>
            </div>
          </ng-container>
        </ng-container>
        <ng-template #loadingOrders>
          <p>{{ 'admin.orders.loading' | translate: 'Loading orders…' }}</p>
        </ng-template>
        <ng-template #emptyOrders>
          <p>{{ 'admin.orders.empty' | translate: 'No orders yet.' }}</p>
        </ng-template>
      </section>
    </div>

    <ng-template #managePlaceholder>
      <section class="card">
        <header>
          <h3>{{ 'admin.managePlaceholder.title' | translate: 'Manage restaurant content' }}</h3>
        </header>
        <p>
          {{
            'admin.managePlaceholder.description'
              | translate: 'Choose a restaurant above to start uploading photos and editing menus.'
          }}
        </p>
      </section>
    </ng-template>
  `
})
export class AdminDashboardPage {
  private restaurantService = inject(RestaurantService);
  private chainService = inject(ChainService);
  private orderService = inject(OrderService);
  private i18n = inject(TranslationService);

  constructor() {
    this.loadChains();
  }

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
    tap(restaurant => this.populateDetailsForm(restaurant)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  orders$ = this.orderService.list();

  selectedPhotos: File[] = [];
  uploading = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';
  removingPhotoId: number | null = null;
  removingChainId: number | null = null;

  chains: Chain[] = [];
  restaurantChain: Chain | null = null;
  chainInput = '';
  addingChain = false;
  chainMessage = '';
  chainMessageType: 'success' | 'error' | '' = '';

  languages = this.i18n.languages;
  primaryLanguageCode = this.languages[0]?.code ?? 'en';

  detailsForm: { name: string; descriptions: Record<string, string> } = {
    name: '',
    descriptions: {},
  };
  detailsSaving = false;
  detailsMessage = '';
  detailsMessageType: 'success' | 'error' | '' = '';

  onRestaurantChange(value: string | number) {
    const id = Number(value);
    this.selectedRestaurantId = id;
    this.selectedRestaurantIdSubject.next(id);
    this.resetUploadState();
    this.resetDetailsStatus();
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
      this.statusMessage = this.i18n.translate('restaurantDetail.photosUploaded', 'Photos uploaded successfully!');
      this.statusType = 'success';
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
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
    if (this.selectedRestaurantId === null || this.removingPhotoId !== null) {
      return;
    }

    if (!confirm(this.i18n.translate('restaurantDetail.removePhotoConfirm', 'Remove this photo?'))) {
      return;
    }

    this.removingPhotoId = photo.id;
    this.statusMessage = '';
    this.statusType = '';

    try {
      await firstValueFrom(this.restaurantService.deletePhoto(this.selectedRestaurantId, photo.id));
      this.statusMessage = this.i18n.translate('restaurantDetail.photoRemoved', 'Photo removed.');
      this.statusType = 'success';
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
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

  private populateDetailsForm(restaurant: Restaurant) {
    const descriptions: Record<string, string> = {};

    this.languages.forEach(language => {
      descriptions[language.code] = this.getTranslationForLanguage(
        restaurant.description_translations,
        restaurant.description,
        language.code
      );
    });

    const name = this.getTranslationForLanguage(
      restaurant.name_translations,
      restaurant.name,
      this.primaryLanguageCode
    );

    this.detailsForm = { name, descriptions };
    this.setRestaurantChain(restaurant);
    this.chainInput = '';
    this.resetDetailsStatus();
    this.resetChainStatus();
  }

  private getTranslationForLanguage(
    translations: Record<string, string> | undefined,
    fallback: string | undefined,
    languageCode: string
  ): string {
    const normalizedCode = languageCode.toLowerCase();
    if (translations) {
      const direct =
        translations[languageCode] ?? translations[normalizedCode] ?? translations[languageCode.toUpperCase()];
      if (direct?.trim()) {
        return direct.trim();
      }

      const variant = Object.entries(translations).find(([key]) => key.toLowerCase().startsWith(`${normalizedCode}-`));
      if (variant?.[1]?.trim()) {
        return variant[1].trim();
      }
    }

    if (languageCode === this.primaryLanguageCode && fallback?.trim()) {
      return fallback.trim();
    }

    return '';
  }

  async saveDetails() {
    if (this.selectedRestaurantId === null || this.detailsSaving) {
      return;
    }

    const trimmedName = this.detailsForm.name.trim();

    if (!trimmedName) {
      this.detailsMessage = this.i18n.translate(
        'admin.details.requiredName',
        'Enter at least one restaurant name.'
      );
      this.detailsMessageType = 'error';
      return;
    }

    const payload = this.buildUpdatePayload(trimmedName);

    this.detailsSaving = true;
    this.detailsMessage = '';
    this.detailsMessageType = '';

    try {
      await firstValueFrom(this.restaurantService.update(this.selectedRestaurantId, payload));
      this.detailsMessage = this.i18n.translate('admin.details.saved', 'Restaurant details updated!');
      this.detailsMessageType = 'success';
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
    } catch (err) {
      console.error(err);
      this.detailsMessage = this.i18n.translate(
        'admin.details.error',
        'Unable to update the restaurant. Please try again.'
      );
      this.detailsMessageType = 'error';
    } finally {
      this.detailsSaving = false;
    }
  }

  private buildUpdatePayload(trimmedName: string): RestaurantUpdateInput {
    const descriptionTranslations: Record<string, string> = {};

    this.languages.forEach(language => {
      const descriptionValue = this.detailsForm.descriptions[language.code]?.trim();
      if (descriptionValue) {
        descriptionTranslations[language.code] = descriptionValue;
      }
    });

    const primaryDescription = this.detailsForm.descriptions[this.primaryLanguageCode]?.trim() ?? '';

    const payload: RestaurantUpdateInput = {
      name: trimmedName,
      description: primaryDescription,
    };

    if (Object.keys(descriptionTranslations).length) {
      payload.description_translations = descriptionTranslations;
    }

    return payload;
  }

  private sortChains(chains: Chain[]): Chain[] {
    return [...chains].sort((a, b) => a.name.localeCompare(b.name));
  }

  private setRestaurantChain(restaurant: Restaurant) {
    this.restaurantChain = restaurant.chain ?? null;
  }

  private resetChainStatus() {
    this.chainMessage = '';
    this.chainMessageType = '';
    this.removingChainId = null;
    this.addingChain = false;
  }

  private clearChainMessage() {
    this.chainMessage = '';
    this.chainMessageType = '';
  }

  private async loadChains() {
    try {
      const chains = await firstValueFrom(this.chainService.list());
      this.chains = this.sortChains(chains ?? []);
    } catch (err) {
      console.error('Failed to load chains', err);
      this.chains = [];
    }
  }

  isChainAttached(chainId: number): boolean {
    return this.restaurantChain?.id === chainId;
  }

  get chainInputMatchesExisting(): boolean {
    const trimmed = this.chainInput.trim().toLowerCase();
    if (!trimmed) {
      return false;
    }

    return this.chains.some(chain => chain.name.trim().toLowerCase() === trimmed);
  }

  async removeChain(chain: Chain) {
    if (this.selectedRestaurantId === null || this.removingChainId === chain.id) {
      return;
    }

    this.clearChainMessage();
    this.removingChainId = chain.id;

    try {
      await firstValueFrom(this.chainService.removeChainFromRestaurant(this.selectedRestaurantId, chain.id));
      this.restaurantChain = null;
      this.setChainMessage('success', 'admin.chains.removed', 'Chain removed from restaurant.');
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
    } catch (err) {
      console.error(err);
      this.setChainMessage('error', 'admin.chains.error', 'Unable to update chain. Please try again.');
    } finally {
      this.removingChainId = null;
    }
  }

  async addChainFromInput() {
    if (this.selectedRestaurantId === null || this.addingChain) {
      return;
    }

    const trimmedName = this.chainInput.trim();

    if (!trimmedName) {
      this.chainInput = trimmedName;
      return;
    }

    const existingChain = this.findChainByName(trimmedName);

    if (existingChain && this.isChainAttached(existingChain.id)) {
      this.setChainMessage('error', 'admin.chains.alreadyAdded', 'This chain is already linked to the restaurant.');
      this.chainInput = '';
      return;
    }

    this.addingChain = true;
    this.clearChainMessage();

    try {
      let chain: Chain | undefined = existingChain;

      if (!chain) {
        chain = await firstValueFrom(this.chainService.create({ name: trimmedName }));
        this.chains = this.sortChains([...this.chains, chain]);
      }

      if (this.restaurantChain && this.restaurantChain.id !== chain.id) {
        await firstValueFrom(
          this.chainService.removeChainFromRestaurant(this.selectedRestaurantId, this.restaurantChain.id)
        );
        this.restaurantChain = null;
      }

      await firstValueFrom(this.chainService.addChainToRestaurant(this.selectedRestaurantId, chain.id));
      this.restaurantChain = chain;
      this.setChainMessage(
        'success',
        chain === existingChain ? 'admin.chains.added' : 'admin.chains.created',
        chain === existingChain ? 'Chain assigned to restaurant.' : 'New chain created and assigned!'
      );
      this.chainInput = '';
      this.selectedRestaurantIdSubject.next(this.selectedRestaurantId);
    } catch (err) {
      console.error(err);
      this.setChainMessage('error', 'admin.chains.error', 'Unable to update chain. Please try again.');
    } finally {
      this.addingChain = false;
    }
  }

  private findChainByName(name: string): Chain | undefined {
    const normalized = name.trim().toLowerCase();
    return this.chains.find(chain => chain.name.trim().toLowerCase() === normalized);
  }

  private setChainMessage(type: 'success' | 'error', key: string, fallback: string) {
    this.chainMessage = this.i18n.translate(key, fallback);
    this.chainMessageType = type;
  }

  private resetDetailsStatus() {
    this.detailsMessage = '';
    this.detailsMessageType = '';
    this.detailsSaving = false;
  }
}
