/** Una sola intro per sessione JS (fino a chiusura completa dell'app). */
let introPlayed = false;

export function hasIntroPlayed(): boolean {
  return introPlayed;
}

export function markIntroPlayed(): void {
  introPlayed = true;
}
