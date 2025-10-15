import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuItem } from '../core/models';
import { MenuService } from './menu.service';

interface MenuFormModel {
  name: string;
  description: string;
  price: string;
}

@Component({
  standalone: true,
  selector: 'app-menu-manager',
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe],
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
        <h3>Manage menu</h3>
        <p class="description">Add new dishes or update existing ones in just a few clicks.</p>
      </div>

      <form (ngSubmit)="createItem()">
        <div>
          <label for="new-name">Item name</label>
          <input id="new-name" [(ngModel)]="newItem.name" name="newName" required placeholder="e.g. Spicy Tuna Roll" />
        </div>
        <div>
          <label for="new-description">Description</label>
          <textarea id="new-description" [(ngModel)]="newItem.description" name="newDescription" placeholder="Optional description" ></textarea>
        </div>
        <div>
          <label for="new-price">Price (EUR)</label>
          <input id="new-price" [(ngModel)]="newItem.price" name="newPrice" inputmode="decimal" required placeholder="9.50" />
        </div>
        <div class="actions">
          <span *ngIf="creationStatus" class="status">{{ creationStatus }}</span>
          <button type="submit" class="primary" [disabled]="saving">{{ saving ? 'Saving…' : 'Add item' }}</button>
        </div>
      </form>

      <div *ngIf="error" class="error">{{ error }}</div>

      <div class="menu-items" *ngIf="!loading; else loadingTpl">
        <div *ngIf="!menuItems.length" class="empty-state">No menu items yet. Start by adding your first dish.</div>

        <ng-container *ngFor="let item of menuItems">
          <div class="item-card">
            <form *ngIf="editingId === item.id; else viewTpl" (ngSubmit)="saveItem(item.id)">
              <div>
                <label>Name</label>
                <input [(ngModel)]="editItem.name" name="editName-{{ item.id }}" required />
              </div>
              <div>
                <label>Description</label>
                <textarea [(ngModel)]="editItem.description" name="editDescription-{{ item.id }}"></textarea>
              </div>
              <div>
                <label>Price (EUR)</label>
                <input [(ngModel)]="editItem.price" name="editPrice-{{ item.id }}" inputmode="decimal" required />
              </div>
              <div class="actions">
                <button type="button" class="secondary" (click)="cancelEdit()">Cancel</button>
                <button type="submit" class="primary" [disabled]="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
              </div>
            </form>
            <ng-template #viewTpl>
              <div class="item-header">
                <h4>{{ item.name }}</h4>
                <span>{{ (item.price_cents / 100) | currency:'EUR' }}</span>
              </div>
              <p *ngIf="item.description">{{ item.description }}</p>
              <div class="actions">
                <button type="button" class="secondary" (click)="startEdit(item)">Edit</button>
                <button type="button" class="secondary" (click)="deleteItem(item.id)" [disabled]="saving">Delete</button>
              </div>
            </ng-template>
          </div>
        </ng-container>
      </div>

      <ng-template #loadingTpl>
        <div>Loading menu…</div>
      </ng-template>
    </section>
  `,
})
export class MenuManagerComponent implements OnInit {
  @Input({ required: true }) restaurantId!: number;
  @Output() menuChanged = new EventEmitter<void>();

  private menu = inject(MenuService);

  menuItems: MenuItem[] = [];
  loading = false;
  saving = false;
  error = '';
  creationStatus = '';
  editingId: number | null = null;
  newItem: MenuFormModel = { name: '', description: '', price: '' };
  editItem: MenuFormModel = { name: '', description: '', price: '' };

  ngOnInit() {
    this.loadMenu();
  }

  async loadMenu() {
    if (!this.restaurantId) { return; }
    this.loading = true;
    this.error = '';
    try {
      this.menuItems = await firstValueFrom(this.menu.listByRestaurant(this.restaurantId));
    } catch (err) {
      console.error(err);
      this.error = 'Could not load menu items. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  startEdit(item: MenuItem) {
    this.editingId = item.id;
    this.editItem = {
      name: item.name,
      description: item.description ?? '',
      price: this.formatPrice(item.price_cents),
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editItem = { name: '', description: '', price: '' };
  }

  async createItem() {
    if (!this.newItem.name || !this.newItem.price) { return; }
    const price_cents = this.toCents(this.newItem.price);
    if (price_cents === null) {
      this.error = 'Enter a valid price (e.g. 9.99).';
      return;
    }

    this.saving = true;
    this.error = '';
    this.creationStatus = '';
    try {
      await firstValueFrom(this.menu.create(this.restaurantId, {
        name: this.newItem.name,
        description: this.newItem.description || undefined,
        price_cents,
      }));
      this.newItem = { name: '', description: '', price: '' };
      this.creationStatus = 'Menu item added!';
      await this.loadMenu();
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = 'Unable to add the menu item. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  async saveItem(id: number) {
    if (!this.editItem.name || !this.editItem.price) { return; }
    const price_cents = this.toCents(this.editItem.price);
    if (price_cents === null) {
      this.error = 'Enter a valid price (e.g. 9.99).';
      return;
    }

    this.saving = true;
    this.error = '';
    try {
      await firstValueFrom(this.menu.update(id, {
        name: this.editItem.name,
        description: this.editItem.description || undefined,
        price_cents,
      }));
      this.cancelEdit();
      await this.loadMenu();
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = 'Unable to save changes. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  async deleteItem(id: number) {
    if (!confirm('Remove this menu item?')) { return; }
    this.saving = true;
    this.error = '';
    try {
      await firstValueFrom(this.menu.delete(id));
      await this.loadMenu();
      this.menuChanged.emit();
    } catch (err) {
      console.error(err);
      this.error = 'Unable to remove the item. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  private toCents(value: string): number | null {
    const sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const amount = Number.parseFloat(sanitized);
    if (Number.isNaN(amount)) { return null; }
    return Math.round(amount * 100);
  }

  private formatPrice(priceCents: number): string {
    return (priceCents / 100).toFixed(2);
  }
}
