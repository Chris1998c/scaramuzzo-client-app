export type CustomerNameFields = {
  first_name?: string | null;
  last_name?: string | null;
};

export type FormatUserDisplayNameInput = {
  email?: string | null;
  customer?: CustomerNameFields | null;
  userMetadata?: Record<string, unknown> | null;
};

function capitalizeWord(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function isAlphabeticToken(token: string): boolean {
  return /^[a-zA-Z]{3,20}$/u.test(token);
}

function stripDigits(token: string): string {
  return token.replace(/^\d+/u, '').replace(/\d+$/u, '').trim();
}

/** Candidati nome dalla parte locale dell'email. */
function collectEmailNameCandidates(local: string): string[] {
  const rawSegments = local.split(/[._-]+/u).filter(Boolean);
  const cleanedSegments: string[] = [];

  for (const segment of rawSegments) {
    const cleaned = stripDigits(segment);
    if (!cleaned || !/^[a-zA-Z]+$/u.test(cleaned)) {
      continue;
    }

    cleanedSegments.push(cleaned);

    if (cleaned.length >= 7) {
      for (let i = 4; i <= cleaned.length - 3; i += 1) {
        const prefix = cleaned.slice(0, i);
        const suffix = cleaned.slice(i);
        if (isAlphabeticToken(prefix)) {
          cleanedSegments.push(prefix);
        }
        if (isAlphabeticToken(suffix)) {
          cleanedSegments.push(suffix);
        }
      }
    }
  }

  return cleanedSegments;
}

function scoreEmailNameCandidate(candidate: string, exactSegments: Set<string>): number {
  const lower = candidate.toLowerCase();
  let score = 0;

  if (exactSegments.has(lower)) {
    score += 40;
  }

  if (lower.length >= 6 && lower.length <= 11) {
    score += 18;
  } else if (lower.length >= 4 && lower.length <= 5) {
    score += 8;
  }

  if (lower.length > 12) {
    score -= 25;
  }

  if (!exactSegments.has(lower) && lower.length >= 7) {
    score -= 8;
  }

  return score;
}

/**
 * Estrae un nome leggibile dalla parte locale dell'email.
 * Es. contechristian.98 → Christian, christian.conte → Christian.
 */
export function formatNameFromEmailLocal(email: string): string | null {
  const local = email.split('@')[0]?.trim();
  if (!local) {
    return null;
  }

  const rawParts = local
    .split(/[._-]+/u)
    .map(stripDigits)
    .filter((part) => part.length > 0 && /^[a-zA-Z]+$/u.test(part));

  const exactSegments = new Set(rawParts.map((p) => p.toLowerCase()));
  const candidates = collectEmailNameCandidates(local);

  const ranked = [...new Set(candidates.map((c) => capitalizeWord(c)).filter((c) => c.length >= 3))]
    .map((name) => ({ name, score: scoreEmailNameCandidate(name, exactSegments) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.name ?? null;
}

function firstNameFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) {
    return null;
  }

  const first =
    typeof metadata.first_name === 'string'
      ? metadata.first_name
      : typeof metadata.given_name === 'string'
        ? metadata.given_name
        : null;

  if (first?.trim()) {
    return capitalizeWord(first.split(/\s+/u)[0] ?? first);
  }

  if (typeof metadata.full_name === 'string' && metadata.full_name.trim()) {
    const word = metadata.full_name.trim().split(/\s+/u)[0];
    return word ? capitalizeWord(word) : null;
  }

  return null;
}

/**
 * Solo nome (senza cognome) per saluti UI.
 * Ordine: anagrafica cliente → metadata auth → email pulita.
 */
export function formatUserDisplayName(input: FormatUserDisplayNameInput): string {
  const first = input.customer?.first_name?.trim();
  if (first) {
    return capitalizeWord(first.split(/\s+/u)[0] ?? first);
  }

  const fromMeta = firstNameFromMetadata(input.userMetadata ?? undefined);
  if (fromMeta) {
    return fromMeta;
  }

  if (input.email) {
    const fromEmail = formatNameFromEmailLocal(input.email);
    if (fromEmail) {
      return fromEmail;
    }
  }

  return '';
}

export function formatGreeting(input: FormatUserDisplayNameInput): string {
  const name = formatUserDisplayName(input);
  return name ? `Ciao, ${name}` : 'Ciao';
}
