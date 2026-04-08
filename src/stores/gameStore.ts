import { create } from 'zustand';
import type { WarriorProfile, BeltColor, DailyMission, SkillAccuracy } from '../types';
import { db } from '../db';

interface GameState {
  activeProfile: WarriorProfile | null;
  profiles: WarriorProfile[];
  isLoading: boolean;

  sessionKi: number;
  sessionCoins: number;
  sessionCombo: number;
  sessionMaxCombo: number;
  sessionCorrect: number;
  sessionTotal: number;

  dailyMission: DailyMission | null;
  dailyMissionProgress: number;

  loadProfiles: () => Promise<void>;
  setActiveProfile: (profile: WarriorProfile) => void;
  createProfile: (profile: Omit<WarriorProfile, 'id'>) => Promise<WarriorProfile>;
  updateProfile: (id: number, changes: Partial<WarriorProfile>) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;

  addKi: (amount: number) => void;
  addCoins: (amount: number) => void;
  recordAnswer: (correct: boolean) => void;
  resetSession: () => void;

  promoteBelt: (newBelt: BeltColor) => Promise<void>;
  updateStreak: () => Promise<void>;

  getSkillAccuracy: (profileId: number) => Promise<SkillAccuracy>;
  getBestScores: (profileId: number) => Promise<Map<number, number>>;
  getBestAccuracyForUnit: (profileId: number, unitId: number) => Promise<number>;
}

export const useGameStore = create<GameState>((set, get) => ({
  activeProfile: null,
  profiles: [],
  isLoading: true,

  sessionKi: 0,
  sessionCoins: 0,
  sessionCombo: 0,
  sessionMaxCombo: 0,
  sessionCorrect: 0,
  sessionTotal: 0,

  dailyMission: null,
  dailyMissionProgress: 0,

  loadProfiles: async () => {
    const profiles = await db.profiles.toArray();
    const savedId = localStorage.getItem('activeProfileId');
    let restored: WarriorProfile | null = null;
    if (savedId) {
      restored = profiles.find((p) => p.id === Number(savedId)) ?? null;
    }
    set({ profiles, isLoading: false, activeProfile: restored });
  },

  setActiveProfile: (profile) => {
    if (profile.id != null) localStorage.setItem('activeProfileId', String(profile.id));
    set({ activeProfile: profile });
  },

  createProfile: async (profileData) => {
    const id = await db.profiles.add(profileData as WarriorProfile);
    const profile = { ...profileData, id } as WarriorProfile;
    set((s) => ({ profiles: [...s.profiles, profile] }));
    return profile;
  },

  updateProfile: async (id, changes) => {
    await db.profiles.update(id, changes);
    const updated = await db.profiles.get(id);
    if (!updated) return;
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? updated : p)),
      activeProfile: s.activeProfile?.id === id ? updated : s.activeProfile,
    }));
  },

  deleteProfile: async (id) => {
    await db.profiles.delete(id);
    await db.techniqueProgress.where('profileId').equals(id).delete();
    await db.sessionResults.where('profileId').equals(id).delete();
    const wasActive = get().activeProfile?.id === id;
    if (wasActive) localStorage.removeItem('activeProfileId');
    set((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      activeProfile: wasActive ? null : s.activeProfile,
    }));
  },

  addKi: (amount) => {
    set((s) => ({ sessionKi: s.sessionKi + amount }));
  },

  addCoins: (amount) => {
    set((s) => ({ sessionCoins: s.sessionCoins + amount }));
  },

  recordAnswer: (correct) => {
    set((s) => {
      const newCombo = correct ? s.sessionCombo + 1 : 0;
      const bonusKi = correct ? (newCombo >= 3 ? 15 : 10) : 0;
      return {
        sessionCorrect: s.sessionCorrect + (correct ? 1 : 0),
        sessionTotal: s.sessionTotal + 1,
        sessionCombo: newCombo,
        sessionMaxCombo: Math.max(s.sessionMaxCombo, newCombo),
        sessionKi: s.sessionKi + bonusKi,
      };
    });
  },

  resetSession: () => {
    set({
      sessionKi: 0,
      sessionCoins: 0,
      sessionCombo: 0,
      sessionMaxCombo: 0,
      sessionCorrect: 0,
      sessionTotal: 0,
    });
  },

  promoteBelt: async (newBelt) => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile?.id) return;
    await updateProfile(activeProfile.id, { currentBelt: newBelt });
  },

  updateStreak: async () => {
    const { activeProfile, updateProfile } = get();
    if (!activeProfile?.id) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = activeProfile.streakDays;
    if (activeProfile.streakLastDate === today) {
      return;
    } else if (activeProfile.streakLastDate === yesterday) {
      newStreak += 1;
    } else if (activeProfile.streakLastDate !== null) {
      if (activeProfile.streakFreezes > 0) {
        newStreak += 1;
        await updateProfile(activeProfile.id, {
          streakFreezes: activeProfile.streakFreezes - 1,
        });
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await updateProfile(activeProfile.id, {
      streakDays: newStreak,
      streakLastDate: today,
    });
  },

  getSkillAccuracy: async (profileId) => {
    const results = await db.sessionResults
      .where('profileId')
      .equals(profileId)
      .toArray();

    const total = results.length;
    const avgAccuracy = total > 0
      ? results.reduce((sum, r) => sum + r.accuracy, 0) / total
      : 0;

    return {
      profileId,
      vocabulary: avgAccuracy,
      grammar: avgAccuracy,
      listening: avgAccuracy,
      speaking: avgAccuracy,
      totalExercises: results.reduce((sum, r) => sum + r.exercisesCompleted, 0),
    };
  },

  getBestScores: async (profileId) => {
    const results = await db.sessionResults.where('profileId').equals(profileId).toArray();
    const best = new Map<number, number>();
    for (const r of results) {
      const prev = best.get(r.unitId) ?? 0;
      if (r.accuracy > prev) best.set(r.unitId, r.accuracy);
    }
    return best;
  },

  getBestAccuracyForUnit: async (profileId, unitId) => {
    const results = await db.sessionResults.where('profileId').equals(profileId).toArray();
    let max = 0;
    for (const r of results) {
      if (r.unitId === unitId && r.accuracy > max) max = r.accuracy;
    }
    return max;
  },
}));
