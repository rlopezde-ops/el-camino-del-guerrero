import type { Exercise, ExerciseType, Technique, UnitData } from '../types';
import { expandKataTokens, splitIntoKataTiles } from './kataWords';
import { normalizeSpanishPhrase } from './speechRecognition';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `gen-${prefix}-${Date.now()}-${idCounter}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickDistinct<T>(arr: T[], count: number, exclude?: T): T[] {
  const pool = exclude !== undefined ? arr.filter((x) => x !== exclude) : [...arr];
  shuffle(pool);
  return pool.slice(0, Math.min(count, pool.length));
}

/** Indefinite article for Unit 8 school nouns (gender matches curriculum vocabulary). */
function schoolIndefiniteArticle(techId: string): 'un' | 'una' {
  const map: Record<string, 'un' | 'una'> = {
    libro: 'un',
    lapiz: 'un',
    escuela: 'una',
    maestro: 'un',
    maestra: 'una',
    clase: 'una',
    puerta: 'una',
    ventana: 'una',
    mesa: 'una',
    silla: 'una',
    pizarra: 'una',
    mochila: 'una',
    cuaderno: 'un',
    tarea: 'una',
    examen: 'un',
    recreo: 'un',
  };
  return map[techId] ?? 'un';
}

/** Techniques from all units with id <= maxUnitId (same dojo). */
export function getTechniquesUpToUnit(allUnits: UnitData[], maxUnitId: number): Technique[] {
  return allUnits.filter((u) => u.id <= maxUnitId).flatMap((u) => u.techniques);
}

function englishOptions(tech: Technique, pool: Technique[], n: number): string[] {
  const distractors = pickDistinct(
    pool.filter((t) => t.id !== tech.id && t.english !== tech.english),
    n - 1,
  ).map((t) => t.english);
  return shuffle([tech.english, ...distractors]).slice(0, n);
}

function spanishWordOptions(tech: Technique, pool: Technique[], n: number): string[] {
  const distractors = pickDistinct(
    pool.filter((t) => t.id !== tech.id && t.spanish !== tech.spanish),
    n - 1,
  ).map((t) => t.spanish);
  return shuffle([tech.spanish, ...distractors]).slice(0, n);
}

/** Contextual blanks matched to technique category. */
function blockForTech(tech: Technique): { prompt: string; correctAnswer: string } | null {
  const { spanish, english, category } = tech;

  if (category === 'numbers') {
    return {
      prompt: `Tengo ______ años. (Pick the Spanish for: ${english})`,
      correctAnswer: spanish,
    };
  }
  if (category === 'family') {
    return {
      prompt: `Mi ______ es muy simpático o simpática. (my relative is nice — pick the family word)`,
      correctAnswer: spanish,
    };
  }
  if (category === 'animals') {
    return {
      prompt: `El ______ es grande.`,
      correctAnswer: spanish,
    };
  }
  if (category === 'food') {
    return {
      prompt: `Me gusta comer ______.`,
      correctAnswer: spanish,
    };
  }
  if (category === 'body') {
    return {
      prompt: `Me duele la ______.`,
      correctAnswer: spanish,
    };
  }
  if (category === 'colors' || category === 'descriptions') {
    return {
      prompt: `El gato es ______.`,
      correctAnswer: spanish,
    };
  }
  if (category === 'school') {
    const art = schoolIndefiniteArticle(tech.id);
    return {
      prompt: `Necesito ${art} ______.`,
      correctAnswer: spanish,
    };
  }
  if (category === 'introductions' && tech.id === 'me-llamo') {
    return {
      prompt: `Me ______ Sofía.`,
      correctAnswer: 'llamo',
    };
  }
  return {
    prompt: `The Spanish for "${english}" is ______.`,
    correctAnswer: spanish,
  };
}

function kataEntry(tokens: string[]): { spanish: string; words: string[] } {
  const parts = expandKataTokens(tokens);
  return { spanish: parts.join(' '), words: shuffle(parts) };
}

/** Definite article + gustar pattern for Unit 7 food items (incl. plural frijoles). */
function foodGustaKataEntries(tech: Technique): Array<{ spanish: string; words: string[] }> {
  const id = tech.id;
  if (id === 'frijoles') {
    return [
      kataEntry(['Me', 'gustan', 'los', tech.spanish]),
      kataEntry(['No', 'me', 'gustan', 'los', tech.spanish]),
    ];
  }
  const article: Record<string, 'el' | 'la'> = {
    manzana: 'la',
    agua: 'el',
    leche: 'la',
    pan: 'el',
    pollo: 'el',
    arroz: 'el',
    huevo: 'el',
    queso: 'el',
    fruta: 'la',
    jugo: 'el',
    cafe: 'el',
    carne: 'la',
    ensalada: 'la',
    sopa: 'la',
  };
  const art = article[id];
  if (!art) return [];
  return [
    kataEntry(['Me', 'gusta', art, tech.spanish]),
    kataEntry(['No', 'me', 'gusta', art, tech.spanish]),
  ];
}

function buildKataPool(unit: UnitData): Array<{ spanish: string; words: string[] }> {
  const pool: Array<{ spanish: string; words: string[] }> = [];
  const adjectives = ['grande', 'pequeño', 'bonito'];
  const subjects = ['El gato', 'La casa', 'El perro'];

  for (const tech of unit.techniques) {
    const cat = tech.category;

    if (cat === 'family') {
      pool.push(kataEntry(['Mi', tech.spanish, 'es', pick(adjectives)]));
      pool.push(kataEntry(['Mi', tech.spanish, 'es', 'simpático']));
    }

    if (cat === 'animals') {
      pool.push(kataEntry(['El', tech.spanish, 'es', pick(adjectives)]));
      pool.push(kataEntry(['El', tech.spanish, 'es', 'bonito']));
    }

    if (cat === 'food') {
      for (const k of foodGustaKataEntries(tech)) {
        pool.push(k);
      }
    }

    if (cat === 'colors') {
      const subj = pick(subjects).split(' ');
      pool.push(kataEntry([...subj, 'es', tech.spanish]));
      pool.push(kataEntry(['La', 'casa', 'es', tech.spanish]));
    }

    if (cat === 'descriptions') {
      pool.push(kataEntry(['El', 'gato', 'es', tech.spanish]));
      pool.push(kataEntry(['La', 'casa', 'es', tech.spanish]));
    }

    if (cat === 'numbers' && tech.spanish.length <= 10 && !tech.spanish.includes(' ')) {
      pool.push(kataEntry(['Tengo', tech.spanish, 'años']));
      pool.push(kataEntry(['Hay', tech.spanish, 'libros']));
    }

    if (cat === 'body') {
      pool.push(kataEntry(['Me', 'duele', 'la', tech.spanish]));
      pool.push(kataEntry(['Toca', 'la', tech.spanish]));
    }

    if (cat === 'health') {
      const w = splitIntoKataTiles(tech.spanish);
      if (w.length >= 2) {
        pool.push({ spanish: tech.spanish, words: shuffle([...w]) });
      }
    }

    if (cat === 'school') {
      const art = schoolIndefiniteArticle(tech.id);
      pool.push(kataEntry(['Necesito', art, tech.spanish]));
      pool.push(kataEntry(['En', 'la', 'clase', 'hay', art, tech.spanish]));
    }

    if (cat === 'introductions') {
      const w = splitIntoKataTiles(tech.spanish);
      if (w.length >= 2) {
        pool.push({ spanish: tech.spanish, words: shuffle([...w]) });
      }
    }

    if (cat === 'greetings' || cat === 'manners') {
      const w = splitIntoKataTiles(tech.spanish);
      if (w.length >= 2) {
        pool.push({ spanish: tech.spanish, words: shuffle([...w]) });
      }
    }

    if (cat === 'phrases') {
      const w = splitIntoKataTiles(tech.spanish);
      if (w.length >= 2) {
        pool.push({ spanish: tech.spanish, words: shuffle([...w]) });
      }
    }
  }
  return pool.filter((k) => k.words.length >= 2);
}

const EXERCISE_TYPES: ExerciseType[] = [
  'strike', 'counter', 'block', 'kata', 'sense', 'kiai', 'speed', 'mission',
];

function generateOne(
  unit: UnitData,
  pool: Technique[],
  typeHint: ExerciseType,
): Exercise | null {
  const unitTechs = unit.techniques;
  if (unitTechs.length === 0) return null;

  const tech = pick(unitTechs);
  const belt = unit.belt;
  const unitNum = unit.id;

  switch (typeHint) {
    case 'strike':
      return {
        id: nextId('strike'),
        type: 'strike',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: `Strike! Tap the word for: "${tech.english}"`,
        correctAnswer: tech.spanish,
        options: spanishWordOptions(tech, pool, 4),
      };

    case 'counter': {
      const toEnglish = Math.random() < 0.5;
      if (toEnglish) {
        return {
          id: nextId('counter'),
          type: 'counter',
          unit: unitNum,
          belt,
          linkedTechniqueId: tech.id,
          prompt: `What does "${tech.spanish}" mean?`,
          correctAnswer: tech.english,
          options: englishOptions(tech, pool, 4),
        };
      }
      return {
        id: nextId('counter'),
        type: 'counter',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: `How do you say "${tech.english}" in Spanish?`,
        correctAnswer: tech.spanish,
        options: spanishWordOptions(tech, pool, 4),
      };
    }

    case 'block': {
      const raw = blockForTech(tech);
      if (!raw) return null;
      const pseudo: Technique = { ...tech, spanish: raw.correctAnswer };
      const opts = spanishWordOptions(pseudo, unitTechs.concat(pool), 4);
      return {
        id: nextId('block'),
        type: 'block',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: raw.prompt,
        correctAnswer: raw.correctAnswer,
        options: opts,
      };
    }

    case 'kata': {
      const katas = buildKataPool(unit);
      const fallbackTiles = splitIntoKataTiles(tech.spanish);
      const kata = katas.length
        ? pick(katas)
        : {
            spanish: tech.spanish,
            words: fallbackTiles.length >= 2 ? shuffle([...fallbackTiles]) : fallbackTiles,
          };
      if (kata.words.length < 2) {
        return null;
      }
      return {
        id: nextId('kata'),
        type: 'kata',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: 'Build the sentence:',
        correctAnswer: kata.spanish,
        words: shuffle([...kata.words]),
      };
    }

    case 'sense':
      return {
        id: nextId('sense'),
        type: 'sense',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: `Listen and choose the meaning of "${tech.spanish}"`,
        correctAnswer: tech.english,
        options: englishOptions(tech, pool, 4),
        promptAudio: tech.audioUrl,
      };

    case 'kiai':
      return {
        id: nextId('kiai'),
        type: 'kiai',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: `Say: "${tech.spanish}"`,
        displayPhrase: tech.spanish,
        correctAnswer: normalizeSpanishPhrase(tech.spanish),
      };

    case 'speed': {
      const fromUnit = pickDistinct(unitTechs, 2);
      const rest = pool.filter((p) => !fromUnit.some((u) => u.id === p.id));
      const fromPool = pickDistinct(rest, 2);
      const four = shuffle([...fromUnit, ...fromPool]).slice(0, 4);
      if (four.length < 2) return null;
      return {
        id: nextId('speed'),
        type: 'speed',
        unit: unitNum,
        belt,
        linkedTechniqueId: [...four].sort((a, b) => a.id.localeCompare(b.id)).map((t) => t.id).join(','),
        prompt: 'Match the pairs!',
        correctAnswer: '',
        pairs: four.map((t) => ({ spanish: t.spanish, english: t.english })),
      };
    }

    case 'mission': {
      const snippet = unit.storySnippet ?? 'En el dojo practicamos español.';
      return {
        id: nextId('mission'),
        type: 'mission',
        unit: unitNum,
        belt,
        linkedTechniqueId: tech.id,
        prompt: `${snippet}\n\nWhich word fits: "${tech.english}"?`,
        correctAnswer: tech.spanish,
        options: spanishWordOptions(tech, pool, 4),
      };
    }

    default:
      return null;
  }
}

/**
 * Mix ~30% hand-crafted unit.exercises with procedurally generated items.
 */
export function generateSessionExercises(
  unit: UnitData,
  techniquesPool: Technique[],
  targetCount: number,
): Exercise[] {
  const handcrafted = shuffle([...unit.exercises]);
  const hTarget = Math.min(handcrafted.length, Math.max(1, Math.round(targetCount * 0.3)));

  const out: Exercise[] = [];
  out.push(...handcrafted.slice(0, hTarget));

  const pool = techniquesPool.length ? techniquesPool : unit.techniques;
  let attempts = 0;
  while (out.length < targetCount && attempts < targetCount * 4) {
    attempts += 1;
    const type = pick(EXERCISE_TYPES);
    const ex = generateOne(unit, pool, type);
    if (ex) out.push(ex);
  }

  while (out.length < targetCount && handcrafted.length > hTarget) {
    out.push(handcrafted[out.length - hTarget] ?? handcrafted[0]);
  }

  return shuffle(out).slice(0, targetCount);
}

/** Types the belt-test UI supports (no speed/mission pair grids). */
const BOSS_EXERCISE_TYPES: ExerciseType[] = [
  'counter', 'counter', 'strike', 'block', 'sense', 'kiai',
];

/** Belt test: sample across all units in dojo (e.g. dojo1.units). */
export function generateBeltTestExercises(
  units: UnitData[],
  techniquesPool: Technique[],
  count: number,
): Exercise[] {
  const allHand = shuffle(units.flatMap((u) => u.exercises));
  const hTake = Math.min(4, allHand.length, Math.round(count * 0.25));
  const out: Exercise[] = [...allHand.slice(0, hTake)];

  const pool = techniquesPool.length ? techniquesPool : units.flatMap((u) => u.techniques);
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    const unit = pick(units);
    const type = pick(BOSS_EXERCISE_TYPES);
    const ex = generateOne(unit, pool, type);
    if (ex) {
      ex.unit = 0;
      ex.id = nextId('boss');
      out.push(ex);
    }
  }
  return shuffle(out).slice(0, count);
}
