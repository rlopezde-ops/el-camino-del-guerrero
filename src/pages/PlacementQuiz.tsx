import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import SpeechBubble from '../components/ui/SpeechBubble';
import BeltBadge from '../components/ui/BeltBadge';
import DojoButton from '../components/ui/DojoButton';
import OptionCard from '../components/ui/OptionCard';
import VoxelConfetti from '../components/ui/VoxelConfetti';
import { BELT_DISPLAY_NAMES, BELT_CSS_COLORS, type BeltColor } from '../types';
import { seedTechniquesAsKnown } from '../lib/spacedRepetition';
import { getTechniquesByBelt, getDojo1Units } from '../data/curriculum';
import { db } from '../db';

interface TrialQuestion {
  prompt: string;
  correctAnswer: string;
  options: string[];
}

interface TrialDef {
  belt: BeltColor;
  label: string;
  pick: number;
  pool: TrialQuestion[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TRIAL_DEFINITIONS: TrialDef[] = [
  {
    belt: 'white',
    label: 'White Belt Trial',
    pick: 3,
    pool: [
      { prompt: 'What does "Hola" mean?', correctAnswer: 'Hello', options: ['Hello', 'Goodbye', 'Please', 'Thank you'] },
      { prompt: 'What number is "siete"?', correctAnswer: '7', options: ['5', '6', '7', '8'] },
      { prompt: '"Me llamo" means...', correctAnswer: 'My name is', options: ['My name is', 'I like', 'I have', 'I want'] },
      { prompt: 'What does "gracias" mean?', correctAnswer: 'Thank you', options: ['Please', 'Thank you', 'Goodbye', 'Sorry'] },
      { prompt: 'What number is "catorce"?', correctAnswer: '14', options: ['12', '13', '14', '15'] },
      { prompt: 'How do you say "good afternoon"?', correctAnswer: 'Buenas tardes', options: ['Buenos días', 'Buenas tardes', 'Buenas noches', 'Hola'] },
    ],
  },
  {
    belt: 'yellow',
    label: 'Yellow Belt Trial',
    pick: 3,
    pool: [
      { prompt: 'What color is "azul"?', correctAnswer: 'Blue', options: ['Red', 'Blue', 'Green', 'Yellow'] },
      { prompt: '"Simpático" best means...', correctAnswer: 'Nice / friendly (person)', options: ['Nice / friendly (person)', 'Pretty', 'Tall', 'Angry'] },
      { prompt: '"Hermana" means...', correctAnswer: 'Sister', options: ['Brother', 'Sister', 'Mom', 'Dad'] },
      { prompt: 'What is "tío"?', correctAnswer: 'Uncle', options: ['Aunt', 'Uncle', 'Cousin', 'Grandfather'] },
      { prompt: 'What color is "morado"?', correctAnswer: 'Purple', options: ['Pink', 'Purple', 'Gray', 'Brown'] },
      { prompt: '"Grande" means...', correctAnswer: 'Big', options: ['Small', 'Big', 'Pretty', 'Old'] },
    ],
  },
  {
    belt: 'orange',
    label: 'Orange Belt Trial',
    pick: 3,
    pool: [
      { prompt: '"La cabeza" is...', correctAnswer: 'The head', options: ['The head', 'The hand', 'The foot', 'The eye'] },
      { prompt: '"El perro es grande" means...', correctAnswer: 'The dog is big', options: ['The dog is big', 'The cat is small', 'The bird is pretty', 'The fish is blue'] },
      { prompt: 'What is "brazo"?', correctAnswer: 'Arm', options: ['Leg', 'Arm', 'Hand', 'Foot'] },
      { prompt: 'What is "conejo"?', correctAnswer: 'Rabbit', options: ['Cat', 'Rabbit', 'Bird', 'Fish'] },
      { prompt: '"Me duele la cabeza" means...', correctAnswer: 'My head hurts', options: ['My head hurts', 'I like heads', 'The head is big', 'I have a head'] },
      { prompt: 'What is "vaca"?', correctAnswer: 'Cow', options: ['Dog', 'Cow', 'Horse', 'Pig'] },
    ],
  },
  {
    belt: 'green',
    label: 'Green Belt Trial',
    pick: 3,
    pool: [
      { prompt: '"Me gusta comer manzanas" means...', correctAnswer: 'I like to eat apples', options: ['I like to eat apples', 'I want to eat bread', 'I have an apple', 'The apple is red'] },
      { prompt: 'What is "un libro"?', correctAnswer: 'A book', options: ['A book', 'A pencil', 'A door', 'A class'] },
      { prompt: 'What is "queso"?', correctAnswer: 'Cheese', options: ['Cheese', 'Rice', 'Soup', 'Juice'] },
      { prompt: '"No me gusta la leche" means...', correctAnswer: "I don't like milk", options: ["I don't like milk", 'I like milk', 'The milk is white', 'I want milk'] },
      { prompt: 'What is "mochila"?', correctAnswer: 'Backpack', options: ['Backpack', 'Book', 'School', 'Teacher'] },
    ],
  },
];

function buildTrials() {
  return TRIAL_DEFINITIONS.map((d) => ({
    belt: d.belt,
    label: d.label,
    questions: shuffle(d.pool).slice(0, d.pick),
  }));
}

type Phase = 'intro' | 'trial' | 'beltUp' | 'result';

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const { activeProfile, updateProfile, setActiveProfile } = useGameStore();

  const trials = useMemo(() => buildTrials(), []);

  const [phase, setPhase] = useState<Phase>('intro');
  const [trialIdx, setTrialIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [trialCorrect, setTrialCorrect] = useState(0);
  const [earnedBelts, setEarnedBelts] = useState<BeltColor[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [, setAnswerCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalCoins, setTotalCoins] = useState(50);

  const currentTrial = trials[trialIdx];
  const currentQuestion = currentTrial?.questions[questionIdx];
  const requiredCorrect = Math.ceil((currentTrial?.questions.length ?? 0) * 0.66);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;
    setAnswerCorrect(isCorrect);
    const newCorrect = isCorrect ? trialCorrect + 1 : trialCorrect;
    if (isCorrect) setTrialCorrect(newCorrect);

    setTimeout(() => {
      const nextQ = questionIdx + 1;
      const remaining = currentTrial.questions.length - nextQ;
      const canStillPass = newCorrect + remaining >= requiredCorrect;

      if (nextQ >= currentTrial.questions.length) {
        if (newCorrect >= requiredCorrect) {
          awardBelt();
        } else {
          finishPlacement();
        }
      } else if (!canStillPass) {
        finishPlacement();
      } else {
        setQuestionIdx(nextQ);
        setSelectedAnswer(null);
        setAnswerCorrect(null);
      }
    }, 800);
  }, [selectedAnswer, currentQuestion, questionIdx, trialCorrect, currentTrial, requiredCorrect]);

  function awardBelt() {
    const belt = currentTrial.belt;
    setEarnedBelts((prev) => [...prev, belt]);
    setShowConfetti(true);
    setPhase('beltUp');
    setTotalCoins((c) => c + (trialIdx + 1) * 50);
    setTimeout(() => setShowConfetti(false), 3000);
  }

  function nextTrialOrFinish() {
    const next = trialIdx + 1;
    if (next >= trials.length) {
      finishPlacement();
    } else {
      setTrialIdx(next);
      setQuestionIdx(0);
      setTrialCorrect(0);
      setSelectedAnswer(null);
      setAnswerCorrect(null);
      setPhase('trial');
    }
  }

  async function finishPlacement() {
    setPhase('result');
    if (!activeProfile?.id) return;

    const highestBelt: BeltColor = earnedBelts.length > 0
      ? earnedBelts[earnedBelts.length - 1]
      : 'white';

    const BELT_UNIT_MAP: Record<string, number> = {
      white: 3, yellow: 5, orange: 7, green: 8,
    };

    const unitStart = earnedBelts.length > 0
      ? (BELT_UNIT_MAP[highestBelt] ?? 1)
      : 1;

    const dojo1Belts: BeltColor[] = ['white', 'yellow', 'orange', 'green'];
    const clampedBelt = dojo1Belts.includes(highestBelt) ? highestBelt : 'green';

    for (const belt of earnedBelts) {
      const techniques = getTechniquesByBelt(belt);
      if (techniques.length > 0) {
        await seedTechniquesAsKnown(activeProfile.id, techniques);
      }
    }

    const pid = activeProfile.id;
    for (const u of getDojo1Units()) {
      if (u.id < unitStart) {
        await db.sessionResults.add({
          profileId: pid, unitId: u.id, completedAt: new Date(),
          kiEarned: 0, coinsEarned: 0, accuracy: 0.85,
          exercisesCompleted: 10, comboMax: 3,
          newTechniquesLearned: u.techniques.length, techniquesReviewed: 10,
        });
      }
    }

    const updates = {
      currentBelt: clampedBelt,
      currentUnit: Math.min(unitStart, 8),
      currentStripe: 1,
      coins: totalCoins,
      placementBelt: clampedBelt,
      placementCompleted: true,
    };

    await updateProfile(activeProfile.id, updates);
    setActiveProfile({ ...activeProfile, ...updates });
  }

  const beltColor = currentTrial ? BELT_CSS_COLORS[currentTrial.belt] : '#f59e0b';

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <VoxelConfetti active={showConfetti} color={beltColor} />

      {/* ── Belt-up ceremony — full-screen overlay ───────────────────────── */}
      <AnimatePresence>
        {phase === 'beltUp' && (
          <motion.div
            key="belt-ceremony"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.93)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Radial glow in belt color */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 480,
                height: 480,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${beltColor}28 0%, transparent 65%)`,
              }}
              aria-hidden
            />

            <motion.div
              className="flex flex-col items-center gap-5 relative z-10"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              {/* Belt badge — bigger than normal */}
              <motion.div
                animate={{ scale: [1, 1.12, 1, 1.06, 1] }}
                transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
              >
                <BeltBadge belt={currentTrial.belt} size="lg" showLabel={false} />
              </motion.div>

              {/* Belt name */}
              <motion.h2
                className="font-baloo font-extrabold text-center leading-none"
                style={{ fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', color: beltColor }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 18 }}
              >
                {BELT_DISPLAY_NAMES[currentTrial.belt]}
              </motion.h2>

              <motion.p
                className="font-poppins text-lg md:text-xl text-white/55 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {earnedBelts.length} belt{earnedBelts.length > 1 ? 's' : ''} earned · {earnedBelts.length * 2} stripes skipped
              </motion.p>

              {/* Continue — appears after a beat so the moment lands first */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.35 }}
              >
                <DojoButton size="lg" onClick={nextTrialOrFinish}>
                  {trialIdx + 1 < trials.length ? 'Next Trial →' : 'See Results'}
                </DojoButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main phases ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Intro */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-1 w-20 mx-auto rounded-full bg-amber-400/40" aria-hidden />
            <h1 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
              La Prueba del Guerrero
            </h1>
            <SpeechBubble text="Welcome to the Dojo, warrior. Show me what you already know. Every belt you earn is one you've mastered. ¡Hajime!" />
            <DojoButton size="lg" onClick={() => setPhase('trial')}>
              Begin Trial!
            </DojoButton>
          </motion.div>
        )}

        {/* Trial */}
        {phase === 'trial' && currentQuestion && (
          <motion.div
            key={`trial-${trialIdx}-${questionIdx}`}
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Progress header */}
            <div className="px-5 md:px-8 pt-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-baloo font-bold text-xl md:text-2xl"
                  style={{ color: beltColor }}
                >
                  {currentTrial.label}
                </span>
                <span className="font-pixel text-sm text-white/40">
                  {questionIdx + 1} / {currentTrial.questions.length}
                </span>
              </div>
              {/* Segmented progress bar */}
              <div className="flex gap-1.5">
                {currentTrial.questions.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-2 flex-1 rounded-full"
                    style={{
                      backgroundColor:
                        i < questionIdx
                          ? beltColor
                          : i === questionIdx
                          ? `${beltColor}88`
                          : 'rgba(255,255,255,0.08)',
                    }}
                    animate={i === questionIdx ? { opacity: [0.5, 1, 0.5] } : undefined}
                    transition={i === questionIdx ? { repeat: Infinity, duration: 1.2 } : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Question + options */}
            <div className="flex-1 px-5 md:px-8 pb-8">
              <motion.h2
                key={questionIdx}
                className="font-baloo text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentQuestion.prompt}
              </motion.h2>

              <div className="flex flex-col gap-3 md:gap-4 max-w-xl">
                {currentQuestion.options.map((opt) => (
                  <OptionCard
                    key={opt}
                    text={opt}
                    selected={selectedAnswer === opt}
                    correct={
                      selectedAnswer
                        ? opt === currentQuestion.correctAnswer
                          ? true
                          : selectedAnswer === opt
                          ? false
                          : null
                        : null
                    }
                    disabled={selectedAnswer !== null}
                    beltColor={beltColor}
                    onClick={() => handleAnswer(opt)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="h-1 w-24 mx-auto rounded-full bg-amber-400/35" aria-hidden />
            <h1 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
              {earnedBelts.length === 0
                ? 'Welcome to the Dojo!'
                : earnedBelts.length >= 4
                ? '¡Increíble, guerrero!'
                : `${BELT_DISPLAY_NAMES[earnedBelts[earnedBelts.length - 1]]} Earned!`}
            </h1>
            <p className="font-poppins text-lg md:text-xl text-white/55 text-center max-w-md px-2">
              {earnedBelts.length === 0
                ? 'Every master was once a beginner. Sensei will guide you from the start.'
                : `You conquered ${earnedBelts.length} trial${earnedBelts.length > 1 ? 's' : ''}! Your training begins at a higher rank.`}
            </p>

            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-3 rounded-xl">
                <span className="font-poppins text-xs font-semibold uppercase tracking-wide text-white/45">Coins</span>
                <span className="font-pixel text-base md:text-lg text-coin-gold">{totalCoins}</span>
              </div>
            </div>

            {earnedBelts.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {earnedBelts.map((b) => <BeltBadge key={b} belt={b} size="md" earned />)}
              </div>
            )}

            <DojoButton size="lg" onClick={() => navigate('/path')} className="mt-2">
              Enter the Warrior's Path →
            </DojoButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
