export const colors = {
  background: '#140905',
  surface: '#1b0d08',
  card: '#241109',
  border: '#5a3520',
  gold: '#c5a572',
  text: '#f5e7d6',
  muted: '#b99372',
} as const;

export type ColorToken = keyof typeof colors;
