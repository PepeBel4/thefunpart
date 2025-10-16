import { AsyncPipe, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, tap } from 'rxjs';
import { ChainService } from '../chains/chain.service';
import { coerceHexColor, DEFAULT_BRAND_COLOR, normalizeHexColor } from '../core/color-utils';
import { Chain, Restaurant, RestaurantUpdateInput } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { RESTAURANT_CUISINES } from '../restaurants/cuisines';
import { RestaurantService } from '../restaurants/restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-restaurant-details',
  imports: [AsyncPipe, FormsModule, NgFor, NgIf, TitleCasePipe, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .details-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .details-form label {
      font-weight: 600;
      font-size: 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .details-form input,
    .details-form textarea {
      width: 100%;
      padding: 0.65rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font: inherit;
    }

    .details-form textarea {
      min-height: 96px;
      resize: vertical;
    }

    .details-form select {
      width: 100%;
      padding: 0.65rem 0.75rem;
      padding-right: 2.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.95);
      font: inherit;
      cursor: pointer;
      appearance: none;
    }

    .color-field input[type='color'] {
      width: 100%;
      height: 44px;
      border: 1px solid rgba(10, 10, 10, 0.12);
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.9);
      padding: 0.2rem;
    }

    .logo-manager {
      display: grid;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 0.85rem;
      padding: clamp(1rem, 2vw, 1.25rem);
    }

    .logo-header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .logo-header span:first-child {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .logo-header span:last-child {
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 400;
    }

    .logo-content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }

    .logo-preview {
      width: 96px;
      height: 96px;
      border-radius: 20px;
      border: 1px dashed rgba(10, 10, 10, 0.15);
      background: rgba(250, 250, 250, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .logo-preview.empty {
      color: var(--text-secondary);
      font-size: 0.8rem;
      text-align: center;
      padding: 0.5rem;
    }

    .logo-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .logo-actions button {
      padding: 0.55rem 1.1rem;
      font-size: 0.9rem;
    }

    .logo-actions .remove-button {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid rgba(10, 10, 10, 0.12);
      box-shadow: none;
    }

    .logo-actions .remove-button:hover {
      transform: none;
      box-shadow: none;
      border-color: rgba(10, 10, 10, 0.2);
      color: rgba(0, 0, 0, 0.8);
    }

    .details-form select:focus {
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.45);
      outline: none;
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
    }

    .details-form select:disabled {
      cursor: not-allowed;
      opacity: 0.7;
      background: rgba(245, 245, 245, 0.9);
    }

    .language-fields {
      display: grid;
      gap: 1rem;
    }

    .language-card {
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 0.85rem;
      padding: clamp(1rem, 2vw, 1.25rem);
      background: rgba(255, 255, 255, 0.85);
      display: grid;
      gap: 0.75rem;
    }

    .language-card h4 {
      margin: 0;
      font-size: 1.05rem;
    }

    .cuisine-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .cuisine-selector-header {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .cuisine-selector-header span:first-child {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .cuisine-selector-header span:last-child {
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 400;
    }

    .cuisine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.5rem;
    }

    .cuisine-option {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.65rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.1);
      background: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
    }

    .cuisine-option input[type='checkbox'] {
      width: 16px;
      height: 16px;
      accent-color: var(--brand-green);
    }

    .chain-manager {
      border-top: 1px solid rgba(10, 10, 10, 0.08);
      padding-top: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chain-select {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .chain-select-control {
      position: relative;
    }

    .chain-select-control::after {
      content: '';
      position: absolute;
      right: 1.15rem;
      top: 50%;
      pointer-events: none;
      width: 10px;
      height: 10px;
      border-right: 2px solid rgba(10, 10, 10, 0.45);
      border-bottom: 2px solid rgba(10, 10, 10, 0.45);
      transform: translateY(-50%) rotate(45deg);
    }

    .chain-label-heading {
      font-size: 1.1rem;
    }

    .chain-label-description {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .details-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    button {
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      border-radius: 999px;
      padding: 0.65rem 1.4rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 12px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.24);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 32px rgba(var(--brand-green-rgb, 6, 193, 103), 0.28);
    }

    button[disabled] {
      opacity: 0.7;
      cursor: default;
      box-shadow: none;
    }

    .status {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .status.error {
      color: #d14343;
    }

    .status.success {
      color: var(--brand-green);
    }

    .current-restaurant {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurant$ | async as restaurant">
      <header>
        <h3>{{ 'admin.details.heading' | translate: 'Restaurant details' }}</h3>
        <p>
          {{
            'admin.details.description'
              | translate: 'Edit the name and multi-language description guests see on the site.'
          }}
        </p>
        <p class="current-restaurant">
          {{ 'admin.details.editing' | translate: 'Editing {{name}}': { name: restaurant.name } }}
        </p>
      </header>

      <form class="details-form" (ngSubmit)="saveDetails()" novalidate>
        <label class="name-field" for="restaurant-name">
          {{ 'admin.details.nameLabel' | translate: 'Restaurant name' }}
          <input
            id="restaurant-name"
            name="name"
            [(ngModel)]="detailsForm.name"
            required
            [attr.placeholder]="
              'admin.details.namePlaceholder' | translate: 'Enter the restaurant name'
            "
          />
        </label>

        <label class="color-field" for="restaurant-color">
          {{ 'admin.details.colorLabel' | translate: 'Primary color' }}
          <input
            id="restaurant-color"
            type="color"
            name="primaryColor"
            [(ngModel)]="detailsForm.primaryColor"
            required
          />
        </label>

        <div class="logo-manager">
          <div class="logo-header">
            <span>{{ 'admin.details.logoHeading' | translate: 'Logo' }}</span>
            <span>
              {{
                'admin.details.logoHelp'
                  | translate: 'Upload a square logo to show alongside the restaurant.'
              }}
            </span>
          </div>

          <div class="logo-content">
            <div
              class="logo-preview"
              [class.empty]="!(currentRestaurant?.logo_url || restaurant.logo_url)"
            >
              <ng-container *ngIf="currentRestaurant?.logo_url || restaurant.logo_url; else noLogo">
                <img
                  [src]="currentRestaurant?.logo_url || restaurant.logo_url || ''"
                  [alt]="restaurant.name + ' logo'"
                />
              </ng-container>
              <ng-template #noLogo>
                <span>{{ 'admin.details.logoEmpty' | translate: 'No logo uploaded yet.' }}</span>
              </ng-template>
            </div>

            <div class="logo-actions">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                (change)="onLogoFileChange($event)"
                #logoInput
                hidden
                [disabled]="logoUploading"
              />
              <button type="button" (click)="logoInput.click()" [disabled]="logoUploading">
                {{
                  logoUploading
                    ? ('admin.details.logoUploading' | translate: 'Uploading…')
                    : (currentRestaurant?.logo_url || restaurant.logo_url)
                      ? ('admin.details.logoChange' | translate: 'Change logo')
                      : ('admin.details.logoUpload' | translate: 'Upload logo')
                }}
              </button>
              <button
                type="button"
                class="remove-button"
                *ngIf="currentRestaurant?.logo_url || restaurant.logo_url"
                (click)="removeLogo()"
                [disabled]="logoUploading || logoRemoving"
              >
                {{
                  logoRemoving
                    ? ('admin.details.logoRemoving' | translate: 'Removing…')
                    : ('admin.details.logoRemove' | translate: 'Remove logo')
                }}
              </button>
            </div>
          </div>

          <p *ngIf="logoMessage" class="status" [class.error]="logoMessageType === 'error'" [class.success]="logoMessageType === 'success'">
            {{ logoMessage }}
          </p>
        </div>

        <div class="chain-manager">
          <label class="chain-select">
            <span class="chain-label-heading">
              {{ 'admin.chains.heading' | translate: 'Chain' }}
            </span>
            <span class="chain-label-description">
              {{ 'admin.chains.description' | translate: 'Choose the chain this restaurant belongs to.' }}
            </span>
            <div class="chain-select-control">
              <select
                name="chainSelection"
                [(ngModel)]="chainSelection"
                (ngModelChange)="onChainSelectionChange($event)"
                [disabled]="chainSaving"
              >
                <option value="">
                  {{ 'admin.chains.noneOption' | translate: 'Not part of a chain' }}
                </option>
                <option *ngFor="let chain of chains" [value]="chain.id">{{ chain.name }}</option>
                <option [value]="createChainOptionValue">
                  {{ 'admin.chains.createOption' | translate: 'Create new chain…' }}
                </option>
              </select>
            </div>
          </label>
          <p *ngIf="chainMessage" class="status" [class.error]="chainMessageType === 'error'" [class.success]="chainMessageType === 'success'">
            {{ chainMessage }}
          </p>
        </div>

        <div class="language-fields">
          <div class="language-card" *ngFor="let language of languages">
            <h4>
              {{ language.label }}
              <span *ngIf="language.code === primaryLanguageCode">
                ({{ 'admin.details.primaryLanguage' | translate: 'Primary language' }})
              </span>
            </h4>
            <textarea
              [name]="'description-' + language.code"
              [(ngModel)]="detailsForm.descriptions[language.code]"
              [attr.placeholder]="
                'admin.details.descriptionPlaceholder'
                  | translate: 'Describe the atmosphere, specialties, and what guests can expect.'
              "
            ></textarea>
          </div>
        </div>

        <div class="cuisine-selector">
          <div class="cuisine-selector-header">
            <span>{{ 'admin.details.cuisinesLabel' | translate: 'Cuisines offered' }}</span>
            <span>{{ 'admin.details.cuisinesHelp' | translate: 'Pick as many as apply.' }}</span>
          </div>
          <div class="cuisine-grid">
            <label class="cuisine-option" *ngFor="let cuisine of cuisines; trackBy: trackCuisine">
              <input
                type="checkbox"
                [checked]="isCuisineSelected(cuisine)"
                (change)="onCuisineToggle(cuisine, $event.target.checked)"
              />
              <span>{{ cuisine | titlecase }}</span>
            </label>
          </div>
        </div>

        <div class="details-actions">
          <button type="submit" [disabled]="detailsSaving">
            {{
              detailsSaving
                ? ('admin.details.saving' | translate: 'Saving…')
                : ('admin.details.save' | translate: 'Save changes')
            }}
          </button>
        </div>

        <div *ngIf="detailsMessage" class="status" [class.error]="detailsMessageType === 'error'" [class.success]="detailsMessageType === 'success'">
          {{ detailsMessage }}
        </div>
      </form>
    </section>
  `,
})
export class AdminRestaurantDetailsPage {
  private context = inject(AdminRestaurantContextService);
  private restaurantService = inject(RestaurantService);
  private chainService = inject(ChainService);
  private i18n = inject(TranslationService);

  readonly cuisines = [...RESTAURANT_CUISINES];
  readonly languages = this.i18n.languages;
  readonly primaryLanguageCode = this.languages[0]?.code ?? 'en';
  readonly logoMaxSizeBytes = 2 * 1024 * 1024;
  private readonly logoAllowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
  ];

  readonly selectedRestaurant$ = this.context.selectedRestaurant$.pipe(
    tap(restaurant => {
      this.currentRestaurant = restaurant;
      this.populateDetailsForm(restaurant);
      this.setRestaurantChain(restaurant);
      this.resetDetailsStatus();
      this.resetChainStatus();
      this.resetLogoStatus();
    })
  );

  chains: Chain[] = [];
  currentRestaurant: Restaurant | null = null;
  restaurantChain: Chain | null = null;
  chainSelection = '';
  chainSaving = false;
  chainMessage = '';
  chainMessageType: 'success' | 'error' | '' = '';
  readonly createChainOptionValue = '__create__';

  detailsForm: {
    name: string;
    descriptions: Record<string, string>;
    cuisines: string[];
    primaryColor: string;
  } = {
    name: '',
    descriptions: {},
    cuisines: [],
    primaryColor: DEFAULT_BRAND_COLOR,
  };
  detailsSaving = false;
  detailsMessage = '';
  detailsMessageType: 'success' | 'error' | '' = '';
  logoUploading = false;
  logoRemoving = false;
  logoMessage = '';
  logoMessageType: 'success' | 'error' | '' = '';

  constructor() {
    void this.loadChains();
  }

  onLogoFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (input.value) {
      input.value = '';
    }

    this.logoMessage = '';
    this.logoMessageType = '';

    if (!file) {
      return;
    }

    if (!this.validateLogoFile(file)) {
      return;
    }

    void this.uploadLogo(file);
  }

  async removeLogo() {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null || this.logoRemoving || this.logoUploading) {
      return;
    }

    const confirmationMessage = this.i18n.translate(
      'admin.details.removeLogoConfirm',
      'Remove the current logo?'
    );

    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return;
    }

    this.logoRemoving = true;
    this.logoMessage = '';
    this.logoMessageType = '';

    try {
      const updatedRestaurant = await firstValueFrom(this.restaurantService.deleteLogo(restaurantId));
      this.currentRestaurant = updatedRestaurant;
      this.setLogoMessage('success', 'admin.details.logoRemoved', 'Logo removed.');
      this.context.updateRestaurantInList(updatedRestaurant);
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.setLogoMessage(
        'error',
        'admin.details.logoError',
        'Unable to update the logo. Please try again.'
      );
    } finally {
      this.logoRemoving = false;
    }
  }

  async saveDetails() {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null || this.detailsSaving) {
      return;
    }

    const trimmedName = this.detailsForm.name.trim();

    if (!trimmedName) {
      this.detailsMessage = this.i18n.translate(
        'admin.details.requiredName',
        'Enter at least one restaurant name.'
      );
      this.detailsMessageType = 'error';
      return;
    }

    const payload = this.buildUpdatePayload(trimmedName);

    this.detailsSaving = true;
    this.detailsMessage = '';
    this.detailsMessageType = '';

    try {
      const updatedRestaurant = await firstValueFrom(
        this.restaurantService.update(restaurantId, payload)
      );
      this.currentRestaurant = updatedRestaurant;
      this.detailsMessage = this.i18n.translate('admin.details.saved', 'Restaurant details updated!');
      this.detailsMessageType = 'success';
      this.context.updateRestaurantInList(updatedRestaurant);
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.detailsMessage = this.i18n.translate(
        'admin.details.error',
        'Unable to update the restaurant. Please try again.'
      );
      this.detailsMessageType = 'error';
    } finally {
      this.detailsSaving = false;
    }
  }

  trackCuisine = (_: number, cuisine: string) => cuisine;

  isCuisineSelected(cuisine: string): boolean {
    return this.detailsForm.cuisines.includes(cuisine);
  }

  onCuisineToggle(cuisine: string, checked: boolean) {
    const current = new Set(this.detailsForm.cuisines);

    if (checked) {
      current.add(cuisine);
    } else {
      current.delete(cuisine);
    }

    const orderedSelection = this.cuisines
      .filter(option => current.has(option))
      .concat(Array.from(current).filter(option => !this.cuisines.includes(option)));

    this.detailsForm = {
      ...this.detailsForm,
      cuisines: orderedSelection,
    };
  }

  onChainSelectionChange(value: string) {
    if (this.context.selectedRestaurantId === null) {
      this.chainSelection = '';
      return;
    }

    if (value === this.createChainOptionValue) {
      this.chainSelection = this.restaurantChain ? String(this.restaurantChain.id) : '';
      void this.promptCreateChain();
      return;
    }

    if (!value) {
      if (!this.restaurantChain) {
        this.chainSelection = '';
        return;
      }

      void this.updateChain(null);
      return;
    }

    const chainId = Number(value);

    if (Number.isNaN(chainId)) {
      this.chainSelection = this.restaurantChain ? String(this.restaurantChain.id) : '';
      return;
    }

    const chain = this.chains.find(item => item.id === chainId);

    if (!chain) {
      this.chainSelection = this.restaurantChain ? String(this.restaurantChain.id) : '';
      return;
    }

    void this.updateChain(chain);
  }

  private populateDetailsForm(restaurant: Restaurant) {
    const descriptions = restaurant.description_translations
      ? { ...restaurant.description_translations }
      : {};

    this.detailsForm = {
      name: restaurant.name ?? '',
      descriptions,
      cuisines: [...(restaurant.cuisines ?? [])],
      primaryColor: coerceHexColor(restaurant.primary_color),
    };

    const primaryDescription = restaurant.description ?? '';
    if (primaryDescription) {
      this.detailsForm.descriptions[this.primaryLanguageCode] = primaryDescription;
    }
  }

  private async uploadLogo(file: File) {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null) {
      return;
    }

    this.logoUploading = true;
    this.logoMessage = '';
    this.logoMessageType = '';

    try {
      const updatedRestaurant = await firstValueFrom(
        this.restaurantService.uploadLogo(restaurantId, file)
      );
      this.currentRestaurant = updatedRestaurant;
      this.setLogoMessage('success', 'admin.details.logoSaved', 'Logo updated!');
      this.context.updateRestaurantInList(updatedRestaurant);
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.setLogoMessage(
        'error',
        'admin.details.logoError',
        'Unable to update the logo. Please try again.'
      );
    } finally {
      this.logoUploading = false;
    }
  }

  private validateLogoFile(file: File): boolean {
    if (!this.logoAllowedMimeTypes.includes(file.type)) {
      this.setLogoMessage(
        'error',
        'admin.details.logoInvalidType',
        'Please choose a PNG, JPEG, SVG, or WebP file.'
      );
      return false;
    }

    if (file.size > this.logoMaxSizeBytes) {
      this.setLogoMessage('error', 'admin.details.logoTooLarge', 'Choose a file smaller than 2 MB.');
      return false;
    }

    return true;
  }

  private setLogoMessage(type: 'success' | 'error', key: string, fallback: string) {
    this.logoMessage = this.i18n.translate(key, fallback);
    this.logoMessageType = type;
  }

  private buildUpdatePayload(trimmedName: string): RestaurantUpdateInput {
    const descriptionTranslations: Record<string, string> = {};

    this.languages.forEach(language => {
      const descriptionValue = this.detailsForm.descriptions[language.code]?.trim();
      if (descriptionValue) {
        descriptionTranslations[language.code] = descriptionValue;
      }
    });

    const primaryDescription = this.detailsForm.descriptions[this.primaryLanguageCode]?.trim() ?? '';

    const payload: RestaurantUpdateInput = {
      name: trimmedName,
      description: primaryDescription,
    };

    if (Object.keys(descriptionTranslations).length) {
      payload.description_translations = descriptionTranslations;
    }

    payload.cuisines = [...this.detailsForm.cuisines];

    const normalizedColor = normalizeHexColor(this.detailsForm.primaryColor) ?? DEFAULT_BRAND_COLOR;
    payload.primary_color = normalizedColor;

    this.detailsForm = {
      ...this.detailsForm,
      primaryColor: normalizedColor,
    };

    return payload;
  }

  private async loadChains() {
    try {
      const chains = await firstValueFrom(this.chainService.list());
      this.chains = this.sortChains(chains ?? []);
    } catch (err) {
      console.error('Failed to load chains', err);
      this.chains = [];
    }
  }

  private sortChains(chains: Chain[]): Chain[] {
    return [...chains].sort((a, b) => a.name.localeCompare(b.name));
  }

  private setRestaurantChain(restaurant: Restaurant) {
    this.restaurantChain = restaurant.chain ?? null;
    this.chainSelection = this.restaurantChain ? String(this.restaurantChain.id) : '';
  }

  private resetChainStatus() {
    this.chainMessage = '';
    this.chainMessageType = '';
    this.chainSaving = false;
  }

  private clearChainMessage() {
    this.chainMessage = '';
    this.chainMessageType = '';
  }

  private resetLogoStatus() {
    this.logoUploading = false;
    this.logoRemoving = false;
    this.logoMessage = '';
    this.logoMessageType = '';
  }

  private async promptCreateChain() {
    const promptMessage = this.i18n.translate('admin.chains.newPrompt', 'Enter a name for the new chain.');
    const name = typeof window !== 'undefined' ? window.prompt(promptMessage, '') : null;

    const trimmedName = name?.trim();

    if (!trimmedName) {
      this.chainSelection = this.restaurantChain ? String(this.restaurantChain.id) : '';
      return;
    }

    this.chainSaving = true;
    this.clearChainMessage();

    try {
      const chain = await firstValueFrom(this.chainService.create({ name: trimmedName }));
      this.chains = this.sortChains([...this.chains, chain]);
      await this.updateChain(chain, { preserveSavingState: true });
    } catch (err) {
      console.error(err);
      this.setChainMessage('error', 'admin.chains.error', 'Unable to update chain. Please try again.');
    } finally {
      this.chainSaving = false;
    }
  }

  private async updateChain(chain: Chain | null, options: { preserveSavingState?: boolean } = {}) {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null) {
      return;
    }

    if (this.restaurantChain?.id === chain?.id) {
      this.chainSelection = chain ? String(chain.id) : '';
      return;
    }

    const previousChain = this.restaurantChain;
    const { preserveSavingState = false } = options;

    if (!preserveSavingState) {
      this.chainSaving = true;
      this.clearChainMessage();
    }

    try {
      const payload: RestaurantUpdateInput = {
        chain_id: chain?.id ?? null,
      };

      if (this.currentRestaurant?.name) {
        payload.name = this.currentRestaurant.name;
      }

      const updatedRestaurant = await firstValueFrom(
        this.restaurantService.update(restaurantId, payload)
      );

      const resolvedChain = updatedRestaurant.chain ?? chain ?? null;

      this.currentRestaurant = updatedRestaurant;
      this.restaurantChain = resolvedChain;
      this.chainSelection = resolvedChain ? String(resolvedChain.id) : '';
      this.setChainMessage(
        'success',
        resolvedChain ? 'admin.chains.added' : 'admin.chains.removed',
        resolvedChain ? 'Chain assigned to restaurant.' : 'Chain removed from restaurant.'
      );
      this.context.updateRestaurantInList(updatedRestaurant);
      this.context.refreshSelectedRestaurant();
    } catch (err) {
      console.error(err);
      this.restaurantChain = previousChain;
      this.chainSelection = previousChain ? String(previousChain.id) : '';
      this.setChainMessage('error', 'admin.chains.error', 'Unable to update chain. Please try again.');
    } finally {
      if (!preserveSavingState) {
        this.chainSaving = false;
      }
    }
  }

  private setChainMessage(type: 'success' | 'error', key: string, fallback: string) {
    this.chainMessage = this.i18n.translate(key, fallback);
    this.chainMessageType = type;
  }

  private resetDetailsStatus() {
    this.detailsMessage = '';
    this.detailsMessageType = '';
    this.detailsSaving = false;
  }
}
