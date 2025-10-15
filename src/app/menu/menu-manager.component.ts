import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuItem, MenuItemCategory, MenuItemInput } from '../core/models';
import { MenuService } from './menu.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { CategoriesService } from './categories.service';

interface CategoryFormModel {
  id?: number;
  name: string;
}

interface MenuFormModel {
  name: string;
  description: string;
  price: string;
  categories: CategoryFormModel[];
}

@Component({
  standalone: true,
  selector: 'app-menu-manager',
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
      background: rgba(6, 193, 103, 0.12);
      color: #036239;
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 600;
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
            name="newDescription"
            [attr.placeholder]="'menu.form.descriptionPlaceholder' | translate: 'Optional description'"
          ></textarea>
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
export class MenuManagerComponent implements OnChanges, OnInit {
  @Input({ required: true }) restaurantId!: number;
  @Output() menuChanged = new EventEmitter<void>();

  private menu = inject(MenuService);
  private i18n = inject(TranslationService);
  private categories = inject(CategoriesService);

  private loadToken = 0;

  menuItems: MenuItem[] = [];
  availableCategories: MenuItemCategory[] = [];
  loading = false;
  saving = false;
  error = '';
  creationStatus = '';
  editingId: number | null = null;
  newItem: MenuFormModel = this.createEmptyForm();
  editItem: MenuFormModel = this.createEmptyForm();
  newPhotos: File[] = [];
  editPhotos: File[] = [];
  removingPhotoId: number | null = null;

  ngOnInit() {
    void this.fetchCategories();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('restaurantId' in changes) {
      const id = changes['restaurantId'].currentValue;
      if (typeof id === 'number' && !Number.isNaN(id)) {
        this.resetState();
        void this.fetchCategories(id);
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
    } catch (err) {
      console.error('Could not load categories', err);
      this.availableCategories = [];
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
        this.menuItems = items;
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

  startEdit(item: MenuItem) {
    this.editingId = item.id;
    this.editPhotos = [];
    this.removingPhotoId = null;
    this.editItem = {
      name: item.name,
      description: item.description ?? '',
      price: this.formatPrice(item.price_cents),
      categories: this.mapCategoriesForForm(item.categories),
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editItem = this.createEmptyForm();
    this.editPhotos = [];
    this.removingPhotoId = null;
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
      const created = await firstValueFrom(this.menu.create(this.restaurantId, {
        name: this.newItem.name,
        description: this.newItem.description || undefined,
        price_cents,
        ...(categories ? { menu_item_categories: categories } : {}),
      }));
      if (created?.id && this.newPhotos.length) {
        try {
          await this.uploadMenuItemPhotos(created.id, this.newPhotos);
        } catch (uploadError) {
          console.error(uploadError);
          this.error = this.i18n.translate(
            'menu.photos.error.upload',
            'Could not upload item photos. Please try again.'
          );
        }
      }
      this.newPhotos = [];
      this.newItem = this.createEmptyForm();
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

    this.saving = true;
    this.error = '';
    try {
      const categories = this.prepareCategories(this.editItem.categories);
      await firstValueFrom(this.menu.update(id, {
        name: this.editItem.name,
        description: this.editItem.description || undefined,
        price_cents,
        ...(categories ? { menu_item_categories: categories } : {}),
      }));
      let uploadedItem: MenuItem | null = null;
      if (this.editPhotos.length) {
        try {
          uploadedItem = await this.uploadMenuItemPhotos(id, this.editPhotos);
        } catch (uploadError) {
          console.error(uploadError);
          this.error = this.i18n.translate(
            'menu.photos.error.upload',
            'Could not upload item photos. Please try again.'
          );
        }
      }
      this.editPhotos = [];
      if (uploadedItem) {
        this.mergeMenuItemUpdate(uploadedItem);
      }
      this.cancelEdit();
      void this.loadMenu(true);
      void this.fetchCategories();
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = this.i18n.translate('menu.form.error.update', 'Unable to save changes. Please try again.');
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
    if (target === 'new') {
      this.newPhotos = [...this.newPhotos, ...selection];
    } else {
      this.editPhotos = [...this.editPhotos, ...selection];
    }
  }

  clearQueuedPhotos(target: 'new' | 'edit') {
    if (target === 'new') {
      this.newPhotos = [];
    } else {
      this.editPhotos = [];
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

  private mergeMenuItemUpdate(updated: MenuItem) {
    const index = this.menuItems.findIndex(item => item.id === updated.id);
    if (index === -1) { return; }

    const current = this.menuItems[index];
    this.menuItems[index] = {
      ...current,
      ...updated,
      photos: updated.photos ?? current.photos,
    };
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
    this.newPhotos = [];
    this.editPhotos = [];
    this.removingPhotoId = null;
    this.loadToken++;
  }

  addCategory(target: 'new' | 'edit') {
    this.getCategoryList(target).push(this.createEmptyCategory());
  }

  removeCategory(target: 'new' | 'edit', index: number) {
    const list = this.getCategoryList(target);
    list.splice(index, 1);
    if (!list.length) {
      list.push(this.createEmptyCategory());
    }
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

  private createEmptyForm(): MenuFormModel {
    return { name: '', description: '', price: '', categories: [this.createEmptyCategory()] };
  }

  private getCategoryList(target: 'new' | 'edit') {
    return target === 'new' ? this.newItem.categories : this.editItem.categories;
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

  onCategoryNameChange(target: 'new' | 'edit', index: number, value: string) {
    const list = this.getCategoryList(target);
    const entry = list[index];
    if (!entry) { return; }

    entry.name = value;
    this.applyCategoryMatch(entry);
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

  private createEmptyCategory(): CategoryFormModel {
    return { id: undefined, name: '' };
  }
}
