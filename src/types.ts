export type BeltColor =
  | 'white' | 'yellow' | 'orange' | 'green'
  | 'blue' | 'purple' | 'brown' | 'red'
  | 'black-1' | 'black-2' | 'black-3' | 'black-4' | 'black-5';

export const BELT_ORDER: BeltColor[] = [
  'white', 'yellow', 'orange', 'green',
  'blue', 'purple', 'brown', 'red',
  'black-1', 'black-2', 'black-3', 'black-4', 'black-5',
];

export const BELT_DISPLAY_NAMES: Record<BeltColor, string> = {
  'white': 'Cinturón Blanco',
  'yellow': 'Cinturón Amarillo',
  'orange': 'Cinturón Naranja',
  'green': 'Cinturón Verde',
  'blue': 'Cinturón Azul',
  'purple': 'Cinturón Morado',
  'brown': 'Cinturón Marrón',
  'red': 'Cinturón Rojo',
  'black-1': 'Cinturón Negro - 1er Dan',
  'black-2': 'Cinturón Negro - 2do Dan',
  'black-3': 'Cinturón Negro - 3er Dan',
  'black-4': 'Cinturón Negro - 4to Dan',
  'black-5': 'Cinturón Negro - 5to Dan "Maestro"',
};

export const BELT_CSS_COLORS: Record<BeltColor, string> = {
  'white': '#f5f5f5',
  'yellow': '#fbbf24',
  'orange': '#f97316',
  'green': '#22c55e',
  'blue': '#3b82f6',
  'purple': '#a855f7',
  'brown': '#92400e',
  'red': '#dc2626',
  'black-1': '#1f2937',
  'black-2': '#1f2937',
  'black-3': '#1f2937',
  'black-4': '#1f2937',
  'black-5': '#1f2937',
};

export type AgeGroup = 'junior' | 'warrior' | 'elite' | 'master';

export interface WarriorProfile {
  id?: number;
  name: string;
  age: number;
  ageGroup: AgeGroup;
  createdAt: Date;

  avatarHead: number;
  avatarHair: number;
  avatarSkinTone: number;
  avatarGiPattern: number;
  avatarAccessories: number[];

  currentBelt: BeltColor;
  currentDojo: number;
  currentUnit: number;
  currentStripe: number;

  kiPoints: number;
  coins: number;
  streakDays: number;
  streakLastDate: string | null;
  streakFreezes: number;

  placementBelt: BeltColor | null;
  placementCompleted: boolean;

  pin?: string;
}

export type ExerciseType =
  | 'strike'    // Picture Match
  | 'kata'      // Word Shuffle
  | 'block'     // Fill the Blank
  | 'sense'     // Listen and Tap
  | 'kiai'      // Speak It
  | 'counter'   // Translate It
  | 'speed'     // Tap the Pairs
  | 'mission';  // Story Builder

export interface Technique {
  id: string;
  spanish: string;
  english: string;
  imageUrl?: string;
  audioUrl?: string;
  category: string;
  unit: number;
  belt: BeltColor;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  unit: number;
  belt: BeltColor;
  prompt: string;
  promptAudio?: string;
  correctAnswer: string;
  options?: string[];
  imageSrc?: string;
  words?: string[];
  pairs?: Array<{ spanish: string; english: string }>;
  storyTemplate?: string;
  blanks?: Array<{ correct: string; options: string[] }>;
  /** Stable id for spaced repetition when exercise is procedurally generated */
  linkedTechniqueId?: string;
  /** For kiai: phrase shown in UI; `correctAnswer` stays normalized for matching */
  displayPhrase?: string;
}

export interface UnitData {
  id: number;
  belt: BeltColor;
  stripe: number;
  title: string;
  titleEs: string;
  topic: string;
  techniques: Technique[];
  exercises: Exercise[];
  storySnippet?: string;
}

export interface DojoData {
  id: number;
  name: string;
  nameEs: string;
  description: string;
  cefr: string;
  belts: BeltColor[];
  units: UnitData[];
  bossExercises: Exercise[];
}

export interface TechniqueProgress {
  id?: number;
  profileId: number;
  techniqueId: string;
  strength: number;
  lastReviewed: Date;
  nextReview: Date;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
}

export interface SessionResult {
  id?: number;
  profileId: number;
  unitId: number;
  completedAt: Date;
  kiEarned: number;
  coinsEarned: number;
  accuracy: number;
  exercisesCompleted: number;
  comboMax: number;
  newTechniquesLearned: number;
  techniquesReviewed: number;
}

export interface DailyMission {
  id: string;
  description: string;
  descriptionEs: string;
  target: number;
  type: 'ki' | 'techniques' | 'sessions' | 'sparring' | 'streak';
  rewardCoins: number;
  rewardKi: number;
}

export interface SkillAccuracy {
  profileId: number;
  vocabulary: number;
  grammar: number;
  listening: number;
  speaking: number;
  totalExercises: number;
}

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 12) return 'junior';
  if (age <= 15) return 'warrior';
  if (age <= 18) return 'elite';
  return 'master';
}

export function getBeltIndex(belt: BeltColor): number {
  return BELT_ORDER.indexOf(belt);
}

export function getUnitsForBelt(belt: BeltColor): number[] {
  const idx = getBeltIndex(belt);
  return [idx * 2 + 1, idx * 2 + 2];
}
