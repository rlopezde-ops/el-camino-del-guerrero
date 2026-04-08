/** Split a Spanish phrase into one tile per word (preserves ¿ ¡ ? ! on tokens). */
export function splitIntoKataTiles(phrase: string): string[] {
  return phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

/** Flatten template tokens so multi-word strings become separate tiles. */
export function expandKataTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const t of tokens) {
    out.push(...splitIntoKataTiles(t));
  }
  return out;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
