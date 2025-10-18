import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, tap } from 'rxjs';
import { Chain, RestaurantUpdateInput } from '../core/models';
import { TranslationService } from '../core/translation.service';
import { RestaurantService } from '../restaurants/restaurant.service';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

@Component({
  standalone: true,
  selector: 'app-admin-restaurant-loyalty',
  imports: [AsyncPipe, FormsModule, NgIf, TranslatePipe],
  styles: [`
    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: 2rem clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    header h3 {
      margin: 0;
      font-size: clamp(1.4rem, 3vw, 1.7rem);
      letter-spacing: -0.02em;
    }

    header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 520px;
    }

    .loyalty-form {
      display: grid;
      gap: 1.25rem;
    }

    .loyalty-toggle {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      padding-right: 64px;
    }

    .loyalty-toggle input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      width: 48px;
      height: 26px;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
      cursor: pointer;
    }

    .toggle-visual {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 26px;
      border-radius: 999px;
      background: rgba(10, 10, 10, 0.18);
      transition: background 0.2s ease;
      flex-shrink: 0;
      pointer-events: none;
    }

    .toggle-visual::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }

    .loyalty-toggle input[type='checkbox']:checked + .toggle-visual {
      background: var(--brand-green);
    }

    .loyalty-toggle input[type='checkbox']:checked + .toggle-visual::after {
      transform: translateX(22px);
    }

    .loyalty-toggle input[type='checkbox']:focus-visible + .toggle-visual {
      box-shadow: 0 0 0 3px rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
    }

    .toggle-text {
      font-size: 0.95rem;
    }

    .loyalty-amount {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 600;
    }

    .loyalty-amount input[type='number'] {
      max-width: 200px;
      padding: 0.6rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.9);
      font: inherit;
    }

    .loyalty-note {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .loyalty-summary {
      margin: 0;
      font-weight: 600;
    }

    .loyalty-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .loyalty-actions button {
      background: var(--brand-green);
      color: var(--brand-on-primary);
      border: 0;
      border-radius: 999px;
      padding: 0.6rem 1.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .loyalty-actions button:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(6, 193, 103, 0.2);
    }

    .loyalty-actions button[disabled] {
      opacity: 0.6;
      cursor: default;
      box-shadow: none;
      transform: none;
    }

    .loyalty-status {
      font-weight: 600;
    }

    .loyalty-status.error {
      color: #d14343;
    }

    .loyalty-status.success {
      color: var(--brand-green);
    }

    .empty-state {
      color: var(--text-secondary);
    }
  `],
  template: `
    <section class="card" *ngIf="selectedRestaurantId$ | async as restaurantId">
      <ng-container *ngIf="restaurantId !== null; else noRestaurantSelected">
        <ng-container *ngIf="selectedRestaurant$ | async">
          <header>
            <h3>{{ 'admin.loyalty.heading' | translate: 'Loyalty program' }}</h3>
            <p *ngIf="!restaurantChain">
              {{
                'admin.loyalty.descriptionRestaurant'
                  | translate: 'Manage how this restaurant awards loyalty points to guests.'
              }}
            </p>
            <p *ngIf="restaurantChain" class="loyalty-note">
              {{
                'admin.loyalty.chainManaged'
                  | translate: 'Loyalty is managed by {{chain}}.' : { chain: restaurantChain!.name }
              }}
            </p>
          </header>

          <ng-container *ngIf="!restaurantChain; else chainManaged">
            <form class="loyalty-form" (ngSubmit)="saveLoyaltySettings()" novalidate>
              <label class="loyalty-toggle">
                <span class="toggle-text">
                  {{ 'admin.loyalty.enableLabel' | translate: 'Enable loyalty points' }}
                </span>
                <input type="checkbox" name="loyaltyEnabled" [(ngModel)]="loyaltyForm.enabled" />
                <span class="toggle-visual" aria-hidden="true"></span>
              </label>

              <label class="loyalty-amount">
                {{ 'admin.loyalty.earnAmountLabel' | translate: 'Euros spent to earn 1 point' }}
                <input
                  type="number"
                  name="loyaltyEarnAmount"
                  min="0"
                  step="0.01"
                  [(ngModel)]="loyaltyForm.earnAmount"
                  [disabled]="!loyaltyForm.enabled"
                />
              </label>

              <p class="loyalty-note" *ngIf="loyaltyForm.enabled && loyaltyForm.earnAmount">
                {{
                  'admin.loyalty.earnAmountHint'
                    | translate: 'Guests receive 1 point for every €{{amount}} they spend.': {
                        amount: loyaltyForm.earnAmount
                      }
                }}
              </p>

              <div class="loyalty-actions">
                <button type="submit" [disabled]="loyaltySaving">
                  {{
                    loyaltySaving
                      ? ('admin.loyalty.saving' | translate: 'Saving…')
                      : ('admin.loyalty.save' | translate: 'Save loyalty settings')
                  }}
                </button>
                <span
                  *ngIf="loyaltyMessage"
                  class="loyalty-status"
                  [class.error]="loyaltyMessageType === 'error'"
                  [class.success]="loyaltyMessageType === 'success'"
                >
                  {{ loyaltyMessage }}
                </span>
              </div>
            </form>
          </ng-container>

          <ng-template #chainManaged>
            <p class="loyalty-summary" *ngIf="restaurantChain!.loyalty_program_enabled; else chainLoyaltyDisabled">
              {{
                'admin.loyalty.chainSummary'
                  | translate: 'Guests receive 1 point for every €{{amount}} they spend chain-wide.': {
                      amount: formatEarnAmount(restaurantChain!.loyalty_points_earn_amount_cents)
                    }
              }}
            </p>
            <ng-template #chainLoyaltyDisabled>
              <p class="loyalty-note">
                {{ 'admin.loyalty.chainDisabled' | translate: 'The chain currently has loyalty points disabled.' }}
              </p>
            </ng-template>
          </ng-template>
        </ng-container>
      </ng-container>

      <ng-template #noRestaurantSelected>
        <p class="empty-state">
          {{ 'admin.loyalty.noRestaurant' | translate: 'Select a restaurant to manage loyalty settings.' }}
        </p>
      </ng-template>
    </section>
  `,
})
export class AdminRestaurantLoyaltyPage {
  private context = inject(AdminRestaurantContextService);
  private restaurantService = inject(RestaurantService);
  private i18n = inject(TranslationService);

  readonly selectedRestaurantId$ = this.context.selectedRestaurantId$;
  readonly selectedRestaurant$ = this.context.selectedRestaurant$.pipe(
    tap(restaurant => {
      this.restaurantChain = restaurant.chain ?? null;
      this.loyaltyForm = {
        enabled: Boolean(restaurant.loyalty_program_enabled),
        earnAmount: this.formatEarnAmount(restaurant.loyalty_points_earn_amount_cents),
      };
      this.loyaltyMessage = '';
      this.loyaltyMessageType = '';
      this.loyaltySaving = false;
    })
  );

  restaurantChain: Chain | null = null;
  loyaltyForm = {
    enabled: false,
    earnAmount: '',
  };
  loyaltySaving = false;
  loyaltyMessage = '';
  loyaltyMessageType: 'success' | 'error' | '' = '';

  async saveLoyaltySettings() {
    const restaurantId = this.context.selectedRestaurantId;
    if (restaurantId === null || this.loyaltySaving || this.restaurantChain) {
      return;
    }

    if (this.loyaltyForm.enabled) {
      const parsed = this.parseEarnAmount(this.loyaltyForm.earnAmount);
      if (!parsed.valid) {
        this.setLoyaltyMessage('error', 'admin.loyalty.invalidAmount', 'Enter a valid amount in euros.');
        return;
      }

      await this.persistLoyaltySettings(restaurantId, {
        loyalty_program_enabled: true,
        loyalty_points_earn_amount_cents: parsed.value,
      });
      return;
    }

    await this.persistLoyaltySettings(restaurantId, {
      loyalty_program_enabled: false,
      loyalty_points_earn_amount_cents: null,
    });
  }

  formatEarnAmount(cents: number | null | undefined): string {
    if (cents == null || Number.isNaN(cents)) {
      return '';
    }

    const euros = (cents / 100).toFixed(2);
    return euros.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  private async persistLoyaltySettings(restaurantId: number, payload: RestaurantUpdateInput) {
    this.loyaltySaving = true;
    this.loyaltyMessage = '';
    this.loyaltyMessageType = '';

    try {
      const updatedRestaurant = await firstValueFrom(this.restaurantService.update(restaurantId, payload));
      this.context.updateRestaurantInList(updatedRestaurant);
      this.context.refreshSelectedRestaurant();
      this.setLoyaltyMessage('success', 'admin.loyalty.saved', 'Loyalty settings updated.');
    } catch (error) {
      console.error('Failed to update loyalty settings', error);
      this.setLoyaltyMessage('error', 'admin.loyalty.error', 'Unable to update loyalty settings.');
    } finally {
      this.loyaltySaving = false;
    }
  }

  private parseEarnAmount(value: string | number | null | undefined): { valid: boolean; value: number } {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value <= 0) {
        return { valid: false, value: 0 };
      }

      const cents = Math.round(value * 100);
      return cents > 0 ? { valid: true, value: cents } : { valid: false, value: 0 };
    }

    if (value == null) {
      return { valid: false, value: 0 };
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
      return { valid: false, value: 0 };
    }

    const normalized = trimmed.replace(',', '.');
    const numeric = Number(normalized);

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return { valid: false, value: 0 };
    }

    const cents = Math.round(numeric * 100);
    if (cents <= 0) {
      return { valid: false, value: 0 };
    }

    return { valid: true, value: cents };
  }

  private setLoyaltyMessage(type: 'success' | 'error', key: string, fallback: string) {
    this.loyaltyMessage = this.i18n.translate(key, fallback);
    this.loyaltyMessageType = type;
  }
}
