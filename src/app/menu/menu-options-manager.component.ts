import { NgFor, NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuItem, MenuItemCategory, MenuOption, MenuOptionItem } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { CategoriesService } from './categories.service';
import { MenuService } from './menu.service';
import { MenuOptionInput, MenuOptionItemInput, MenuOptionsService } from './menu-options.service';

type OptionModifierType = 'none' | 'amount' | 'percentage';

interface AssignmentFormEntry {
  menuItemId: number;
  name: string;
  modifierType: OptionModifierType;
  amount: string;
  percentage: string;
  optionItemId?: number;
}

interface OptionFormModel {
  title: string;
  categoryId: number | null;
  minSelections: string;
  maxSelections: string;
  assignments: AssignmentFormEntry[];
}

interface ValidationErrors {
  categoryMissing: boolean;
  minInvalid: boolean;
  maxInvalid: boolean;
  minMaxInvalid: boolean;
  amountInvalidIds: number[];
  percentageInvalidIds: number[];
}

@Component({
  standalone: true,
  selector: 'app-menu-options-manager',
  imports: [FormsModule, NgFor, NgIf, TranslatePipe],
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

    form.option-form {
      display: grid;
      gap: 1rem;
    }

    .field-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    input,
    select {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-soft);
      background: var(--surface-elevated);
      font: inherit;
    }

    .assignment-section {
      border-top: 1px solid var(--border-soft);
      padding-top: 1rem;
      display: grid;
      gap: 0.75rem;
    }

    .assignment-header {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .assignment-header h4 {
      margin: 0;
      font-size: 1rem;
    }

    .assignment-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .assignment-list {
      display: grid;
      gap: 0.75rem;
    }

    .assignment-row {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      border: 1px solid var(--border-soft);
      padding: 0.85rem 1rem;
      display: grid;
      gap: 0.6rem;
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
      gap: 0.75rem;
    }

    .edit-grid {
      display: grid;
      gap: 1rem;
    }

    .assignment-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .modifiers {
      display: grid;
      gap: 0.5rem;
      padding-left: 0;
    }

    .modifier-row {
      display: grid;
      gap: 0.4rem;
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
      color: var(--brand-on-primary);
      box-shadow: 0 12px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.24);
    }

    button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 28px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
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
      margin: 0;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    @media (max-width: 600px) {
      .field-grid {
        grid-template-columns: 1fr;
      }

      .modifiers {
        padding-left: 0;
      }
    }
  `],
  template: `
    <div class="manager-card">
      <form class="option-form" (ngSubmit)="createOption()">
        <div class="field-grid">
          <label>
            {{ 'menu.options.form.titleLabel' | translate: 'Option title' }}
            <input
              name="optionTitle"
              [(ngModel)]="newOption.title"
              required
              placeholder="{{ 'menu.options.form.titleLabel' | translate: 'Option title' }}"
            />
          </label>
          <label>
            {{ 'menu.options.form.categoryLabel' | translate: 'Category' }}
            <select
              name="optionCategory"
              [(ngModel)]="newOption.categoryId"
              (ngModelChange)="handleCategoryChange('new', $event)"
              [ngModelOptions]="{ standalone: true }"
            >
              <option [ngValue]="null">
                {{ 'menu.options.form.categoryPlaceholder' | translate: 'Select a category' }}
              </option>
              <option *ngFor="let category of categories" [ngValue]="category.id">
                {{ resolveCategoryName(category) }}
              </option>
            </select>
          </label>
          <label>
            {{ 'menu.options.form.minLabel' | translate: 'Minimum selections' }}
            <input
              type="number"
              min="0"
              name="optionMin"
              [(ngModel)]="newOption.minSelections"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <label>
            {{ 'menu.options.form.maxLabel' | translate: 'Maximum selections' }}
            <input
              type="number"
              min="0"
              name="optionMax"
              [(ngModel)]="newOption.maxSelections"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
        </div>

        <p *ngIf="createCategoryMissing" class="error">
          {{ 'menu.options.error.category' | translate: 'Select a category for the option.' }}
        </p>
        <p *ngIf="createMinInvalid" class="error">
          {{ 'menu.options.error.minSelections' | translate: 'Enter a valid minimum selections number.' }}
        </p>
        <p *ngIf="createMaxInvalid" class="error">
          {{ 'menu.options.error.maxSelections' | translate: 'Enter a valid maximum selections number.' }}
        </p>
        <p *ngIf="createMinMaxInvalid" class="error">
          {{
            'menu.options.error.minMax'
              | translate: 'Maximum selections must be equal to or greater than the minimum.'
          }}
        </p>

        <section class="assignment-section" *ngIf="newOption.categoryId !== null">
          <div class="assignment-header">
            <h4>{{ 'menu.options.form.menuItemsLabel' | translate: 'Menu items in this category' }}</h4>
            <p>
              {{
                'menu.options.form.menuItemsHint'
                  | translate: 'All dishes in this category automatically include the option. Adjust price modifiers if needed.'
              }}
            </p>
          </div>

          <p *ngIf="!newOption.assignments.length" class="empty-state">
            {{ 'menu.options.form.noMenuItems' | translate: 'No menu items in this category yet.' }}
          </p>

          <div class="assignment-list" *ngIf="newOption.assignments.length">
            <div class="assignment-row" *ngFor="let assignment of newOption.assignments">
              <div class="assignment-name">{{ assignment.name }}</div>

              <div class="modifiers">
                <div class="modifier-row">
                  <label>
                    {{ 'menu.options.form.modifierLabel' | translate: 'Price modifier' }}
                    <select
                      name="newModifier-{{ assignment.menuItemId }}"
                      [(ngModel)]="assignment.modifierType"
                      (ngModelChange)="changeModifier('new', assignment, $event)"
                      [ngModelOptions]="{ standalone: true }"
                    >
                      <option value="none">
                        {{ 'menu.options.form.modifierNone' | translate: 'No price change' }}
                      </option>
                      <option value="amount">
                        {{ 'menu.options.form.modifierAmount' | translate: 'Add fixed amount' }}
                      </option>
                      <option value="percentage">
                        {{ 'menu.options.form.modifierPercentage' | translate: 'Add percentage' }}
                      </option>
                    </select>
                  </label>
                </div>

                <div class="modifier-row" *ngIf="assignment.modifierType === 'amount'">
                  <label>
                    {{ 'menu.options.form.modifierAmountLabel' | translate: 'Amount (EUR)' }}
                    <input
                      type="text"
                      name="newAmount-{{ assignment.menuItemId }}"
                      [(ngModel)]="assignment.amount"
                      (input)="clearAssignmentErrors('new', assignment.menuItemId)"
                      [ngModelOptions]="{ standalone: true }"
                      placeholder="1.50"
                    />
                  </label>
                  <p *ngIf="createAmountErrors[assignment.menuItemId]" class="error">
                    {{
                      'menu.options.error.amount'
                        | translate: 'Enter a valid amount in euros (e.g. 1.50).'
                    }}
                  </p>
                </div>

                <div class="modifier-row" *ngIf="assignment.modifierType === 'percentage'">
                  <label>
                    {{ 'menu.options.form.modifierPercentageLabel' | translate: 'Percentage (%)' }}
                    <input
                      type="number"
                      step="0.01"
                      name="newPercentage-{{ assignment.menuItemId }}"
                      [(ngModel)]="assignment.percentage"
                      (input)="clearAssignmentErrors('new', assignment.menuItemId)"
                      [ngModelOptions]="{ standalone: true }"
                      placeholder="10"
                    />
                  </label>
                  <p *ngIf="createPercentageErrors[assignment.menuItemId]" class="error">
                    {{ 'menu.options.error.percentage' | translate: 'Enter a valid percentage (e.g. 12.5).' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p *ngIf="createError" class="error">
          {{ 'menu.options.error.create' | translate: 'Unable to add the option. Please try again.' }}
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
          <ng-container *ngIf="editingId === option.id && editModel; else viewOption">
            <div class="assignment-header">
              <h4>{{ 'menu.options.list.editing' | translate: 'Edit option' }}</h4>
            </div>

            <div class="edit-grid">
              <div class="field-grid">
                <label>
                  {{ 'menu.options.form.titleLabel' | translate: 'Option title' }}
                  <input
                    name="editTitle-{{ option.id }}"
                    [(ngModel)]="editModel.title"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
                <label>
                  {{ 'menu.options.form.categoryLabel' | translate: 'Category' }}
                  <select
                    name="editCategory-{{ option.id }}"
                    [(ngModel)]="editModel.categoryId"
                    (ngModelChange)="handleCategoryChange('edit', $event)"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option [ngValue]="null">
                      {{ 'menu.options.form.categoryPlaceholder' | translate: 'Select a category' }}
                    </option>
                    <option *ngFor="let category of categories" [ngValue]="category.id">
                      {{ resolveCategoryName(category) }}
                    </option>
                  </select>
                </label>
                <label>
                  {{ 'menu.options.form.minLabel' | translate: 'Minimum selections' }}
                  <input
                    type="number"
                    min="0"
                    name="editMin-{{ option.id }}"
                    [(ngModel)]="editModel.minSelections"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
                <label>
                  {{ 'menu.options.form.maxLabel' | translate: 'Maximum selections' }}
                  <input
                    type="number"
                    min="0"
                    name="editMax-{{ option.id }}"
                    [(ngModel)]="editModel.maxSelections"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
              </div>

              <p *ngIf="editCategoryMissing" class="error">
                {{ 'menu.options.error.category' | translate: 'Select a category for the option.' }}
              </p>
              <p *ngIf="editMinInvalid" class="error">
                {{ 'menu.options.error.minSelections' | translate: 'Enter a valid minimum selections number.' }}
              </p>
              <p *ngIf="editMaxInvalid" class="error">
                {{ 'menu.options.error.maxSelections' | translate: 'Enter a valid maximum selections number.' }}
              </p>
              <p *ngIf="editMinMaxInvalid" class="error">
                {{
                  'menu.options.error.minMax'
                    | translate: 'Maximum selections must be equal to or greater than the minimum.'
                }}
              </p>

              <section class="assignment-section" *ngIf="editModel.categoryId !== null">
                <div class="assignment-header">
                  <h4>{{ 'menu.options.form.menuItemsLabel' | translate: 'Menu items in this category' }}</h4>
                  <p>
                    {{
                      'menu.options.form.menuItemsHint'
                        | translate:
                          'All dishes in this category automatically include the option. Adjust price modifiers if needed.'
                    }}
                  </p>
                </div>

                <p *ngIf="!editModel.assignments.length" class="empty-state">
                  {{ 'menu.options.form.noMenuItems' | translate: 'No menu items in this category yet.' }}
                </p>

                <div class="assignment-list" *ngIf="editModel.assignments.length">
                  <div class="assignment-row" *ngFor="let assignment of editModel.assignments">
                    <div class="assignment-name">{{ assignment.name }}</div>

                    <div class="modifiers">
                      <div class="modifier-row">
                        <label>
                          {{ 'menu.options.form.modifierLabel' | translate: 'Price modifier' }}
                          <select
                            name="editModifier-{{ option.id }}-{{ assignment.menuItemId }}"
                            [(ngModel)]="assignment.modifierType"
                            (ngModelChange)="changeModifier('edit', assignment, $event)"
                            [ngModelOptions]="{ standalone: true }"
                          >
                            <option value="none">
                              {{ 'menu.options.form.modifierNone' | translate: 'No price change' }}
                            </option>
                            <option value="amount">
                              {{ 'menu.options.form.modifierAmount' | translate: 'Add fixed amount' }}
                            </option>
                            <option value="percentage">
                              {{ 'menu.options.form.modifierPercentage' | translate: 'Add percentage' }}
                            </option>
                          </select>
                        </label>
                      </div>

                      <div class="modifier-row" *ngIf="assignment.modifierType === 'amount'">
                        <label>
                          {{ 'menu.options.form.modifierAmountLabel' | translate: 'Amount (EUR)' }}
                          <input
                            type="text"
                            name="editAmount-{{ option.id }}-{{ assignment.menuItemId }}"
                            [(ngModel)]="assignment.amount"
                            (input)="clearAssignmentErrors('edit', assignment.menuItemId)"
                            [ngModelOptions]="{ standalone: true }"
                            placeholder="1.50"
                          />
                        </label>
                        <p *ngIf="editAmountErrors[assignment.menuItemId]" class="error">
                          {{
                            'menu.options.error.amount'
                              | translate: 'Enter a valid amount in euros (e.g. 1.50).'
                          }}
                        </p>
                      </div>

                      <div class="modifier-row" *ngIf="assignment.modifierType === 'percentage'">
                        <label>
                          {{ 'menu.options.form.modifierPercentageLabel' | translate: 'Percentage (%)' }}
                          <input
                            type="number"
                            step="0.01"
                            name="editPercentage-{{ option.id }}-{{ assignment.menuItemId }}"
                            [(ngModel)]="assignment.percentage"
                            (input)="clearAssignmentErrors('edit', assignment.menuItemId)"
                            [ngModelOptions]="{ standalone: true }"
                            placeholder="10"
                          />
                        </label>
                        <p *ngIf="editPercentageErrors[assignment.menuItemId]" class="error">
                          {{ 'menu.options.error.percentage' | translate: 'Enter a valid percentage (e.g. 12.5).' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <p *ngIf="updateError" class="error">
                {{ 'menu.options.error.update' | translate: 'Unable to save changes. Please try again.' }}
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
                  [disabled]="updating || !editModel.title.trim()"
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
            <div class="assignment-header">
              <h4>{{ option.title }}</h4>
              <p>
                {{
                  'menu.options.list.summary'
                    | translate: 'Min {{min}} · Max {{max}}'
                    : { min: option.min_selections, max: option.max_selections }
                }}
              </p>
            </div>

            <p *ngIf="deleteErrorId === option.id" class="error">
              {{ 'menu.options.error.delete' | translate: 'Unable to delete the option. Please try again.' }}
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
  private categoriesService = inject(CategoriesService);
  private menuService = inject(MenuService);
  private i18n = inject(TranslationService);

  options: MenuOption[] = [];
  categories: MenuItemCategory[] = [];
  menuItems: MenuItem[] = [];

  loading = false;
  loadError = false;

  creating = false;
  createError = false;
  newOption: OptionFormModel = this.createEmptyForm();
  createCategoryMissing = false;
  createMinInvalid = false;
  createMaxInvalid = false;
  createMinMaxInvalid = false;
  createAmountErrors: Record<number, boolean> = {};
  createPercentageErrors: Record<number, boolean> = {};

  editingId: number | null = null;
  editingOption: MenuOption | null = null;
  editModel: OptionFormModel | null = null;
  editCategoryMissing = false;
  editMinInvalid = false;
  editMaxInvalid = false;
  editMinMaxInvalid = false;
  editAmountErrors: Record<number, boolean> = {};
  editPercentageErrors: Record<number, boolean> = {};
  updating = false;
  updateError = false;

  deletingId: number | null = null;
  deleteErrorId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ('restaurantId' in changes) {
      const id = changes['restaurantId'].currentValue;
      if (typeof id === 'number' && !Number.isNaN(id)) {
        this.resetState();
        void this.loadCategories(id);
        void this.loadMenuItems(id);
        void this.loadOptions();
      }
    }
  }

  async loadOptions(): Promise<void> {
    if (typeof this.restaurantId !== 'number') {
      return;
    }

    this.loading = true;
    this.loadError = false;

    try {
      const options = await firstValueFrom(this.menuOptions.listByRestaurant(this.restaurantId));
      this.options = options ?? [];

      if (this.editingId !== null) {
        const match = this.options.find(option => option.id === this.editingId);
        if (match && this.editModel) {
          this.editingOption = match;
          this.editModel = this.createFormFromOption(match);
        }
      }
    } catch (error) {
      console.error('Failed to load options', error);
      this.options = [];
      this.loadError = true;
    } finally {
      this.loading = false;
    }
  }

  async createOption(): Promise<void> {
    if (this.creating) {
      return;
    }

    const title = this.newOption.title.trim();
    if (!title) {
      return;
    }

    this.resetValidationState('new');

    const { payload, errors } = this.buildPayload(this.newOption, title);
    this.applyValidationErrors('new', errors);

    if (!payload || typeof this.restaurantId !== 'number') {
      return;
    }

    this.creating = true;
    this.createError = false;

    try {
      const created = await firstValueFrom(this.menuOptions.create(this.restaurantId, payload));
      this.options = [...this.options, created];
      this.newOption = this.createEmptyForm();
      this.resetValidationState('new');
      void this.loadOptions();
    } catch (error) {
      console.error('Failed to create option', error);
      this.createError = true;
    } finally {
      this.creating = false;
    }
  }

  startEdit(option: MenuOption): void {
    this.editingId = option.id;
    this.editingOption = option;
    this.editModel = this.createFormFromOption(option);
    this.resetValidationState('edit');
    this.updateError = false;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editingOption = null;
    this.editModel = null;
    this.resetValidationState('edit');
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

    this.resetValidationState('edit');

    const baseOption = this.editingOption ?? option;
    const { payload, errors } = this.buildPayload(this.editModel, title, baseOption);
    this.applyValidationErrors('edit', errors);

    if (!payload) {
      return;
    }

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

  handleCategoryChange(context: 'new' | 'edit', value: number | null): void {
    if (context === 'new') {
      this.newOption.categoryId = value;
      this.newOption.assignments = this.createAssignmentsForCategory(value);
      this.resetValidationState('new');
    } else if (this.editModel) {
      this.editModel.categoryId = value;
      if (value === null) {
        this.editModel.assignments = [];
      } else if (this.editingOption && this.editingOption.category_id === value) {
        this.editModel.assignments = this.createAssignmentsFromOption(this.editingOption, value);
      } else {
        this.editModel.assignments = this.createAssignmentsForCategory(value);
      }
      this.resetValidationState('edit');
    }
  }

  changeModifier(context: 'new' | 'edit', assignment: AssignmentFormEntry, type: OptionModifierType): void {
    assignment.modifierType = type;
    if (type === 'amount') {
      assignment.percentage = '';
    } else if (type === 'percentage') {
      assignment.amount = '';
    } else {
      assignment.amount = '';
      assignment.percentage = '';
    }
    this.clearAssignmentErrors(context, assignment.menuItemId);
  }

  clearAssignmentErrors(context: 'new' | 'edit', menuItemId: number): void {
    if (context === 'new') {
      if (this.createAmountErrors[menuItemId] || this.createPercentageErrors[menuItemId]) {
        const amount = { ...this.createAmountErrors };
        const percentage = { ...this.createPercentageErrors };
        delete amount[menuItemId];
        delete percentage[menuItemId];
        this.createAmountErrors = amount;
        this.createPercentageErrors = percentage;
      }
    } else {
      if (this.editAmountErrors[menuItemId] || this.editPercentageErrors[menuItemId]) {
        const amount = { ...this.editAmountErrors };
        const percentage = { ...this.editPercentageErrors };
        delete amount[menuItemId];
        delete percentage[menuItemId];
        this.editAmountErrors = amount;
        this.editPercentageErrors = percentage;
      }
    }
  }

  private async loadCategories(restaurantId: number): Promise<void> {
    try {
      const categories = await firstValueFrom(this.categoriesService.list(restaurantId));
      const list = categories ?? [];
      const locale = this.i18n.currentLocale();
      this.categories = [...list].sort((a, b) =>
        this.resolveCategoryName(a).localeCompare(this.resolveCategoryName(b), locale, { sensitivity: 'base' })
      );
    } catch (error) {
      console.error('Could not load categories', error);
      this.categories = [];
    }
  }

  private async loadMenuItems(restaurantId: number): Promise<void> {
    try {
      const menuItems = await firstValueFrom(this.menuService.listByRestaurant(restaurantId));
      this.menuItems = menuItems ?? [];

      if (this.newOption.categoryId !== null) {
        this.newOption.assignments = this.createAssignmentsForCategory(this.newOption.categoryId, this.newOption.assignments);
      }

      const editModel = this.editModel;
      if (editModel && editModel.categoryId !== null) {
        if (this.editingOption && this.editingOption.category_id === editModel.categoryId) {
          editModel.assignments = this.createAssignmentsFromOption(
            this.editingOption,
            editModel.categoryId
          );
        } else {
          editModel.assignments = this.createAssignmentsForCategory(
            editModel.categoryId,
            editModel.assignments
          );
        }
      }
    } catch (error) {
      console.error('Could not load menu items', error);
      this.menuItems = [];
    }
  }

  private resetState(): void {
    this.options = [];
    this.categories = [];
    this.menuItems = [];
    this.newOption = this.createEmptyForm();
    this.resetValidationState('new');
    this.cancelEdit();
    this.createError = false;
    this.updateError = false;
    this.deletingId = null;
    this.deleteErrorId = null;
  }

  private createEmptyForm(): OptionFormModel {
    return {
      title: '',
      categoryId: null,
      minSelections: '0',
      maxSelections: '1',
      assignments: [],
    };
  }

  private createFormFromOption(option: MenuOption): OptionFormModel {
    const categoryId = option.category_id ?? null;
    return {
      title: option.title ?? '',
      categoryId,
      minSelections: option.min_selections != null ? String(option.min_selections) : '0',
      maxSelections: option.max_selections != null ? String(option.max_selections) : '0',
      assignments: this.createAssignmentsFromOption(option, categoryId),
    };
  }

  private createAssignmentsForCategory(
    categoryId: number | null,
    previous?: AssignmentFormEntry[]
  ): AssignmentFormEntry[] {
    if (categoryId === null) {
      return [];
    }

    const items = this.getMenuItemsForCategory(categoryId);
    const previousMap = new Map(previous?.map(entry => [entry.menuItemId, entry]));

    return items.map(item => {
      const existing = previousMap.get(item.id);
      if (existing) {
        return { ...existing, name: item.name };
      }

      return this.createAssignmentEntry(item.id, item.name);
    });
  }

  private createAssignmentsFromOption(option: MenuOption, categoryId: number | null): AssignmentFormEntry[] {
    if (categoryId === null) {
      return [];
    }

    const available = (option.available_menu_items?.length
      ? option.available_menu_items
      : this.getMenuItemsForCategory(categoryId)
    ).map(item => ({ id: item.id, name: item.name }));

    const sorted = this.sortByName(available);
    const optionItems = new Map((option.option_items ?? []).map(item => [item.menu_item_id, item]));

    return sorted.map(item => {
      const existing = optionItems.get(item.id);
      const modifierType = this.resolveModifierType(existing);
      return {
        menuItemId: item.id,
        name: item.name,
        modifierType,
        amount: modifierType === 'amount' ? this.formatCurrencyInput(existing?.price_modifier_amount_cents) : '',
        percentage:
          modifierType === 'percentage' && existing?.price_modifier_percentage != null
            ? String(existing.price_modifier_percentage)
            : '',
        optionItemId: existing?.id ?? undefined,
      };
    });
  }

  private createAssignmentEntry(menuItemId: number, name: string): AssignmentFormEntry {
    return {
      menuItemId,
      name,
      modifierType: 'none',
      amount: '',
      percentage: '',
    };
  }

  private buildPayload(
    form: OptionFormModel,
    title: string,
    baseOption?: MenuOption
  ): { payload?: MenuOptionInput; errors: ValidationErrors } {
    const errors: ValidationErrors = {
      categoryMissing: false,
      minInvalid: false,
      maxInvalid: false,
      minMaxInvalid: false,
      amountInvalidIds: [],
      percentageInvalidIds: [],
    };

    if (form.categoryId === null) {
      errors.categoryMissing = true;
    }

    const min = this.parseInteger(form.minSelections);
    if (!min.valid) {
      errors.minInvalid = true;
    }

    const max = this.parseInteger(form.maxSelections);
    if (!max.valid) {
      errors.maxInvalid = true;
    }

    if (min.valid && max.valid && max.value < min.value) {
      errors.minMaxInvalid = true;
    }

    const optionItems: MenuOptionItemInput[] = [];
    const menuItemOptionId = baseOption?.id;

    for (const assignment of form.assignments) {
      if (assignment.modifierType === 'amount') {
        const parsed = this.parseCurrency(assignment.amount);
        if (!parsed.valid) {
          errors.amountInvalidIds.push(assignment.menuItemId);
          continue;
        }

        optionItems.push({
          id: assignment.optionItemId,
          menu_item_option_id: menuItemOptionId,
          menu_item_id: assignment.menuItemId,
          price_modifier_type: 'amount',
          price_modifier_amount_cents: parsed.cents,
          price_modifier_percentage: null,
        });
      } else if (assignment.modifierType === 'percentage') {
        const parsed = this.parsePercentage(assignment.percentage);
        if (!parsed.valid || parsed.percentage === null) {
          errors.percentageInvalidIds.push(assignment.menuItemId);
          continue;
        }

        optionItems.push({
          id: assignment.optionItemId,
          menu_item_option_id: menuItemOptionId,
          menu_item_id: assignment.menuItemId,
          price_modifier_type: 'percentage',
          price_modifier_amount_cents: null,
          price_modifier_percentage: parsed.percentage,
        });
      } else {
        optionItems.push({
          id: assignment.optionItemId,
          menu_item_option_id: menuItemOptionId,
          menu_item_id: assignment.menuItemId,
          price_modifier_type: 'none',
          price_modifier_amount_cents: null,
          price_modifier_percentage: null,
        });
      }
    }

    const hasAmountErrors = errors.amountInvalidIds.length > 0;
    const hasPercentageErrors = errors.percentageInvalidIds.length > 0;
    const valid =
      !errors.categoryMissing &&
      !errors.minInvalid &&
      !errors.maxInvalid &&
      !errors.minMaxInvalid &&
      !hasAmountErrors &&
      !hasPercentageErrors;

    if (!valid || form.categoryId === null || !min.valid || !max.valid) {
      return { errors };
    }

    const payload: MenuOptionInput = {
      title,
      category_id: form.categoryId,
      min_selections: min.value,
      max_selections: max.value,
      option_items: optionItems,
    };

    return { payload, errors };
  }

  private applyValidationErrors(context: 'new' | 'edit', errors: ValidationErrors): void {
    const amountMap = this.buildErrorMap(errors.amountInvalidIds);
    const percentageMap = this.buildErrorMap(errors.percentageInvalidIds);

    if (context === 'new') {
      this.createCategoryMissing = errors.categoryMissing;
      this.createMinInvalid = errors.minInvalid;
      this.createMaxInvalid = errors.maxInvalid;
      this.createMinMaxInvalid = errors.minMaxInvalid;
      this.createAmountErrors = amountMap;
      this.createPercentageErrors = percentageMap;
    } else {
      this.editCategoryMissing = errors.categoryMissing;
      this.editMinInvalid = errors.minInvalid;
      this.editMaxInvalid = errors.maxInvalid;
      this.editMinMaxInvalid = errors.minMaxInvalid;
      this.editAmountErrors = amountMap;
      this.editPercentageErrors = percentageMap;
    }
  }

  private buildErrorMap(ids: number[]): Record<number, boolean> {
    return ids.reduce<Record<number, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
  }

  private resetValidationState(context: 'new' | 'edit'): void {
    if (context === 'new') {
      this.createCategoryMissing = false;
      this.createMinInvalid = false;
      this.createMaxInvalid = false;
      this.createMinMaxInvalid = false;
      this.createAmountErrors = {};
      this.createPercentageErrors = {};
    } else {
      this.editCategoryMissing = false;
      this.editMinInvalid = false;
      this.editMaxInvalid = false;
      this.editMinMaxInvalid = false;
      this.editAmountErrors = {};
      this.editPercentageErrors = {};
    }
  }

  private getMenuItemsForCategory(categoryId: number): MenuItem[] {
    const filtered = this.menuItems.filter(item =>
      (item.categories ?? []).some(category => category?.id === categoryId)
    );
    return this.sortByName(filtered);
  }

  private sortByName<T extends { name: string }>(items: T[]): T[] {
    const locale = this.i18n.currentLocale();
    return [...items].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
  }

  resolveCategoryName(category: MenuItemCategory): string {
    if (!category) {
      return '';
    }

    const direct = category.name?.trim();
    if (direct) {
      return direct;
    }

    const translations = category.name_translations;
    if (translations) {
      const preferred = translations[this.i18n.currentLanguageCode()]?.trim();
      if (preferred) {
        return preferred;
      }

      for (const value of Object.values(translations)) {
        if (value?.trim()) {
          return value.trim();
        }
      }
    }

    return '';
  }

  private formatCurrencyInput(value: number | null | undefined): string {
    if (value == null) {
      return '';
    }

    return (value / 100).toFixed(2);
  }

  private parseInteger(value: string): { value: number; valid: boolean } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { value: 0, valid: false };
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { value: 0, valid: false };
    }

    return { value: parsed, valid: true };
  }

  private parseCurrency(value: string): { cents: number | null; valid: boolean } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { cents: null, valid: false };
    }

    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      return { cents: null, valid: false };
    }

    return { cents: Math.round(parsed * 100), valid: true };
  }

  private parsePercentage(value: string | number | null | undefined): {
    percentage: number | null;
    valid: boolean;
  } {
    if (value == null) {
      return { percentage: null, valid: false };
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return { percentage: null, valid: false };
      }

      return { percentage: value, valid: true };
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return { percentage: null, valid: false };
    }

    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      return { percentage: null, valid: false };
    }

    return { percentage: parsed, valid: true };
  }

  private resolveModifierType(optionItem?: MenuOptionItem | null): OptionModifierType {
    if (!optionItem) {
      return 'none';
    }

    const type = optionItem.price_modifier_type ?? undefined;
    if (type === 'amount') {
      return 'amount';
    }

    if (type === 'percentage') {
      return 'percentage';
    }

    if (optionItem.price_modifier_amount_cents != null) {
      return 'amount';
    }

    if (optionItem.price_modifier_percentage != null) {
      return 'percentage';
    }

    return 'none';
  }
}
