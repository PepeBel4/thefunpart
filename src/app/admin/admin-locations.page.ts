import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  of,
  catchError,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { Location, LocationInput } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocationService } from '../locations/location.service';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

interface LocationFormState {
  name: string;
  location_type: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-locations',
  imports: [AsyncPipe, FormsModule, NgFor, NgIf, TranslatePipe],
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

    .status-message {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .status-message.error {
      color: #d14343;
    }

    .status-banner {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .status-banner.success {
      color: var(--brand-green);
    }

    .status-banner.error {
      color: #d14343;
    }

    .location-list {
      display: grid;
      gap: 1.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .location-card {
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 0.85rem;
      padding: clamp(1.25rem, 2vw, 1.5rem);
      background: rgba(255, 255, 255, 0.9);
      display: grid;
      gap: 1rem;
    }

    .location-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .location-header h4 {
      margin: 0;
      font-size: 1.05rem;
    }

    .badge {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
      color: #046032;
    }

    .location-body {
      display: grid;
      gap: 0.35rem;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .location-body strong {
      color: var(--text-primary);
    }

    .location-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    button.action {
      border: 0;
      border-radius: 999px;
      padding: 0.55rem 1.15rem;
      font-weight: 600;
      cursor: pointer;
      background: rgba(10, 10, 10, 0.08);
      color: var(--text-primary);
      transition: background 0.2s ease;
    }

    button.action.primary {
      background: var(--brand-green);
      color: var(--brand-on-primary);
      box-shadow: 0 12px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
    }

    button.action.danger {
      background: rgba(209, 67, 67, 0.18);
      color: #7a2020;
    }

    button.action:hover:not(:disabled) {
      background: rgba(10, 10, 10, 0.12);
    }

    button.action.primary:hover:not(:disabled) {
      background: var(--brand-green);
      filter: brightness(0.95);
    }

    button.action.danger:hover:not(:disabled) {
      background: rgba(209, 67, 67, 0.24);
    }

    button.action:disabled {
      opacity: 0.65;
      cursor: default;
      box-shadow: none;
    }

    form.location-form {
      display: grid;
      gap: 1rem;
    }

    form.location-form label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-weight: 600;
      font-size: 0.9rem;
    }

    form.location-form input,
    form.location-form select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font: inherit;
      background: rgba(255, 255, 255, 0.95);
    }

    .form-grid {
      display: grid;
      gap: 0.75rem;
    }

    @media (min-width: 720px) {
      .form-grid.two-column {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .empty-state {
      font-style: italic;
      color: var(--text-secondary);
    }
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurantId$ | async as restaurantId">
      <header>
        <h3>{{ 'admin.locations.heading' | translate: 'Locations' }}</h3>
        <p>
          {{
            'admin.locations.description'
              | translate: 'Keep branch addresses current so guests know where to find you.'
          }}
        </p>
      </header>

      <ng-container *ngIf="restaurantId !== null; else noRestaurantSelected">
        <div *ngIf="loading" class="status-message">
          {{ 'admin.locations.loading' | translate: 'Loading locations…' }}
        </div>

        <div *ngIf="loadError" class="status-message error">{{ loadError }}</div>

        <ng-container *ngIf="locations$ | async as locations">
          <ul class="location-list" *ngIf="locations.length; else noLocations">
            <li class="location-card" *ngFor="let location of locations; trackBy: trackByLocationId">
              <ng-container *ngIf="editingLocationId === location.id; else viewMode">
                <form class="location-form" (ngSubmit)="updateLocation(location.id)">
                  <div class="form-grid">
                    <label>
                      {{ 'admin.locations.nameLabel' | translate: 'Location name' }}
                      <input
                        type="text"
                        required
                        [name]="'editName' + location.id"
                        [(ngModel)]="editForm.name"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.typeLabel' | translate: 'Type' }}
                      <input
                        type="text"
                        [name]="'editType' + location.id"
                        [(ngModel)]="editForm.location_type"
                      />
                    </label>
                  </div>

                  <div class="form-grid two-column">
                    <label>
                      {{ 'admin.locations.address1Label' | translate: 'Address line 1' }}
                      <input
                        type="text"
                        [name]="'editAddress1' + location.id"
                        [(ngModel)]="editForm.address_line1"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.address2Label' | translate: 'Address line 2' }}
                      <input
                        type="text"
                        [name]="'editAddress2' + location.id"
                        [(ngModel)]="editForm.address_line2"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.cityLabel' | translate: 'City' }}
                      <input
                        type="text"
                        [name]="'editCity' + location.id"
                        [(ngModel)]="editForm.city"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.stateLabel' | translate: 'State / Province' }}
                      <input
                        type="text"
                        [name]="'editState' + location.id"
                        [(ngModel)]="editForm.state"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.postalCodeLabel' | translate: 'Postal code' }}
                      <input
                        type="text"
                        [name]="'editPostal' + location.id"
                        [(ngModel)]="editForm.postal_code"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.countryLabel' | translate: 'Country' }}
                      <input
                        type="text"
                        [name]="'editCountry' + location.id"
                        [(ngModel)]="editForm.country"
                      />
                    </label>
                  </div>

                  <div class="form-grid two-column">
                    <label>
                      {{ 'admin.locations.latitudeLabel' | translate: 'Latitude' }}
                      <input
                        type="text"
                        inputmode="decimal"
                        [name]="'editLatitude' + location.id"
                        [(ngModel)]="editForm.latitude"
                      />
                    </label>
                    <label>
                      {{ 'admin.locations.longitudeLabel' | translate: 'Longitude' }}
                      <input
                        type="text"
                        inputmode="decimal"
                        [name]="'editLongitude' + location.id"
                        [(ngModel)]="editForm.longitude"
                      />
                    </label>
                  </div>

                  <div class="form-actions">
                    <button class="action primary" type="submit" [disabled]="updatingId === location.id">
                      {{
                        updatingId === location.id
                          ? ('admin.locations.updating' | translate: 'Saving…')
                          : ('admin.locations.update' | translate: 'Save changes')
                      }}
                    </button>
                    <button class="action" type="button" (click)="cancelEdit()">
                      {{ 'admin.locations.cancel' | translate: 'Cancel' }}
                    </button>
                  </div>
                </form>
              </ng-container>

              <ng-template #viewMode>
                <div class="location-header">
                  <h4>{{ location.name }}</h4>
                  <span class="badge" *ngIf="location.location_type">{{ location.location_type }}</span>
                </div>

                <div class="location-body">
                  <div *ngIf="location.address_line1 || location.address_line2">
                    <strong>{{ 'admin.locations.addressLabel' | translate: 'Address' }}:</strong>
                    <div>{{ location.address_line1 }}</div>
                    <div *ngIf="location.address_line2">{{ location.address_line2 }}</div>
                  </div>

                  <div *ngIf="location.city || location.state || location.postal_code">
                    <strong>{{ 'admin.locations.cityStateLabel' | translate: 'City & region' }}:</strong>
                    <div>
                      {{ location.city }}
                      <span *ngIf="location.state">
                        <ng-container *ngIf="location.city">· </ng-container>{{ location.state }}
                      </span>
                      <span *ngIf="location.postal_code">
                        <ng-container *ngIf="location.city || location.state">· </ng-container>{{
                          location.postal_code
                        }}
                      </span>
                    </div>
                  </div>

                  <div *ngIf="location.country">
                    <strong>{{ 'admin.locations.countryLabel' | translate: 'Country' }}:</strong>
                    <div>{{ location.country }}</div>
                  </div>

                  <div *ngIf="location.latitude !== null && location.latitude !== undefined">
                    <strong>{{ 'admin.locations.latitudeLabel' | translate: 'Latitude' }}:</strong>
                    <div>{{ location.latitude }}</div>
                  </div>

                  <div *ngIf="location.longitude !== null && location.longitude !== undefined">
                    <strong>{{ 'admin.locations.longitudeLabel' | translate: 'Longitude' }}:</strong>
                    <div>{{ location.longitude }}</div>
                  </div>
                </div>

                <div class="location-actions">
                  <button class="action" type="button" (click)="startEdit(location)">
                    {{ 'admin.locations.edit' | translate: 'Edit' }}
                  </button>
                  <button
                    class="action danger"
                    type="button"
                    (click)="deleteLocation(location)"
                    [disabled]="deletingId === location.id"
                  >
                    {{
                      deletingId === location.id
                        ? ('admin.locations.deleting' | translate: 'Removing…')
                        : ('admin.locations.delete' | translate: 'Delete')
                    }}
                  </button>
                </div>
              </ng-template>
            </li>
          </ul>
        </ng-container>

        <ng-template #noLocations>
          <p class="empty-state" *ngIf="!loading && !loadError">
            {{
              'admin.locations.empty'
                | translate: 'No locations yet. Add your first location using the form below.'
            }}
          </p>
        </ng-template>

        <form class="location-form" (ngSubmit)="createLocation()">
          <h4>{{ 'admin.locations.createHeading' | translate: 'Add a new location' }}</h4>

          <div class="form-grid">
            <label>
              {{ 'admin.locations.nameLabel' | translate: 'Location name' }}
              <input
                type="text"
                name="createName"
                required
                [(ngModel)]="newLocationForm.name"
              />
            </label>
            <label>
              {{ 'admin.locations.typeLabel' | translate: 'Type' }}
              <input type="text" name="createType" [(ngModel)]="newLocationForm.location_type" />
            </label>
          </div>

          <div class="form-grid two-column">
            <label>
              {{ 'admin.locations.address1Label' | translate: 'Address line 1' }}
              <input
                type="text"
                name="createAddress1"
                [(ngModel)]="newLocationForm.address_line1"
              />
            </label>
            <label>
              {{ 'admin.locations.address2Label' | translate: 'Address line 2' }}
              <input
                type="text"
                name="createAddress2"
                [(ngModel)]="newLocationForm.address_line2"
              />
            </label>
            <label>
              {{ 'admin.locations.cityLabel' | translate: 'City' }}
              <input type="text" name="createCity" [(ngModel)]="newLocationForm.city" />
            </label>
            <label>
              {{ 'admin.locations.stateLabel' | translate: 'State / Province' }}
              <input type="text" name="createState" [(ngModel)]="newLocationForm.state" />
            </label>
            <label>
              {{ 'admin.locations.postalCodeLabel' | translate: 'Postal code' }}
              <input
                type="text"
                name="createPostal"
                [(ngModel)]="newLocationForm.postal_code"
              />
            </label>
            <label>
              {{ 'admin.locations.countryLabel' | translate: 'Country' }}
              <input type="text" name="createCountry" [(ngModel)]="newLocationForm.country" />
            </label>
          </div>

          <div class="form-grid two-column">
            <label>
              {{ 'admin.locations.latitudeLabel' | translate: 'Latitude' }}
              <input
                type="text"
                inputmode="decimal"
                name="createLatitude"
                [(ngModel)]="newLocationForm.latitude"
              />
            </label>
            <label>
              {{ 'admin.locations.longitudeLabel' | translate: 'Longitude' }}
              <input
                type="text"
                inputmode="decimal"
                name="createLongitude"
                [(ngModel)]="newLocationForm.longitude"
              />
            </label>
          </div>

          <div class="form-actions">
            <button class="action primary" type="submit" [disabled]="creating">
              {{
                creating
                  ? ('admin.locations.saving' | translate: 'Saving…')
                  : ('admin.locations.create' | translate: 'Add location')
              }}
            </button>
            <button class="action" type="button" (click)="resetNewLocationForm()">
              {{ 'admin.locations.reset' | translate: 'Reset form' }}
            </button>
          </div>
        </form>
      </ng-container>

      <ng-template #noRestaurantSelected>
        <p class="empty-state">
          {{
            'admin.locations.noRestaurant'
              | translate: 'Select a restaurant to manage its locations.'
          }}
        </p>
      </ng-template>

      <div
        *ngIf="statusMessage"
        class="status-banner"
        [class.success]="statusType === 'success'"
        [class.error]="statusType === 'error'"
      >
        {{ statusMessage }}
      </div>
    </section>
  `,
})
export class AdminLocationsPage {
  private context = inject(AdminRestaurantContextService);
  private locations = inject(LocationService);
  private i18n = inject(TranslationService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;

  private reloadLocations$ = new BehaviorSubject<void>(undefined);
  private currentRestaurantId: number | null = null;

  readonly locations$ = combineLatest([this.selectedRestaurantId$, this.reloadLocations$]).pipe(
    switchMap(([restaurantId]) => {
      if (restaurantId !== this.currentRestaurantId) {
        this.currentRestaurantId = restaurantId;
        this.clearStatus();
        this.cancelEdit();
        this.resetNewLocationForm();
      }

      this.loadError = '';
      this.loading = true;

      if (restaurantId === null) {
        this.loading = false;
        return of([] as Location[]);
      }

      return this.locations.listForRestaurant(restaurantId).pipe(
        tap(locations => {
          this.loading = false;
          if (!locations.some(location => location.id === this.editingLocationId)) {
            this.cancelEdit();
          }
        }),
        catchError(error => {
          console.error('Failed to load locations', error);
          this.loading = false;
          this.loadError = this.i18n.translate(
            'admin.locations.loadError',
            'Unable to load locations. Please try again.'
          );
          return of([] as Location[]);
        })
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  newLocationForm: LocationFormState = this.createEmptyForm();
  editForm: LocationFormState = this.createEmptyForm();
  editingLocationId: number | null = null;

  loading = false;
  loadError = '';
  creating = false;
  updatingId: number | null = null;
  deletingId: number | null = null;

  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  trackByLocationId(_: number, location: Location) {
    return location.id;
  }

  async createLocation() {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null || this.creating) {
      return;
    }

    const trimmedName = this.newLocationForm.name.trim();
    if (!trimmedName) {
      this.setStatus(
        'error',
        this.i18n.translate('admin.locations.nameRequired', 'Enter a name for the location.')
      );
      return;
    }

    this.creating = true;
    this.clearStatus();

    const payload = this.buildPayload(this.newLocationForm);

    try {
      await firstValueFrom(this.locations.createForRestaurant(restaurantId, payload));
      this.setStatus(
        'success',
        this.i18n.translate('admin.locations.created', 'Location added successfully.')
      );
      this.resetNewLocationForm();
      this.reloadLocations();
    } catch (error) {
      console.error('Failed to create location', error);
      this.setStatus(
        'error',
        this.i18n.translate('admin.locations.createError', 'Could not add the location. Please try again.')
      );
    } finally {
      this.creating = false;
    }
  }

  startEdit(location: Location) {
    this.editingLocationId = location.id;
    this.editForm = this.toFormState(location);
    this.clearStatus();
  }

  cancelEdit() {
    this.editingLocationId = null;
    this.editForm = this.createEmptyForm();
  }

  async updateLocation(locationId: number) {
    if (this.updatingId !== null || this.editingLocationId !== locationId) {
      return;
    }

    const trimmedName = this.editForm.name.trim();
    if (!trimmedName) {
      this.setStatus(
        'error',
        this.i18n.translate('admin.locations.nameRequired', 'Enter a name for the location.')
      );
      return;
    }

    this.updatingId = locationId;
    this.clearStatus();

    const payload = this.buildPayload(this.editForm);

    try {
      await firstValueFrom(this.locations.update(locationId, payload));
      this.setStatus(
        'success',
        this.i18n.translate('admin.locations.updated', 'Location updated.')
      );
      this.cancelEdit();
      this.reloadLocations();
    } catch (error) {
      console.error('Failed to update location', error);
      this.setStatus(
        'error',
        this.i18n.translate('admin.locations.updateError', 'Could not save changes. Please try again.')
      );
    } finally {
      this.updatingId = null;
    }
  }

  async deleteLocation(location: Location) {
    if (this.deletingId !== null) {
      return;
    }

    const confirmation = confirm(
      this.i18n.translate('admin.locations.deleteConfirm', 'Remove this location?')
    );

    if (!confirmation) {
      return;
    }

    this.deletingId = location.id;
    this.clearStatus();

    try {
      await firstValueFrom(this.locations.delete(location.id));
      this.setStatus(
        'success',
        this.i18n.translate('admin.locations.deleted', 'Location removed.')
      );
      this.reloadLocations();
    } catch (error) {
      console.error('Failed to delete location', error);
      this.setStatus(
        'error',
        this.i18n.translate('admin.locations.deleteError', 'Could not remove the location. Please try again.')
      );
    } finally {
      this.deletingId = null;
    }
  }

  resetNewLocationForm() {
    this.newLocationForm = this.createEmptyForm();
  }

  private reloadLocations() {
    this.reloadLocations$.next(undefined);
  }

  private createEmptyForm(): LocationFormState {
    return {
      name: '',
      location_type: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      latitude: '',
      longitude: '',
    };
  }

  private toFormState(location: Location): LocationFormState {
    return {
      name: location.name ?? '',
      location_type: location.location_type ?? '',
      address_line1: location.address_line1 ?? '',
      address_line2: location.address_line2 ?? '',
      city: location.city ?? '',
      state: location.state ?? '',
      postal_code: location.postal_code ?? '',
      country: location.country ?? '',
      latitude: this.formatCoordinate(location.latitude),
      longitude: this.formatCoordinate(location.longitude),
    };
  }

  private formatCoordinate(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private buildPayload(form: LocationFormState): LocationInput {
    return {
      name: form.name.trim(),
      location_type: this.normalizeString(form.location_type),
      address_line1: this.normalizeString(form.address_line1),
      address_line2: this.normalizeString(form.address_line2),
      city: this.normalizeString(form.city),
      state: this.normalizeString(form.state),
      postal_code: this.normalizeString(form.postal_code),
      country: this.normalizeString(form.country),
      latitude: this.parseCoordinate(form.latitude),
      longitude: this.parseCoordinate(form.longitude),
    };
  }

  private normalizeString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private parseCoordinate(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private clearStatus() {
    this.statusMessage = '';
    this.statusType = '';
  }

  private setStatus(type: 'success' | 'error', message: string) {
    this.statusType = type;
    this.statusMessage = message;
  }
}
