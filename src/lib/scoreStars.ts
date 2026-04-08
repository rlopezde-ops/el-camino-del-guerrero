/** accuracy is 0–1 from session storage */
export function accuracyToStars(accuracy: number): 0 | 1 | 2 | 3 {
  const pct = Math.round(accuracy * 100);
  if (pct >= 96) return 3;
  if (pct >= 90) return 2;
  if (pct >= 80) return 1;
  return 0;
}

export function starsLabel(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}
