import { NgForOf, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { RestaurantPhoto } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-menu-item-photo-slider',
  imports: [NgForOf, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }

    .photo-slider {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      aspect-ratio: 4 / 3;
      background: rgba(10, 10, 10, 0.04);
      box-shadow: inset 0 0 0 1px rgba(10, 10, 10, 0.04);
    }

    .photo-slider img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transform: scale(1.02);
      transition: opacity 0.6s ease, transform 0.6s ease;
      will-change: opacity, transform;
    }

    .photo-slider img.active {
      opacity: 1;
      transform: scale(1);
      z-index: 2;
    }

    .photo-slider img.previous {
      opacity: 0;
      z-index: 1;
    }

    .photo-slider.single img {
      position: relative;
      opacity: 1;
      transform: none;
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .photo-slider img {
        transition-duration: 0.01ms;
      }
    }
  `],
  template: `
    <div class="photo-slider" *ngIf="photos?.length" [class.single]="(photos?.length ?? 0) === 1">
      <img
        *ngFor="let photo of photos || []; index as i"
        [src]="photo.url"
        [alt]="createAltText(i)"
        loading="lazy"
        [class.active]="i === currentIndex"
        [class.previous]="previousIndex === i && (photos?.length ?? 0) > 1"
      />
    </div>
  `,
})
export class MenuItemPhotoSliderComponent implements OnChanges, OnDestroy, OnInit {
  @Input() photos: RestaurantPhoto[] | null | undefined = [];
  @Input() itemName = '';

  currentIndex = 0;
  previousIndex: number | null = null;

  private readonly intervalMs = 5000;
  private timerId: number | null = null;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.restartTimer();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['photos']) {
      this.currentIndex = 0;
      this.previousIndex = null;
      this.restartTimer();
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private restartTimer() {
    this.clearTimer();
    const total = this.photos?.length ?? 0;
    if (total <= 1) { return; }

    this.zone.runOutsideAngular(() => {
      this.timerId = window.setInterval(() => {
        this.zone.run(() => {
          this.previousIndex = this.currentIndex;
          this.currentIndex = (this.currentIndex + 1) % total;
          this.cdr.markForCheck();
        });
      }, this.intervalMs);
    });
  }

  private clearTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  createAltText(index: number) {
    const name = this.itemName?.trim();
    const base = name ? `${name} photo` : 'Menu item photo';
    return `${base} ${index + 1}`;
  }
}
