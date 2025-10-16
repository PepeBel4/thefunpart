export const DEFAULT_BRAND_COLOR = '#06c167' as const;

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(HEX_COLOR_REGEX);
  if (!match) {
    return null;
  }

  const hex = match[1];
  if (hex.length === 3) {
    const [r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return `#${hex.toLowerCase()}`;
}

export function coerceHexColor(
  value: string | null | undefined,
  fallback: string = DEFAULT_BRAND_COLOR
): string {
  return normalizeHexColor(value) ?? normalizeHexColor(fallback) ?? DEFAULT_BRAND_COLOR;
}
