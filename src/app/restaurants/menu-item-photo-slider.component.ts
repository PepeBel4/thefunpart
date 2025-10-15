import { NgForOf, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { RestaurantPhoto } from '../core/models';

type SliderPhoto = Pick<RestaurantPhoto, 'url'>;

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
    <div class="photo-slider" *ngIf="displayPhotos.length" [class.single]="displayPhotos.length === 1">
      <img
        *ngFor="let photo of displayPhotos; index as i"
        [src]="photo.url"
        [alt]="createAltText(i)"
        loading="lazy"
        [class.active]="i === currentIndex"
        [class.previous]="previousIndex === i && displayPhotos.length > 1"
      />
    </div>
  `,
})
export class MenuItemPhotoSliderComponent implements OnDestroy, OnInit {
  readonly displayPhotos: SliderPhoto[] = [];

  @Input()
  set photos(value: ReadonlyArray<RestaurantPhoto | string> | null | undefined) {
    this.replacePhotos(value);
  }

  @Input() itemName = '';

  currentIndex = 0;
  previousIndex: number | null = null;

  private readonly intervalMs = 5000;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = typeof window !== 'undefined';

  ngOnInit() {
    this.restartTimer();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private restartTimer() {
    this.clearTimer();
    const total = this.displayPhotos.length;
    if (!this.isBrowser || total <= 1) { return; }

    this.zone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
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
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private replacePhotos(value: ReadonlyArray<RestaurantPhoto | string> | null | undefined) {
    this.displayPhotos.splice(0, this.displayPhotos.length);

    if (value?.length) {
      for (const entry of value) {
        const url = typeof entry === 'string' ? entry : entry?.url;
        if (url) {
          this.displayPhotos.push({ url });
        }
      }
    }

    this.currentIndex = 0;
    this.previousIndex = null;
    this.restartTimer();
    this.cdr.markForCheck();
  }

  createAltText(index: number) {
    const name = this.itemName?.trim();
    const base = name ? `${name} photo` : 'Menu item photo';
    return `${base} ${index + 1}`;
  }
}
