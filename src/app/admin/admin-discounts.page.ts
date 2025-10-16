import { Component } from '@angular/core';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-discounts',
  imports: [TranslatePipe],
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

    ul {
      margin: 0;
      padding-left: 1.25rem;
      display: grid;
      gap: 0.5rem;
    }

    li {
      color: var(--text-secondary);
      line-height: 1.4;
    }
  `],
  template: `
    <section class="card">
      <header>
        <h3>{{ 'admin.discounts.heading' | translate: 'Manage discounts' }}</h3>
        <p>
          {{
            'admin.discounts.description'
              | translate:
                  'Plan time-limited promotions and reward loyal guests with targeted offers.'
          }}
        </p>
      </header>

      <p>
        {{
          'admin.discounts.placeholder'
            | translate:
                'Discount tooling is coming soon. In the meantime, outline the offers you want to run so your team can schedule them.'
        }}
      </p>
      <ul>
        <li>{{ 'admin.discounts.todoOne' | translate: 'Note the discount name and duration.' }}</li>
        <li>{{ 'admin.discounts.todoTwo' | translate: 'List which menu items or categories are included.' }}</li>
        <li>{{ 'admin.discounts.todoThree' | translate: 'Share redemption rules with staff so guests get a consistent experience.' }}</li>
      </ul>
    </section>
  `,
})
export class AdminDiscountsPage {}
