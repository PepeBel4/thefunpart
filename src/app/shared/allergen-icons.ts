import { Allergen } from '../core/models';

export type AllergenIconKey =
  | 'gluten'
  | 'peanut'
  | 'nuts'
  | 'dairy'
  | 'egg'
  | 'fish'
  | 'shellfish'
  | 'soy'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'sulfite'
  | 'lupin'
  | 'mollusc'
  | 'default';

export interface AllergenIconPath {
  d: string;
  fill?: string;
  stroke?: string;
}

export interface AllergenIconCircle {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
}

export interface AllergenIconDefinition {
  viewBox: string;
  paths?: AllergenIconPath[];
  circles?: AllergenIconCircle[];
}

const ICON_DEFINITIONS: Record<AllergenIconKey, AllergenIconDefinition> = {
  gluten: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3v18' },
      { d: 'M12 5c-2 2-3 4.5-3 6.5s1 4.5 3 6.5' },
      { d: 'M12 5c2 2 3 4.5 3 6.5s-1 4.5-3 6.5' },
      { d: 'M9 9h6' },
      { d: 'M9 13h6' },
      { d: 'M9 17h6' },
    ],
  },
  peanut: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M9 5.5C9 3.6 10.5 2 12.4 2c2 0 3.6 1.6 3.6 3.5 0 1.2-.5 2.3-1.4 3.1-.9.8-1.4 1.9-1.4 3.1 0 1.6 1 3 2.4 3.7 1 .5 1.8 1.4 2.2 2.4.4 1 .4 2.1-.2 3-.8 1.3-2.3 1.9-3.7 1.6-1.5-.3-3 .3-3.9 1.6' },
      { d: 'M9 5.5C9 7.4 7.4 9 5.5 9 3.6 9 2 7.4 2 5.5 2 3.6 3.6 2 5.5 2 7.4 2 9 3.6 9 5.5Z' },
      { d: 'M9 18.5C9 20.4 7.4 22 5.5 22 3.6 22 2 20.4 2 18.5 2 16.6 3.6 15 5.5 15 7.4 15 9 16.6 9 18.5Z' },
    ],
  },
  nuts: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3c3.2 0 6 1.9 6 4.8 0 2.2-1.7 3.6-3.4 4.6-1.2.7-1.6 2.3-1 3.6.4.8.4 1.8 0 2.6-.7 1.5-2.3 2.4-4 2.4s-3.3-.9-4-2.4c-.4-.8-.4-1.8 0-2.6.6-1.3.2-2.9-1-3.6C7.7 11.4 6 10 6 7.8 6 4.9 8.8 3 12 3Z' },
      { d: 'M12 3v18' },
    ],
  },
  dairy: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M9 3h6l2 3v14H7V6l2-3Z' },
      { d: 'M9 8h6' },
      { d: 'M9 12h6' },
    ],
  },
  egg: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 4c-3 0-5 3.5-5 7 0 3.6 2.2 7 5 7s5-3.4 5-7c0-3.5-2-7-5-7Z' },
      { d: 'M12 11.5a1.6 1.6 0 1 0 .01 0' },
    ],
  },
  fish: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 12c1.5-2.8 4.2-4.5 7.5-4.5 2.5 0 4.8.9 6.5 2.5l4-2-2 4 2 4-4-2c-1.7 1.6-4 2.5-6.5 2.5C7.2 16.5 4.5 14.8 3 12Z' },
      { d: 'M15 12h0.01' },
    ],
  },
  shellfish: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 4c4.1 0 7.5 3.4 7.5 7.5S16.1 19 12 19 4.5 15.6 4.5 11.5 7.9 4 12 4Z' },
      { d: 'M5.5 11.5c1.5-1.8 3.9-3 6.5-3s5 1.2 6.5 3' },
      { d: 'M12 8.5V20' },
    ],
  },
  soy: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M9 4.5c-2 1.5-3 4.2-2.2 6.7.8 2.4 3.2 3.8 5.7 3.2 2-.5 3.6.3 4.5 2 .8 1.6.6 3.5-.6 4.8-1.4 1.5-3.7 1.8-5.4.7-2.6-1.6-5-4.8-5.9-8.1-.9-3.2.2-6.8 3.9-9.3' },
      { d: 'M14.5 4c1.2.9 2 2.3 2 3.8 0 2.3-1.7 4.2-3.9 4.6' },
    ],
  },
  sesame: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3.5c1.6 0 3 1.8 3 4 0 1.9-1.1 3.6-3 5.3-1.9-1.7-3-3.4-3-5.3 0-2.2 1.4-4 3-4Z' },
      { d: 'M6 11.5c1.4 0 2.5 1.5 2.5 3.3 0 1.6-.9 3.1-2.5 4.5-1.6-1.4-2.5-2.9-2.5-4.5 0-1.8 1.1-3.3 2.5-3.3Z' },
      { d: 'M18 11.5c1.4 0 2.5 1.5 2.5 3.3 0 1.6-.9 3.1-2.5 4.5-1.6-1.4-2.5-2.9-2.5-4.5 0-1.8 1.1-3.3 2.5-3.3Z' },
    ],
  },
  mustard: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3c2.2 0 4 1.8 4 4 0 1.7-1.1 3.2-2.7 3.7-1.7.6-2.8 2.2-2.8 4 0 2.2 1.8 4 4 4h1.5' },
      { d: 'M7 7c0-2.2 1.8-4 4-4' },
      { d: 'M7 7c0 1.7 1.1 3.2 2.7 3.7 1.7.6 2.8 2.2 2.8 4 0 2.2-1.8 4-4 4H7' },
      { d: 'M6 19h12' },
    ],
  },
  celery: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 3c0 1.5.7 3 2 3.8 1.3.8 2 2.3 2 3.8v11' },
      { d: 'M16 3c0 1.5-.7 3-2 3.8-1.3.8-2 2.3-2 3.8' },
      { d: 'M6 7c0-1.7 1.3-3 3-3' },
      { d: 'M18 7c0-1.7-1.3-3-3-3' },
      { d: 'M10 13h4' },
    ],
  },
  sulfite: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 3h8l1.5 3v8c0 3-2.2 5.5-5.5 5.5S6.5 17 6.5 14V6L8 3Z' },
      { d: 'M9 8h6' },
      { d: 'M10 12h4' },
    ],
  },
  lupin: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3c2 1.8 3 4 3 6 0 2.3-1.2 4.4-3 6.2-1.8-1.8-3-3.9-3-6.2 0-2 1-4.2 3-6Z' },
      { d: 'M8 13c-1.3 1-2 2.5-2 4 0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4 0-1.5-.7-3-2-4' },
      { d: 'M12 9v12' },
    ],
  },
  mollusc: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8Z' },
      { d: 'M6 12c1.2-2.5 3.7-4 6-4s4.8 1.5 6 4' },
      { d: 'M12 8v12' },
    ],
  },
  default: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 4 4 20h16L12 4Z' },
      { d: 'M12 10v4' },
      { d: 'M12 16h.01' },
    ],
  },
};

const NORMALIZED_LOOKUP: Record<string, AllergenIconKey> = {
  gluten: 'gluten',
  wheat: 'gluten',
  barley: 'gluten',
  rye: 'gluten',
  oats: 'gluten',
  oat: 'gluten',
  spelt: 'gluten',
  kamut: 'gluten',
  peanut: 'peanut',
  peanuts: 'peanut',
  groundnut: 'peanut',
  groundnuts: 'peanut',
  nut: 'nuts',
  nuts: 'nuts',
  walnut: 'nuts',
  walnuts: 'nuts',
  almond: 'nuts',
  almonds: 'nuts',
  hazelnut: 'nuts',
  hazelnuts: 'nuts',
  pistachio: 'nuts',
  pistachios: 'nuts',
  cashew: 'nuts',
  cashews: 'nuts',
  pecan: 'nuts',
  pecans: 'nuts',
  macadamia: 'nuts',
  macadamias: 'nuts',
  milk: 'dairy',
  dairy: 'dairy',
  lactose: 'dairy',
  butter: 'dairy',
  cheese: 'dairy',
  yoghurt: 'dairy',
  yogurt: 'dairy',
  cream: 'dairy',
  egg: 'egg',
  eggs: 'egg',
  eggwhite: 'egg',
  eggyolk: 'egg',
  fish: 'fish',
  salmon: 'fish',
  tuna: 'fish',
  cod: 'fish',
  haddock: 'fish',
  anchovy: 'fish',
  anchovies: 'fish',
  shellfish: 'shellfish',
  crustacean: 'shellfish',
  crustaceans: 'shellfish',
  shrimp: 'shellfish',
  prawns: 'shellfish',
  prawn: 'shellfish',
  crab: 'shellfish',
  lobster: 'shellfish',
  crayfish: 'shellfish',
  soy: 'soy',
  soya: 'soy',
  soybean: 'soy',
  soybeans: 'soy',
  edamame: 'soy',
  tofu: 'soy',
  sesame: 'sesame',
  sesameseed: 'sesame',
  sesameseeds: 'sesame',
  tahini: 'sesame',
  mustard: 'mustard',
  mustardseed: 'mustard',
  mustardseeds: 'mustard',
  celery: 'celery',
  celeriac: 'celery',
  sulphur: 'sulfite',
  sulphurdioxide: 'sulfite',
  sulphites: 'sulfite',
  sulfite: 'sulfite',
  sulfites: 'sulfite',
  e220: 'sulfite',
  lupin: 'lupin',
  lupine: 'lupin',
  mollusc: 'mollusc',
  molluscs: 'mollusc',
  clam: 'mollusc',
  clams: 'mollusc',
  mussel: 'mollusc',
  mussels: 'mollusc',
  oyster: 'mollusc',
  oysters: 'mollusc',
};

function normalize(value: string | undefined | null): string {
  if (!value) {
    return '';
  }
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');
}

export function resolveAllergenIconKey(allergen: Allergen | undefined): AllergenIconKey {
  if (!allergen) {
    return 'default';
  }

  if (allergen.id != null) {
    const byId = ID_LOOKUP[allergen.id];
    if (byId) {
      return byId;
    }
  }

  const candidates = new Set<string>();

  if (allergen.name) {
    candidates.add(allergen.name);
  }

  if (allergen.name_translations) {
    for (const value of Object.values(allergen.name_translations)) {
      if (value) {
        candidates.add(value);
      }
    }
  }

  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized) {
      continue;
    }

    const direct = NORMALIZED_LOOKUP[normalized];
    if (direct) {
      return direct;
    }

    for (const { key, pattern } of KEYWORD_PATTERNS) {
      if (pattern.test(candidate)) {
        return key;
      }
    }
  }

  return 'default';
}

export function getAllergenIconDefinition(key: AllergenIconKey): AllergenIconDefinition {
  return ICON_DEFINITIONS[key] ?? ICON_DEFINITIONS.default;
}

const ID_LOOKUP: Record<number, AllergenIconKey> = {};

const KEYWORD_PATTERNS: { key: AllergenIconKey; pattern: RegExp }[] = [
  { key: 'peanut', pattern: /peanut/i },
  { key: 'nuts', pattern: /nut/i },
  { key: 'shellfish', pattern: /(shellfish|crustacean|shrimp|prawn|lobster|crab)/i },
  { key: 'mollusc', pattern: /(mollusc|clam|mussel|oyster|scallop)/i },
  { key: 'gluten', pattern: /(gluten|wheat|barley|rye|oat)/i },
  { key: 'dairy', pattern: /(milk|dairy|lactose|cheese|butter|cream)/i },
  { key: 'egg', pattern: /egg/i },
  { key: 'fish', pattern: /(fish|salmon|tuna|cod|anchovy|haddock)/i },
  { key: 'soy', pattern: /(soy|soya|tofu|edamame)/i },
  { key: 'sesame', pattern: /(sesame|tahini)/i },
  { key: 'mustard', pattern: /mustard/i },
  { key: 'celery', pattern: /(celery|celeriac)/i },
  { key: 'sulfite', pattern: /(sulph|sulf|e220)/i },
  { key: 'lupin', pattern: /lupin/i },
];

