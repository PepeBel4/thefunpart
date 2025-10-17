import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import {
  Allergen,
  MenuItem,
  MenuItemCategory,
  MenuItemInput,
  MenuOption,
  MenuOptionAssignment,
} from '../core/models';
import { MenuService } from './menu.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { CategoriesService } from './categories.service';
import { AllergensService } from './allergens.service';
import { AllergenIconComponent } from '../shared/allergen-icon.component';
import { MenuOptionsService } from './menu-options.service';
import { MenuOptionAssignmentsService } from './menu-option-assignments.service';
import {
  MenuItemAiAssistantService,
  MenuItemAiSuggestions,
} from './menu-item-ai-assistant.service';

interface CategoryFormModel {
  id?: number;
  name: string;
}

interface MenuFormModel {
  name: string;
  description: string;
  price: string;
  categories: CategoryFormModel[];
  allergens: Allergen[];
}

interface QueuedPhoto {
  file: File;
  preview: string;
}

interface OptionAssignmentDraft {
  id?: number;
  optionId: number | null;
}

interface OptionAssignmentChangeSet {
  toCreate: number[];
  toUpdate: { id: number; optionId: number }[];
  toDelete: number[];
}

@Component({
  standalone: true,
  selector: 'app-menu-manager',
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe, TranslatePipe, AllergenIconComponent],
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

    .ai-suggestion-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      font-size: 0.85rem;
    }

    .ai-suggestion-banner.loading {
      background: rgba(10, 10, 10, 0.04);
      color: var(--text-secondary);
    }

    .ai-suggestion-banner.success {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: #036239;
    }

    .ai-suggestion-banner.info {
      background: rgba(10, 10, 10, 0.04);
      color: var(--text-primary);
    }

    .ai-suggestion-banner.error {
      background: rgba(229, 62, 62, 0.12);
      color: #8f1e1e;
    }

    .ai-suggestion-banner button.link {
      margin-left: auto;
    }

    form {
      display: grid;
      gap: 0.75rem;
    }

    label {
      font-weight: 600;
      font-size: 0.95rem;
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

    .ai-price-band {
      margin: 0.35rem 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
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

    .menu-items {
      display: grid;
      gap: 1rem;
    }

    .item-card {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      border: 1px solid rgba(10, 10, 10, 0.05);
      padding: 1.1rem 1.25rem;
      display: grid;
      gap: 0.5rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: center;
    }

    .item-header h4 {
      margin: 0;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    .error {
      color: #d14343;
      font-size: 0.9rem;
    }

    .status {
      font-size: 0.95rem;
      color: var(--brand-green);
      font-weight: 600;
    }

    .category-section {
      display: grid;
      gap: 0.4rem;
    }

    .category-inputs {
      display: grid;
      gap: 0.5rem;
    }

    .category-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-row input {
      flex: 1;
    }

    .category-row select {
      flex: 1;
    }

    datalist {
      display: none;
    }

    button.link {
      background: transparent;
      color: var(--brand-green);
      padding: 0;
      box-shadow: none;
      border-radius: 0;
      font-size: 0.9rem;
    }

    button.link:hover {
      text-decoration: underline;
      transform: none;
    }

    button.link.remove {
      color: var(--text-secondary);
      font-weight: 500;
    }

    button.link.add {
      justify-self: flex-start;
      font-weight: 600;
    }

    .category-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.15rem;
    }

    .category-tags .tag {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: #036239;
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .allergen-section {
      display: grid;
      gap: 0.45rem;
    }

    .allergen-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .allergen-selector button.pill {
      background: var(--surface-elevated);
      border: 1px solid var(--border-soft);
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: none;
      color: inherit;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      line-height: 1;
    }

    .allergen-selector button.pill:hover {
      transform: translateY(-1px);
    }

    .allergen-selector button.pill.selected {
      background: rgba(229, 62, 62, 0.12);
      border-color: rgba(229, 62, 62, 0.4);
      color: #8f1e1e;
    }

    .allergen-selector button.pill app-allergen-icon {
      --allergen-icon-bg: rgba(229, 62, 62, 0.14);
      --allergen-icon-border: rgba(143, 30, 30, 0.14);
    }

    .allergen-selector button.pill:not(.selected) app-allergen-icon {
      --allergen-icon-bg: rgba(10, 10, 10, 0.04);
      --allergen-icon-color: var(--text-secondary);
      --allergen-icon-border: rgba(10, 10, 10, 0.08);
    }

    .allergen-help {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .allergen-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .allergen-tags .tag {
      background: rgba(229, 62, 62, 0.12);
      color: #8f1e1e;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      line-height: 1;
    }

    .allergen-tags .tag app-allergen-icon {
      --allergen-icon-bg: rgba(229, 62, 62, 0.18);
      --allergen-icon-border: rgba(143, 30, 30, 0.2);
    }

    .photo-section {
      display: grid;
      gap: 0.5rem;
    }

    .photo-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .photo-info {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .photo-grid {
      display: grid;
      gap: 0.6rem;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    }

    .photo-grid figure {
      position: relative;
      border-radius: 0.75rem;
      overflow: hidden;
      background: var(--surface);
      min-height: 96px;
    }

    .photo-grid img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-grid button.remove-photo {
      position: absolute;
      top: 0.4rem;
      right: 0.4rem;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      border-radius: 999px;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      box-shadow: none;
    }

    .photo-grid button.remove-photo:hover {
      transform: none;
      text-decoration: underline;
    }

    .option-assignment-section {
      display: grid;
      gap: 0.6rem;
    }

    .option-assignment-description {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin: 0;
    }

    .option-assignment-list {
      display: grid;
      gap: 0.5rem;
    }

    .option-assignment-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .option-assignment-row select {
      flex: 1;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-soft);
      background: var(--surface-elevated);
      font: inherit;
    }

    .option-assignment-help {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .option-assignment-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .option-assignment-tags .tag {
      background: rgba(6, 193, 103, 0.12);
      color: #036239;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .manager-card {
        margin-top: 2rem;
        padding: 1.5rem;
      }
    }
  `],
  template: `
    <section class="manager-card">
      <div>
        <h3>{{ 'menu.manage.heading' | translate: 'Manage menu' }}</h3>
        <p class="description">
          {{ 'menu.manage.description' | translate: 'Add new dishes or update existing ones in just a few clicks.' }}
        </p>
      </div>

      <form (ngSubmit)="createItem()">
        <div>
          <label for="new-name">{{ 'menu.form.nameLabel' | translate: 'Item name' }}</label>
          <input
            id="new-name"
            [(ngModel)]="newItem.name"
            (ngModelChange)="onNewItemNameChange($event)"
            name="newName"
            required
            [attr.placeholder]="'menu.form.namePlaceholder' | translate: 'e.g. Spicy Tuna Roll'"
          />
        </div>
        <div>
          <label for="new-description">{{ 'menu.form.descriptionLabel' | translate: 'Description' }}</label>
          <textarea
            id="new-description"
            [(ngModel)]="newItem.description"
            (ngModelChange)="onNewItemDescriptionChange($event)"
            name="newDescription"
            [attr.placeholder]="'menu.form.descriptionPlaceholder' | translate: 'Optional description'"
          ></textarea>
        </div>
        <div class="ai-suggestion-banner loading" *ngIf="aiSuggestionStatus === 'loading'">
          {{ 'menu.aiAssist.loading' | translate: 'Analyzing item details…' }}
        </div>
        <div class="ai-suggestion-banner success" *ngIf="aiSuggestionStatus === 'applied'">
          {{
            'menu.aiAssist.applied'
              | translate: 'AI suggestions applied to categories and allergens.'
          }}
        </div>
        <div class="ai-suggestion-banner info" *ngIf="aiSuggestionStatus === 'ready'">
          <span>{{ 'menu.aiAssist.ready' | translate: 'AI suggestions are ready to apply.' }}</span>
          <button
            type="button"
            class="link apply"
            *ngIf="canApplyAiSuggestions"
            (click)="applyPendingAiSuggestions()"
          >
            {{ 'menu.aiAssist.apply' | translate: 'Apply suggestions' }}
          </button>
        </div>
        <div class="ai-suggestion-banner error" *ngIf="aiSuggestionStatus === 'error'">
          <span>
            {{
              aiSuggestionError
                || (
                  'menu.aiAssist.error'
                    | translate: 'Unable to suggest details right now. Please try again.'
                )
            }}
          </span>
          <button type="button" class="link retry" (click)="retryAiSuggestions()">
            {{ 'menu.aiAssist.retry' | translate: 'Try again' }}
          </button>
        </div>
        <div>
          <label for="new-price">{{ 'menu.form.priceLabel' | translate: 'Price (EUR)' }}</label>
          <input
            id="new-price"
            [(ngModel)]="newItem.price"
            name="newPrice"
            inputmode="decimal"
            required
            [attr.placeholder]="'menu.form.pricePlaceholder' | translate: '9.50'"
          />
          <p class="ai-price-band" *ngIf="aiSuggestionPriceBand">
            {{
              'menu.aiAssist.priceBand'
                | translate: 'Suggested price band: {{band}}': { band: aiSuggestionPriceBand }
            }}
          </p>
        </div>
        <div class="category-section">
          <label>Categories</label>
          <div class="category-inputs">
            <div class="category-row" *ngFor="let category of newItem.categories; let i = index">
              <input
                [(ngModel)]="newItem.categories[i].name"
                name="newCategory-{{ i }}"
                placeholder="e.g. Starters"
                [attr.list]="availableCategories.length ? 'new-category-options' : null"
                (ngModelChange)="onCategoryNameChange('new', i, $event)"
              />
              <button
                type="button"
                class="link remove"
                (click)="removeCategory('new', i)"
                *ngIf="newItem.categories.length > 1"
              >
                Remove
              </button>
            </div>
            <button type="button" class="link add" (click)="addCategory('new')">+ Add category</button>
            <datalist id="new-category-options" *ngIf="availableCategories.length">
              <ng-container *ngFor="let option of availableCategories">
                <ng-container *ngIf="resolveCategoryName(option) as label">
                  <option [value]="label"></option>
                </ng-container>
              </ng-container>
            </datalist>
          </div>
        </div>
        <div class="allergen-section">
          <label>{{ 'menu.form.allergensLabel' | translate: 'Allergens' }}</label>
          <ng-container *ngIf="availableAllergens.length; else noNewAllergens">
            <div class="allergen-selector">
              <button
                type="button"
                class="pill"
                *ngFor="let allergen of availableAllergens"
                [class.selected]="isAllergenSelected('new', allergen.id)"
                (click)="toggleAllergen('new', allergen)"
              >
                <app-allergen-icon [allergen]="allergen"></app-allergen-icon>
                <span>{{ resolveAllergenName(allergen) }}</span>
              </button>
            </div>
            <span class="allergen-help">
              {{ 'menu.form.allergensHint' | translate: 'Select all allergens contained in this dish.' }}
            </span>
          </ng-container>
          <ng-template #noNewAllergens>
            <span class="allergen-help">
              {{ 'menu.form.allergensEmpty' | translate: 'No allergens available yet.' }}
            </span>
          </ng-template>
        </div>
        <div class="photo-section">
          <label>{{ 'menu.photos.label' | translate: 'Item photos' }}</label>
          <div class="photo-controls">
            <input
              type="file"
              #newPhotoInput
              multiple
              accept="image/*"
              (change)="onPhotoSelection('new', newPhotoInput.files); newPhotoInput.value = ''"
              [disabled]="saving"
            />
            <button type="button" class="link remove" *ngIf="newPhotos.length" (click)="clearQueuedPhotos('new')">
              {{ 'menu.photos.clear' | translate: 'Clear selection' }}
            </button>
          </div>
          <div class="photo-grid queued" *ngIf="newPhotos.length">
            <figure *ngFor="let photo of newPhotos; index as i">
              <img [src]="photo.preview" [alt]="'Selected photo ' + (i + 1)" />
              <button
                type="button"
                class="remove-photo"
                (click)="removeQueuedPhoto('new', i)"
                [disabled]="saving"
              >
                {{ 'menu.photos.removeQueued' | translate: 'Remove photo' }}
              </button>
            </figure>
          </div>
          <span class="photo-info" *ngIf="newPhotos.length">
            {{
              newPhotos.length === 1
                ? ('menu.photos.readyOne' | translate: '1 photo ready to upload')
                : ('menu.photos.readyMany' | translate: '{{count}} photos ready to upload': { count: newPhotos.length })
            }}
          </span>
          <span class="photo-info" *ngIf="!newPhotos.length">
            {{ 'menu.photos.noteCreate' | translate: 'Optional: upload images to highlight this dish.' }}
          </span>
        </div>
        <div class="actions">
          <span *ngIf="creationStatus" class="status">{{ creationStatus }}</span>
          <button type="submit" class="primary" [disabled]="saving">
            {{
              saving
                ? ('menu.form.saving' | translate: 'Saving…')
                : ('menu.form.add' | translate: 'Add item')
            }}
          </button>
        </div>
      </form>

      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="menu-items" *ngIf="!loading; else loadingTpl">
        <div *ngIf="!menuItems.length" class="empty-state">
          {{ 'menu.items.empty' | translate: 'No menu items yet. Start by adding your first dish.' }}
        </div>

        <ng-container *ngFor="let item of menuItems">
          <div class="item-card">
            <form *ngIf="editingId === item.id; else viewTpl" (ngSubmit)="saveItem(item.id)">
              <div>
                <label>{{ 'menu.items.name' | translate: 'Name' }}</label>
                <input [(ngModel)]="editItem.name" name="editName-{{ item.id }}" required />
              </div>
              <div>
                <label>{{ 'menu.items.description' | translate: 'Description' }}</label>
                <textarea [(ngModel)]="editItem.description" name="editDescription-{{ item.id }}"></textarea>
              </div>
              <div>
                <label>{{ 'menu.items.price' | translate: 'Price (EUR)' }}</label>
                <input [(ngModel)]="editItem.price" name="editPrice-{{ item.id }}" inputmode="decimal" required />
              </div>
              <div class="category-section">
                <label>Categories</label>
                <div class="category-inputs">
                  <div class="category-row" *ngFor="let category of editItem.categories; let i = index">
                    <input
                      [(ngModel)]="editItem.categories[i].name"
                      name="editCategory-{{ item.id }}-{{ i }}"
                      placeholder="e.g. Starters"
                      [attr.list]="availableCategories.length ? 'edit-category-options' : null"
                      (ngModelChange)="onCategoryNameChange('edit', i, $event)"
                    />
                    <button
                      type="button"
                      class="link remove"
                      (click)="removeCategory('edit', i)"
                      *ngIf="editItem.categories.length > 1"
                    >
                      Remove
                    </button>
                  </div>
                  <button type="button" class="link add" (click)="addCategory('edit')">+ Add category</button>
                  <datalist id="edit-category-options" *ngIf="availableCategories.length">
                    <ng-container *ngFor="let option of availableCategories">
                      <ng-container *ngIf="resolveCategoryName(option) as label">
                        <option [value]="label"></option>
                      </ng-container>
                    </ng-container>
                  </datalist>
                </div>
              </div>
              <div class="allergen-section">
                <label>{{ 'menu.form.allergensLabel' | translate: 'Allergens' }}</label>
                <ng-container *ngIf="availableAllergens.length; else noEditAllergens">
                  <div class="allergen-selector">
                    <button
                      type="button"
                      class="pill"
                      *ngFor="let allergen of availableAllergens"
                      [class.selected]="isAllergenSelected('edit', allergen.id)"
                      (click)="toggleAllergen('edit', allergen)"
                    >
                      <app-allergen-icon [allergen]="allergen"></app-allergen-icon>
                      <span>{{ resolveAllergenName(allergen) }}</span>
                    </button>
                  </div>
                  <span class="allergen-help">
                    {{ 'menu.form.allergensHint' | translate: 'Select all allergens contained in this dish.' }}
                  </span>
                </ng-container>
                <ng-template #noEditAllergens>
                  <span class="allergen-help">
                    {{ 'menu.form.allergensEmpty' | translate: 'No allergens available yet.' }}
                  </span>
                </ng-template>
              </div>
              <div class="option-assignment-section">
                <label>{{ 'menu.options.assignments.label' | translate: 'Menu options' }}</label>
                <p class="option-assignment-description">
                  {{
                    'menu.options.assignments.description'
                      | translate: 'Assign options to this item.'
                  }}
                </p>
                <ng-container *ngIf="availableOptions.length; else noOptionsAvailableTpl">
                  <p *ngIf="!editOptionAssignments.length" class="option-assignment-help">
                    {{
                      'menu.options.assignments.none'
                        | translate: 'No options assigned yet.'
                    }}
                  </p>
                  <div class="option-assignment-list" *ngIf="editOptionAssignments.length">
                    <div class="option-assignment-row" *ngFor="let assignment of editOptionAssignments; let i = index">
                      <select
                        [(ngModel)]="editOptionAssignments[i].optionId"
                        name="editOption-{{ item.id }}-{{ i }}"
                        [ngModelOptions]="{ standalone: true }"
                      >
                        <option [ngValue]="null">
                          {{
                            'menu.options.assignments.selectOption'
                              | translate: 'Select option'
                          }}
                        </option>
                        <option *ngFor="let option of availableOptions" [ngValue]="option.id">
                          {{ option.title }}
                        </option>
                      </select>
                      <button type="button" class="link remove" (click)="removeOptionAssignment(i)">
                        {{ 'menu.options.assignments.remove' | translate: 'Remove' }}
                      </button>
                    </div>
                  </div>
                  <button type="button" class="link add" (click)="addOptionAssignment()">
                    + {{ 'menu.options.assignments.add' | translate: 'Add option' }}
                  </button>
                </ng-container>
                <ng-template #noOptionsAvailableTpl>
                  <span class="option-assignment-help">
                    {{
                      'menu.options.assignments.noOptions'
                        | translate: 'No menu options available yet.'
                    }}
                  </span>
                </ng-template>
                <p *ngIf="assignmentError" class="error">{{ assignmentError }}</p>
              </div>
              <div class="photo-section">
                <label>{{ 'menu.photos.label' | translate: 'Item photos' }}</label>
                <div class="photo-grid" *ngIf="item.photos?.length; else noMenuItemPhotos">
                  <figure *ngFor="let photo of item.photos">
                    <img [src]="photo.url" [alt]="item.name" />
                    <button
                      type="button"
                      class="remove-photo"
                      (click)="removePhoto(item.id, photo.id)"
                      [disabled]="saving || removingPhotoId === photo.id"
                    >
                      {{
                        removingPhotoId === photo.id
                          ? ('menu.photos.removing' | translate: 'Removing…')
                          : ('menu.photos.remove' | translate: 'Remove')
                      }}
                    </button>
                  </figure>
                </div>
                <ng-template #noMenuItemPhotos>
                  <span class="photo-info">{{ 'menu.photos.empty' | translate: 'No photos yet.' }}</span>
                </ng-template>
                <div class="photo-controls">
                  <input
                    type="file"
                    #editPhotoInput
                    multiple
                    accept="image/*"
                    (change)="onPhotoSelection('edit', editPhotoInput.files); editPhotoInput.value = ''"
                    [disabled]="saving"
                  />
                  <button type="button" class="link remove" *ngIf="editPhotos.length" (click)="clearQueuedPhotos('edit')">
                    {{ 'menu.photos.clear' | translate: 'Clear selection' }}
                  </button>
                </div>
                <div class="photo-grid queued" *ngIf="editPhotos.length">
                  <figure *ngFor="let photo of editPhotos; index as i">
                    <img [src]="photo.preview" [alt]="'Selected photo ' + (i + 1)" />
                    <button
                      type="button"
                      class="remove-photo"
                      (click)="removeQueuedPhoto('edit', i)"
                      [disabled]="saving"
                    >
                      {{ 'menu.photos.removeQueued' | translate: 'Remove photo' }}
                    </button>
                  </figure>
                </div>
                <span class="photo-info" *ngIf="editPhotos.length">
                  {{
                    editPhotos.length === 1
                      ? ('menu.photos.readyOne' | translate: '1 photo ready to upload')
                      : ('menu.photos.readyMany' | translate: '{{count}} photos ready to upload': { count: editPhotos.length })
                  }}
                </span>
                <span class="photo-info">
                  {{ 'menu.photos.noteEdit' | translate: 'New photos upload when you save changes.' }}
                </span>
              </div>
              <div class="actions">
                <button type="button" class="secondary" (click)="cancelEdit()">
                  {{ 'menu.items.cancel' | translate: 'Cancel' }}
                </button>
                <button type="submit" class="primary" [disabled]="saving">
                  {{
                    saving
                      ? ('menu.form.saving' | translate: 'Saving…')
                      : ('menu.items.save' | translate: 'Save changes')
                  }}
                </button>
              </div>
            </form>
            <ng-template #viewTpl>
              <div class="item-header">
                <h4>{{ item.name }}</h4>
                <span>{{ (item.price_cents / 100) | currency:'EUR' }}</span>
              </div>
              <p *ngIf="item.description">{{ item.description }}</p>
              <div *ngIf="item.categories?.length" class="category-tags">
                <ng-container *ngFor="let category of item.categories">
                  <ng-container *ngIf="resolveCategoryName(category) as label">
                    <span class="tag">{{ label }}</span>
                  </ng-container>
                </ng-container>
              </div>
              <div *ngIf="item.allergens?.length" class="allergen-tags">
                <ng-container *ngFor="let allergen of item.allergens">
                  <ng-container *ngIf="resolveAllergenName(allergen) as allergenLabel">
                    <span class="tag">
                      <app-allergen-icon [allergen]="allergen"></app-allergen-icon>
                      <span>{{ allergenLabel }}</span>
                    </span>
                  </ng-container>
                </ng-container>
              </div>
              <div *ngIf="item.option_assignments?.length" class="option-assignment-tags">
                <span class="tag" *ngFor="let assignment of item.option_assignments">
                  {{ resolveOptionTitleById(assignment.menu_item_option_id) }}
                </span>
              </div>
              <div class="actions">
                <button type="button" class="secondary" (click)="startEdit(item)">
                  {{ 'menu.items.edit' | translate: 'Edit' }}
                </button>
                <button type="button" class="secondary" (click)="deleteItem(item.id)" [disabled]="saving">
                  {{ 'menu.items.delete' | translate: 'Delete' }}
                </button>
              </div>
            </ng-template>
          </div>
        </ng-container>
      </div>

      <ng-template #loadingTpl>
        <div>{{ 'menu.form.loading' | translate: 'Loading menu…' }}</div>
      </ng-template>
    </section>
  `,
})
export class MenuManagerComponent implements OnChanges, OnInit, OnDestroy {
  @Input({ required: true }) restaurantId!: number;
  @Output() menuChanged = new EventEmitter<void>();

  private menu = inject(MenuService);
  private i18n = inject(TranslationService);
  private categories = inject(CategoriesService);
  private allergens = inject(AllergensService);
  private options = inject(MenuOptionsService);
  private optionAssignments = inject(MenuOptionAssignmentsService);
  private aiAssistant = inject(MenuItemAiAssistantService);

  private loadToken = 0;

  private aiSuggestionTrigger = new Subject<{ name: string; description: string }>();
  private aiSuggestionSubscription: Subscription | null = null;
  private aiSuggestionRequestId = 0;
  private pendingAiSuggestions: MenuItemAiSuggestions | null = null;
  private suppressNewCategoryTracking = false;
  private suppressNewAllergenTracking = false;
  private newCategoriesManuallyEdited = false;
  private newAllergensManuallyEdited = false;

  menuItems: MenuItem[] = [];
  availableCategories: MenuItemCategory[] = [];
  availableAllergens: Allergen[] = [];
  availableOptions: MenuOption[] = [];
  loading = false;
  saving = false;
  error = '';
  creationStatus = '';
  editingId: number | null = null;
  newItem: MenuFormModel = this.createEmptyForm();
  editItem: MenuFormModel = this.createEmptyForm();
  editOptionAssignments: OptionAssignmentDraft[] = [];
  newPhotos: QueuedPhoto[] = [];
  editPhotos: QueuedPhoto[] = [];
  removingPhotoId: number | null = null;
  assignmentError = '';
  aiSuggestionStatus: 'idle' | 'loading' | 'ready' | 'applied' | 'error' = 'idle';
  aiSuggestionError = '';
  aiSuggestionPriceBand: string | null = null;

  private originalOptionAssignments: MenuOptionAssignment[] = [];

  ngOnInit() {
    this.aiSuggestionSubscription = this.aiSuggestionTrigger
      .pipe(debounceTime(600))
      .subscribe(payload => {
        void this.fetchAiSuggestions(payload);
      });
    void this.fetchCategories();
    void this.fetchAllergens();
    void this.fetchOptions();
  }

  ngOnDestroy() {
    this.releaseQueuedPhotos(this.newPhotos);
    this.releaseQueuedPhotos(this.editPhotos);
    this.aiSuggestionSubscription?.unsubscribe();
    this.aiSuggestionTrigger.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('restaurantId' in changes) {
      const currentValue = changes['restaurantId'].currentValue;
      const normalizedId = typeof currentValue === 'string' ? Number(currentValue) : currentValue;

      if (typeof normalizedId === 'number' && !Number.isNaN(normalizedId)) {
        this.restaurantId = normalizedId;
        this.resetState();
        void this.fetchCategories(normalizedId);
        void this.fetchAllergens();
        void this.fetchOptions(normalizedId);
        void this.loadMenu();
      }
    }
  }

  private async fetchCategories(restaurantId = this.restaurantId) {
    if (restaurantId === null || restaurantId === undefined) { return; }

    try {
      const categories = await firstValueFrom(this.categories.list(restaurantId));
      this.availableCategories = categories ?? [];
      this.syncCategoryList('new');
      this.syncCategoryList('edit');
      this.applyAiSuggestionsIfAllowed();
    } catch (err) {
      console.error('Could not load categories', err);
      this.availableCategories = [];
    }
  }

  private async fetchAllergens() {
    try {
      const allergens = await firstValueFrom(this.allergens.list());
      this.availableAllergens = allergens ?? [];
      this.syncAllergenList('new');
      this.syncAllergenList('edit');
      this.applyAiSuggestionsIfAllowed();
    } catch (err) {
      console.error('Could not load allergens', err);
      this.availableAllergens = [];
    }
  }

  private async fetchOptions(restaurantId = this.restaurantId) {
    if (restaurantId === null || restaurantId === undefined) { return; }

    try {
      const options = await firstValueFrom(this.options.listByRestaurant(restaurantId));
      this.availableOptions = this.sortOptions(options ?? []);
    } catch (err) {
      console.error('Could not load menu options', err);
      this.availableOptions = [];
    }
  }

  private async loadMenu(preserveExisting = false) {
    if (this.restaurantId === null || this.restaurantId === undefined) { return; }

    const token = ++this.loadToken;
    if (!preserveExisting) {
      this.loading = true;
      this.menuItems = [];
    }
    this.error = '';

    try {
      const items = await firstValueFrom(this.menu.listByRestaurant(this.restaurantId));
      if (token === this.loadToken) {
        const enriched = await this.enrichMenuItemsWithOptionAssignments(items ?? []);
        if (token === this.loadToken) {
          this.menuItems = enriched;
        }
      }
    } catch (err) {
      console.error(err);
      if (token === this.loadToken) {
        this.error = this.i18n.translate('menu.form.error.load', 'Could not load menu items. Please try again.');
      }
    } finally {
      if (token === this.loadToken) {
        this.loading = false;
      }
    }
  }

  private async enrichMenuItemsWithOptionAssignments(items: MenuItem[]): Promise<MenuItem[]> {
    if (!items.length) { return items; }

    const requiresFetch = items.some(item => item.option_assignments === undefined);
    if (!requiresFetch) { return items; }

    const enriched = await Promise.all(
      items.map(async (item) => {
        if (item.option_assignments !== undefined) {
          return item;
        }

        try {
          const assignments = await firstValueFrom(
            this.optionAssignments.list({ menu_item_id: item.id })
          );
          return { ...item, option_assignments: assignments ?? [] };
        } catch (err) {
          console.error(`Could not load option assignments for menu item ${item.id}`, err);
          return { ...item, option_assignments: [] };
        }
      })
    );

    return enriched;
  }

  startEdit(item: MenuItem) {
    this.editingId = item.id;
    this.releaseQueuedPhotos(this.editPhotos);
    this.editPhotos = [];
    this.removingPhotoId = null;
    this.editItem = {
      name: item.name,
      description: item.description ?? '',
      price: this.formatPrice(item.price_cents),
      categories: this.mapCategoriesForForm(item.categories),
      allergens: this.mapAllergensForForm(item.allergens),
    };
    this.editOptionAssignments = this.mapOptionAssignmentsForForm(item.option_assignments);
    this.originalOptionAssignments = [...(item.option_assignments ?? [])];
    this.assignmentError = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editItem = this.createEmptyForm();
    this.releaseQueuedPhotos(this.editPhotos);
    this.editPhotos = [];
    this.removingPhotoId = null;
    this.editOptionAssignments = [];
    this.originalOptionAssignments = [];
    this.assignmentError = '';
  }

  async createItem() {
    if (!this.newItem.name || !this.newItem.price) { return; }
    const price_cents = this.toCents(this.newItem.price);
    if (price_cents === null) {
      this.error = this.i18n.translate('menu.form.error.price', 'Enter a valid price (e.g. 9.99).');
      return;
    }

    this.saving = true;
    this.error = '';
    this.creationStatus = '';
    try {
      const categories = this.prepareCategories(this.newItem.categories);
      const allergenIds = this.prepareAllergenIds(this.newItem.allergens);
      const payload: MenuItemInput = {
        name: this.newItem.name,
        description: this.newItem.description || undefined,
        price_cents,
        allergen_ids: allergenIds,
      };
      if (categories) {
        payload.menu_item_categories = categories;
      }
      const created = await firstValueFrom(this.menu.create(this.restaurantId, payload));
      if (created?.id && this.newPhotos.length) {
        try {
          await this.uploadMenuItemPhotos(created.id, this.newPhotos.map(photo => photo.file));
        } catch (uploadError) {
          console.error(uploadError);
          this.error = this.i18n.translate(
            'menu.photos.error.upload',
            'Could not upload item photos. Please try again.'
          );
        }
      }
      this.releaseQueuedPhotos(this.newPhotos);
      this.newPhotos = [];
      this.newItem = this.createEmptyForm();
      this.resetAiSuggestionState();
      this.creationStatus = this.i18n.translate('menu.form.status', 'Menu item added!');
      await this.loadMenu(true);
      await this.fetchCategories();
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = this.i18n.translate('menu.form.error.create', 'Unable to add the menu item. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  async saveItem(id: number) {
    if (!this.editItem.name || !this.editItem.price) { return; }
    const price_cents = this.toCents(this.editItem.price);
    if (price_cents === null) {
      this.error = this.i18n.translate('menu.form.error.price', 'Enter a valid price (e.g. 9.99).');
      return;
    }

    this.assignmentError = '';
    const assignmentChanges = this.buildOptionAssignmentChanges();
    if (!assignmentChanges) {
      this.assignmentError = this.i18n.translate(
        'menu.options.assignments.error.select',
        'Select an option for each assignment.'
      );
      return;
    }

    this.saving = true;
    this.error = '';
    try {
      const categories = this.prepareCategories(this.editItem.categories);
      const allergenIds = this.prepareAllergenIds(this.editItem.allergens);
      const payload: MenuItemInput = {
        name: this.editItem.name,
        description: this.editItem.description || undefined,
        price_cents,
        allergen_ids: allergenIds,
      };
      if (categories) {
        payload.menu_item_categories = categories;
      }
      const updated = await firstValueFrom(this.menu.update(id, payload));
      if (updated) {
        this.mergeMenuItemUpdate(updated);
      }

      const queuedPhotos = this.editPhotos;
      const pendingPhotos = queuedPhotos.length ? queuedPhotos.map(photo => photo.file) : [];
      await this.applyOptionAssignmentChanges(id, assignmentChanges);
      this.cancelEdit();
      void this.fetchCategories();
      this.menuChanged.emit();

      if (pendingPhotos.length) {
        void this.finishPhotoUpload(id, pendingPhotos);
      } else {
        void this.loadMenu(true);
      }
    } catch (err) {
      console.error(err);
      if (!this.error) {
        this.error = this.i18n.translate('menu.form.error.update', 'Unable to save changes. Please try again.');
      }
    } finally {
      this.saving = false;
    }
  }

  async deleteItem(id: number) {
    if (!confirm(this.i18n.translate('menu.items.removeConfirm', 'Remove this menu item?'))) { return; }
    this.saving = true;
    this.error = '';
    try {
      await firstValueFrom(this.menu.delete(id));
      this.menuItems = this.menuItems.filter((item) => item.id !== id);
      void this.loadMenu(true);
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = this.i18n.translate('menu.form.error.remove', 'Unable to remove the item. Please try again.');
    } finally {
      this.saving = false;
    }
  }

  onPhotoSelection(target: 'new' | 'edit', files: FileList | null) {
    const selection = files ? Array.from(files) : [];
    if (!selection.length) { return; }
    this.error = '';
    const queued = this.createQueuedPhotos(selection);
    if (target === 'new') {
      this.newPhotos = [...this.newPhotos, ...queued];
    } else {
      this.editPhotos = [...this.editPhotos, ...queued];
    }
  }

  clearQueuedPhotos(target: 'new' | 'edit') {
    if (target === 'new') {
      this.releaseQueuedPhotos(this.newPhotos);
      this.newPhotos = [];
    } else {
      this.releaseQueuedPhotos(this.editPhotos);
      this.editPhotos = [];
    }
  }

  removeQueuedPhoto(target: 'new' | 'edit', index: number) {
    const list = target === 'new' ? this.newPhotos : this.editPhotos;
    const working = [...list];
    const [removed] = working.splice(index, 1);
    if (removed) {
      URL.revokeObjectURL(removed.preview);
    }
    if (target === 'new') {
      this.newPhotos = working;
    } else {
      this.editPhotos = working;
    }
  }

  async removePhoto(itemId: number, photoId: number) {
    this.error = '';
    this.removingPhotoId = photoId;
    const previousSaving = this.saving;
    this.saving = true;
    try {
      await firstValueFrom(this.menu.deletePhoto(itemId, photoId));
      const target = this.menuItems.find(entry => entry.id === itemId);
      if (target) {
        const photos = target.photos ?? [];
        target.photos = photos.filter(photo => photo.id !== photoId);
      }
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = this.i18n.translate('menu.photos.error.delete', 'Could not remove the photo. Please try again.');
    } finally {
      this.removingPhotoId = null;
      this.saving = previousSaving;
    }
  }

  private toCents(value: string): number | null {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const amount = Number.parseFloat(sanitized);
    if (Number.isNaN(amount)) { return null; }
    return Math.round(amount * 100);
  }

  private async uploadMenuItemPhotos(menuItemId: number, files: File[]): Promise<MenuItem | null> {
    if (!files.length) { return null; }
    return await firstValueFrom(this.menu.uploadPhotos(menuItemId, files));
  }

  private createQueuedPhotos(files: File[]): QueuedPhoto[] {
    return files.map(file => ({ file, preview: URL.createObjectURL(file) }));
  }

  private releaseQueuedPhotos(list: QueuedPhoto[]) {
    for (const photo of list) {
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    }
  }

  private mergeMenuItemUpdate(updated: MenuItem) {
    const index = this.menuItems.findIndex(item => item.id === updated.id);
    if (index === -1) { return; }

    const current = this.menuItems[index];
    this.menuItems[index] = {
      ...current,
      ...updated,
      photos: updated.photos ?? current.photos,
      allergens: updated.allergens ?? current.allergens,
      option_assignments: updated.option_assignments ?? current.option_assignments,
    };
  }

  private async finishPhotoUpload(menuItemId: number, files: File[]) {
    try {
      const uploadedItem = await this.uploadMenuItemPhotos(menuItemId, files);
      if (uploadedItem) {
        this.mergeMenuItemUpdate(uploadedItem);
      }
    } catch (uploadError) {
      console.error(uploadError);
      this.error = this.i18n.translate(
        'menu.photos.error.upload',
        'Could not upload item photos. Please try again.'
      );
    } finally {
      void this.loadMenu(true);
      this.menuChanged.emit();
    }
  }

  private formatPrice(priceCents: number): string {
    return (priceCents / 100).toFixed(2);
  }

  private resetState() {
    this.menuItems = [];
    this.loading = false;
    this.saving = false;
    this.error = '';
    this.creationStatus = '';
    this.editingId = null;
    this.newItem = this.createEmptyForm();
    this.editItem = this.createEmptyForm();
    this.availableCategories = [];
    this.availableAllergens = [];
    this.availableOptions = [];
    this.releaseQueuedPhotos(this.newPhotos);
    this.releaseQueuedPhotos(this.editPhotos);
    this.newPhotos = [];
    this.editPhotos = [];
    this.removingPhotoId = null;
    this.editOptionAssignments = [];
    this.originalOptionAssignments = [];
    this.assignmentError = '';
    this.resetAiSuggestionState();
    this.loadToken++;
  }

  onNewItemNameChange(value: string) {
    this.newItem = { ...this.newItem, name: value };
    this.onNewItemTextChanged();
  }

  onNewItemDescriptionChange(value: string) {
    this.newItem = { ...this.newItem, description: value };
    this.onNewItemTextChanged();
  }

  applyPendingAiSuggestions() {
    if (!this.pendingAiSuggestions) { return; }
    this.newCategoriesManuallyEdited = false;
    this.newAllergensManuallyEdited = false;
    this.applyAiSuggestionsIfAllowed();
  }

  retryAiSuggestions() {
    const trimmedName = this.newItem.name?.trim() ?? '';
    if (trimmedName.length < 3 || this.restaurantId == null) { return; }

    const trimmedDescription = this.newItem.description?.trim() ?? '';
    void this.fetchAiSuggestions({ name: trimmedName, description: trimmedDescription });
  }

  get canApplyAiSuggestions(): boolean {
    const suggestions = this.pendingAiSuggestions;
    if (!suggestions) { return false; }

    const needsCategoryApply = suggestions.categories.length > 0 && this.newCategoriesManuallyEdited;
    const needsAllergenApply = suggestions.allergens.length > 0 && this.newAllergensManuallyEdited;

    return needsCategoryApply || needsAllergenApply;
  }

  private onNewItemTextChanged() {
    const trimmedName = this.newItem.name?.trim() ?? '';
    const trimmedDescription = this.newItem.description?.trim() ?? '';

    if (trimmedName.length < 3) {
      this.clearAiSuggestions();
      return;
    }

    if (this.restaurantId == null) { return; }

    this.aiSuggestionTrigger.next({ name: trimmedName, description: trimmedDescription });
  }

  private async fetchAiSuggestions(input: { name: string; description: string }) {
    if (this.restaurantId == null) { return; }

    const requestId = ++this.aiSuggestionRequestId;
    this.aiSuggestionStatus = 'loading';
    this.aiSuggestionError = '';

    try {
      const suggestions = await firstValueFrom(
        this.aiAssistant.suggest(this.restaurantId, {
          name: input.name,
          description: input.description,
        })
      );

      if (this.aiSuggestionRequestId !== requestId) { return; }

      this.pendingAiSuggestions = suggestions;
      this.applyAiSuggestionsIfAllowed();
    } catch (error) {
      if (this.aiSuggestionRequestId !== requestId) { return; }
      console.error('Failed to fetch AI menu item details', error);
      this.aiSuggestionStatus = 'error';
      this.aiSuggestionError = this.i18n.translate(
        'menu.aiAssist.error',
        'Unable to suggest details right now. Please try again.'
      );
    }
  }

  private applyAiSuggestionsIfAllowed() {
    const suggestions = this.pendingAiSuggestions;

    if (!suggestions) {
      this.aiSuggestionPriceBand = null;
      if (this.aiSuggestionStatus !== 'loading') {
        this.aiSuggestionStatus = 'idle';
      }
      return;
    }

    this.aiSuggestionPriceBand = suggestions.priceBand ?? null;

    let applied = false;
    let blocked = false;

    if (suggestions.categories.length) {
      if (this.newCategoriesManuallyEdited) {
        blocked = true;
      } else {
        const result = this.setNewCategoriesFromSuggestions(suggestions.categories);
        if (result === 'applied' || result === 'unchanged') {
          applied = true;
        } else if (result === 'unavailable') {
          blocked = true;
        }
      }
    }

    if (suggestions.allergens.length) {
      if (this.newAllergensManuallyEdited) {
        blocked = true;
      } else {
        const result = this.setNewAllergensFromSuggestions(suggestions.allergens);
        if (result === 'applied' || result === 'unchanged') {
          applied = true;
        } else if (result === 'unavailable') {
          blocked = true;
        }
      }
    }

    if (applied) {
      this.aiSuggestionStatus = 'applied';
      this.aiSuggestionError = '';
    } else if (blocked) {
      this.aiSuggestionStatus = 'ready';
    } else if (suggestions.priceBand) {
      if (this.aiSuggestionStatus !== 'loading') {
        this.aiSuggestionStatus = 'idle';
      }
    } else if (this.aiSuggestionStatus !== 'loading') {
      this.aiSuggestionStatus = 'idle';
    }
  }

  private setNewCategoriesFromSuggestions(
    suggested: MenuItemAiSuggestions['categories']
  ): 'applied' | 'unchanged' | 'unavailable' {
    if (!suggested.length) { return 'unchanged'; }

    const normalized = this.normalizeSuggestedCategories(suggested);
    if (!normalized.length) { return 'unavailable'; }

    const current = this.getCategoryList('new');
    if (this.areCategoryFormsEqual(current, normalized)) {
      this.newCategoriesManuallyEdited = false;
      return 'unchanged';
    }

    this.suppressNewCategoryTracking = true;
    this.newItem = {
      ...this.newItem,
      categories: normalized,
    };
    this.suppressNewCategoryTracking = false;
    this.newCategoriesManuallyEdited = false;
    this.syncCategoryList('new');
    return 'applied';
  }

  private normalizeSuggestedCategories(
    suggested: MenuItemAiSuggestions['categories']
  ): CategoryFormModel[] {
    const seen = new Set<string>();
    const result: CategoryFormModel[] = [];

    for (const suggestion of suggested) {
      const resolved = this.resolveCategorySuggestion(suggestion);
      if (!resolved) { continue; }

      const key = `${resolved.id ?? ''}::${resolved.name.toLowerCase()}`;
      if (seen.has(key)) { continue; }
      seen.add(key);
      result.push(resolved);
    }

    return result;
  }

  private resolveCategorySuggestion(
    suggestion: MenuItemAiSuggestions['categories'][number]
  ): CategoryFormModel | null {
    if (!suggestion) { return null; }

    if (suggestion.id != null) {
      const byId = this.availableCategories.find(category => category.id === suggestion.id);
      if (byId) {
        return { id: byId.id, name: this.resolveCategoryName(byId) };
      }
    }

    const label = suggestion.name?.trim();
    if (!label) {
      return null;
    }

    const match = this.findMatchingCategory(label);
    if (match) {
      return { id: match.id, name: this.resolveCategoryName(match) };
    }

    return { name: label };
  }

  private areCategoryFormsEqual(a: CategoryFormModel[], b: CategoryFormModel[]): boolean {
    if (a.length !== b.length) { return false; }

    for (let i = 0; i < a.length; i++) {
      const left = `${a[i].id ?? ''}::${(a[i].name ?? '').toLowerCase()}`;
      const right = `${b[i].id ?? ''}::${(b[i].name ?? '').toLowerCase()}`;
      if (left !== right) {
        return false;
      }
    }

    return true;
  }

  private setNewAllergensFromSuggestions(
    suggested: MenuItemAiSuggestions['allergens']
  ): 'applied' | 'unchanged' | 'unavailable' {
    if (!suggested.length) { return 'unchanged'; }

    const normalized = this.normalizeSuggestedAllergens(suggested);
    if (!normalized.length) { return 'unavailable'; }

    const current = this.getAllergenList('new');
    if (this.areAllergenListsEqual(current, normalized)) {
      this.newAllergensManuallyEdited = false;
      return 'unchanged';
    }

    this.suppressNewAllergenTracking = true;
    this.newItem = {
      ...this.newItem,
      allergens: normalized,
    };
    this.suppressNewAllergenTracking = false;
    this.newAllergensManuallyEdited = false;
    return 'applied';
  }

  private normalizeSuggestedAllergens(
    suggested: MenuItemAiSuggestions['allergens']
  ): Allergen[] {
    const seen = new Set<number>();
    const result: Allergen[] = [];

    for (const suggestion of suggested) {
      if (!suggestion) { continue; }

      let resolved: Allergen | undefined;

      if (suggestion.id != null) {
        resolved = this.findAllergenById(suggestion.id);
      }

      if (!resolved) {
        const label = suggestion.name?.trim();
        if (!label) { continue; }
        resolved = this.availableAllergens.find(
          allergen => this.resolveAllergenName(allergen).toLowerCase() === label.toLowerCase()
        );
      }

      if (!resolved) { continue; }
      if (seen.has(resolved.id)) { continue; }
      seen.add(resolved.id);
      result.push(resolved);
    }

    return result;
  }

  private areAllergenListsEqual(a: Allergen[], b: Allergen[]): boolean {
    if (a.length !== b.length) { return false; }

    const idsA = [...a.map(item => item.id)].sort((first, second) => first - second);
    const idsB = [...b.map(item => item.id)].sort((first, second) => first - second);

    return idsA.every((id, index) => id === idsB[index]);
  }

  private markCategoryEdited(target: 'new' | 'edit') {
    if (target !== 'new' || this.suppressNewCategoryTracking) { return; }
    this.newCategoriesManuallyEdited = true;
    if (this.pendingAiSuggestions?.categories.length) {
      this.aiSuggestionStatus = 'ready';
    }
  }

  private markAllergenEdited(target: 'new' | 'edit') {
    if (target !== 'new' || this.suppressNewAllergenTracking) { return; }
    this.newAllergensManuallyEdited = true;
    if (this.pendingAiSuggestions?.allergens.length) {
      this.aiSuggestionStatus = 'ready';
    }
  }

  private clearAiSuggestions() {
    this.pendingAiSuggestions = null;
    this.aiSuggestionStatus = 'idle';
    this.aiSuggestionError = '';
    this.aiSuggestionPriceBand = null;
    this.aiSuggestionRequestId++;
  }

  private resetAiSuggestionState() {
    this.clearAiSuggestions();
    this.newCategoriesManuallyEdited = false;
    this.newAllergensManuallyEdited = false;
    this.suppressNewCategoryTracking = false;
    this.suppressNewAllergenTracking = false;
  }

  addCategory(target: 'new' | 'edit') {
    this.getCategoryList(target).push(this.createEmptyCategory());
    this.markCategoryEdited(target);
  }

  removeCategory(target: 'new' | 'edit', index: number) {
    const list = this.getCategoryList(target);
    list.splice(index, 1);
    if (!list.length) {
      list.push(this.createEmptyCategory());
    }
    this.markCategoryEdited(target);
  }

  addOptionAssignment() {
    if (!this.availableOptions.length) { return; }
    this.assignmentError = '';
    this.editOptionAssignments = [
      ...this.editOptionAssignments,
      this.createOptionAssignmentDraft(),
    ];
  }

  removeOptionAssignment(index: number) {
    const next = [...this.editOptionAssignments];
    next.splice(index, 1);
    this.editOptionAssignments = next;
    this.assignmentError = '';
  }

  resolveCategoryName(category: MenuItemCategory): string {
    if (!category) { return ''; }

    const direct = category.name?.trim();
    if (direct) { return direct; }

    const translations = category.name_translations;
    if (translations) {
      for (const value of Object.values(translations)) {
        if (value?.trim()) {
          return value.trim();
        }
      }
    }

    return '';
  }

  resolveOptionTitleById(optionId: number | null | undefined): string {
    const option = this.findOptionById(optionId);
    if (option?.title?.trim()) {
      return option.title.trim();
    }

    if (optionId == null) {
      return this.i18n.translate('menu.options.assignments.fallback', 'Option #{{id}}', {
        id: '—',
      });
    }

    return this.i18n.translate('menu.options.assignments.fallback', 'Option #{{id}}', {
      id: optionId,
    });
  }

  private createEmptyForm(): MenuFormModel {
    return { name: '', description: '', price: '', categories: [this.createEmptyCategory()], allergens: [] };
  }

  private getCategoryList(target: 'new' | 'edit') {
    return target === 'new' ? this.newItem.categories : this.editItem.categories;
  }

  private getAllergenList(target: 'new' | 'edit') {
    return target === 'new' ? this.newItem.allergens : this.editItem.allergens;
  }

  toggleAllergen(target: 'new' | 'edit', allergen: Allergen) {
    const list = this.getAllergenList(target);
    const index = list.findIndex(entry => entry.id === allergen.id);
    if (index === -1) {
      const resolved = this.findAllergenById(allergen.id) ?? allergen;
      list.push(resolved);
    } else {
      list.splice(index, 1);
    }
    this.markAllergenEdited(target);
  }

  isAllergenSelected(target: 'new' | 'edit', allergenId: number | undefined): boolean {
    if (allergenId == null) { return false; }
    return this.getAllergenList(target).some(entry => entry.id === allergenId);
  }

  private mapCategoriesForForm(categories: MenuItem['categories'] | undefined): CategoryFormModel[] {
    if (!categories || !categories.length) {
      return [this.createEmptyCategory()];
    }

    const mapped = categories
      .map(category => ({
        id: category?.id ?? undefined,
        name: this.resolveCategoryName(category as MenuItemCategory),
      }))
      .filter(category => category.name.trim().length > 0);

    return mapped.length ? mapped : [this.createEmptyCategory()];
  }

  private prepareCategories(list: CategoryFormModel[]): MenuItemInput['menu_item_categories'] {
    const sanitized = list
      .map(category => ({ id: category.id, name: category.name.trim() }))
      .filter(category => category.name.length > 0)
      .map(category =>
        category.id != null
          ? { id: category.id, name: category.name }
          : { name: category.name }
      );

    return sanitized.length ? sanitized : undefined;
  }

  private prepareAllergenIds(list: Allergen[]): number[] {
    const ids = list
      .map(allergen => allergen.id)
      .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id));

    return Array.from(new Set(ids));
  }

  private mapOptionAssignmentsForForm(assignments: MenuOptionAssignment[] | undefined): OptionAssignmentDraft[] {
    if (!assignments?.length) {
      return [];
    }

    return assignments.map(assignment =>
      this.createOptionAssignmentDraft(assignment.menu_item_option_id ?? null, assignment.id)
    );
  }

  private createOptionAssignmentDraft(optionId: number | null = null, id?: number): OptionAssignmentDraft {
    return { id, optionId };
  }

  private buildOptionAssignmentChanges(): OptionAssignmentChangeSet | null {
    const toCreate: number[] = [];
    const toUpdate: { id: number; optionId: number }[] = [];
    const seenIds = new Set<number>();

    for (const assignment of this.editOptionAssignments) {
      if (assignment.optionId == null) {
        return null;
      }

      if (assignment.id != null) {
        seenIds.add(assignment.id);
        const original = this.originalOptionAssignments.find(item => item.id === assignment.id);
        if (original && original.menu_item_option_id !== assignment.optionId) {
          toUpdate.push({ id: assignment.id, optionId: assignment.optionId });
        }
      } else {
        toCreate.push(assignment.optionId);
      }
    }

    const toDelete = this.originalOptionAssignments
      .filter(assignment => !seenIds.has(assignment.id))
      .map(assignment => assignment.id);

    return { toCreate, toUpdate, toDelete };
  }

  private async applyOptionAssignmentChanges(menuItemId: number, changes: OptionAssignmentChangeSet) {
    if (!changes.toCreate.length && !changes.toUpdate.length && !changes.toDelete.length) {
      return;
    }

    try {
      for (const id of changes.toDelete) {
        await firstValueFrom(this.optionAssignments.delete(id));
      }

      for (const update of changes.toUpdate) {
        await firstValueFrom(
          this.optionAssignments.update(update.id, {
            menu_item_id: menuItemId,
            menu_item_option_id: update.optionId,
          })
        );
      }

      for (const optionId of changes.toCreate) {
        await firstValueFrom(
          this.optionAssignments.create({
            menu_item_id: menuItemId,
            menu_item_option_id: optionId,
          })
        );
      }
    } catch (err) {
      console.error(err);
      this.error = this.i18n.translate(
        'menu.options.assignments.error.save',
        'Unable to update option assignments. Please try again.'
      );
      throw err;
    }
  }

  private findOptionById(optionId: number | null | undefined): MenuOption | undefined {
    if (optionId == null) {
      return undefined;
    }

    return this.availableOptions.find(option => option.id === optionId);
  }

  private sortOptions(options: MenuOption[]): MenuOption[] {
    return [...options].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }

  onCategoryNameChange(target: 'new' | 'edit', index: number, value: string) {
    const list = this.getCategoryList(target);
    const entry = list[index];
    if (!entry) { return; }

    entry.name = value;
    this.applyCategoryMatch(entry);
    this.markCategoryEdited(target);
  }

  private applyCategoryMatch(entry: CategoryFormModel, preserveExistingId = false) {
    const trimmed = entry.name.trim();
    if (!trimmed) {
      entry.id = undefined;
      entry.name = '';
      return;
    }

    const match = this.findMatchingCategory(trimmed);
    if (match) {
      entry.id = match.id;
      entry.name = this.resolveCategoryName(match);
    } else {
      entry.name = trimmed;
      if (!preserveExistingId) {
        entry.id = undefined;
      }
    }
  }

  private findMatchingCategory(name: string): MenuItemCategory | undefined {
    const normalized = name.trim().toLowerCase();
    if (!normalized) { return undefined; }

    return this.availableCategories.find(category => this.resolveCategoryName(category).toLowerCase() === normalized);
  }

  private syncCategoryList(target: 'new' | 'edit') {
    const list = this.getCategoryList(target);
    list.forEach(entry => {
      if (entry.name) {
        this.applyCategoryMatch(entry, true);
      }
    });
  }

  private mapAllergensForForm(allergens: MenuItem['allergens'] | undefined): Allergen[] {
    if (!allergens || !allergens.length) {
      return [];
    }

    const mapped = allergens
      .map(allergen =>
        allergen?.id != null
          ? this.findAllergenById(allergen.id) ?? { id: allergen.id, name: this.resolveAllergenName(allergen as Allergen) }
          : undefined
      )
      .filter((entry): entry is Allergen => !!entry && entry.id != null);

    return this.dedupeAllergens(mapped);
  }

  private syncAllergenList(target: 'new' | 'edit') {
    const list = this.getAllergenList(target);
    if (!list.length) { return; }

    const synced = this.dedupeAllergens(
      list
        .map(entry => (entry?.id != null ? this.findAllergenById(entry.id) ?? entry : entry))
        .filter((entry): entry is Allergen => !!entry && entry.id != null)
    );

    list.length = 0;
    list.push(...synced);
  }

  resolveAllergenName(allergen: Allergen | undefined): string {
    if (!allergen) { return ''; }

    const direct = allergen.name?.trim();
    if (direct) { return direct; }

    const translations = allergen.name_translations;
    if (translations) {
      for (const value of Object.values(translations)) {
        if (value?.trim()) {
          return value.trim();
        }
      }
    }

    return '';
  }

  private findAllergenById(id: number | undefined): Allergen | undefined {
    if (id == null) { return undefined; }
    return this.availableAllergens.find(allergen => allergen.id === id);
  }

  private dedupeAllergens(list: Allergen[]): Allergen[] {
    const seen = new Set<number>();
    const deduped: Allergen[] = [];

    for (const allergen of list) {
      if (allergen?.id == null || seen.has(allergen.id)) { continue; }
      seen.add(allergen.id);
      deduped.push(this.findAllergenById(allergen.id) ?? allergen);
    }

    return deduped;
  }

  private createEmptyCategory(): CategoryFormModel {
    return { id: undefined, name: '' };
  }
}
