import type { SkillAccuracy, AgeGroup, Exercise } from '../types';

interface DifficultyAdjustment {
  shouldIncreaseVocab: boolean;
  shouldIncreaseGrammar: boolean;
  needsMoreListening: boolean;
  needsMoreSpeaking: boolean;
  overallLevel: 'easy' | 'normal' | 'hard';
  senseiMessage: string;
}

const THRESHOLD_HIGH = 0.90;
const THRESHOLD_LOW = 0.60;

export function assessDifficulty(accuracy: SkillAccuracy): DifficultyAdjustment {
  const avg = (accuracy.vocabulary + accuracy.grammar + accuracy.listening + accuracy.speaking) / 4;

  let overallLevel: 'easy' | 'normal' | 'hard' = 'normal';
  let senseiMessage = 'Your training is well-balanced. Keep going!';

  if (avg > THRESHOLD_HIGH) {
    overallLevel = 'hard';
    senseiMessage = 'You are very strong! Time for more challenging techniques.';
  } else if (avg < THRESHOLD_LOW) {
    overallLevel = 'easy';
    senseiMessage = 'Let\'s slow down and sharpen your fundamentals.';
  }

  const weakAreas: string[] = [];
  if (accuracy.grammar < THRESHOLD_LOW) weakAreas.push('grammar');
  if (accuracy.vocabulary < THRESHOLD_LOW) weakAreas.push('vocabulary');
  if (accuracy.listening < THRESHOLD_LOW) weakAreas.push('listening');
  if (accuracy.speaking < THRESHOLD_LOW) weakAreas.push('speaking');

  if (weakAreas.length > 0) {
    senseiMessage = `I see you need more practice with ${weakAreas.join(' and ')}. Let's work on your form.`;
  }

  return {
    shouldIncreaseVocab: accuracy.vocabulary > THRESHOLD_HIGH,
    shouldIncreaseGrammar: accuracy.grammar > THRESHOLD_HIGH,
    needsMoreListening: accuracy.listening < THRESHOLD_LOW,
    needsMoreSpeaking: accuracy.speaking < THRESHOLD_LOW,
    overallLevel,
    senseiMessage,
  };
}

export function adjustExerciseMix(
  exercises: Exercise[],
  adjustment: DifficultyAdjustment,
): Exercise[] {
  if (adjustment.overallLevel === 'easy') {
    return exercises.filter((e) => e.type !== 'kiai' && e.type !== 'mission');
  }

  let mix = [...exercises];

  if (adjustment.needsMoreListening) {
    const senseExercises = mix.filter((e) => e.type === 'sense');
    mix = [...mix, ...senseExercises.slice(0, 2)];
  }

  if (adjustment.needsMoreSpeaking) {
    const kiaiExercises = mix.filter((e) => e.type === 'kiai');
    mix = [...mix, ...kiaiExercises.slice(0, 2)];
  }

  return mix;
}

export function getSessionConfig(ageGroup: AgeGroup): {
  sessionMinutes: number;
  maxNewTechniques: number;
  showGrammarNotes: boolean;
  useDragAndDrop: boolean;
  senseiTone: 'encouraging' | 'coaching' | 'peer';
} {
  switch (ageGroup) {
    case 'junior':
      return {
        sessionMinutes: 5,
        maxNewTechniques: 3,
        showGrammarNotes: false,
        useDragAndDrop: true,
        senseiTone: 'encouraging',
      };
    case 'warrior':
      return {
        sessionMinutes: 6,
        maxNewTechniques: 4,
        showGrammarNotes: false,
        useDragAndDrop: true,
        senseiTone: 'coaching',
      };
    case 'elite':
      return {
        sessionMinutes: 8,
        maxNewTechniques: 5,
        showGrammarNotes: true,
        useDragAndDrop: false,
        senseiTone: 'coaching',
      };
    case 'master':
      return {
        sessionMinutes: 10,
        maxNewTechniques: 5,
        showGrammarNotes: true,
        useDragAndDrop: false,
        senseiTone: 'peer',
      };
  }
}
