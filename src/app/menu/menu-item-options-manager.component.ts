import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuItem, MenuItemOption } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { MenuService } from './menu.service';
import { MenuItemOptionsService } from './menu-item-options.service';

interface OptionFormModel {
  name: string;
  price: string;
}

@Component({
  standalone: true,
  selector: 'app-menu-item-options-manager',
  imports: [CurrencyPipe, FormsModule, NgFor, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: block;
    }

    .manager-card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 1.75rem;
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: grid;
      gap: 1.5rem;
      margin-top: 2.5rem;
    }

    header h3 {
      margin: 0;
      font-size: 1.35rem;
    }

    header p.description {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    label.select-label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    select,
    input {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-soft);
      background: var(--surface-elevated);
      font: inherit;
    }

    .status {
      color: var(--brand-green);
      font-weight: 600;
      margin: 0;
    }

    .error {
      color: #d14343;
      font-weight: 600;
      margin: 0;
    }

    .loading {
      color: var(--text-secondary);
      font-style: italic;
    }

    .option-list {
      display: grid;
      gap: 1rem;
    }

    .option-card {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      border: 1px solid rgba(10, 10, 10, 0.05);
      padding: 1.1rem 1.25rem;
      display: grid;
      gap: 0.75rem;
    }

    .option-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .option-header h4 {
      margin: 0;
      font-size: 1.1rem;
    }

    .price {
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-grid {
      display: grid;
      gap: 0.75rem;
    }

    .form-grid label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      justify-content: flex-end;
      margin-top: 0.25rem;
    }

    button {
      border: 0;
      border-radius: 12px;
      padding: 0.55rem 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button.primary {
      background: var(--brand-green);
      color: #042f1a;
      box-shadow: 0 12px 24px rgba(6, 193, 103, 0.24);
    }

    button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 28px rgba(6, 193, 103, 0.28);
    }

    button.secondary {
      background: var(--surface-elevated);
      color: inherit;
      border: 1px solid var(--border-soft);
    }

    button.link {
      background: transparent;
      color: var(--brand-green);
      padding: 0;
      border-radius: 0;
      box-shadow: none;
    }

    button.link.danger {
      color: #d14343;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    .create-card {
      background: rgba(10, 10, 10, 0.02);
      border-radius: var(--radius-card);
      border: 1px dashed rgba(10, 10, 10, 0.1);
      padding: 1.25rem 1.5rem;
      display: grid;
      gap: 0.85rem;
    }

    .create-card h4 {
      margin: 0;
      font-size: 1.1rem;
    }
  `],
  template: `
    <div class="manager-card">
      <header>
        <h3>{{ 'admin.options.heading' | translate: 'Menu item options' }}</h3>
        <p class="description">
          {{
            'admin.options.description'
              | translate: 'Create optional add-ons and extras for your dishes.'
          }}
        </p>
      </header>

      <ng-container *ngIf="menuItems.length; else noMenuItems">
        <label class="select-label">
          {{ 'admin.options.selectItem' | translate: 'Choose menu item' }}
          <select
            [ngModel]="selectedMenuItemId"
            (ngModelChange)="onMenuItemChange($event)"
            [ngModelOptions]="{ standalone: true }"
          >
            <option *ngFor="let item of menuItems" [ngValue]="item.id">{{ item.name }}</option>
          </select>
        </label>

        <p *ngIf="loading" class="loading">
          {{ 'admin.options.loading' | translate: 'Loading options…' }}
        </p>

        <ng-container *ngIf="!loading">
          <p class="status" *ngIf="status">{{ status }}</p>
          <p class="error" *ngIf="error">{{ error }}</p>

          <div class="option-list" *ngIf="optionsForSelected.length; else emptyOptions">
            <div class="option-card" *ngFor="let option of optionsForSelected">
              <ng-container *ngIf="editingId !== option.id; else editForm">
                <div class="option-header">
                  <h4>{{ option.name }}</h4>
                  <span class="price">{{ (option.price_cents / 100) | currency: 'EUR' }}</span>
                </div>
                <div class="actions">
                  <button type="button" class="secondary" (click)="startEdit(option)">
                    {{ 'admin.options.edit' | translate: 'Edit' }}
                  </button>
                  <button
                    type="button"
                    class="link danger"
                    (click)="deleteOption(option.id)"
                    [disabled]="removingId === option.id"
                  >
                    <ng-container *ngIf="removingId === option.id; else removeLabel">
                      {{ 'admin.options.removing' | translate: 'Removing…' }}
                    </ng-container>
                    <ng-template #removeLabel>
                      {{ 'admin.options.remove' | translate: 'Remove' }}
                    </ng-template>
                  </button>
                </div>
              </ng-container>
              <ng-template #editForm>
                <div class="form-grid">
                  <label>
                    {{ 'admin.options.form.name' | translate: 'Option name' }}
                    <input
                      type="text"
                      [(ngModel)]="editOption.name"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </label>
                  <label>
                    {{ 'admin.options.form.price' | translate: 'Price' }}
                    <input
                      type="text"
                      [(ngModel)]="editOption.price"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </label>
                </div>
                <div class="actions">
                  <button type="button" class="secondary" (click)="cancelEdit()">
                    {{ 'admin.options.cancel' | translate: 'Cancel' }}
                  </button>
                  <button
                    type="button"
                    class="primary"
                    (click)="saveOption(option)"
                    [disabled]="savingOptionId === option.id"
                  >
                    <ng-container *ngIf="savingOptionId === option.id; else saveLabel">
                      {{ 'admin.options.saving' | translate: 'Saving…' }}
                    </ng-container>
                    <ng-template #saveLabel>
                      {{ 'admin.options.save' | translate: 'Save changes' }}
                    </ng-template>
                  </button>
                </div>
              </ng-template>
            </div>
          </div>

          <ng-template #emptyOptions>
            <p class="empty-state">
              {{ 'admin.options.empty' | translate: 'No options yet.' }}
            </p>
          </ng-template>

          <section class="create-card">
            <h4>{{ 'admin.options.new.heading' | translate: 'Add new option' }}</h4>
            <div class="form-grid">
              <label>
                {{ 'admin.options.form.name' | translate: 'Option name' }}
                <input
                  type="text"
                  [(ngModel)]="newOption.name"
                  [ngModelOptions]="{ standalone: true }"
                />
              </label>
              <label>
                {{ 'admin.options.form.price' | translate: 'Price' }}
                <input
                  type="text"
                  [(ngModel)]="newOption.price"
                  [ngModelOptions]="{ standalone: true }"
                />
              </label>
            </div>
            <div class="actions">
              <button
                type="button"
                class="primary"
                (click)="createOption()"
                [disabled]="saving || !newOption.name || !newOption.price"
              >
                <ng-container *ngIf="saving; else createLabel">
                  {{ 'admin.options.saving' | translate: 'Saving…' }}
                </ng-container>
                <ng-template #createLabel>
                  {{ 'admin.options.create' | translate: 'Add option' }}
                </ng-template>
              </button>
            </div>
          </section>
        </ng-container>
      </ng-container>

      <ng-template #noMenuItems>
        <p class="empty-state">
          {{ 'admin.options.emptyMenu' | translate: 'Create a menu item before adding options.' }}
        </p>
      </ng-template>
    </div>
  `,
})
export class MenuItemOptionsManagerComponent implements OnChanges {
  @Input() restaurantId: number | null = null;

  private menu = inject(MenuService);
  private optionsService = inject(MenuItemOptionsService);
  private i18n = inject(TranslationService);

  menuItems: MenuItem[] = [];
  options: MenuItemOption[] = [];
  selectedMenuItemId: number | null = null;

  newOption: OptionFormModel = this.createEmptyForm();
  editOption: OptionFormModel = this.createEmptyForm();
  editingId: number | null = null;

  loading = false;
  saving = false;
  savingOptionId: number | null = null;
  removingId: number | null = null;

  status = '';
  error = '';

  private loadToken = 0;

  ngOnChanges(changes: SimpleChanges) {
    if ('restaurantId' in changes) {
      this.resetState();
      if (this.restaurantId !== null && this.restaurantId !== undefined) {
        void this.loadData();
      }
    }
  }

  get optionsForSelected(): MenuItemOption[] {
    if (!this.selectedMenuItemId) {
      return [];
    }
    return this.options.filter((option) => option.menu_item_id === this.selectedMenuItemId);
  }

  onMenuItemChange(value: number | string) {
    const parsed = Number(value);
    this.selectedMenuItemId = Number.isNaN(parsed) ? null : parsed;
    this.status = '';
    this.error = '';
    this.cancelEdit();
  }

  startEdit(option: MenuItemOption) {
    this.editingId = option.id;
    this.editOption = {
      name: option.name,
      price: this.formatPrice(option.price_cents),
    };
    this.status = '';
    this.error = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editOption = this.createEmptyForm();
  }

  async createOption() {
    if (!this.selectedMenuItemId || !this.newOption.name || !this.newOption.price) {
      return;
    }

    const price_cents = this.toCents(this.newOption.price);
    if (price_cents === null) {
      this.error = this.translate('admin.options.error.price', 'Enter a valid price (e.g. 0.50).');
      return;
    }

    this.saving = true;
    this.status = '';
    this.error = '';

    try {
      const payload = {
        menu_item_id: this.selectedMenuItemId,
        name: this.newOption.name,
        price_cents,
      };
      const created = await firstValueFrom(this.optionsService.create(payload));
      if (created) {
        this.options = [...this.options, created];
        this.newOption = this.createEmptyForm();
        this.status = this.translate('admin.options.status.created', 'Option added!');
      }
    } catch (err) {
      console.error(err);
      this.error = this.translate(
        'admin.options.error.create',
        'Unable to add the option. Please try again.'
      );
    } finally {
      this.saving = false;
    }
  }

  async saveOption(option: MenuItemOption) {
    if (this.editingId !== option.id || !this.editOption.name || !this.editOption.price) {
      return;
    }

    const price_cents = this.toCents(this.editOption.price);
    if (price_cents === null) {
      this.error = this.translate('admin.options.error.price', 'Enter a valid price (e.g. 0.50).');
      return;
    }

    this.savingOptionId = option.id;
    this.status = '';
    this.error = '';

    try {
      const payload = {
        menu_item_id: option.menu_item_id,
        name: this.editOption.name,
        price_cents,
      };
      const updated = await firstValueFrom(this.optionsService.update(option.id, payload));
      if (updated) {
        this.options = this.options.map((item) => (item.id === option.id ? updated : item));
        this.status = this.translate('admin.options.status.updated', 'Option updated!');
      }
      this.cancelEdit();
    } catch (err) {
      console.error(err);
      this.error = this.translate(
        'admin.options.error.update',
        'Unable to update the option. Please try again.'
      );
    } finally {
      this.savingOptionId = null;
    }
  }

  async deleteOption(id: number) {
    if (!confirm(this.translate('admin.options.removeConfirm', 'Remove this option?'))) {
      return;
    }

    this.removingId = id;
    this.status = '';
    this.error = '';

    try {
      await firstValueFrom(this.optionsService.delete(id));
      this.options = this.options.filter((option) => option.id !== id);
      this.status = this.translate('admin.options.status.deleted', 'Option removed.');
    } catch (err) {
      console.error(err);
      this.error = this.translate(
        'admin.options.error.delete',
        'Unable to remove the option. Please try again.'
      );
    } finally {
      if (this.removingId === id) {
        this.removingId = null;
      }
    }
  }

  private async loadData() {
    if (this.restaurantId === null || this.restaurantId === undefined) {
      return;
    }

    const token = ++this.loadToken;
    this.loading = true;
    this.status = '';
    this.error = '';

    try {
      const [items, options] = await Promise.all([
        firstValueFrom(this.menu.listByRestaurant(this.restaurantId)),
        firstValueFrom(this.optionsService.listByRestaurant(this.restaurantId)),
      ]);

      if (token !== this.loadToken) {
        return;
      }

      this.menuItems = items ?? [];
      this.options = options ?? [];
      this.ensureSelection();
    } catch (err) {
      console.error(err);
      if (token === this.loadToken) {
        this.error = this.translate(
          'admin.options.error.load',
          'Unable to load menu item options. Please try again.'
        );
      }
    } finally {
      if (token === this.loadToken) {
        this.loading = false;
      }
    }
  }

  private ensureSelection() {
    if (!this.menuItems.length) {
      this.selectedMenuItemId = null;
      return;
    }

    if (!this.selectedMenuItemId || !this.menuItems.some((item) => item.id === this.selectedMenuItemId)) {
      this.selectedMenuItemId = this.menuItems[0]?.id ?? null;
    }
  }

  private resetState() {
    this.menuItems = [];
    this.options = [];
    this.selectedMenuItemId = null;
    this.newOption = this.createEmptyForm();
    this.editOption = this.createEmptyForm();
    this.editingId = null;
    this.status = '';
    this.error = '';
    this.saving = false;
    this.savingOptionId = null;
    this.removingId = null;
  }

  private createEmptyForm(): OptionFormModel {
    return { name: '', price: '' };
  }

  private toCents(value: string): number | null {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return Math.round(parsed * 100);
  }

  private formatPrice(cents?: number | null): string {
    if (cents === null || cents === undefined) {
      return '';
    }
    return (cents / 100).toFixed(2);
  }

  private translate(key: string, fallback: string): string {
    return this.i18n.translate(key, fallback);
  }
}
