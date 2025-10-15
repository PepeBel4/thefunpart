import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Allergen } from '../core/models';
import { AllergenIconDefinition, AllergenIconKey, getAllergenIconDefinition, resolveAllergenIconKey } from './allergen-icons';

@Component({
  standalone: true,
  selector: 'app-allergen-icon',
  imports: [NgIf, NgFor],
  template: `
    <span class="allergen-icon" [attr.data-icon]="iconKey" aria-hidden="true">
      <svg
        *ngIf="definition"
        [attr.viewBox]="definition.viewBox"
        focusable="false"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <ng-container *ngFor="let path of definition.paths ?? []">
          <path [attr.d]="path.d" [attr.fill]="path.fill ?? 'none'" [attr.stroke]="path.stroke"></path>
        </ng-container>
        <ng-container *ngFor="let circle of definition.circles ?? []">
          <circle
            [attr.cx]="circle.cx"
            [attr.cy]="circle.cy"
            [attr.r]="circle.r"
            [attr.fill]="circle.fill ?? 'currentColor'"
            [attr.stroke]="circle.stroke"
          ></circle>
        </ng-container>
      </svg>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      --allergen-icon-bg: rgba(229, 62, 62, 0.12);
      --allergen-icon-color: #8f1e1e;
      --allergen-icon-border: rgba(143, 30, 30, 0.1);
    }

    .allergen-icon {
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 999px;
      background: var(--allergen-icon-bg);
      color: var(--allergen-icon-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 0 1px var(--allergen-icon-border);
    }

    svg {
      width: 1rem;
      height: 1rem;
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllergenIconComponent {
  iconKey: AllergenIconKey = 'default';
  definition: AllergenIconDefinition = getAllergenIconDefinition('default');

  @Input() set allergen(value: Allergen | undefined) {
    this.setIcon(resolveAllergenIconKey(value));
  }

  @Input() set icon(key: AllergenIconKey) {
    this.setIcon(key);
  }

  private setIcon(key: AllergenIconKey) {
    this.iconKey = key;
    this.definition = getAllergenIconDefinition(key);
  }
}
