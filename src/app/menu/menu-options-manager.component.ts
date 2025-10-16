import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuOption } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { MenuOptionInput, MenuOptionsService } from './menu-options.service';

interface OptionFormModel {
  title: string;
  price: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-menu-options-manager',
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe, TranslatePipe],
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
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-top: 2.5rem;
    }

    h3 {
      margin: 0;
      font-size: 1.5rem;
    }

    p.description {
      margin: 0;
      color: var(--text-secondary);
    }

    form.option-form {
      display: grid;
      gap: 0.75rem;
    }

    label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    input,
    textarea {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-soft);
      background: var(--surface-elevated);
      font: inherit;
    }

    textarea {
      min-height: 72px;
      resize: vertical;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
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
      box-shadow: none;
      border-radius: 0;
      font-size: 0.9rem;
    }

    button.link.destructive {
      color: #d14343;
    }

    button.link:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .status {
      font-size: 0.95rem;
      color: var(--brand-green);
      font-weight: 600;
    }

    .error {
      color: #d14343;
      font-size: 0.9rem;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    .options-list {
      display: grid;
      gap: 1rem;
    }

    .option-card {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      border: 1px solid rgba(10, 10, 10, 0.05);
      padding: 1.1rem 1.25rem;
      display: grid;
      gap: 0.6rem;
    }

    .option-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .option-header h4 {
      margin: 0;
      font-size: 1.1rem;
    }

    .option-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .option-price {
      font-weight: 600;
      color: var(--text-primary);
    }

    .edit-grid {
      display: grid;
      gap: 0.75rem;
    }

    @media (max-width: 600px) {
      .option-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
  template: `
    <div class="manager-card">
      <form class="option-form" (ngSubmit)="createOption()">
        <label>
          {{ 'menu.options.form.nameLabel' | translate: 'Option name' }}
          <input
            name="optionTitle"
            [(ngModel)]="newOption.title"
            required
            placeholder="{{ 'menu.options.form.nameLabel' | translate: 'Option name' }}"
          />
        </label>
        <label>
          {{ 'menu.options.form.priceLabel' | translate: 'Price (EUR)' }}
          <input
            name="optionPrice"
            [(ngModel)]="newOption.price"
            [attr.placeholder]="'menu.options.form.pricePlaceholder' | translate: 'e.g. 1.50'"
          />
        </label>
        <label>
          {{ 'menu.options.form.descriptionLabel' | translate: 'Description' }}
          <textarea
            name="optionDescription"
            [(ngModel)]="newOption.description"
            [attr.placeholder]="
              'menu.options.form.descriptionPlaceholder' | translate: 'Optional description'
            "
          ></textarea>
        </label>

        <p *ngIf="createPriceInvalid" class="error">
          {{ 'menu.options.error.price' | translate: 'Enter a valid price (e.g. 1.50).' }}
        </p>
        <p *ngIf="createError" class="error">
          {{
            'menu.options.error.create'
              | translate: 'Unable to add the option. Please try again.'
          }}
        </p>

        <div class="actions">
          <button class="primary" type="submit" [disabled]="creating || !newOption.title.trim()">
            {{
              creating
                ? ('menu.options.form.saving' | translate: 'Saving…')
                : ('menu.options.form.add' | translate: 'Add option')
            }}
          </button>
        </div>
      </form>

      <p *ngIf="loading" class="status">
        {{ 'menu.options.loading' | translate: 'Loading options…' }}
      </p>
      <p *ngIf="loadError" class="error">
        {{ 'menu.options.error.load' | translate: 'Could not load options. Please try again.' }}
      </p>
      <p *ngIf="!loading && !options.length" class="empty-state">
        {{ 'menu.options.empty' | translate: 'No options yet. Add one above to get started.' }}
      </p>

      <div class="options-list" *ngIf="options.length">
        <article class="option-card" *ngFor="let option of options">
          <ng-container *ngIf="editingId === option.id; else viewOption">
            <div class="edit-grid">
              <label>
                {{ 'menu.options.form.nameLabel' | translate: 'Option name' }}
                <input
                  [(ngModel)]="editModel!.title"
                  name="editTitle-{{ option.id }}"
                  [ngModelOptions]="{ standalone: true }"
                />
              </label>
              <label>
                {{ 'menu.options.form.priceLabel' | translate: 'Price (EUR)' }}
                <input
                  [(ngModel)]="editModel!.price"
                  name="editPrice-{{ option.id }}"
                  [ngModelOptions]="{ standalone: true }"
                  [attr.placeholder]="'menu.options.form.pricePlaceholder' | translate: 'e.g. 1.50'"
                />
              </label>
              <label>
                {{ 'menu.options.form.descriptionLabel' | translate: 'Description' }}
                <textarea
                  [(ngModel)]="editModel!.description"
                  name="editDescription-{{ option.id }}"
                  [ngModelOptions]="{ standalone: true }"
                  [attr.placeholder]="
                    'menu.options.form.descriptionPlaceholder' | translate: 'Optional description'
                  "
                ></textarea>
              </label>

              <p *ngIf="editPriceInvalid" class="error">
                {{ 'menu.options.error.price' | translate: 'Enter a valid price (e.g. 1.50).' }}
              </p>
              <p *ngIf="updateError" class="error">
                {{
                  'menu.options.error.update'
                    | translate: 'Unable to save changes. Please try again.'
                }}
              </p>

              <div class="actions">
                <button
                  class="secondary"
                  type="button"
                  (click)="cancelEdit()"
                  [disabled]="updating"
                >
                  {{ 'menu.options.list.cancel' | translate: 'Cancel' }}
                </button>
                <button
                  class="primary"
                  type="button"
                  (click)="saveEdit(option)"
                  [disabled]="updating || !editModel!.title.trim()"
                >
                  {{
                    updating
                      ? ('menu.options.list.updating' | translate: 'Saving…')
                      : ('menu.options.list.save' | translate: 'Save changes')
                  }}
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #viewOption>
            <div class="option-header">
              <div>
                <h4>{{ option.title || option.name }}</h4>
                <p *ngIf="option.description">{{ option.description }}</p>
              </div>
              <span class="option-price" *ngIf="option.price_cents != null">
                {{ option.price_cents / 100 | currency: 'EUR' : 'symbol-narrow' : '1.2-2' }}
              </span>
            </div>

            <p *ngIf="deleteErrorId === option.id" class="error">
              {{
                'menu.options.error.delete'
                  | translate: 'Unable to delete the option. Please try again.'
              }}
            </p>

            <div class="actions">
              <button class="link" type="button" (click)="startEdit(option)">
                {{ 'menu.options.list.edit' | translate: 'Edit' }}
              </button>
              <button
                class="link destructive"
                type="button"
                (click)="deleteOption(option)"
                [disabled]="deletingId === option.id"
              >
                {{
                  deletingId === option.id
                    ? ('menu.options.list.deleting' | translate: 'Removing…')
                    : ('menu.options.list.delete' | translate: 'Delete')
                }}
              </button>
            </div>
          </ng-template>
        </article>
      </div>
    </div>
  `,
})
export class MenuOptionsManagerComponent implements OnChanges {
  @Input({ required: true }) restaurantId!: number;

  private menuOptions = inject(MenuOptionsService);
  private i18n = inject(TranslationService);

  options: MenuOption[] = [];
  loading = false;
  loadError = false;

  creating = false;
  createError = false;
  createPriceInvalid = false;
  newOption: OptionFormModel = this.createEmptyForm();

  editingId: number | null = null;
  editModel: OptionFormModel | null = null;
  editPriceInvalid = false;
  updating = false;
  updateError = false;

  deletingId: number | null = null;
  deleteErrorId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['restaurantId'] && this.restaurantId) {
      void this.loadOptions();
    }
  }

  private createEmptyForm(): OptionFormModel {
    return { title: '', price: '', description: '' };
  }

  private normalizeDescription(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private parsePrice(value: string): { cents: number | null; valid: boolean } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { cents: null, valid: true };
    }

    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      return { cents: null, valid: false };
    }

    return { cents: Math.round(parsed * 100), valid: true };
  }

  private formatPriceInput(priceCents: number | null | undefined): string {
    if (priceCents == null) {
      return '';
    }

    return (priceCents / 100).toFixed(2);
  }

  async loadOptions(): Promise<void> {
    this.loading = true;
    this.loadError = false;

    try {
      this.options = await firstValueFrom(this.menuOptions.listByRestaurant(this.restaurantId));
    } catch (error) {
      console.error('Failed to load options', error);
      this.options = [];
      this.loadError = true;
    } finally {
      this.loading = false;
    }
  }

  async createOption(): Promise<void> {
    const title = this.newOption.title.trim();
    if (!title || this.creating) {
      return;
    }

    const { cents, valid } = this.parsePrice(this.newOption.price);
    if (!valid) {
      this.createPriceInvalid = true;
      return;
    }

    this.createPriceInvalid = false;
    const payload: MenuOptionInput = {
      title,
      name: title,
      description: this.normalizeDescription(this.newOption.description),
      price_cents: cents,
    };

    this.creating = true;
    this.createError = false;

    try {
      const created = await firstValueFrom(this.menuOptions.create(this.restaurantId, payload));
      this.options = [...this.options, created];
      this.newOption = this.createEmptyForm();
    } catch (error) {
      console.error('Failed to create option', error);
      this.createError = true;
    } finally {
      this.creating = false;
    }
  }

  startEdit(option: MenuOption): void {
    this.editingId = option.id;
    this.editModel = {
      title: option.title ?? option.name ?? '',
      price: this.formatPriceInput(option.price_cents),
      description: option.description ?? '',
    };
    this.editPriceInvalid = false;
    this.updateError = false;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editModel = null;
    this.editPriceInvalid = false;
    this.updateError = false;
  }

  async saveEdit(option: MenuOption): Promise<void> {
    if (!this.editModel || this.updating) {
      return;
    }

    const title = this.editModel.title.trim();
    if (!title) {
      return;
    }

    const { cents, valid } = this.parsePrice(this.editModel.price);
    if (!valid) {
      this.editPriceInvalid = true;
      return;
    }

    this.editPriceInvalid = false;

    const payload: MenuOptionInput = {
      title,
      name: title,
      description: this.normalizeDescription(this.editModel.description),
      price_cents: cents,
    };

    this.updating = true;
    this.updateError = false;

    try {
      const updated = await firstValueFrom(this.menuOptions.update(option.id, payload));
      this.options = this.options.map(item => (item.id === option.id ? updated : item));
      this.cancelEdit();
    } catch (error) {
      console.error('Failed to update option', error);
      this.updateError = true;
    } finally {
      this.updating = false;
    }
  }

  async deleteOption(option: MenuOption): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    const message = this.i18n.translate('menu.options.list.removeConfirm', 'Remove this option?');
    if (!confirm(message)) {
      return;
    }

    this.deletingId = option.id;
    this.deleteErrorId = null;

    try {
      await firstValueFrom(this.menuOptions.delete(option.id));
      this.options = this.options.filter(item => item.id !== option.id);
      if (this.editingId === option.id) {
        this.cancelEdit();
      }
    } catch (error) {
      console.error('Failed to delete option', error);
      this.deleteErrorId = option.id;
    } finally {
      this.deletingId = null;
    }
  }
}
