import { db } from '../db';
import type { TechniqueProgress, Technique } from '../types';

const INITIAL_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const HALF_LIFE_FACTOR = 2.0;
const MIN_STRENGTH = 0;
const MAX_STRENGTH = 1;

function computeStrength(progress: TechniqueProgress): number {
  const elapsed = Date.now() - progress.lastReviewed.getTime();
  const halfLife = INITIAL_INTERVAL_MS * Math.pow(HALF_LIFE_FACTOR, progress.reviewCount - 1);
  const decay = Math.pow(0.5, elapsed / halfLife);
  return Math.max(MIN_STRENGTH, Math.min(MAX_STRENGTH, progress.strength * decay));
}

function computeNextReview(progress: TechniqueProgress, correct: boolean): Date {
  const baseInterval = INITIAL_INTERVAL_MS * Math.pow(HALF_LIFE_FACTOR, progress.reviewCount);
  const factor = correct ? 1.0 : 0.3;
  const interval = baseInterval * factor;
  return new Date(Date.now() + interval);
}

export async function recordReview(
  profileId: number,
  techniqueId: string,
  correct: boolean,
): Promise<TechniqueProgress> {
  const existing = await db.techniqueProgress
    .where('[profileId+techniqueId]')
    .equals([profileId, techniqueId])
    .first();

  if (existing) {
    const newStrength = correct
      ? Math.min(MAX_STRENGTH, existing.strength + 0.15)
      : Math.max(MIN_STRENGTH, existing.strength - 0.25);

    const updated: Partial<TechniqueProgress> = {
      strength: newStrength,
      lastReviewed: new Date(),
      nextReview: computeNextReview(existing, correct),
      reviewCount: existing.reviewCount + 1,
      correctCount: existing.correctCount + (correct ? 1 : 0),
      incorrectCount: existing.incorrectCount + (correct ? 0 : 1),
    };

    await db.techniqueProgress.update(existing.id!, updated);
    return { ...existing, ...updated };
  } else {
    const newProgress: TechniqueProgress = {
      profileId,
      techniqueId,
      strength: correct ? 0.4 : 0.1,
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + (correct ? INITIAL_INTERVAL_MS : INITIAL_INTERVAL_MS * 0.3)),
      reviewCount: 1,
      correctCount: correct ? 1 : 0,
      incorrectCount: correct ? 0 : 1,
    };
    const id = await db.techniqueProgress.add(newProgress);
    return { ...newProgress, id };
  }
}

export async function getDueReviews(profileId: number, limit = 10): Promise<TechniqueProgress[]> {
  const now = new Date();
  const all = await db.techniqueProgress
    .where('profileId')
    .equals(profileId)
    .toArray();

  return all
    .filter((p) => p.nextReview <= now)
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
    .slice(0, limit);
}

export async function getWeakTechniques(profileId: number, limit = 5): Promise<TechniqueProgress[]> {
  const all = await db.techniqueProgress
    .where('profileId')
    .equals(profileId)
    .toArray();

  return all
    .map((p) => ({ ...p, currentStrength: computeStrength(p) }))
    .sort((a, b) => a.currentStrength - b.currentStrength)
    .slice(0, limit);
}

export async function seedTechniquesAsKnown(
  profileId: number,
  techniques: Technique[],
): Promise<void> {
  const entries: TechniqueProgress[] = techniques.map((t) => ({
    profileId,
    techniqueId: t.id,
    strength: 0.5,
    lastReviewed: new Date(),
    nextReview: new Date(Date.now() + INITIAL_INTERVAL_MS * 0.5),
    reviewCount: 1,
    correctCount: 1,
    incorrectCount: 0,
  }));
  await db.techniqueProgress.bulkAdd(entries);
}

export function getTechniqueStrength(progress: TechniqueProgress): number {
  return computeStrength(progress);
}
