export const RESTAURANT_CUISINES: readonly string[] = [
  'grocery',
  'pizza',
  'sushi',
  'halal',
  'fast food',
  'burgers',
  'desserts',
  'indian',
  'poke',
  'korean',
  'asian',
  'healthy',
  'thai',
  'chinese',
  'bbq',
  'mexican',
  'wings',
  'italian',
  'soup',
  'ice cream',
  'bakery',
  'bubble tea',
  'breakfast',
  'comfort food',
  'vietnamese',
  'america',
  'sandwich',
  'greek',
  'vegan',
  'soul food',
  'seafood',
  'japanase',
  'hawaiian',
  'smoothies',
  'coffee',
  'kosher',
  'street food',
  'caribbean',
  'taiwanese',
  ];

export type RestaurantCuisine = (typeof RESTAURANT_CUISINES)[number];

export function normalizeRestaurantCuisines(
  cuisines: string[] | undefined,
  orderedList: readonly string[] = RESTAURANT_CUISINES,
): string[] | undefined {
  if (!cuisines?.length) {
    return undefined;
  }

  const sanitized = cuisines
    .map(cuisine => cuisine?.trim())
    .filter((cuisine): cuisine is string => Boolean(cuisine))
    .map(cuisine => cuisine.toLowerCase());

  if (!sanitized.length) {
    return undefined;
  }

  const unique = Array.from(new Set(sanitized));
  const ordered = orderedList.filter(cuisine => unique.includes(cuisine));
  const extras = unique.filter(cuisine => !orderedList.includes(cuisine));
  const combined = [...ordered, ...extras];

  return combined.length ? combined : undefined;
}
