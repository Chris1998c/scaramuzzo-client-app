import type { CustomerService } from '@/types/customerApi';

/**
 * Regola piega allineata 1:1 al backend Manager
 * (`lib/customer-app/customerBookingServiceRules.ts` + `lib/agendaServiceVisual.ts`).
 *
 * Backend: colore / schiariture / styling / trattamento (tecnico) / taglio (incluso
 * taglio "generico", trattato come taglio donna) richiedono almeno una piega nello
 * stesso booking. Taglio uomo / barber / barba e la piega stessa sono esclusi.
 *
 * La UI replica la classificazione per palette del backend così da non bloccare meno
 * (o più) del backend. Il confirm gestisce comunque il 400 residuo come rete di sicurezza
 * (es. `need_processing` non esposto dal DTO `/services`).
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

export function canContinueBooking(
  services: CustomerService[],
  selectedServiceIds: (string | number)[],
): boolean {
  if (selectedServiceIds.length === 0) {
    return false;
  }

  return getBlowDryRequirementState(services, selectedServiceIds).status === 'ok';
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
