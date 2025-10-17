import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  LocationOpeningHour,
  LocationOpeningHourException,
  LocationOpeningHourExceptionInput,
  LocationOpeningHourInput,
} from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { LocationService } from '../locations/location.service';

type OpeningHourForm = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
};

type OpeningHourExceptionForm = {
  date: string;
  closed: boolean;
  starts_at: string;
  ends_at: string;
  reason: string;
};

interface DayOption {
  value: number;
  labelKey: string;
  fallback: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-location-hours',
  imports: [CommonModule, FormsModule, TranslatePipe],
  styles: [
    `
      :host {
        display: block;
        margin-top: 1rem;
      }

      section.hours-card {
        border-top: 1px solid rgba(10, 10, 10, 0.08);
        padding-top: 1.25rem;
        margin-top: 1.25rem;
        display: grid;
        gap: 1.25rem;
      }

      section.hours-card:first-of-type {
        margin-top: 0;
        padding-top: 0;
        border-top: 0;
      }

      h5 {
        margin: 0;
        font-size: 1rem;
      }

      p.section-description {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .status-message {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .status-message.error {
        color: #d14343;
      }

      .status-banner {
        font-size: 0.9rem;
        font-weight: 600;
      }

      .status-banner.success {
        color: var(--brand-green);
      }

      .status-banner.error {
        color: #d14343;
      }

      ul.item-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
      }

      .list-item {
        border: 1px solid rgba(10, 10, 10, 0.08);
        border-radius: 0.75rem;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.9);
      }

      .item-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
      }

      .item-header strong {
        font-size: 0.95rem;
      }

      .item-meta {
        display: grid;
        gap: 0.35rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .action-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      button.action {
        border: 0;
        border-radius: 999px;
        padding: 0.45rem 1rem;
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

      button.action:disabled {
        opacity: 0.65;
        cursor: default;
        box-shadow: none;
      }

      button.action:hover:not(:disabled) {
        background: rgba(10, 10, 10, 0.12);
      }

      form.inline-form {
        display: grid;
        gap: 0.75rem;
      }

      form.inline-form .grid {
        display: grid;
        gap: 0.75rem;
      }

      form.inline-form label {
        font-weight: 600;
        font-size: 0.85rem;
        display: grid;
        gap: 0.35rem;
      }

      form.inline-form input,
      form.inline-form select,
      form.inline-form textarea {
        padding: 0.55rem 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid rgba(10, 10, 10, 0.12);
        font: inherit;
        background: rgba(255, 255, 255, 0.95);
      }

      form.inline-form textarea {
        min-height: 3rem;
        resize: vertical;
      }

      .inline-form .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .empty-state {
        font-style: italic;
        color: var(--text-secondary);
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .checkbox-row input[type='checkbox'] {
        width: 1rem;
        height: 1rem;
      }

      @media (min-width: 720px) {
        form.inline-form .grid.two-column {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
  template: `
    <section class="hours-card">
      <div>
        <h5>{{ 'admin.locations.hours.heading' | translate: 'Regular opening hours' }}</h5>
        <p class="section-description">
          {{
            'admin.locations.hours.description'
              | translate: 'Set weekly hours guests can rely on.'
          }}
        </p>
      </div>

      <div *ngIf="openingHoursLoading" class="status-message">
        {{ 'admin.locations.hours.loading' | translate: 'Loading opening hours…' }}
      </div>
      <div *ngIf="openingHoursError" class="status-message error">{{ openingHoursError }}</div>

      <ng-container *ngIf="openingHours.length; else noOpeningHours">
        <ul class="item-list">
          <li class="list-item" *ngFor="let hour of openingHours">
            <ng-container *ngIf="editingHourId === hour.id; else viewHour">
              <form class="inline-form" (ngSubmit)="updateOpeningHour(hour.id)">
                <div class="grid two-column">
                  <label>
                    {{ 'admin.locations.hours.dayLabel' | translate: 'Day of week' }}
                    <select [name]="'editHourDay' + hour.id" [(ngModel)]="openingHourEditForm.day_of_week">
                      <option *ngFor="let option of dayOptions" [ngValue]="option.value">
                        {{ option.labelKey | translate: option.fallback }}
                      </option>
                    </select>
                  </label>
                  <label>
                    {{ 'admin.locations.hours.opensAtLabel' | translate: 'Opens at' }}
                    <input
                      type="time"
                      required
                      [name]="'editHourOpens' + hour.id"
                      [(ngModel)]="openingHourEditForm.opens_at"
                    />
                  </label>
                  <label>
                    {{ 'admin.locations.hours.closesAtLabel' | translate: 'Closes at' }}
                    <input
                      type="time"
                      required
                      [name]="'editHourCloses' + hour.id"
                      [(ngModel)]="openingHourEditForm.closes_at"
                    />
                  </label>
                </div>
                <div class="actions">
                  <button
                    class="action primary"
                    type="submit"
                    [disabled]="updatingHourId === hour.id"
                  >
                    {{
                      updatingHourId === hour.id
                        ? ('admin.locations.hours.updating' | translate: 'Saving…')
                        : ('admin.locations.hours.update' | translate: 'Save')
                    }}
                  </button>
                  <button class="action" type="button" (click)="cancelHourEdit()">
                    {{ 'admin.locations.hours.cancel' | translate: 'Cancel' }}
                  </button>
                </div>
              </form>
            </ng-container>

            <ng-template #viewHour>
              <div class="item-header">
                <strong>{{ dayLabel(hour.day_of_week) }}</strong>
                <div class="action-row">
                  <button class="action" type="button" (click)="startHourEdit(hour)">
                    {{ 'admin.locations.hours.edit' | translate: 'Edit' }}
                  </button>
                  <button
                    class="action danger"
                    type="button"
                    (click)="deleteOpeningHour(hour)"
                    [disabled]="deletingHourId === hour.id"
                  >
                    {{
                      deletingHourId === hour.id
                        ? ('admin.locations.hours.deleting' | translate: 'Removing…')
                        : ('admin.locations.hours.delete' | translate: 'Delete')
                    }}
                  </button>
                </div>
              </div>
              <div class="item-meta">
                <span>
                  {{ 'admin.locations.hours.opensAtLabel' | translate: 'Opens at' }}:
                  <strong>{{ formatTime(hour.opens_at) }}</strong>
                </span>
                <span>
                  {{ 'admin.locations.hours.closesAtLabel' | translate: 'Closes at' }}:
                  <strong>{{ formatTime(hour.closes_at) }}</strong>
                </span>
              </div>
            </ng-template>
          </li>
        </ul>
      </ng-container>

      <ng-template #noOpeningHours>
        <p class="empty-state">
          {{
            'admin.locations.hours.empty'
              | translate: 'No opening hours added yet.'
          }}
        </p>
      </ng-template>

      <form class="inline-form" (ngSubmit)="createOpeningHour()">
        <h6>{{ 'admin.locations.hours.addHeading' | translate: 'Add opening hours' }}</h6>
        <div class="grid two-column">
          <label>
            {{ 'admin.locations.hours.dayLabel' | translate: 'Day of week' }}
            <select name="createHourDay" [(ngModel)]="openingHourCreateForm.day_of_week">
              <option *ngFor="let option of dayOptions" [ngValue]="option.value">
                {{ option.labelKey | translate: option.fallback }}
              </option>
            </select>
          </label>
          <label>
            {{ 'admin.locations.hours.opensAtLabel' | translate: 'Opens at' }}
            <input type="time" required name="createHourOpens" [(ngModel)]="openingHourCreateForm.opens_at" />
          </label>
          <label>
            {{ 'admin.locations.hours.closesAtLabel' | translate: 'Closes at' }}
            <input type="time" required name="createHourCloses" [(ngModel)]="openingHourCreateForm.closes_at" />
          </label>
        </div>
        <div class="actions">
          <button class="action primary" type="submit" [disabled]="creatingHour">
            {{
              creatingHour
                ? ('admin.locations.hours.saving' | translate: 'Saving…')
                : ('admin.locations.hours.add' | translate: 'Add hours')
            }}
          </button>
          <button class="action" type="button" (click)="resetHourCreateForm()">
            {{ 'admin.locations.hours.reset' | translate: 'Reset form' }}
          </button>
        </div>
      </form>

      <div
        *ngIf="openingHourStatusMessage"
        class="status-banner"
        [class.success]="openingHourStatusType === 'success'"
        [class.error]="openingHourStatusType === 'error'"
      >
        {{ openingHourStatusMessage }}
      </div>
    </section>

    <section class="hours-card">
      <div>
        <h5>{{ 'admin.locations.exceptions.heading' | translate: 'Exceptions & closures' }}</h5>
        <p class="section-description">
          {{
            'admin.locations.exceptions.description'
              | translate: 'Add one-off changes for holidays or special events.'
          }}
        </p>
      </div>

      <div *ngIf="exceptionsLoading" class="status-message">
        {{ 'admin.locations.exceptions.loading' | translate: 'Loading exceptions…' }}
      </div>
      <div *ngIf="exceptionsError" class="status-message error">{{ exceptionsError }}</div>

      <ng-container *ngIf="exceptions.length; else noExceptions">
        <ul class="item-list">
          <li class="list-item" *ngFor="let exception of exceptions">
            <ng-container *ngIf="editingExceptionId === exception.id; else viewException">
              <form class="inline-form" (ngSubmit)="updateException(exception.id)">
                <div class="grid two-column">
                  <label>
                    {{ 'admin.locations.exceptions.dateLabel' | translate: 'Date' }}
                    <input
                      type="date"
                      required
                      [name]="'editExceptionDate' + exception.id"
                      [(ngModel)]="exceptionEditForm.date"
                    />
                  </label>
                  <label class="checkbox-row">
                    <input
                      type="checkbox"
                      [name]="'editExceptionClosed' + exception.id"
                      [(ngModel)]="exceptionEditForm.closed"
                    />
                    <span>
                      {{
                        'admin.locations.exceptions.closedLabel' | translate: 'Closed all day'
                      }}
                    </span>
                  </label>
                </div>

                <div class="grid two-column">
                  <label>
                    {{ 'admin.locations.exceptions.startsAtLabel' | translate: 'Opens at' }}
                    <input
                      type="time"
                      [required]="!exceptionEditForm.closed"
                      [disabled]="exceptionEditForm.closed"
                      [name]="'editExceptionStarts' + exception.id"
                      [(ngModel)]="exceptionEditForm.starts_at"
                    />
                  </label>
                  <label>
                    {{ 'admin.locations.exceptions.endsAtLabel' | translate: 'Closes at' }}
                    <input
                      type="time"
                      [required]="!exceptionEditForm.closed"
                      [disabled]="exceptionEditForm.closed"
                      [name]="'editExceptionEnds' + exception.id"
                      [(ngModel)]="exceptionEditForm.ends_at"
                    />
                  </label>
                </div>

                <label>
                  {{ 'admin.locations.exceptions.reasonLabel' | translate: 'Reason (optional)' }}
                  <textarea
                    [name]="'editExceptionReason' + exception.id"
                    [(ngModel)]="exceptionEditForm.reason"
                  ></textarea>
                </label>

                <div class="actions">
                  <button
                    class="action primary"
                    type="submit"
                    [disabled]="updatingExceptionId === exception.id"
                  >
                    {{
                      updatingExceptionId === exception.id
                        ? ('admin.locations.exceptions.updating' | translate: 'Saving…')
                        : ('admin.locations.exceptions.update' | translate: 'Save')
                    }}
                  </button>
                  <button class="action" type="button" (click)="cancelExceptionEdit()">
                    {{ 'admin.locations.exceptions.cancel' | translate: 'Cancel' }}
                  </button>
                </div>
              </form>
            </ng-container>

            <ng-template #viewException>
              <div class="item-header">
                <strong>{{ formatDate(exception.date) }}</strong>
                <div class="action-row">
                  <button class="action" type="button" (click)="startExceptionEdit(exception)">
                    {{ 'admin.locations.exceptions.edit' | translate: 'Edit' }}
                  </button>
                  <button
                    class="action danger"
                    type="button"
                    (click)="deleteException(exception)"
                    [disabled]="deletingExceptionId === exception.id"
                  >
                    {{
                      deletingExceptionId === exception.id
                        ? ('admin.locations.exceptions.deleting' | translate: 'Removing…')
                        : ('admin.locations.exceptions.delete' | translate: 'Delete')
                    }}
                  </button>
                </div>
              </div>
              <div class="item-meta">
                <span *ngIf="exception.closed; else partialHours">
                  {{ 'admin.locations.exceptions.closedLabel' | translate: 'Closed all day' }}
                </span>
                <ng-template #partialHours>
                  <span>
                    {{ 'admin.locations.exceptions.startsAtLabel' | translate: 'Opens at' }}:
                    <strong>{{ formatTime(exception.starts_at) }}</strong>
                  </span>
                  <span>
                    {{ 'admin.locations.exceptions.endsAtLabel' | translate: 'Closes at' }}:
                    <strong>{{ formatTime(exception.ends_at) }}</strong>
                  </span>
                </ng-template>
                <span *ngIf="exception.reason">
                  {{ 'admin.locations.exceptions.reasonLabel' | translate: 'Reason (optional)' }}:
                  <strong>{{ exception.reason }}</strong>
                </span>
              </div>
            </ng-template>
          </li>
        </ul>
      </ng-container>

      <ng-template #noExceptions>
        <p class="empty-state">
          {{
            'admin.locations.exceptions.empty'
              | translate: 'No exceptions scheduled yet.'
          }}
        </p>
      </ng-template>

      <form class="inline-form" (ngSubmit)="createException()">
        <h6>{{ 'admin.locations.exceptions.addHeading' | translate: 'Add an exception' }}</h6>
        <div class="grid two-column">
          <label>
            {{ 'admin.locations.exceptions.dateLabel' | translate: 'Date' }}
            <input type="date" required name="createExceptionDate" [(ngModel)]="exceptionCreateForm.date" />
          </label>
          <label class="checkbox-row">
            <input
              type="checkbox"
              name="createExceptionClosed"
              [(ngModel)]="exceptionCreateForm.closed"
            />
            <span>
              {{ 'admin.locations.exceptions.closedLabel' | translate: 'Closed all day' }}
            </span>
          </label>
        </div>

        <p class="status-message">
          {{
            'admin.locations.exceptions.closedHelp'
              | translate: 'Leave times empty if the location is closed all day.'
          }}
        </p>

        <div class="grid two-column">
          <label>
            {{ 'admin.locations.exceptions.startsAtLabel' | translate: 'Opens at' }}
            <input
              type="time"
              [required]="!exceptionCreateForm.closed"
              [disabled]="exceptionCreateForm.closed"
              name="createExceptionStarts"
              [(ngModel)]="exceptionCreateForm.starts_at"
            />
          </label>
          <label>
            {{ 'admin.locations.exceptions.endsAtLabel' | translate: 'Closes at' }}
            <input
              type="time"
              [required]="!exceptionCreateForm.closed"
              [disabled]="exceptionCreateForm.closed"
              name="createExceptionEnds"
              [(ngModel)]="exceptionCreateForm.ends_at"
            />
          </label>
        </div>

        <label>
          {{ 'admin.locations.exceptions.reasonLabel' | translate: 'Reason (optional)' }}
          <textarea name="createExceptionReason" [(ngModel)]="exceptionCreateForm.reason"></textarea>
        </label>

        <div class="actions">
          <button class="action primary" type="submit" [disabled]="creatingException">
            {{
              creatingException
                ? ('admin.locations.exceptions.saving' | translate: 'Saving…')
                : ('admin.locations.exceptions.add' | translate: 'Add exception')
            }}
          </button>
          <button class="action" type="button" (click)="resetExceptionCreateForm()">
            {{ 'admin.locations.exceptions.reset' | translate: 'Reset form' }}
          </button>
        </div>
      </form>

      <div
        *ngIf="exceptionStatusMessage"
        class="status-banner"
        [class.success]="exceptionStatusType === 'success'"
        [class.error]="exceptionStatusType === 'error'"
      >
        {{ exceptionStatusMessage }}
      </div>
    </section>
  `,
})
export class AdminLocationHoursComponent implements OnChanges {
  @Input({ required: true }) locationId!: number;

  private readonly locations = inject(LocationService);
  private readonly i18n = inject(TranslationService);

  readonly dayOptions: DayOption[] = [
    { value: 0, labelKey: 'admin.locations.hours.days.sunday', fallback: 'Sunday' },
    { value: 1, labelKey: 'admin.locations.hours.days.monday', fallback: 'Monday' },
    { value: 2, labelKey: 'admin.locations.hours.days.tuesday', fallback: 'Tuesday' },
    { value: 3, labelKey: 'admin.locations.hours.days.wednesday', fallback: 'Wednesday' },
    { value: 4, labelKey: 'admin.locations.hours.days.thursday', fallback: 'Thursday' },
    { value: 5, labelKey: 'admin.locations.hours.days.friday', fallback: 'Friday' },
    { value: 6, labelKey: 'admin.locations.hours.days.saturday', fallback: 'Saturday' },
  ];

  openingHours: LocationOpeningHour[] = [];
  openingHoursLoading = false;
  openingHoursError = '';

  exceptions: LocationOpeningHourException[] = [];
  exceptionsLoading = false;
  exceptionsError = '';

  openingHourCreateForm: OpeningHourForm = this.createEmptyHourForm();
  openingHourEditForm: OpeningHourForm = this.createEmptyHourForm();
  editingHourId: number | null = null;
  creatingHour = false;
  updatingHourId: number | null = null;
  deletingHourId: number | null = null;

  exceptionCreateForm: OpeningHourExceptionForm = this.createEmptyExceptionForm();
  exceptionEditForm: OpeningHourExceptionForm = this.createEmptyExceptionForm();
  editingExceptionId: number | null = null;
  creatingException = false;
  updatingExceptionId: number | null = null;
  deletingExceptionId: number | null = null;

  openingHourStatusMessage = '';
  openingHourStatusType: 'success' | 'error' | '' = '';

  exceptionStatusMessage = '';
  exceptionStatusType: 'success' | 'error' | '' = '';

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['locationId']) {
      this.resetForms();
      this.clearOpeningHourStatus();
      this.clearExceptionStatus();

      if (this.locationId) {
        await Promise.all([this.loadOpeningHours(), this.loadExceptions()]);
      } else {
        this.openingHours = [];
        this.exceptions = [];
      }
    }
  }

  dayLabel(day: number) {
    const option = this.dayOptions.find(item => item.value === day);
    if (!option) {
      return String(day);
    }
    return this.i18n.translate(option.labelKey, option.fallback);
  }

  formatTime(value: string | null | undefined): string {
    if (!value) {
      return this.i18n.translate('admin.locations.hours.timePlaceholder', '—');
    }

    const match = value.match(/(\d{2}:\d{2})/);
    return match ? match[1] : value;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value;
  }

  async createOpeningHour() {
    if (this.creatingHour || !this.locationId) {
      return;
    }

    const validationError = this.validateHourForm(this.openingHourCreateForm);
    if (validationError) {
      this.setOpeningHourStatus('error', validationError);
      return;
    }

    this.creatingHour = true;
    this.clearOpeningHourStatus();

    const payload = this.buildOpeningHourPayload(this.openingHourCreateForm);

    try {
      const createdHour = await firstValueFrom(
        this.locations.createOpeningHour(this.locationId, payload)
      );
      this.upsertOpeningHour(createdHour);
      this.setOpeningHourStatus(
        'success',
        this.i18n.translate('admin.locations.hours.created', 'Opening hours added.')
      );
      this.resetHourCreateForm();
      await this.loadOpeningHours();
    } catch (error) {
      console.error('Failed to create opening hours', error);
      this.setOpeningHourStatus(
        'error',
        this.i18n.translate(
          'admin.locations.hours.createError',
          'Could not add opening hours. Please try again.'
        )
      );
    } finally {
      this.creatingHour = false;
    }
  }

  startHourEdit(hour: LocationOpeningHour) {
    this.editingHourId = hour.id;
    this.openingHourEditForm = {
      day_of_week: hour.day_of_week,
      opens_at: this.toTimeInput(hour.opens_at),
      closes_at: this.toTimeInput(hour.closes_at),
    };
    this.clearOpeningHourStatus();
  }

  cancelHourEdit() {
    this.editingHourId = null;
    this.openingHourEditForm = this.createEmptyHourForm();
  }

  async updateOpeningHour(hourId: number) {
    if (this.updatingHourId !== null || this.editingHourId !== hourId || !this.locationId) {
      return;
    }

    const validationError = this.validateHourForm(this.openingHourEditForm);
    if (validationError) {
      this.setOpeningHourStatus('error', validationError);
      return;
    }

    this.updatingHourId = hourId;
    this.clearOpeningHourStatus();

    const payload = this.buildOpeningHourPayload(this.openingHourEditForm);

    try {
      await firstValueFrom(
        this.locations.updateOpeningHour(this.locationId, hourId, payload)
      );
      this.setOpeningHourStatus(
        'success',
        this.i18n.translate('admin.locations.hours.updated', 'Opening hours updated.')
      );
      this.cancelHourEdit();
      await this.loadOpeningHours();
    } catch (error) {
      console.error('Failed to update opening hours', error);
      this.setOpeningHourStatus(
        'error',
        this.i18n.translate(
          'admin.locations.hours.updateError',
          'Could not update opening hours. Please try again.'
        )
      );
    } finally {
      this.updatingHourId = null;
    }
  }

  async deleteOpeningHour(hour: LocationOpeningHour) {
    if (this.deletingHourId !== null || !this.locationId) {
      return;
    }

    const confirmed = confirm(
      this.i18n.translate(
        'admin.locations.hours.deleteConfirm',
        'Remove these opening hours?'
      )
    );

    if (!confirmed) {
      return;
    }

    this.deletingHourId = hour.id;
    this.clearOpeningHourStatus();

    try {
      await firstValueFrom(
        this.locations.deleteOpeningHour(this.locationId, hour.id)
      );
      this.removeOpeningHour(hour.id);
      this.setOpeningHourStatus(
        'success',
        this.i18n.translate('admin.locations.hours.deleted', 'Opening hours removed.')
      );
      await this.loadOpeningHours();
    } catch (error) {
      console.error('Failed to delete opening hours', error);
      this.setOpeningHourStatus(
        'error',
        this.i18n.translate(
          'admin.locations.hours.deleteError',
          'Could not remove opening hours. Please try again.'
        )
      );
    } finally {
      this.deletingHourId = null;
    }
  }

  resetHourCreateForm() {
    const day = this.openingHourCreateForm.day_of_week;
    this.openingHourCreateForm = this.createEmptyHourForm(day);
  }

  async createException() {
    if (this.creatingException || !this.locationId) {
      return;
    }

    const validationError = this.validateExceptionForm(this.exceptionCreateForm);
    if (validationError) {
      this.setExceptionStatus('error', validationError);
      return;
    }

    this.creatingException = true;
    this.clearExceptionStatus();

    const payload = this.buildExceptionPayload(this.exceptionCreateForm);

    try {
      const createdException = await firstValueFrom(
        this.locations.createOpeningHourException(this.locationId, payload)
      );
      this.upsertException(createdException);
      this.setExceptionStatus(
        'success',
        this.i18n.translate('admin.locations.exceptions.created', 'Exception added.')
      );
      this.resetExceptionCreateForm();
      await this.loadExceptions();
    } catch (error) {
      console.error('Failed to create opening hour exception', error);
      this.setExceptionStatus(
        'error',
        this.i18n.translate(
          'admin.locations.exceptions.createError',
          'Could not add the exception. Please try again.'
        )
      );
    } finally {
      this.creatingException = false;
    }
  }

  startExceptionEdit(exception: LocationOpeningHourException) {
    this.editingExceptionId = exception.id;
    this.exceptionEditForm = this.toExceptionForm(exception);
    this.clearExceptionStatus();
  }

  cancelExceptionEdit() {
    this.editingExceptionId = null;
    this.exceptionEditForm = this.createEmptyExceptionForm();
  }

  async updateException(exceptionId: number) {
    if (
      this.updatingExceptionId !== null ||
      this.editingExceptionId !== exceptionId ||
      !this.locationId
    ) {
      return;
    }

    const validationError = this.validateExceptionForm(this.exceptionEditForm);
    if (validationError) {
      this.setExceptionStatus('error', validationError);
      return;
    }

    this.updatingExceptionId = exceptionId;
    this.clearExceptionStatus();

    const payload = this.buildExceptionPayload(this.exceptionEditForm);

    try {
      const updatedException = await firstValueFrom(
        this.locations.updateOpeningHourException(this.locationId, exceptionId, payload)
      );
      this.upsertException(updatedException);
      this.setExceptionStatus(
        'success',
        this.i18n.translate('admin.locations.exceptions.updated', 'Exception updated.')
      );
      this.cancelExceptionEdit();
      await this.loadExceptions();
    } catch (error) {
      console.error('Failed to update opening hour exception', error);
      this.setExceptionStatus(
        'error',
        this.i18n.translate(
          'admin.locations.exceptions.updateError',
          'Could not update the exception. Please try again.'
        )
      );
    } finally {
      this.updatingExceptionId = null;
    }
  }

  async deleteException(exception: LocationOpeningHourException) {
    if (this.deletingExceptionId !== null || !this.locationId) {
      return;
    }

    const confirmed = confirm(
      this.i18n.translate(
        'admin.locations.exceptions.deleteConfirm',
        'Remove this exception?'
      )
    );

    if (!confirmed) {
      return;
    }

    this.deletingExceptionId = exception.id;
    this.clearExceptionStatus();

    try {
      await firstValueFrom(
        this.locations.deleteOpeningHourException(this.locationId, exception.id)
      );
      this.removeException(exception.id);
      this.setExceptionStatus(
        'success',
        this.i18n.translate('admin.locations.exceptions.deleted', 'Exception removed.')
      );
      await this.loadExceptions();
    } catch (error) {
      console.error('Failed to delete opening hour exception', error);
      this.setExceptionStatus(
        'error',
        this.i18n.translate(
          'admin.locations.exceptions.deleteError',
          'Could not remove the exception. Please try again.'
        )
      );
    } finally {
      this.deletingExceptionId = null;
    }
  }

  resetExceptionCreateForm() {
    this.exceptionCreateForm = this.createEmptyExceptionForm();
  }

  private async loadOpeningHours() {
    this.openingHoursLoading = true;
    this.openingHoursError = '';

    try {
      const hours = await firstValueFrom(
        this.locations.listOpeningHours(this.locationId)
      );
      this.openingHours = this.sortOpeningHours(hours);
    } catch (error) {
      console.error('Failed to load opening hours', error);
      this.openingHoursError = this.i18n.translate(
        'admin.locations.hours.loadError',
        'Unable to load opening hours. Please try again.'
      );
    } finally {
      this.openingHoursLoading = false;
    }
  }

  private async loadExceptions() {
    this.exceptionsLoading = true;
    this.exceptionsError = '';

    try {
      const exceptions = await firstValueFrom(
        this.locations.listOpeningHourExceptions(this.locationId)
      );
      this.exceptions = this.sortExceptions(exceptions);
    } catch (error) {
      console.error('Failed to load opening hour exceptions', error);
      this.exceptionsError = this.i18n.translate(
        'admin.locations.exceptions.loadError',
        'Unable to load exceptions. Please try again.'
      );
    } finally {
      this.exceptionsLoading = false;
    }
  }

  private validateHourForm(form: OpeningHourForm): string | null {
    const opens = form.opens_at.trim();
    const closes = form.closes_at.trim();

    if (!opens || !closes) {
      return this.i18n.translate(
        'admin.locations.hours.invalidTime',
        'Enter both opening and closing times.'
      );
    }

    const opensMinutes = this.timeToMinutes(opens);
    const closesMinutes = this.timeToMinutes(closes);

    if (opensMinutes === null || closesMinutes === null) {
      return this.i18n.translate(
        'admin.locations.hours.invalidTime',
        'Enter both opening and closing times.'
      );
    }

    if (closesMinutes <= opensMinutes) {
      return this.i18n.translate(
        'admin.locations.hours.invalidRange',
        'Closing time must be after opening time.'
      );
    }

    return null;
  }

  private validateExceptionForm(form: OpeningHourExceptionForm): string | null {
    if (!form.date.trim()) {
      return this.i18n.translate(
        'admin.locations.exceptions.invalidDate',
        'Choose a date for the exception.'
      );
    }

    if (form.closed) {
      return null;
    }

    const starts = form.starts_at.trim();
    const ends = form.ends_at.trim();

    if (!starts || !ends) {
      return this.i18n.translate(
        'admin.locations.exceptions.invalidTime',
        'Enter both start and end times or mark the location as closed.'
      );
    }

    const startMinutes = this.timeToMinutes(starts);
    const endMinutes = this.timeToMinutes(ends);

    if (startMinutes === null || endMinutes === null) {
      return this.i18n.translate(
        'admin.locations.exceptions.invalidTime',
        'Enter both start and end times or mark the location as closed.'
      );
    }

    if (endMinutes <= startMinutes) {
      return this.i18n.translate(
        'admin.locations.exceptions.invalidRange',
        'End time must be after the start time.'
      );
    }

    return null;
  }

  private buildOpeningHourPayload(form: OpeningHourForm): LocationOpeningHourInput {
    return {
      day_of_week: form.day_of_week,
      opens_at: this.normalizeTime(form.opens_at),
      closes_at: this.normalizeTime(form.closes_at),
    };
  }

  private buildExceptionPayload(
    form: OpeningHourExceptionForm
  ): LocationOpeningHourExceptionInput {
    const payload: LocationOpeningHourExceptionInput = {
      date: form.date.trim(),
      closed: form.closed,
    };

    if (!form.closed) {
      payload.starts_at = this.normalizeTime(form.starts_at);
      payload.ends_at = this.normalizeTime(form.ends_at);
    }

    const reason = this.normalizeString(form.reason);
    if (reason !== undefined) {
      payload.reason = reason;
    }

    return payload;
  }

  private toExceptionForm(
    exception: LocationOpeningHourException
  ): OpeningHourExceptionForm {
    return {
      date: exception.date ?? '',
      closed: !!exception.closed,
      starts_at: this.toTimeInput(exception.starts_at),
      ends_at: this.toTimeInput(exception.ends_at),
      reason: exception.reason ?? '',
    };
  }

  private createEmptyHourForm(day: number = 0): OpeningHourForm {
    return {
      day_of_week: day,
      opens_at: '',
      closes_at: '',
    };
  }

  private createEmptyExceptionForm(): OpeningHourExceptionForm {
    return {
      date: '',
      closed: false,
      starts_at: '',
      ends_at: '',
      reason: '',
    };
  }

  private resetForms() {
    this.openingHourCreateForm = this.createEmptyHourForm();
    this.openingHourEditForm = this.createEmptyHourForm();
    this.editingHourId = null;
    this.creatingHour = false;
    this.updatingHourId = null;
    this.deletingHourId = null;

    this.exceptionCreateForm = this.createEmptyExceptionForm();
    this.exceptionEditForm = this.createEmptyExceptionForm();
    this.editingExceptionId = null;
    this.creatingException = false;
    this.updatingExceptionId = null;
    this.deletingExceptionId = null;
  }

  private toTimeInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const match = value.match(/(\d{2}:\d{2})/);
    return match ? match[1] : value;
  }

  private normalizeTime(value: string): string {
    const match = value.trim().match(/(\d{1,2}):(\d{2})/);
    if (!match) {
      return value.trim();
    }
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }

  private normalizeString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private upsertOpeningHour(hour: LocationOpeningHour) {
    const remaining = this.openingHours.filter(item => item.id !== hour.id);
    this.openingHours = this.sortOpeningHours([...remaining, hour]);
  }

  private removeOpeningHour(hourId: number) {
    this.openingHours = this.openingHours.filter(hour => hour.id !== hourId);
  }

  private removeException(exceptionId: number) {
    this.exceptions = this.exceptions.filter(
      exception => exception.id !== exceptionId
    );
  }

  private upsertException(exception: LocationOpeningHourException) {
    const remaining = this.exceptions.filter(item => item.id !== exception.id);
    this.exceptions = this.sortExceptions([...remaining, exception]);
  }

  private sortExceptions(
    exceptions: LocationOpeningHourException[]
  ): LocationOpeningHourException[] {
    return [...exceptions].sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      const aMinutes = this.exceptionStartMinutes(a);
      const bMinutes = this.exceptionStartMinutes(b);
      return aMinutes - bMinutes;
    });
  }

  private exceptionStartMinutes(exception: LocationOpeningHourException): number {
    if (exception.closed || !exception.starts_at) {
      return -1;
    }

    const minutes = this.timeToMinutes(exception.starts_at);
    return minutes ?? Number.MAX_SAFE_INTEGER;
  }

  private sortOpeningHours(hours: LocationOpeningHour[]): LocationOpeningHour[] {
    return [...hours].sort((a, b) => {
      const dayDiff = a.day_of_week - b.day_of_week;
      if (dayDiff !== 0) {
        return dayDiff;
      }

      const aMinutes = this.timeToMinutes(a.opens_at) ?? 0;
      const bMinutes = this.timeToMinutes(b.opens_at) ?? 0;
      return aMinutes - bMinutes;
    });
  }

  private timeToMinutes(value: string): number | null {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) {
      return null;
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private clearOpeningHourStatus() {
    this.openingHourStatusMessage = '';
    this.openingHourStatusType = '';
  }

  private setOpeningHourStatus(type: 'success' | 'error', message: string) {
    this.openingHourStatusType = type;
    this.openingHourStatusMessage = message;
  }

  private clearExceptionStatus() {
    this.exceptionStatusMessage = '';
    this.exceptionStatusType = '';
  }

  private setExceptionStatus(type: 'success' | 'error', message: string) {
    this.exceptionStatusType = type;
    this.exceptionStatusMessage = message;
  }
}
