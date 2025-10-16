import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  MenuItem,
  MenuItemDiscount,
  MenuItemDiscountAssignment,
  MenuItemDiscountInput,
} from '../core/models';
import { TranslationService } from '../core/translation.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { MenuService } from './menu.service';
import { MenuDiscountsService } from './menu-discounts.service';
import { MenuDiscountAssignmentsService } from './menu-discount-assignments.service';

interface DiscountFormModel {
  discount_type: string;
  amount: string;
  percentage_value: string;
  duration_type: string;
  applies_to: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  start_at: string;
  end_at: string;
  active: boolean;
  menu_item_ids: number[];
}

interface AssignmentFormModel {
  menu_item_id: number | null;
  menu_item_discount_id: number | null;
}

@Component({
  standalone: true,
  selector: 'app-menu-discount-manager',
  imports: [DecimalPipe, FormsModule, NgFor, NgIf, TranslatePipe],
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
      gap: 1.5rem;
      margin-top: 2.5rem;
    }

    h3 {
      margin: 0;
      font-size: 1.35rem;
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
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .label {
      font-weight: 600;
      font-size: 0.95rem;
      display: block;
      margin-bottom: 0.4rem;
    }

    input,
    select,
    textarea {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      border: 1px solid var(--border-soft);
      background: var(--surface-elevated);
      font: inherit;
    }

    textarea {
      min-height: 72px;
      resize: vertical;
    }

    .checkbox-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .checkbox-list label {
      flex-direction: row;
      align-items: center;
      gap: 0.35rem;
      font-weight: 500;
      border: 1px solid var(--border-soft);
      padding: 0.45rem 0.65rem;
      border-radius: 999px;
      background: var(--surface-elevated);
      cursor: pointer;
    }

    .checkbox-list input[type='checkbox'] {
      width: auto;
      accent-color: var(--brand-green);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      justify-content: flex-end;
      margin-top: 0.35rem;
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

    .status {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--brand-green);
      margin-right: auto;
    }

    .status.error {
      color: #d14343;
    }

    .loading {
      color: var(--text-secondary);
      font-style: italic;
    }

    .discount-list,
    .assignment-list {
      display: grid;
      gap: 1rem;
    }

    .discount-card,
    .assignment-card {
      background: var(--surface-elevated);
      border-radius: var(--radius-card);
      border: 1px solid rgba(10, 10, 10, 0.05);
      padding: 1.1rem 1.25rem;
      display: grid;
      gap: 0.65rem;
    }

    .discount-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .discount-meta,
    .assignment-meta {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    .assignment-form {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .assignment-form select {
      flex: 1 1 180px;
    }

    @media (max-width: 640px) {
      .manager-card {
        margin-top: 2rem;
        padding: 1.5rem;
      }

      .assignment-form {
        flex-direction: column;
        align-items: stretch;
      }

      .actions {
        justify-content: stretch;
      }
    }
  `],
  template: `
    <section class="manager-card">
      <div>
        <h3>{{ 'menu.discounts.heading' | translate: 'Manage discounts' }}</h3>
        <p class="description">
          {{
            'menu.discounts.description'
              | translate: 'Create promotions and link them to your dishes.'
          }}
        </p>
      </div>

      <p *ngIf="loading" class="loading">
        {{ 'menu.discounts.loading' | translate: 'Loading discount data…' }}
      </p>

      <p *ngIf="!loading && loadError" class="status error">{{ loadError }}</p>

      <ng-container *ngIf="!loading">
        <form (ngSubmit)="createDiscount()" class="discount-form">
          <h4>{{ 'menu.discounts.create.title' | translate: 'Create a new discount' }}</h4>

          <label>
            {{ 'menu.discounts.form.discountType' | translate: 'Discount type' }}
            <input [(ngModel)]="newDiscount.discount_type" name="newDiscountType" required />
          </label>

          <label>
            {{ 'menu.discounts.form.appliesTo' | translate: 'Applies to' }}
            <input [(ngModel)]="newDiscount.applies_to" name="newAppliesTo" />
          </label>

          <label>
            {{ 'menu.discounts.form.durationType' | translate: 'Duration type' }}
            <input [(ngModel)]="newDiscount.duration_type" name="newDurationType" />
          </label>

          <label>
            {{ 'menu.discounts.form.amount' | translate: 'Amount (EUR)' }}
            <input
              [(ngModel)]="newDiscount.amount"
              name="newAmount"
              inputmode="decimal"
              [attr.placeholder]="'menu.discounts.form.amountPlaceholder' | translate: 'e.g. 5.00'"
            />
          </label>

          <label>
            {{ 'menu.discounts.form.percentage' | translate: 'Percentage' }}
            <input
              [(ngModel)]="newDiscount.percentage_value"
              name="newPercentage"
              inputmode="decimal"
              [attr.placeholder]="'menu.discounts.form.percentagePlaceholder' | translate: 'e.g. 10'"
            />
          </label>

          <label>
            {{ 'menu.discounts.form.dayOfWeek' | translate: 'Day of week' }}
            <input [(ngModel)]="newDiscount.day_of_week" name="newDayOfWeek" />
          </label>

          <label>
            {{ 'menu.discounts.form.startTime' | translate: 'Start time' }}
            <input [(ngModel)]="newDiscount.start_time" name="newStartTime" />
          </label>

          <label>
            {{ 'menu.discounts.form.endTime' | translate: 'End time' }}
            <input [(ngModel)]="newDiscount.end_time" name="newEndTime" />
          </label>

          <label>
            {{ 'menu.discounts.form.startAt' | translate: 'Start date & time' }}
            <input [(ngModel)]="newDiscount.start_at" name="newStartAt" />
          </label>

          <label>
            {{ 'menu.discounts.form.endAt' | translate: 'End date & time' }}
            <input [(ngModel)]="newDiscount.end_at" name="newEndAt" />
          </label>

          <label>
            {{ 'menu.discounts.form.active' | translate: 'Active' }}
            <select [(ngModel)]="newDiscount.active" name="newActive">
              <option [ngValue]="true">{{ 'menu.discounts.active.true' | translate: 'Active' }}</option>
              <option [ngValue]="false">{{ 'menu.discounts.active.false' | translate: 'Inactive' }}</option>
            </select>
          </label>

          <div>
            <span class="label">{{ 'menu.discounts.form.menuItems' | translate: 'Applies to menu items' }}</span>
            <div class="checkbox-list">
              <label *ngFor="let item of menuItems">
                <input
                  type="checkbox"
                  [checked]="newDiscount.menu_item_ids.includes(item.id)"
                  (change)="toggleMenuItem(newDiscount, item.id, $event.target.checked)"
                />
                {{ item.name }}
              </label>
            </div>
          </div>

          <div class="actions">
            <span *ngIf="discountStatus" class="status">{{ discountStatus }}</span>
            <span *ngIf="discountError" class="status error">{{ discountError }}</span>
            <button type="submit" class="primary" [disabled]="savingDiscount">
              {{
                savingDiscount
                  ? ('menu.discounts.form.saving' | translate: 'Saving…')
                  : ('menu.discounts.form.create' | translate: 'Create discount')
              }}
            </button>
          </div>
        </form>

        <div class="discount-list">
          <h4>{{ 'menu.discounts.current.title' | translate: 'Current discounts' }}</h4>
          <p *ngIf="!restaurantDiscounts.length" class="empty-state">
            {{ 'menu.discounts.empty' | translate: 'No discounts yet. Add one above to get started.' }}
          </p>

          <ng-container *ngFor="let discount of restaurantDiscounts">
            <div class="discount-card">
              <form
                *ngIf="editingDiscountId === discount.id && editDiscountForm; else viewDiscount"
                (ngSubmit)="saveDiscount(discount.id)"
              >
                <label>
                  {{ 'menu.discounts.form.discountType' | translate: 'Discount type' }}
                  <input [(ngModel)]="editDiscountForm.discount_type" name="editType-{{ discount.id }}" required />
                </label>

                <label>
                  {{ 'menu.discounts.form.appliesTo' | translate: 'Applies to' }}
                  <input [(ngModel)]="editDiscountForm.applies_to" name="editAppliesTo-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.durationType' | translate: 'Duration type' }}
                  <input [(ngModel)]="editDiscountForm.duration_type" name="editDuration-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.amount' | translate: 'Amount (EUR)' }}
                  <input
                    [(ngModel)]="editDiscountForm.amount"
                    name="editAmount-{{ discount.id }}"
                    inputmode="decimal"
                  />
                </label>

                <label>
                  {{ 'menu.discounts.form.percentage' | translate: 'Percentage' }}
                  <input
                    [(ngModel)]="editDiscountForm.percentage_value"
                    name="editPercentage-{{ discount.id }}"
                    inputmode="decimal"
                  />
                </label>

                <label>
                  {{ 'menu.discounts.form.dayOfWeek' | translate: 'Day of week' }}
                  <input [(ngModel)]="editDiscountForm.day_of_week" name="editDayOfWeek-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.startTime' | translate: 'Start time' }}
                  <input [(ngModel)]="editDiscountForm.start_time" name="editStartTime-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.endTime' | translate: 'End time' }}
                  <input [(ngModel)]="editDiscountForm.end_time" name="editEndTime-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.startAt' | translate: 'Start date & time' }}
                  <input [(ngModel)]="editDiscountForm.start_at" name="editStartAt-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.endAt' | translate: 'End date & time' }}
                  <input [(ngModel)]="editDiscountForm.end_at" name="editEndAt-{{ discount.id }}" />
                </label>

                <label>
                  {{ 'menu.discounts.form.active' | translate: 'Active' }}
                  <select [(ngModel)]="editDiscountForm.active" name="editActive-{{ discount.id }}">
                    <option [ngValue]="true">{{ 'menu.discounts.active.true' | translate: 'Active' }}</option>
                    <option [ngValue]="false">{{ 'menu.discounts.active.false' | translate: 'Inactive' }}</option>
                  </select>
                </label>

                <div>
                  <span class="label">{{ 'menu.discounts.form.menuItems' | translate: 'Applies to menu items' }}</span>
                  <div class="checkbox-list">
                    <label *ngFor="let item of menuItems">
                      <input
                        type="checkbox"
                        [checked]="editDiscountForm.menu_item_ids.includes(item.id)"
                        (change)="toggleMenuItem(editDiscountForm!, item.id, $event.target.checked)"
                      />
                      {{ item.name }}
                    </label>
                  </div>
                </div>

                <div class="actions">
                  <span *ngIf="discountStatus" class="status">{{ discountStatus }}</span>
                  <span *ngIf="discountError" class="status error">{{ discountError }}</span>
                  <button type="button" class="secondary" (click)="cancelDiscountEdit()">
                    {{ 'menu.items.cancel' | translate: 'Cancel' }}
                  </button>
                  <button type="submit" class="primary" [disabled]="savingDiscount">
                    {{
                      savingDiscount
                        ? ('menu.discounts.form.saving' | translate: 'Saving…')
                        : ('menu.discounts.form.update' | translate: 'Update discount')
                    }}
                  </button>
                </div>
              </form>

              <ng-template #viewDiscount>
                <div class="discount-header">
                  <div>
                    <h5>#{{ discount.id }}</h5>
                    <div class="discount-meta">
                      {{ discount.discount_type }} ·
                      <span *ngIf="discount.amount_cents != null">
                        {{ discount.amount_cents / 100 | number:'1.2-2' }} €
                      </span>
                      <span *ngIf="discount.percentage_value != null">
                        {{ discount.percentage_value }}%
                      </span>
                      <span *ngIf="discount.active === false">
                        · {{ 'menu.discounts.state.inactive' | translate: 'Inactive' }}
                      </span>
                    </div>
                    <div class="discount-meta" *ngIf="discount.menu_items.length">
                      {{ 'menu.discounts.assignedTo' | translate: 'Assigned to:' }}
                      {{ formatMenuItemNames(discount) }}
                    </div>
                  </div>

                  <div class="actions">
                    <button type="button" class="secondary" (click)="startDiscountEdit(discount)">
                      {{ 'menu.items.edit' | translate: 'Edit' }}
                    </button>
                    <button type="button" class="secondary" (click)="deleteDiscount(discount)">
                      {{ 'menu.items.delete' | translate: 'Delete' }}
                    </button>
                  </div>
                </div>
              </ng-template>
            </div>
          </ng-container>
        </div>

        <div class="assignment-section">
          <h4>{{ 'menu.discounts.assignments.title' | translate: 'Assignments' }}</h4>
          <p class="description">
            {{
              'menu.discounts.assignments.description'
                | translate: 'Link discounts to menu items or adjust existing connections.'
            }}
          </p>

          <form class="assignment-form" (ngSubmit)="createAssignment()">
            <select [(ngModel)]="newAssignment.menu_item_id" name="newAssignmentItem" required>
              <option [ngValue]="null">{{ 'menu.discounts.assignments.selectItem' | translate: 'Choose menu item' }}</option>
              <option *ngFor="let item of menuItems" [ngValue]="item.id">{{ item.name }}</option>
            </select>

            <select [(ngModel)]="newAssignment.menu_item_discount_id" name="newAssignmentDiscount" required>
              <option [ngValue]="null">
                {{ 'menu.discounts.assignments.selectDiscount' | translate: 'Choose discount' }}
              </option>
              <option *ngFor="let discount of discounts" [ngValue]="discount.id">
                #{{ discount.id }} · {{ discount.discount_type }}
              </option>
            </select>

            <div class="actions">
              <span *ngIf="assignmentStatus" class="status">{{ assignmentStatus }}</span>
              <span *ngIf="assignmentError" class="status error">{{ assignmentError }}</span>
              <button type="submit" class="primary" [disabled]="savingAssignment">
                {{
                  savingAssignment
                    ? ('menu.discounts.assignments.saving' | translate: 'Saving…')
                    : ('menu.discounts.assignments.create' | translate: 'Assign discount')
                }}
              </button>
            </div>
          </form>

          <div class="assignment-list">
            <p *ngIf="!assignments.length" class="empty-state">
              {{ 'menu.discounts.assignments.empty' | translate: 'No assignments yet.' }}
            </p>

            <ng-container *ngFor="let assignment of assignments">
              <div class="assignment-card">
                <form
                  *ngIf="editingAssignmentId === assignment.id && editAssignmentForm; else viewAssignment"
                  (ngSubmit)="saveAssignment(assignment.id)"
                >
                  <select [(ngModel)]="editAssignmentForm.menu_item_id" name="editAssignmentItem-{{ assignment.id }}" required>
                    <option *ngFor="let item of menuItems" [ngValue]="item.id">{{ item.name }}</option>
                  </select>

                  <select
                    [(ngModel)]="editAssignmentForm.menu_item_discount_id"
                    name="editAssignmentDiscount-{{ assignment.id }}"
                    required
                  >
                    <option *ngFor="let discount of discounts" [ngValue]="discount.id">
                      #{{ discount.id }} · {{ discount.discount_type }}
                    </option>
                  </select>

                  <div class="actions">
                    <span *ngIf="assignmentStatus" class="status">{{ assignmentStatus }}</span>
                    <span *ngIf="assignmentError" class="status error">{{ assignmentError }}</span>
                    <button type="button" class="secondary" (click)="cancelAssignmentEdit()">
                      {{ 'menu.items.cancel' | translate: 'Cancel' }}
                    </button>
                    <button type="submit" class="primary" [disabled]="savingAssignment">
                      {{
                        savingAssignment
                          ? ('menu.discounts.assignments.saving' | translate: 'Saving…')
                          : ('menu.discounts.assignments.update' | translate: 'Update assignment')
                      }}
                    </button>
                  </div>
                </form>

                <ng-template #viewAssignment>
                  <div class="assignment-meta">
                    {{ assignment.menu_item.name }} →
                    {{ 'menu.discounts.assignments.discountLabel' | translate: 'Discount' }}
                    #{{ assignment.menu_item_discount_id }}
                    ({{ assignment.menu_item_discount.discount_type }})
                  </div>

                  <div class="actions">
                    <button type="button" class="secondary" (click)="startAssignmentEdit(assignment)">
                      {{ 'menu.items.edit' | translate: 'Edit' }}
                    </button>
                    <button type="button" class="secondary" (click)="deleteAssignment(assignment)">
                      {{ 'menu.items.delete' | translate: 'Delete' }}
                    </button>
                  </div>
                </ng-template>
              </div>
            </ng-container>
          </div>
        </div>
      </ng-container>
    </section>
  `,
})
export class MenuDiscountManagerComponent implements OnDestroy {
  private restaurantIdValue: number | null = null;

  private menu = inject(MenuService);
  private discountsApi = inject(MenuDiscountsService);
  private assignmentsApi = inject(MenuDiscountAssignmentsService);
  private i18n = inject(TranslationService);

  loading = false;
  menuItems: MenuItem[] = [];
  discounts: MenuItemDiscount[] = [];
  assignments: MenuItemDiscountAssignment[] = [];
  private initialRequestToken = 0;
  private refreshRequestToken = 0;

  newDiscount: DiscountFormModel = this.createEmptyDiscountForm();
  editingDiscountId: number | null = null;
  editDiscountForm: DiscountFormModel | null = null;

  newAssignment: AssignmentFormModel = this.createEmptyAssignmentForm();
  editingAssignmentId: number | null = null;
  editAssignmentForm: AssignmentFormModel | null = null;

  discountStatus = '';
  discountError = '';
  assignmentStatus = '';
  assignmentError = '';
  savingDiscount = false;
  savingAssignment = false;
  loadError = '';

  @Input()
  set restaurantId(value: number | string | null) {
    const nextValue = this.parseNumber(value);

    if (nextValue === this.restaurantIdValue) {
      return;
    }

    this.restaurantIdValue = nextValue;

    if (this.restaurantIdValue === null) {
      this.cancelPendingRequests();
      this.resetState();
      return;
    }

    this.cancelPendingRequests();
    const restaurantId = this.restaurantIdValue;
    if (restaurantId !== null) {
      void this.initialize(restaurantId);
    }
  }

  get restaurantId(): number | null {
    return this.restaurantIdValue;
  }

  ngOnDestroy() {
    this.cancelPendingRequests();
  }

  get restaurantDiscounts(): MenuItemDiscount[] {
    const restaurantId = this.restaurantIdValue;
    if (restaurantId === null) {
      return [];
    }

    const menuItems = this.menuItems;

    return this.discounts.filter(discount => {
      if (discount.menu_items.some(item => item.restaurant_id === restaurantId)) {
        return true;
      }

      if (!discount.menu_item_ids.length) {
        return false;
      }

      return discount.menu_item_ids.some(id =>
        menuItems.some(item => item.id === id && item.restaurant_id === restaurantId)
      );
    });
  }

  async createDiscount() {
    if (this.restaurantIdValue === null) { return; }
    this.discountStatus = '';
    this.discountError = '';

    const validationError = this.validateDiscountForm(this.newDiscount);
    if (validationError) {
      this.discountError = validationError;
      return;
    }

    const payload = this.toDiscountPayload(this.newDiscount);
    if (payload === null) {
      return;
    }

    this.savingDiscount = true;
    try {
      const created = await firstValueFrom(this.discountsApi.create(payload));
      this.upsertDiscount(created);
      this.newDiscount = this.createEmptyDiscountForm();
      this.discountStatus = this.i18n.translate(
        'menu.discounts.form.statusCreated',
        'Discount created.'
      );
      await this.reloadDiscountsAndAssignments('discount');
    } catch (error) {
      console.error(error);
      this.discountError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.error.save',
          'Unable to save the discount. Please try again.'
        );
    } finally {
      this.savingDiscount = false;
    }
  }

  startDiscountEdit(discount: MenuItemDiscount) {
    this.discountStatus = '';
    this.discountError = '';
    this.editingDiscountId = discount.id;
    this.editDiscountForm = this.mapDiscountToForm(discount);
  }

  cancelDiscountEdit() {
    this.editingDiscountId = null;
    this.editDiscountForm = null;
    this.discountStatus = '';
    this.discountError = '';
  }

  async saveDiscount(id: number) {
    if (!this.editDiscountForm) { return; }

    this.discountStatus = '';
    this.discountError = '';

    const validationError = this.validateDiscountForm(this.editDiscountForm);
    if (validationError) {
      this.discountError = validationError;
      return;
    }

    const payload = this.toDiscountPayload(this.editDiscountForm);
    if (payload === null) {
      return;
    }

    this.savingDiscount = true;
    try {
      const updated = await firstValueFrom(this.discountsApi.update(id, payload));
      this.upsertDiscount(updated);
      this.discountStatus = this.i18n.translate(
        'menu.discounts.form.statusUpdated',
        'Discount updated.'
      );
      this.cancelDiscountEdit();
      await this.reloadDiscountsAndAssignments('discount');
    } catch (error) {
      console.error(error);
      this.discountError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.error.save',
          'Unable to save the discount. Please try again.'
        );
    } finally {
      this.savingDiscount = false;
    }
  }

  async deleteDiscount(discount: MenuItemDiscount) {
    if (!confirm(this.i18n.translate('menu.discounts.deleteConfirm', 'Delete this discount?'))) {
      return;
    }

    this.discountStatus = '';
    this.discountError = '';
    this.savingDiscount = true;

    try {
      await firstValueFrom(this.discountsApi.delete(discount.id));
      this.discountStatus = this.i18n.translate(
        'menu.discounts.form.statusDeleted',
        'Discount removed.'
      );
      this.removeDiscountLocally(discount.id);
      await this.reloadDiscountsAndAssignments('discount');
    } catch (error) {
      console.error(error);
      this.discountError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.error.delete',
          'Unable to delete the discount. Please try again.'
        );
    } finally {
      this.savingDiscount = false;
    }
  }

  toggleMenuItem(form: DiscountFormModel, id: number, checked: boolean) {
    const current = new Set(form.menu_item_ids);
    if (checked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    form.menu_item_ids = Array.from(current);
  }

  async createAssignment() {
    if (this.restaurantIdValue === null) { return; }

    this.assignmentStatus = '';
    this.assignmentError = '';

    if (!this.newAssignment.menu_item_id || !this.newAssignment.menu_item_discount_id) {
      this.assignmentError = this.i18n.translate(
        'menu.discounts.assignments.error.select',
        'Select both a menu item and a discount.'
      );
      return;
    }

    this.savingAssignment = true;
    try {
      const created = await firstValueFrom(
        this.assignmentsApi.create({
          menu_item_id: this.newAssignment.menu_item_id,
          menu_item_discount_id: this.newAssignment.menu_item_discount_id,
        })
      );
      this.assignmentStatus = this.i18n.translate(
        'menu.discounts.assignments.created',
        'Assignment created.'
      );
      this.newAssignment = this.createEmptyAssignmentForm();
      this.addOrUpdateAssignment(created);
      await this.reloadDiscountsAndAssignments('assignment');
    } catch (error) {
      console.error(error);
      this.assignmentError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.assignments.error.save',
          'Unable to save the assignment. Please try again.'
        );
    } finally {
      this.savingAssignment = false;
    }
  }

  startAssignmentEdit(assignment: MenuItemDiscountAssignment) {
    this.assignmentStatus = '';
    this.assignmentError = '';
    this.editingAssignmentId = assignment.id;
    this.editAssignmentForm = {
      menu_item_id: assignment.menu_item_id,
      menu_item_discount_id: assignment.menu_item_discount_id,
    };
  }

  cancelAssignmentEdit() {
    this.editingAssignmentId = null;
    this.editAssignmentForm = null;
    this.assignmentStatus = '';
    this.assignmentError = '';
  }

  async saveAssignment(id: number) {
    if (!this.editAssignmentForm) { return; }

    this.assignmentStatus = '';
    this.assignmentError = '';

    if (!this.editAssignmentForm.menu_item_id || !this.editAssignmentForm.menu_item_discount_id) {
      this.assignmentError = this.i18n.translate(
        'menu.discounts.assignments.error.select',
        'Select both a menu item and a discount.'
      );
      return;
    }

    const previous = this.assignments.find(assignment => assignment.id === id) || null;

    this.savingAssignment = true;
    try {
      const updated = await firstValueFrom(
        this.assignmentsApi.update(id, {
          menu_item_id: this.editAssignmentForm.menu_item_id,
          menu_item_discount_id: this.editAssignmentForm.menu_item_discount_id,
        })
      );
      this.assignmentStatus = this.i18n.translate(
        'menu.discounts.assignments.updated',
        'Assignment updated.'
      );
      if (previous) {
        this.removeAssignmentLocally(previous);
      }
      this.cancelAssignmentEdit();
      this.addOrUpdateAssignment(updated);
      await this.reloadDiscountsAndAssignments('assignment');
    } catch (error) {
      console.error(error);
      this.assignmentError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.assignments.error.save',
          'Unable to save the assignment. Please try again.'
        );
    } finally {
      this.savingAssignment = false;
    }
  }

  async deleteAssignment(assignment: MenuItemDiscountAssignment) {
    if (
      !confirm(
        this.i18n.translate(
          'menu.discounts.assignments.deleteConfirm',
          'Remove this assignment?'
        )
      )
    ) {
      return;
    }

    this.assignmentStatus = '';
    this.assignmentError = '';
    this.savingAssignment = true;

    try {
      await firstValueFrom(this.assignmentsApi.delete(assignment.id));
      this.assignmentStatus = this.i18n.translate(
        'menu.discounts.assignments.deleted',
        'Assignment removed.'
      );
      this.removeAssignmentLocally(assignment);
      await this.reloadDiscountsAndAssignments('assignment');
    } catch (error) {
      console.error(error);
      this.assignmentError =
        this.extractError(error) ||
        this.i18n.translate(
          'menu.discounts.assignments.error.delete',
          'Unable to delete the assignment. Please try again.'
        );
    } finally {
      this.savingAssignment = false;
    }
  }

  private async initialize(restaurantId: number) {
    const loadToken = ++this.initialRequestToken;
    this.loading = true;
    this.loadError = '';
    this.discountStatus = '';
    this.discountError = '';
    this.assignmentStatus = '';
    this.assignmentError = '';
    this.menuItems = [];
    this.discounts = [];
    this.assignments = [];

    try {
      const [items, discounts, assignments] = await Promise.all([
        firstValueFrom(this.menu.listByRestaurant(restaurantId)),
        firstValueFrom(this.discountsApi.list()),
        firstValueFrom(this.assignmentsApi.list()),
      ]);

      if (this.initialRequestToken !== loadToken) {
        return;
      }

      this.menuItems = items;
      this.replaceDiscounts(discounts);
      this.replaceAssignments(assignments);
      this.loading = false;
    } catch (error) {
      if (this.initialRequestToken !== loadToken) {
        return;
      }

      console.error(error);
      this.loadError = this.i18n.translate(
        'menu.discounts.error.load',
        'Unable to load discount data. Please refresh and try again.'
      );
      this.loading = false;
    }
  }

  private cancelPendingRequests() {
    this.initialRequestToken++;
    this.refreshRequestToken++;
  }

  private async reloadDiscountsAndAssignments(kind: 'discount' | 'assignment') {
    const restaurantId = this.restaurantIdValue;
    if (restaurantId === null) {
      return;
    }

    const refreshToken = ++this.refreshRequestToken;

    try {
      const [discounts, assignments] = await Promise.all([
        firstValueFrom(this.discountsApi.list()),
        firstValueFrom(this.assignmentsApi.list()),
      ]);

      if (this.refreshRequestToken !== refreshToken) {
        return;
      }

      this.replaceDiscounts(discounts);
      this.replaceAssignments(assignments);
    } catch (error) {
      if (this.refreshRequestToken !== refreshToken) {
        return;
      }

      console.error(error);

      if (kind === 'discount') {
        this.discountError = this.i18n.translate(
          'menu.discounts.error.load',
          'Unable to load discount data. Please refresh and try again.'
        );
      } else {
        this.assignmentError = this.i18n.translate(
          'menu.discounts.assignments.error.refresh',
          'Unable to refresh assignments. Please reload the page.'
        );
      }
    }
  }

  private replaceDiscounts(discounts: MenuItemDiscount[]) {
    this.discounts = (discounts ?? []).map(discount => this.normalizeDiscount(discount));
  }

  private replaceAssignments(assignments: MenuItemDiscountAssignment[]) {
    const normalized: MenuItemDiscountAssignment[] = [];
    for (const assignment of assignments ?? []) {
      const mapped = this.normalizeAssignment(assignment);
      if (mapped) {
        normalized.push(mapped);
      }
    }
    this.assignments = normalized;
  }

  private normalizeDiscount(discount: MenuItemDiscount): MenuItemDiscount {
    const menuItemIds = Array.isArray(discount.menu_item_ids)
      ? discount.menu_item_ids
          .map(id => this.parseNumber(id))
          .filter((id): id is number => id !== null)
      : [];

    const menuItems = Array.isArray(discount.menu_items)
      ? discount.menu_items
          .map(item => {
            const restaurantId = this.parseNumber(item.restaurant_id);
            if (restaurantId === null) {
              return null;
            }
            return { ...item, restaurant_id: restaurantId };
          })
          .filter((item): item is typeof item & { restaurant_id: number } => item !== null)
      : [];

    const knownMenuItemsById = new Map(this.menuItems.map(item => [item.id, item]));
    const mergedMenuItems = [...menuItems];

    for (const id of menuItemIds) {
      if (mergedMenuItems.some(item => item.id === id)) {
        continue;
      }

      const known = knownMenuItemsById.get(id);
      if (!known) {
        continue;
      }

      mergedMenuItems.push({
        id: known.id,
        name: known.name,
        restaurant_id: known.restaurant_id,
      });
    }

    return {
      ...discount,
      menu_item_ids: menuItemIds,
      menu_items: mergedMenuItems.map(item => ({ ...item })),
    };
  }

  private normalizeAssignment(
    assignment: MenuItemDiscountAssignment
  ): MenuItemDiscountAssignment | null {
    if (!assignment || !assignment.menu_item) {
      return null;
    }

    const restaurantId = this.parseNumber(assignment.menu_item.restaurant_id);
    if (restaurantId === null) {
      return null;
    }

    const currentRestaurant = this.restaurantIdValue;
    if (currentRestaurant !== null && restaurantId !== currentRestaurant) {
      return null;
    }

    return {
      ...assignment,
      menu_item: {
        ...assignment.menu_item,
        restaurant_id: restaurantId,
      },
      menu_item_discount: { ...assignment.menu_item_discount },
    };
  }

  private addOrUpdateAssignment(assignment: MenuItemDiscountAssignment) {
    const normalized = this.normalizeAssignment(assignment);
    if (!normalized) {
      return;
    }

    const index = this.assignments.findIndex(existing => existing.id === normalized.id);
    if (index === -1) {
      this.assignments = [...this.assignments, normalized];
    } else {
      const next = [...this.assignments];
      next[index] = normalized;
      this.assignments = next;
    }

    this.mergeAssignmentIntoDiscount(normalized);
  }

  private mergeAssignmentIntoDiscount(assignment: MenuItemDiscountAssignment) {
    const discountIndex = this.discounts.findIndex(
      discount => discount.id === assignment.menu_item_discount_id
    );
    if (discountIndex === -1) {
      return;
    }

    const discount = this.discounts[discountIndex];
    const menuItemIds = discount.menu_item_ids.includes(assignment.menu_item_id)
      ? [...discount.menu_item_ids]
      : [...discount.menu_item_ids, assignment.menu_item_id];

    const menuItems = discount.menu_items.map(item => ({ ...item }));
    const existingIndex = menuItems.findIndex(item => item.id === assignment.menu_item_id);
    if (existingIndex === -1) {
      menuItems.push({ ...assignment.menu_item });
    } else {
      menuItems[existingIndex] = { ...assignment.menu_item };
    }

    const next = [...this.discounts];
    next[discountIndex] = {
      ...discount,
      menu_item_ids: menuItemIds,
      menu_items: menuItems,
    };
    this.discounts = next;
  }

  private removeAssignmentLocally(assignment: MenuItemDiscountAssignment) {
    const remaining = this.assignments.filter(existing => existing.id !== assignment.id);
    this.assignments = remaining;

    const discountIndex = this.discounts.findIndex(
      discount => discount.id === assignment.menu_item_discount_id
    );
    if (discountIndex === -1) {
      return;
    }

    const stillAssigned = remaining.some(
      existing =>
        existing.menu_item_discount_id === assignment.menu_item_discount_id &&
        existing.menu_item_id === assignment.menu_item_id
    );

    if (stillAssigned) {
      return;
    }

    const discount = this.discounts[discountIndex];
    const menuItemIds = discount.menu_item_ids.filter(id => id !== assignment.menu_item_id);
    const menuItems = discount.menu_items
      .filter(item => item.id !== assignment.menu_item_id)
      .map(item => ({ ...item }));

    const next = [...this.discounts];
    next[discountIndex] = {
      ...discount,
      menu_item_ids: menuItemIds,
      menu_items: menuItems,
    };
    this.discounts = next;
  }

  private removeDiscountLocally(discountId: number) {
    this.discounts = this.discounts.filter(discount => discount.id !== discountId);
    this.assignments = this.assignments.filter(
      assignment => assignment.menu_item_discount_id !== discountId
    );
  }

  private upsertDiscount(discount: MenuItemDiscount) {
    const normalized = this.normalizeDiscount(discount);
    const index = this.discounts.findIndex(existing => existing.id === normalized.id);
    if (index === -1) {
      this.discounts = [...this.discounts, normalized];
    } else {
      const next = [...this.discounts];
      next[index] = normalized;
      this.discounts = next;
    }
  }

  private parseNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private resetState() {
    this.menuItems = [];
    this.discounts = [];
    this.assignments = [];
    this.loading = false;
    this.loadError = '';
    this.discountStatus = '';
    this.discountError = '';
    this.assignmentStatus = '';
    this.assignmentError = '';
    this.savingDiscount = false;
    this.savingAssignment = false;
  }

  private validateDiscountForm(form: DiscountFormModel): string | null {
    if (!form.discount_type.trim()) {
      return this.i18n.translate(
        'menu.discounts.error.type',
        'Enter the discount type.'
      );
    }

    if (!form.menu_item_ids.length) {
      return this.i18n.translate(
        'menu.discounts.error.menuItems',
        'Select at least one menu item.'
      );
    }

    return null;
  }

  private toDiscountPayload(form: DiscountFormModel): MenuItemDiscountInput | null {
    const amountCheck = this.validateAmount(form.amount);
    if (!amountCheck.valid) {
      this.discountError = amountCheck.message ?? '';
      return null;
    }

    const percentageCheck = this.validatePercentage(form.percentage_value);
    if (!percentageCheck.valid) {
      this.discountError = percentageCheck.message ?? '';
      return null;
    }

    const payload: MenuItemDiscountInput = {
      discount_type: form.discount_type.trim(),
      duration_type: form.duration_type.trim() || null,
      applies_to: form.applies_to.trim() || null,
      day_of_week: form.day_of_week.trim() || null,
      start_time: form.start_time.trim() || null,
      end_time: form.end_time.trim() || null,
      start_at: form.start_at.trim() || null,
      end_at: form.end_at.trim() || null,
      active: form.active,
      menu_item_ids: form.menu_item_ids,
    };

    if (amountCheck.value !== undefined) {
      payload.amount_cents = amountCheck.value;
    }

    if (percentageCheck.value !== undefined) {
      payload.percentage_value = percentageCheck.value;
    }

    return payload;
  }

  private validateAmount(value: string): {
    valid: boolean;
    value?: number | null;
    message?: string;
  } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { valid: true, value: null };
    }

    const normalized = trimmed.replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) {
      return {
        valid: false,
        message: this.i18n.translate(
          'menu.discounts.error.amount',
          'Enter a valid amount (e.g. 5.00).'
        ),
      };
    }

    return { valid: true, value: Math.round(parsed * 100) };
  }

  private validatePercentage(value: string): {
    valid: boolean;
    value?: number | null;
    message?: string;
  } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { valid: true, value: null };
    }

    const normalized = trimmed.replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) {
      return {
        valid: false,
        message: this.i18n.translate(
          'menu.discounts.error.percentage',
          'Enter a valid percentage (e.g. 10).'
        ),
      };
    }

    return { valid: true, value: parsed };
  }

  private mapDiscountToForm(discount: MenuItemDiscount): DiscountFormModel {
    return {
      discount_type: discount.discount_type || '',
      amount: this.formatAmount(discount.amount_cents),
      percentage_value:
        discount.percentage_value != null ? String(discount.percentage_value) : '',
      duration_type: discount.duration_type || '',
      applies_to: discount.applies_to || '',
      day_of_week: discount.day_of_week || '',
      start_time: discount.start_time || '',
      end_time: discount.end_time || '',
      start_at: discount.start_at || '',
      end_at: discount.end_at || '',
      active: discount.active !== false,
      menu_item_ids: [...discount.menu_item_ids],
    };
  }

  private formatAmount(cents?: number | null): string {
    if (cents == null) {
      return '';
    }
    return (cents / 100).toFixed(2);
  }

  private createEmptyDiscountForm(): DiscountFormModel {
    return {
      discount_type: '',
      amount: '',
      percentage_value: '',
      duration_type: '',
      applies_to: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      start_at: '',
      end_at: '',
      active: true,
      menu_item_ids: [],
    };
  }

  private createEmptyAssignmentForm(): AssignmentFormModel {
    return {
      menu_item_id: null,
      menu_item_discount_id: null,
    };
  }

  formatMenuItemNames(discount: MenuItemDiscount): string {
    return discount.menu_items
      .map(item => item?.name)
      .filter((name): name is string => typeof name === 'string' && !!name)
      .join(', ');
  }

  private extractError(error: unknown): string | null {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error as { errors?: unknown; message?: string } | null;
      if (payload) {
        if (Array.isArray(payload.errors) && payload.errors.length) {
          const first = payload.errors[0];
          if (typeof first === 'string') {
            return first;
          }
        } else if (typeof payload.errors === 'string') {
          return payload.errors;
        } else if (typeof payload.message === 'string') {
          return payload.message;
        }
      }
    }

    return null;
  }
}
