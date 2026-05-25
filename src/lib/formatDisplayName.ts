export type DisplayNameSource = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export type FormatDisplayNameOptions = {
  /** Saluto breve: solo nome. */
  mode?: 'greeting' | 'full';
};

const NAME_TOKEN = /^[a-zA-ZÀ-ÿ'’-]{2,24}$/u;

function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/gu, ' ');
}

function capitalizeToken(token: string): string {
  const trimmed = normalizeToken(token);
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function isValidNameToken(token: string): boolean {
  const trimmed = normalizeToken(token);
  return trimmed.length >= 2 && NAME_TOKEN.test(trimmed);
}

function cleanNameField(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = normalizeToken(String(value));
  if (!trimmed || !isValidNameToken(trimmed)) {
    return null;
  }

  return capitalizeToken(trimmed);
}

function collectEmailTokens(local: string): string[] {
  const segments = local
    .split(/[._-]+/u)
    .map((part) => part.replace(/^\d+/u, '').replace(/\d+$/u, '').trim())
    .filter((part) => isValidNameToken(part));

  const expanded = [...segments];

  for (const segment of segments) {
    if (segment.length < 7) {
      continue;
    }

    for (let i = 4; i <= segment.length - 3; i += 1) {
      const suffix = segment.slice(i);
      if (isValidNameToken(suffix)) {
        expanded.push(suffix);
      }
    }
  }

  return expanded;
}

function pickNameFromEmail(email: string): string | null {
  const local = email.split('@')[0]?.trim();
  if (!local) {
    return null;
  }

  const tokens = collectEmailTokens(local);
  if (tokens.length === 0) {
    return null;
  }

  const unique = [...new Set(tokens.map((t) => t.toLowerCase()))];

  const ranked = unique
    .map((lower) => {
      const display = capitalizeToken(lower);
      const isExactSegment = local.split(/[._-]+/u).some(
        (seg) => seg.replace(/\d+$/u, '').toLowerCase() === lower,
      );
      let score = display.length;

      if (isExactSegment) {
        score += 30;
      }
      if (display.length >= 6) {
        score += 20;
      }
      if (display.length <= 5) {
        score -= 10;
      }

      const dominated = unique.some(
        (other) => other !== lower && other.length > lower.length && other.startsWith(lower),
      );
      if (dominated) {
        score -= 40;
      }

      return { display, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.display ?? null;
}

/**
 * Nome da mostrare in UI (enterprise).
 * Priorità: first_name CRM → first+last elegante → email pulita.
 */
export function formatDisplayName(
  source: DisplayNameSource,
  options: FormatDisplayNameOptions = {},
): string | null {
  const mode = options.mode ?? 'greeting';
  const first = cleanNameField(source.firstName);
  const last = cleanNameField(source.lastName);

  if (mode === 'greeting') {
    if (first) {
      return first;
    }

    if (last) {
      return last;
    }
  }

  if (mode === 'full' && first && last) {
    return `${first} ${last}`;
  }

  if (first) {
    return first;
  }

  if (last) {
    return last;
  }

  if (source.email) {
    return pickNameFromEmail(source.email);
  }

  return null;
}

export function formatGreetingLabel(
  source: DisplayNameSource,
  options?: Omit<FormatDisplayNameOptions, 'mode'>,
): string {
  const name = formatDisplayName(source, { ...options, mode: 'greeting' });
  return name ? `Ciao, ${name}` : 'Ciao';
}
