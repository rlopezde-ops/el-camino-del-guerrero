import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import SpeechBubble from '../components/ui/SpeechBubble';
import BeltRack from '../components/ui/BeltRack';
import BeltBadge from '../components/ui/BeltBadge';
import DojoButton from '../components/ui/DojoButton';
import OptionCard from '../components/ui/OptionCard';
import VoxelConfetti from '../components/ui/VoxelConfetti';
import { BELT_DISPLAY_NAMES, BELT_CSS_COLORS, getBeltIndex, type BeltColor } from '../types';
import { seedTechniquesAsKnown } from '../lib/spacedRepetition';
import { getTechniquesByBelt } from '../data/curriculum';

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
    belt: 'orange',
    label: 'Yellow-Orange Belt Trial',
    pick: 3,
    pool: [
      { prompt: 'What color is "azul"?', correctAnswer: 'Blue', options: ['Red', 'Blue', 'Green', 'Yellow'] },
      { prompt: '"Hermana" means...', correctAnswer: 'Sister', options: ['Brother', 'Sister', 'Mom', 'Dad'] },
      { prompt: '"La cabeza" is...', correctAnswer: 'The head', options: ['The head', 'The hand', 'The foot', 'The eye'] },
      { prompt: '"Simpático" best means...', correctAnswer: 'Nice / friendly (person)', options: ['Nice / friendly (person)', 'Pretty', 'Tall', 'Angry'] },
      { prompt: 'What is "tío"?', correctAnswer: 'Uncle', options: ['Aunt', 'Uncle', 'Cousin', 'Grandfather'] },
      { prompt: 'What color is "morado"?', correctAnswer: 'Purple', options: ['Pink', 'Purple', 'Gray', 'Brown'] },
    ],
  },
  {
    belt: 'green',
    label: 'Green Belt Trial',
    pick: 3,
    pool: [
      { prompt: '"Me gusta comer manzanas" means...', correctAnswer: 'I like to eat apples', options: ['I like to eat apples', 'I want to eat bread', 'I have an apple', 'The apple is red'] },
      { prompt: 'What is "un libro"?', correctAnswer: 'A book', options: ['A book', 'A pencil', 'A door', 'A class'] },
      { prompt: '"El perro es grande" means...', correctAnswer: 'The dog is big', options: ['The dog is big', 'The cat is small', 'The bird is pretty', 'The fish is blue'] },
      { prompt: 'What is "queso"?', correctAnswer: 'Cheese', options: ['Cheese', 'Rice', 'Soup', 'Juice'] },
      { prompt: '"No me gusta la leche" means...', correctAnswer: "I don't like milk", options: ["I don't like milk", 'I like milk', 'The milk is white', 'I want milk'] },
    ],
  },
  {
    belt: 'red',
    label: 'Blue-Red Belt Trial',
    pick: 4,
    pool: [
      { prompt: '"Yo voy al parque" means...', correctAnswer: 'I go to the park', options: ['I go to the park', 'I went to the park', 'I will go to the park', 'I am at the park'] },
      { prompt: 'What does "Llueve" mean?', correctAnswer: 'It rains', options: ['It\'s hot', 'It rains', 'It\'s cold', 'It snows'] },
      { prompt: '"Son las tres" means...', correctAnswer: 'It is 3 o\'clock', options: ['It is 3 o\'clock', 'There are 3', 'I have 3', 'It\'s March'] },
      { prompt: '"¿Dónde está la tienda?" means...', correctAnswer: 'Where is the store?', options: ['Where is the store?', 'What is the store?', 'Is this the store?', 'I like the store'] },
      { prompt: '"Quisiera agua, por favor" suggests...', correctAnswer: 'I would like water, please', options: ['I would like water, please', 'I hate water', 'Where is the water?', 'The water is cold'] },
      { prompt: '"Hace calor" means...', correctAnswer: "It's hot (weather)", options: ["It's hot (weather)", 'I am hot', 'I like heat', 'It is winter'] },
    ],
  },
  {
    belt: 'black-1',
    label: 'Black Belt Trial',
    pick: 4,
    pool: [
      { prompt: '"Ayer yo fui al cine" means...', correctAnswer: 'Yesterday I went to the movies', options: ['Yesterday I went to the movies', 'Today I go to the movies', 'Tomorrow I will go to the movies', 'I like movies'] },
      { prompt: '"Mañana voy a estudiar" means...', correctAnswer: 'Tomorrow I am going to study', options: ['Tomorrow I am going to study', 'Yesterday I studied', 'I study every day', 'I don\'t like studying'] },
      { prompt: '"Creo que el bosque es hermoso" means...', correctAnswer: 'I think the forest is beautiful', options: ['I think the forest is beautiful', 'I went to the forest', 'The forest is big', 'I like forests'] },
      { prompt: '"El año pasado viajé a México" means...', correctAnswer: 'Last year I traveled to Mexico', options: ['Last year I traveled to Mexico', 'I want to travel to Mexico', 'Mexico is beautiful', 'I live in Mexico'] },
      { prompt: '"Si tuviera tiempo, viajaría" is closer to...', correctAnswer: 'If I had time, I would travel', options: ['If I had time, I would travel', 'I travel when I have time', 'I never travel', 'I traveled last year'] },
      { prompt: '"Ojalá llueva" expresses...', correctAnswer: 'Hopefully it rains / I hope it rains', options: ['Hopefully it rains / I hope it rains', 'It is raining', 'It never rains', 'I hate rain'] },
    ],
  },
];

function buildTrialsFromDefinitions(): { belt: BeltColor; label: string; questions: TrialQuestion[] }[] {
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

  const trials = useMemo(() => buildTrialsFromDefinitions(), []);

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
  const requiredCorrect = Math.ceil(currentTrial?.questions.length * 0.66);

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
  }, [selectedAnswer, currentQuestion, questionIdx, trialCorrect, currentTrial, requiredCorrect, trials]);

  function awardBelt() {
    const belt = currentTrial.belt;
    const newEarned = [...earnedBelts, belt];
    setEarnedBelts(newEarned);
    setShowConfetti(true);
    setPhase('beltUp');

    const bonusCoins = (trialIdx + 1) * 50;
    setTotalCoins((c) => c + bonusCoins);

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

    const highestBelt = earnedBelts.length > 0
      ? earnedBelts[earnedBelts.length - 1]
      : 'white';

    const beltIdx = getBeltIndex(highestBelt);
    const unitStart = beltIdx * 2 + (earnedBelts.length > 0 ? 3 : 1);

    for (const belt of earnedBelts) {
      const techniques = getTechniquesByBelt(belt);
      if (techniques.length > 0) {
        await seedTechniquesAsKnown(activeProfile.id, techniques);
      }
    }

    const updates = {
      currentBelt: highestBelt,
      currentUnit: Math.min(unitStart, 8),
      currentStripe: 1,
      coins: totalCoins,
      placementBelt: highestBelt,
      placementCompleted: true,
    };

    await updateProfile(activeProfile.id, updates);
    setActiveProfile({ ...activeProfile, ...updates });
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <VoxelConfetti active={showConfetti} color={currentTrial ? BELT_CSS_COLORS[currentTrial.belt] : undefined} />

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
            <div className="text-6xl">🥋</div>
            <h1 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
              La Prueba del Guerrero
            </h1>
            <SpeechBubble
              text="Welcome to the Dojo, warrior. Show me what you already know. Every belt you earn is one you've mastered. ¡Hajime!"
            />
            <DojoButton size="lg" onClick={() => setPhase('trial')}>
              Begin Trial! ⚔️
            </DojoButton>
          </motion.div>
        )}

        {/* Trial Questions */}
        {phase === 'trial' && currentQuestion && (
          <motion.div
            key={`trial-${trialIdx}-${questionIdx}`}
            className="flex-1 flex flex-col px-6 pt-6"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
          >
            <div className="flex items-start gap-4 mb-6">
              <BeltRack
                currentBelt={currentTrial.belt}
                earnedBelts={earnedBelts}
                orientation="vertical"
                className="hidden sm:flex"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-baloo text-lg font-bold" style={{ color: BELT_CSS_COLORS[currentTrial.belt] }}>
                    {currentTrial.label}
                  </span>
                  <span className="font-pixel text-xs text-white/40">
                    {questionIdx + 1}/{currentTrial.questions.length}
                  </span>
                </div>

                <h2 className="font-baloo text-2xl font-extrabold text-white mb-6">
                  {currentQuestion.prompt}
                </h2>

                <div className="flex flex-col gap-3">
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
                      beltColor={BELT_CSS_COLORS[currentTrial.belt]}
                      onClick={() => handleAnswer(opt)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Belt-Up Ceremony */}
        {phase === 'beltUp' && (
          <motion.div
            key="beltup"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: 2, duration: 0.4 }}
            >
              <BeltBadge belt={currentTrial.belt} size="lg" showLabel />
            </motion.div>
            <h2 className="font-baloo text-3xl font-extrabold text-center" style={{ color: BELT_CSS_COLORS[currentTrial.belt] }}>
              {BELT_DISPLAY_NAMES[currentTrial.belt]} Earned!
            </h2>
            <p className="font-poppins text-white/60 text-center">
              {earnedBelts.length} belt{earnedBelts.length > 1 ? 's' : ''} earned! You've bypassed {earnedBelts.length * 2} stripes!
            </p>
            <DojoButton size="lg" onClick={nextTrialOrFinish}>
              {trialIdx + 1 < trials.length ? 'Next Trial →' : 'See Results'}
            </DojoButton>
          </motion.div>
        )}

        {/* Placement Result */}
        {phase === 'result' && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-5xl">🏆</div>
            <h1 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
              {earnedBelts.length === 0
                ? 'Welcome to the Dojo!'
                : earnedBelts.length >= 5
                  ? '¡Increíble, guerrero!'
                  : `${BELT_DISPLAY_NAMES[earnedBelts[earnedBelts.length - 1]]} Earned!`}
            </h1>
            <p className="font-poppins text-white/60 text-center max-w-xs">
              {earnedBelts.length === 0
                ? 'Every master was once a beginner. Sensei will guide you from the start.'
                : `You conquered ${earnedBelts.length} trial${earnedBelts.length > 1 ? 's' : ''}! Your training begins at a higher rank.`}
            </p>

            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-2 rounded-xl">
                <span>🪙</span>
                <span className="font-pixel text-sm text-coin-gold">{totalCoins}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {earnedBelts.map((b) => (
                <BeltBadge key={b} belt={b} size="md" earned />
              ))}
            </div>

            <DojoButton size="lg" onClick={() => navigate('/path')} className="mt-4">
              Enter the Warrior's Path →
            </DojoButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
