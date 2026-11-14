import type { CustomerService } from '@/types/customerApi';

/**
 * Regole booking allineate al backend Manager
 * (`lib/customer-app/customerBookingServiceRules.ts` + `lib/agendaServiceVisual.ts`).
 *
 * 1) Piega obbligatoria: colore / schiariture / styling / trattamento (tecnico) /
 *    taglio donna richiedono almeno una piega. Taglio uomo / barber / barba esclusi.
 * 2) Composizione companion: per taglio donna / colore / schiariture / tecnico / erbe
 *    si assicurano shampoo + piega (senza duplicare se già scelti), ordine
 *    shampoo → servizi → piega.
 */

export type AgendaPaletteKey =
  | 'colorazione'
  | 'taglio'
  | 'trattamento'
  | 'schiariture'
  | 'styling'
  | 'piega'
  | 'default';

export type BlowDryRequirementStatus = 'ok' | 'missing_blow_dry' | 'blow_dry_unavailable';

export type BlowDryRequirementState =
  | { status: 'ok' }
  | {
      status: 'missing_blow_dry';
      blowDryService: CustomerService;
    }
  | { status: 'blow_dry_unavailable' };

export type CompanionRequirementState =
  | { status: 'ok' }
  | {
      status: 'missing_companions';
      missingShampoo: boolean;
      missingPiega: boolean;
      shampooService: CustomerService | null;
      blowDryService: CustomerService | null;
    }
  | { status: 'companions_unavailable'; missingShampoo: boolean; missingPiega: boolean };

function norm(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** `categoria | servizio` normalizzato, come `haystack()` lato backend. */
function haystack(service: CustomerService): string {
  const cat = norm(service.category_name);
  const svc = norm(service.name);
  return [cat, svc].filter(Boolean).join(' | ');
}

/**
 * Port di `resolveAgendaPaletteKey` (Manager): nome categoria + nome servizio → chiave palette.
 * Mantenere l'ordine e le regex identiche al backend.
 */
export function resolveAgendaPaletteKey(service: CustomerService): AgendaPaletteKey {
  const cat = norm(service.category_name);
  const svc = norm(service.name);
  const hay = [cat, svc].filter(Boolean).join(' | ');

  if (!hay) {
    return 'default';
  }

  const order: { key: AgendaPaletteKey; re: RegExp }[] = [
    {
      key: 'colorazione',
      re: /color|colour|tinta|tinto|colore|meches|meche|decolor|rifless|raccol|tonal|shampoo.?tinta|patch|henn/,
    },
    {
      key: 'schiariture',
      re: /schiar|bleach|balayage|ombr|airtouch|platin|chiar|carta|foli|highlights|schiuma|super.?blond/,
    },
    { key: 'taglio', re: /taglio|cut|scalp|barber|barba|punta|rasto|forbici/ },
    {
      key: 'trattamento',
      re: /trattament|kerat|ricostr|rigen|nutri|ristrutt|repair|maschera|botox.?cap|ossigen|reconstruction|therapy/,
    },
    { key: 'piega', re: /piega|phono|phon|asciug|brush|ceppi|finish.?piega|blower/ },
    {
      key: 'styling',
      re: /styling|style|moss|lisci|sleek|ondul|wavy|taylor|updo|raccolto.?cer|trecce|dread|crespo|curl|diffus/,
    },
  ];

  for (const { key, re } of order) {
    if (re.test(hay)) {
      return key;
    }
  }

  if (cat) {
    if (/taglio|cut/.test(cat)) return 'taglio';
    if (/trattament|kerat/.test(cat)) return 'trattamento';
    if (/color|tinta/.test(cat)) return 'colorazione';
    if (/styl|piega|finish/.test(cat)) return 'styling';
    if (/schiar/.test(cat)) return 'schiariture';
  }

  return 'default';
}

/** Piega / asciugatura / phon (palette dedicata) — port di `isCustomerAppPiegaService`. */
export function isBlowDryService(service: CustomerService): boolean {
  return resolveAgendaPaletteKey(service) === 'piega';
}

/** Shampoo / lavaggio (non shampoo-tinta). */
export function isShampooService(service: CustomerService): boolean {
  const hay = haystack(service);
  if (/shampoo\s*tinta|tinta\s*shampoo/.test(hay)) {
    return false;
  }
  return /shampoo|lavaggio|(^|[^a-z])wash([^a-z]|$)/.test(hay);
}

/** Taglio uomo / barber / barba — escluso dalla regola piega (port di `isCustomerAppMensHaircutService`). */
export function isMensHaircutService(service: CustomerService): boolean {
  const hay = haystack(service);

  if (/taglio\s*uomo|uomo\s*taglio|taglio\s*men|men\s*cut|barber|barbiere|barba\b/.test(hay)) {
    return true;
  }

  if (resolveAgendaPaletteKey(service) === 'taglio' && /\buomo\b|\bmen\b|barber|barba\b/.test(hay)) {
    return true;
  }

  return false;
}

/** Servizio tecnico (port di `isCustomerAppTechnicalService`). */
function isTechnicalService(service: CustomerService): boolean {
  if (service.need_processing === true) {
    return true;
  }

  const hay = haystack(service);
  if (/\btecnico\b|technical|preparaz|svern|mordenz|decap|applicaz/.test(hay)) {
    return true;
  }

  return resolveAgendaPaletteKey(service) === 'trattamento';
}

const REQUIRES_PIEGA_PALETTE_KEYS: ReadonlySet<AgendaPaletteKey> = new Set([
  'colorazione',
  'schiariture',
  'styling',
]);

/**
 * Servizio che obbliga la presenza di una piega nello stesso booking.
 * Port di `serviceRequiresPiegaCompanion`.
 */
export function requiresBlowDry(service: CustomerService): boolean {
  if (isBlowDryService(service) || isMensHaircutService(service)) {
    return false;
  }

  const paletteKey = resolveAgendaPaletteKey(service);

  if (REQUIRES_PIEGA_PALETTE_KEYS.has(paletteKey)) {
    return true;
  }

  // Taglio generico = taglio donna → richiede piega (allineato al backend).
  if (paletteKey === 'taglio') {
    return true;
  }

  if (isTechnicalService(service)) {
    return true;
  }

  return false;
}

/**
 * Taglio donna / colore / schiariture / tecnico / erbe → richiedono shampoo.
 * Port di `serviceRequiresShampooCompanion`.
 */
export function requiresShampooCompanion(service: CustomerService): boolean {
  if (isShampooService(service) || isBlowDryService(service) || isMensHaircutService(service)) {
    return false;
  }

  const paletteKey = resolveAgendaPaletteKey(service);
  if (paletteKey === 'colorazione' || paletteKey === 'schiariture' || paletteKey === 'taglio') {
    return true;
  }

  if (isTechnicalService(service)) {
    return true;
  }

  if (/erbe|botanic|henn/.test(haystack(service))) {
    return true;
  }

  return false;
}

function isServiceSelected(
  service: CustomerService,
  selectedServiceIds: (string | number)[],
): boolean {
  return selectedServiceIds.some((id) => String(id) === String(service.id));
}

function findBlowDryServices(services: CustomerService[]): CustomerService[] {
  return services.filter(isBlowDryService);
}

function findShampooServices(services: CustomerService[]): CustomerService[] {
  return services.filter(isShampooService);
}

/**
 * Ordine canonico: shampoo → servizi principali → piega.
 */
export function orderBookingServiceIds(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): (string | number)[] {
  const byId = new Map(services.map((service) => [String(service.id), service]));
  const shampoo: (string | number)[] = [];
  const middle: (string | number)[] = [];
  const piega: (string | number)[] = [];
  const seen = new Set<string>();

  for (const id of selectedServiceIds) {
    const key = String(id);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const service = byId.get(key);
    if (service && isShampooService(service)) {
      shampoo.push(id);
    } else if (service && isBlowDryService(service)) {
      piega.push(id);
    } else {
      middle.push(id);
    }
  }

  return [...shampoo, ...middle, ...piega];
}

/**
 * Compone il carrello con shampoo/piega obbligatori senza duplicarli.
 * Port di `composeCustomerBookingServiceIds`.
 */
export function composeBookingServiceIds(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): (string | number)[] {
  const selected = services.filter((service) => isServiceSelected(service, selectedServiceIds));
  const needsPiega = selected.some(requiresBlowDry);
  const needsShampoo = selected.some(requiresShampooCompanion);

  let next = [...selectedServiceIds];

  if (needsShampoo && !selected.some(isShampooService)) {
    const shampoo = findShampooServices(services)[0];
    if (shampoo) {
      next = [shampoo.id, ...next.filter((id) => String(id) !== String(shampoo.id))];
    }
  }

  if (needsPiega && !selected.some(isBlowDryService)) {
    const piega = findBlowDryServices(services)[0];
    if (piega) {
      next = [...next.filter((id) => String(id) !== String(piega.id)), piega.id];
    }
  }

  return orderBookingServiceIds(services, next);
}

/**
 * Stato regola piega per il carrello corrente (port di `evaluateCustomerBookingPiegaRule`).
 */
export function getBlowDryRequirementState(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): BlowDryRequirementState {
  const selected = services.filter((service) => isServiceSelected(service, selectedServiceIds));

  const needsPiega = selected.some(requiresBlowDry);
  if (!needsPiega) {
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

/** Stato companion (shampoo + piega) dopo eventuale composizione. */
export function getCompanionRequirementState(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): CompanionRequirementState {
  const selected = services.filter((service) => isServiceSelected(service, selectedServiceIds));
  const needsPiega = selected.some(requiresBlowDry);
  const needsShampoo = selected.some(requiresShampooCompanion);

  const hasPiega = selected.some(isBlowDryService);
  const hasShampoo = selected.some(isShampooService);

  const missingPiega = needsPiega && !hasPiega;
  const missingShampoo = needsShampoo && !hasShampoo;

  if (!missingPiega && !missingShampoo) {
    return { status: 'ok' };
  }

  const shampooService = findShampooServices(services)[0] ?? null;
  const blowDryService = findBlowDryServices(services)[0] ?? null;

  if ((missingShampoo && !shampooService) || (missingPiega && !blowDryService)) {
    return {
      status: 'companions_unavailable',
      missingShampoo,
      missingPiega,
    };
  }

  return {
    status: 'missing_companions',
    missingShampoo,
    missingPiega,
    shampooService,
    blowDryService,
  };
}

export function canContinueBooking(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): boolean {
  if (selectedServiceIds.length === 0) {
    return false;
  }

  return getCompanionRequirementState(services, selectedServiceIds).status === 'ok';
}

/** Durata effettiva riga (DTO Manager già espone duration = snapshot Agenda). */
export function effectiveServiceDurationMinutes(service: CustomerService): number {
  const duration = Number(service.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.trunc(duration);
}

/** Messaggio backend (400) quando manca la piega obbligatoria. */
export const PIEGA_REQUIRED_BACKEND_MESSAGE =
  'Per completare questa prenotazione aggiungi anche una piega.';

/** Vero se l'errore API è la regola piega obbligatoria del backend. */
export function isPiegaRequiredBackendMessage(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  const normalized = message.trim().toLowerCase();
  return (
    normalized === PIEGA_REQUIRED_BACKEND_MESSAGE.toLowerCase() ||
    (normalized.includes('aggiungi') && normalized.includes('piega'))
  );
}
