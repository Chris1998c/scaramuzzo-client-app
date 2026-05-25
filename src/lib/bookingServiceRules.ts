import type { CustomerService } from '@/types/customerApi';

const TECHNICAL_CATEGORY_KEYWORDS = [
  'colore',
  'colorazione',
  'erbe',
  'botaniche',
  'henne',
  'henna',
  'gloss',
  'tonalizz',
  'schiaritur',
  'balayage',
  'meches',
  'mech',
  'decolor',
  'permanente',
  'stiratura',
  'keratina',
  'trattamento tecnico',
] as const;

const TECHNICAL_NAME_KEYWORDS = [...TECHNICAL_CATEGORY_KEYWORDS] as const;

const BLOW_DRY_NAME_KEYWORDS = ['piega', 'blow dry', 'blowdry', 'asciugatura'] as const;

const BLOW_DRY_CATEGORY_KEYWORDS = ['styling', 'finish', 'finishing', 'piega'] as const;

export type BlowDryRequirementStatus = 'ok' | 'missing_blow_dry' | 'blow_dry_unavailable';

export type BlowDryRequirementState =
  | { status: 'ok' }
  | {
      status: 'missing_blow_dry';
      blowDryService: CustomerService;
    }
  | { status: 'blow_dry_unavailable' };

function normalizeSearchText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

function containsKeyword(haystack: string, keyword: string): boolean {
  return haystack.includes(keyword);
}

function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => containsKeyword(text, keyword));
}

function isTaglioUomoService(service: CustomerService): boolean {
  const name = normalizeSearchText(service.name);
  const category = normalizeSearchText(service.category_name);

  const hasTaglio = containsKeyword(name, 'taglio') || containsKeyword(category, 'taglio');
  const hasUomo =
    containsKeyword(name, 'uomo') ||
    containsKeyword(name, 'barba') ||
    containsKeyword(category, 'uomo') ||
    containsKeyword(category, 'barba');

  return hasTaglio && hasUomo;
}

/** Servizio piega / blow dry (finish obbligatorio per servizi tecnici). */
export function isBlowDryService(service: CustomerService): boolean {
  const name = normalizeSearchText(service.name);
  const category = normalizeSearchText(service.category_name);

  if (matchesAnyKeyword(name, BLOW_DRY_NAME_KEYWORDS)) {
    return true;
  }

  if (matchesAnyKeyword(category, BLOW_DRY_CATEGORY_KEYWORDS) && containsKeyword(name, 'piega')) {
    return true;
  }

  return containsKeyword(category, 'piega') && !containsKeyword(category, 'colore');
}

/**
 * Servizio tecnico/stilistico che richiede piega in aggiunta.
 * Escluso: piega stessa, taglio uomo.
 */
export function requiresBlowDry(service: CustomerService): boolean {
  if (isBlowDryService(service)) {
    return false;
  }

  if (isTaglioUomoService(service)) {
    return false;
  }

  const name = normalizeSearchText(service.name);
  const category = normalizeSearchText(service.category_name);

  if (matchesAnyKeyword(category, TECHNICAL_CATEGORY_KEYWORDS)) {
    return true;
  }

  if (matchesAnyKeyword(name, TECHNICAL_NAME_KEYWORDS)) {
    return true;
  }

  const isTaglioDonna =
    (containsKeyword(name, 'taglio') || containsKeyword(category, 'taglio')) &&
    (containsKeyword(name, 'donna') ||
      containsKeyword(name, 'donne') ||
      containsKeyword(category, 'donna') ||
      containsKeyword(category, 'donne'));

  if (isTaglioDonna && !containsKeyword(name, 'uomo') && !containsKeyword(category, 'uomo')) {
    return true;
  }

  return false;
}

function findBlowDryServices(services: CustomerService[]): CustomerService[] {
  return services.filter(isBlowDryService);
}

function isServiceSelected(
  service: CustomerService,
  selectedServiceIds: (string | number)[],
): boolean {
  return selectedServiceIds.some((id) => String(id) === String(service.id));
}

/**
 * Stato regola piega per il carrello corrente.
 */
export function getBlowDryRequirementState(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): BlowDryRequirementState {
  const selected = services.filter((service) => isServiceSelected(service, selectedServiceIds));

  const requiresTechnical = selected.some(requiresBlowDry);
  if (!requiresTechnical) {
    return { status: 'ok' };
  }

  if (selected.some(isBlowDryService)) {
    return { status: 'ok' };
  }

  const blowDryOptions = findBlowDryServices(services);
  if (blowDryOptions.length === 0) {
    return { status: 'blow_dry_unavailable' };
  }

  return {
    status: 'missing_blow_dry',
    blowDryService: blowDryOptions[0],
  };
}

export function canContinueBooking(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): boolean {
  if (selectedServiceIds.length === 0) {
    return false;
  }

  return getBlowDryRequirementState(services, selectedServiceIds).status === 'ok';
}
