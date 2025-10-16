import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { DEFAULT_BRAND_COLOR, normalizeHexColor } from './color-utils';

@Injectable({ providedIn: 'root' })
export class BrandColorService {
  private readonly defaultColor: string;
  private readonly defaultOnPrimary = '#042f1a';
  private currentOverride: string | null = null;
  private appliedColor: string;

  constructor(@Inject(DOCUMENT) private document: Document) {
    const root = this.document.documentElement;
    const computedStyle = this.document.defaultView?.getComputedStyle(root);
    const color = computedStyle
      ? normalizeHexColor(computedStyle.getPropertyValue('--brand-green'))
      : null;
    const onPrimary = computedStyle
      ? normalizeHexColor(computedStyle.getPropertyValue('--brand-on-primary'))
      : null;

    this.defaultColor = color ?? DEFAULT_BRAND_COLOR;
    this.appliedColor = this.defaultColor;

    if (!onPrimary) {
      root.style.setProperty('--brand-on-primary', this.defaultOnPrimary);
    }
  }

  setOverride(color: string | null | undefined): void {
    const normalized = normalizeHexColor(color);

    if (!normalized) {
      this.applyIfNeeded(this.defaultColor);
      this.currentOverride = null;
      return;
    }

    this.applyIfNeeded(normalized);
    this.currentOverride = normalized === this.defaultColor ? null : normalized;
  }

  reset(): void {
    this.currentOverride = null;
    this.applyIfNeeded(this.defaultColor);
  }

  private applyColor(hex: string): void {
    const normalizedHex = hex.toLowerCase();
    const rgbValues = this.hexToRgbArray(normalizedHex);
    const root = this.document.documentElement;

    if (rgbValues) {
      root.style.setProperty('--brand-green-rgb', rgbValues.join(', '));
      const onPrimary =
        normalizedHex === this.defaultColor ? this.defaultOnPrimary : this.determineOnPrimary(rgbValues);
      root.style.setProperty('--brand-on-primary', onPrimary);
    }

    root.style.setProperty('--brand-green', normalizedHex);
  }

  private applyIfNeeded(hex: string): void {
    if (this.appliedColor === hex) {
      return;
    }

    this.applyColor(hex);
    this.appliedColor = hex;
  }

  private determineOnPrimary(rgb: [number, number, number]): string {
    const luminance = this.relativeLuminance(rgb);
    const contrastWithBlack = this.contrastRatio(luminance, 0);
    const contrastWithWhite = this.contrastRatio(luminance, 1);

    if (contrastWithBlack >= contrastWithWhite) {
      return '#0a0a0a';
    }

    return '#ffffff';
  }

  private contrastRatio(l1: number, l2: number): number {
    const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
    return (lighter + 0.05) / (darker + 0.05);
  }

  private relativeLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private hexToRgbArray(hex: string): [number, number, number] | null {
    const normalized = normalizeHexColor(hex);
    if (!normalized) {
      return null;
    }

    const value = normalized.slice(1);
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);

    return [r, g, b];
  }

}
