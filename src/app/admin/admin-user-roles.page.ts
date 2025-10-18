import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { AdminUserRolesService, UserRolePayload } from './admin-user-roles.service';
import { Chain, Restaurant, UserRole, UserSummary } from '../core/models';
import { RestaurantService } from '../restaurants/restaurant.service';
import { ChainService } from '../chains/chain.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { HttpErrorResponse } from '@angular/common/http';

interface RoleOption {
  value: string;
  label: string;
}

interface RoleFormValue {
  role: string;
  resourceType: string | null;
  resourceId: number | null;
}

interface EditableRoleState {
  role: UserRole;
  form: RoleFormValue;
  saving: boolean;
  error: string | null;
}

interface NewRoleState extends RoleFormValue {
  saving: boolean;
  error: string | null;
}

@Component({
  standalone: true,
  selector: 'app-admin-user-roles',
  imports: [NgClass, NgFor, NgIf, FormsModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="card" *ngIf="!isCheckingAccess(); else loadingAccess">
      <header class="card-header">
        <div>
          <h3>{{ 'admin.userRoles.title' | translate: 'User roles' }}</h3>
          <p>
            {{
              'admin.userRoles.subtitle'
                | translate: 'Search for a user to manage their access across restaurants and chains.'
            }}
          </p>
        </div>
      </header>

      <div class="user-role-grid" *ngIf="isSuperAdmin(); else unauthorized">
        <section class="search-panel">
          <label class="field">
            <span>{{ 'admin.userRoles.search.label' | translate: 'Search users' }}</span>
            <input
              type="search"
              [formControl]="searchControl"
              placeholder="{{ 'admin.userRoles.search.placeholder' | translate: 'Search by name or email' }}"
            />
          </label>

          <p *ngIf="searchLoading()" class="state loading">
            {{ 'admin.userRoles.search.loading' | translate: 'Searching users…' }}
          </p>
          <p *ngIf="searchError()" class="state error">{{ searchError() }}</p>

          <ul class="search-results" *ngIf="searchResults().length > 0">
            <li
              *ngFor="let user of searchResults(); trackBy: trackUser"
              [ngClass]="{ active: selectedUser()?.id === user.id }"
            >
              <button type="button" (click)="selectUser(user)">
                <span class="name">{{ formatUserName(user) }}</span>
                <span class="email">{{ user.email || ('admin.userRoles.noEmail' | translate: 'No email on file') }}</span>
              </button>
            </li>
          </ul>
        </section>

        <section class="roles-panel" *ngIf="selectedUser(); else selectPlaceholder">
          <header class="roles-header">
            <h4>
              {{
                'admin.userRoles.rolesFor'
                  | translate: 'Roles for'
              }}
              <span>{{ formatUserName(selectedUser()!) }}</span>
            </h4>
            <p class="roles-subtitle">
              {{
                'admin.userRoles.rolesSubtitle'
                  | translate: 'Update or remove existing roles, or assign a new one.'
              }}
            </p>
          </header>

          <div *ngIf="rolesLoading()" class="state loading">
            {{ 'admin.userRoles.rolesLoading' | translate: 'Loading roles…' }}
          </div>
          <p *ngIf="rolesError()" class="state error">{{ rolesError() }}</p>

          <div *ngIf="!rolesLoading() && !rolesError()">
            <div *ngIf="editableRoles().length > 0; else emptyRoles">
              <div
                class="role-row"
                *ngFor="let role of editableRoles(); trackBy: trackRoleState"
              >
                <div class="role-form">
                  <label class="field">
                    <span>{{ 'admin.userRoles.role.label' | translate: 'Role' }}</span>
                    <select [(ngModel)]="role.form.role" (ngModelChange)="onRoleChanged(role)">
                      <option *ngFor="let option of roleOptions()" [ngValue]="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </label>

                  <label
                    class="field"
                    *ngIf="shouldShowRestaurantSelector(role.form)"
                  >
                    <span>{{ 'admin.userRoles.role.restaurant' | translate: 'Restaurant' }}</span>
                    <select [(ngModel)]="role.form.resourceId">
                      <option [ngValue]="null">
                        {{ 'admin.userRoles.selectRestaurant' | translate: 'Select restaurant' }}
                      </option>
                      <option *ngFor="let restaurant of restaurants()" [ngValue]="restaurant.id">
                        {{ restaurant.name }}
                      </option>
                    </select>
                  </label>

                  <label class="field" *ngIf="shouldShowChainSelector(role.form)">
                    <span>{{ 'admin.userRoles.role.chain' | translate: 'Chain' }}</span>
                    <select [(ngModel)]="role.form.resourceId">
                      <option [ngValue]="null">
                        {{ 'admin.userRoles.selectChain' | translate: 'Select chain' }}
                      </option>
                      <option *ngFor="let chain of chains()" [ngValue]="chain.id">
                        {{ chain.name }}
                      </option>
                    </select>
                  </label>
                </div>

                <div class="role-actions">
                  <button
                    type="button"
                    (click)="saveRole(role)"
                    [disabled]="role.saving || !canSubmitRoleForm(role.form)"
                  >
                    {{
                      role.saving
                        ? ('admin.userRoles.role.saving' | translate: 'Saving…')
                        : ('admin.userRoles.role.save' | translate: 'Save changes')
                    }}
                  </button>
                  <button type="button" class="danger" (click)="deleteRole(role)" [disabled]="role.saving">
                    {{ 'admin.userRoles.role.delete' | translate: 'Remove role' }}
                  </button>
                  <p *ngIf="role.error" class="state error">{{ role.error }}</p>
                </div>
              </div>
            </div>

            <ng-template #emptyRoles>
              <p class="state empty">
                {{ 'admin.userRoles.noRoles' | translate: 'This user does not have any roles yet.' }}
              </p>
            </ng-template>

            <div class="create-role">
              <h5>{{ 'admin.userRoles.create.title' | translate: 'Add a role' }}</h5>
              <div class="role-form">
                <label class="field">
                  <span>{{ 'admin.userRoles.role.label' | translate: 'Role' }}</span>
                  <select [(ngModel)]="newRole.role" (ngModelChange)="onNewRoleChanged($event)">
                    <option [ngValue]="''">
                      {{ 'admin.userRoles.create.selectRole' | translate: 'Select a role' }}
                    </option>
                    <option *ngFor="let option of roleOptions()" [ngValue]="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="field" *ngIf="shouldShowRestaurantSelector(newRole)">
                  <span>{{ 'admin.userRoles.role.restaurant' | translate: 'Restaurant' }}</span>
                  <select [(ngModel)]="newRole.resourceId">
                    <option [ngValue]="null">
                      {{ 'admin.userRoles.selectRestaurant' | translate: 'Select restaurant' }}
                    </option>
                    <option *ngFor="let restaurant of restaurants()" [ngValue]="restaurant.id">
                      {{ restaurant.name }}
                    </option>
                  </select>
                </label>

                <label class="field" *ngIf="shouldShowChainSelector(newRole)">
                  <span>{{ 'admin.userRoles.role.chain' | translate: 'Chain' }}</span>
                  <select [(ngModel)]="newRole.resourceId">
                    <option [ngValue]="null">
                      {{ 'admin.userRoles.selectChain' | translate: 'Select chain' }}
                    </option>
                    <option *ngFor="let chain of chains()" [ngValue]="chain.id">
                      {{ chain.name }}
                    </option>
                  </select>
                </label>
              </div>

              <div class="role-actions">
                <button
                  type="button"
                  (click)="createRole()"
                  [disabled]="newRole.role === '' || newRole.saving || !canSubmitRoleForm(newRole)"
                >
                  {{
                    newRole.saving
                      ? ('admin.userRoles.create.saving' | translate: 'Creating…')
                      : ('admin.userRoles.create.submit' | translate: 'Add role')
                  }}
                </button>
                <p *ngIf="newRole.error" class="state error">{{ newRole.error }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

    <ng-template #selectPlaceholder>
      <div class="state muted">
        {{ 'admin.userRoles.selectPlaceholder' | translate: 'Search and select a user to manage roles.' }}
      </div>
    </ng-template>

    <ng-template #unauthorized>
      <div class="state error">
        {{ 'admin.userRoles.unauthorized' | translate: 'You do not have permission to manage user roles.' }}
      </div>
    </ng-template>

    <ng-template #loadingAccess>
      <section class="card">
        <p class="state loading">
          {{ 'admin.userRoles.accessLoading' | translate: 'Checking permissions…' }}
        </p>
      </section>
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
    }

    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.75rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: clamp(1.25rem, 2.5vw, 1.75rem);
      min-height: 520px;
    }

    .card-header h3 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 1.9rem);
    }

    .card-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    .user-role-grid {
      display: flex;
      flex-direction: column;
      gap: clamp(1.25rem, 2vw, 1.75rem);
    }

    @media (min-width: 992px) {
      .user-role-grid {
        display: grid;
        grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
        gap: clamp(1.5rem, 3vw, 2.5rem);
        align-items: flex-start;
      }
    }

    .search-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 1rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.08));
      background: rgba(10, 10, 10, 0.04);
    }

    .search-panel input[type='search'] {
      padding: 0.6rem 0.75rem;
      border-radius: 0.7rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.12));
      background: var(--surface, #fff);
      font: inherit;
      color: inherit;
    }

    .search-panel input[type='search']:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.2);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .field span {
      font-weight: 600;
      color: var(--text-primary);
    }

    .field select {
      padding: 0.6rem 0.75rem;
      border-radius: 0.7rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.12));
      background: var(--surface, #fff);
      font: inherit;
      color: inherit;
    }

    .search-results {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 320px;
      overflow: auto;
    }

    .search-results li button {
      width: 100%;
      text-align: left;
      padding: 0.75rem 0.85rem;
      border-radius: 0.75rem;
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.85);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      cursor: pointer;
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }

    .search-results li button:hover,
    .search-results li.active button {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.1);
    }

    .search-results .name {
      font-weight: 600;
    }

    .search-results .email {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .roles-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .roles-header h4 {
      margin: 0;
      font-size: 1.35rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      align-items: baseline;
    }

    .roles-header h4 span {
      font-weight: 600;
      color: var(--text-primary);
    }

    .roles-subtitle {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    .role-row {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.9rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.08));
      background: rgba(10, 10, 10, 0.04);
    }

    @media (min-width: 768px) {
      .role-row {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .role-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem 1rem;
      flex: 1;
    }

    .role-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 200px;
    }

    .role-actions button {
      padding: 0.55rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green, #06c167);
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }

    .role-actions button:hover:not(:disabled) {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
    }

    .role-actions button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .role-actions button.danger {
      border-color: rgba(var(--brand-red-rgb, 200, 30, 30), 0.4);
      background: rgba(var(--brand-red-rgb, 200, 30, 30), 0.12);
      color: var(--brand-red, #c81e1e);
    }

    .role-actions button.danger:hover:not(:disabled) {
      background: rgba(var(--brand-red-rgb, 200, 30, 30), 0.18);
    }

    .state {
      margin: 0;
      font-size: 0.95rem;
    }

    .state.loading {
      color: var(--text-secondary);
      font-style: italic;
    }

    .state.error {
      color: var(--brand-red, #c81e1e);
    }

    .state.empty,
    .state.muted {
      color: var(--text-secondary);
      font-style: italic;
    }

    .create-role {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-soft, rgba(10, 10, 10, 0.08));
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .create-role h5 {
      margin: 0;
      font-size: 1.1rem;
    }
  `,
})
export class AdminUserRolesPage {
  private userRolesService = inject(AdminUserRolesService);
  private restaurantService = inject(RestaurantService);
  private chainService = inject(ChainService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  searchControl = new FormControl('', { nonNullable: true });

  private readonly defaultRoleOptions: RoleOption[] = [
    { value: 'super_admin', label: 'Super admin' },
    { value: 'chain_admin', label: 'Chain admin' },
    { value: 'restaurant_admin', label: 'Restaurant admin' },
  ];

  roleOptions: WritableSignal<RoleOption[]> = signal([...this.defaultRoleOptions]);

  searchResults = signal<UserSummary[]>([]);
  searchLoading = signal(false);
  searchError = signal<string | null>(null);
  selectedUser = signal<UserSummary | null>(null);

  editableRoles: WritableSignal<EditableRoleState[]> = signal<EditableRoleState[]>([]);
  rolesLoading = signal(false);
  rolesError = signal<string | null>(null);

  restaurants = signal<Restaurant[]>([]);
  chains = signal<Chain[]>([]);

  isSuperAdmin = signal(false);
  isCheckingAccess = signal(true);

  newRole: NewRoleState = {
    role: '',
    resourceType: null,
    resourceId: null,
    saving: false,
    error: null,
  };

  constructor() {
    this.observeSearchInput();
    void this.initializeAccess();
  }

  trackUser(_: number, user: UserSummary) {
    return user.id;
  }

  trackRoleState(_: number, state: EditableRoleState) {
    return state.role.id;
  }

  formatUserName(user: UserSummary): string {
    const parts = [user.firstName, user.lastName].filter((part): part is string => !!part);
    if (parts.length) {
      return parts.join(' ');
    }
    return user.email ?? `User #${user.id}`;
  }

  selectUser(user: UserSummary): void {
    if (this.selectedUser()?.id === user.id) {
      return;
    }

    this.selectedUser.set(user);
    this.loadRolesForUser(user.id);
  }

  onRoleChanged(state: EditableRoleState): void {
    state.form = this.adjustFormForRole(state.form);
  }

  onNewRoleChanged(role: string): void {
    const nextForm = this.adjustFormForRole({
      role,
      resourceType: this.newRole.resourceType,
      resourceId: this.newRole.resourceId,
    });

    this.newRole = {
      ...this.newRole,
      ...nextForm,
      error: null,
    };
  }

  saveRole(state: EditableRoleState): void {
    const user = this.selectedUser();
    if (!user || state.saving || !this.canSubmitRoleForm(state.form)) {
      return;
    }

    const payload = this.buildPayload(state.form);

    this.updateRoleState(state.role.id, current => ({ ...current, saving: true, error: null }));

    this.userRolesService
      .update(state.role.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.updateRoleState(state.role.id, current => ({ ...current, saving: false }))))
      .subscribe({
        next: updated => {
          this.ensureRoleOptionExists(updated.role);
          this.updateRoleState(state.role.id, current => ({
            role: updated,
            form: {
              role: updated.role,
              resourceType: updated.resourceType,
              resourceId: updated.resourceId,
            },
            saving: false,
            error: null,
          }));
        },
        error: error => {
          this.updateRoleState(state.role.id, current => ({ ...current, error: this.extractErrorMessage(error) }));
        },
      });
  }

  deleteRole(state: EditableRoleState): void {
    if (state.saving) {
      return;
    }

    this.updateRoleState(state.role.id, current => ({ ...current, saving: true, error: null }));

    this.userRolesService
      .delete(state.role.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.updateRoleState(state.role.id, current => ({ ...current, saving: false }))))
      .subscribe({
        next: () => {
          this.editableRoles.update(roles => roles.filter(item => item.role.id !== state.role.id));
        },
        error: error => {
          this.updateRoleState(state.role.id, current => ({ ...current, error: this.extractErrorMessage(error) }));
        },
      });
  }

  createRole(): void {
    const user = this.selectedUser();
    const current = this.newRole;
    if (!user || current.saving || current.role === '' || !this.canSubmitRoleForm(current)) {
      return;
    }

    const payload = this.buildPayload(current);

    this.newRole = { ...current, saving: true, error: null };

    this.userRolesService
      .create(user.id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.newRole = { ...this.newRole, saving: false };
        })
      )
      .subscribe({
        next: created => {
          this.ensureRoleOptionExists(created.role);
          this.editableRoles.update(roles => [
            ...roles,
            {
              role: created,
              form: {
                role: created.role,
                resourceType: created.resourceType,
                resourceId: created.resourceId,
              },
              saving: false,
              error: null,
            },
          ]);
          this.newRole = {
            role: '',
            resourceType: null,
            resourceId: null,
            saving: false,
            error: null,
          };
        },
        error: error => {
          this.newRole = {
            ...this.newRole,
            error: this.extractErrorMessage(error),
          };
        },
      });
  }

  shouldShowRestaurantSelector(form: RoleFormValue): boolean {
    return form.role === 'restaurant_admin' || form.resourceType === 'Restaurant';
  }

  shouldShowChainSelector(form: RoleFormValue): boolean {
    return form.role === 'chain_admin' || form.resourceType === 'Chain';
  }

  canSubmitRoleForm(form: RoleFormValue): boolean {
    if (form.role === '') {
      return false;
    }

    if (this.shouldShowRestaurantSelector(form) || this.shouldShowChainSelector(form)) {
      return typeof form.resourceId === 'number';
    }

    return true;
  }

  private observeSearchInput(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(this.searchControl.value),
        debounceTime(300),
        map(value => value?.trim() ?? ''),
        distinctUntilChanged(),
        switchMap(value => this.performSearch(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(results => {
        this.searchResults.set(results);
      });
  }

  private performSearch(value: string): Observable<UserSummary[]> {
    if (!this.isSuperAdmin()) {
      this.searchLoading.set(false);
      return of([]);
    }

    if (!value || value.length < 2) {
      this.searchLoading.set(false);
      this.searchError.set(null);
      return of([]);
    }

    this.searchLoading.set(true);
    this.searchError.set(null);

    return this.userRolesService.searchUsers(value).pipe(
      catchError(error => {
        this.searchError.set(this.extractErrorMessage(error));
        return of<UserSummary[]>([]);
      }),
      finalize(() => this.searchLoading.set(false))
    );
  }

  private async initializeAccess(): Promise<void> {
    try {
      const isSuperAdmin = await this.userRolesService.isCurrentUserSuperAdmin();
      this.isSuperAdmin.set(isSuperAdmin);

      if (isSuperAdmin) {
        this.loadReferenceData();
      } else {
        void this.router.navigate(['/admin']);
      }
    } finally {
      this.isCheckingAccess.set(false);
    }
  }

  private loadReferenceData(): void {
    this.restaurantService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: restaurants => this.restaurants.set(restaurants),
        error: error => console.error('Failed to load restaurants', error),
      });

    this.chainService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: chains => this.chains.set(chains),
        error: error => console.error('Failed to load chains', error),
      });
  }

  private loadRolesForUser(userId: number): void {
    this.rolesLoading.set(true);
    this.rolesError.set(null);
    this.editableRoles.set([]);

    this.userRolesService
      .listByUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.rolesLoading.set(false))
      )
      .subscribe({
        next: roles => {
          roles.forEach(role => this.ensureRoleOptionExists(role.role));
          this.editableRoles.set(roles.map(role => ({
            role,
            form: {
              role: role.role,
              resourceType: role.resourceType,
              resourceId: role.resourceId,
            },
            saving: false,
            error: null,
          })));
        },
        error: error => {
          this.rolesError.set(this.extractErrorMessage(error));
        },
      });
  }

  private ensureRoleOptionExists(value: string): void {
    this.roleOptions.update(options => {
      if (options.some(option => option.value === value)) {
        return options;
      }

      return [...options, { value, label: this.formatRoleLabel(value) }];
    });
  }

  private formatRoleLabel(value: string): string {
    return value
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private adjustFormForRole(form: RoleFormValue): RoleFormValue {
    switch (form.role) {
      case 'super_admin':
        return { role: form.role, resourceType: null, resourceId: null };
      case 'restaurant_admin':
        return {
          role: form.role,
          resourceType: 'Restaurant',
          resourceId: this.validateResourceId(form.resourceId) ? form.resourceId : null,
        };
      case 'chain_admin':
        return {
          role: form.role,
          resourceType: 'Chain',
          resourceId: this.validateResourceId(form.resourceId) ? form.resourceId : null,
        };
      default:
        return form;
    }
  }

  private validateResourceId(value: number | null): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private buildPayload(form: RoleFormValue): UserRolePayload {
    const adjusted = this.adjustFormForRole(form);
    return {
      role: adjusted.role,
      resourceType: adjusted.resourceType,
      resourceId: adjusted.resourceId,
    };
  }

  private updateRoleState(roleId: number, updater: (state: EditableRoleState) => EditableRoleState): void {
    this.editableRoles.update(states =>
      states.map(state => (state.role.id === roleId ? updater({ ...state }) : state))
    );
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const data = error.error;
      if (data && typeof data === 'object') {
        if (Array.isArray((data as any).errors) && (data as any).errors.length) {
          return (data as any).errors.join(', ');
        }

        if (typeof (data as any).error === 'string') {
          return (data as any).error;
        }
      }
    }

    return 'Something went wrong. Please try again.';
  }
}
