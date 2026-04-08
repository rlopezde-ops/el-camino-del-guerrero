import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { getUnitById, getDojo1Units } from '../data/curriculum';
import { getRandomPhrase } from '../data/senseiPhrases';
import { recordReview } from '../lib/spacedRepetition';
import { getSessionConfig } from '../lib/adaptiveDifficulty';
import { generateSessionExercises, getTechniquesUpToUnit } from '../lib/exerciseGenerator';
import { accuracyToStars } from '../lib/scoreStars';
import ProgressBar from '../components/ui/ProgressBar';
import ComboCounter from '../components/ui/ComboCounter';
import DojoButton from '../components/ui/DojoButton';
import OptionCard from '../components/ui/OptionCard';
import SpeechBubble from '../components/ui/SpeechBubble';
import VoxelConfetti from '../components/ui/VoxelConfetti';
import KiCounter from '../components/ui/KiCounter';
import { BELT_CSS_COLORS } from '../types';
import type { Exercise } from '../types';

type KataTile = { id: string; text: string };
import {
  listenForSpanish,
  scorePronunciation,
  isSpeechRecognitionSupported,
  normalizeSpanishPhrase,
} from '../lib/speechRecognition';
import { speakSpanish, isTTSSupported } from '../lib/tts';
import { shuffleArray } from '../lib/kataWords';
import { db } from '../db';

export default function TrainingSession() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const {
    activeProfile, recordAnswer, resetSession,
    sessionKi, sessionCombo, sessionMaxCombo,
    sessionCorrect, sessionTotal, updateStreak, updateProfile,
    getBestAccuracyForUnit,
  } = useGameStore();

  const unit = getUnitById(Number(unitId));

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerCorrectness, setAnswerCorrectness] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [senseiText, setSenseiText] = useState('');
  const [showSensei, setShowSensei] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [cooldownMeta, setCooldownMeta] = useState<{
    prevBest: number;
    newAcc: number;
    isNewBest: boolean;
  } | null>(null);
  const cooldownRunRef = useRef(false);

  // Kata state (unique ids so duplicate words each get their own tile)
  const [kataAvailable, setKataAvailable] = useState<KataTile[]>([]);
  const [kataSelected, setKataSelected] = useState<KataTile[]>([]);

  // Kiai state
  const [isListening, setIsListening] = useState(false);
  const [kiaiLocked, setKiaiLocked] = useState(false);
  const kiaiResolvedRef = useRef(false);

  // Speed drill state
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [selectedPairItem, setSelectedPairItem] = useState<string | null>(null);

  // Gamification state
  const [progressFlash, setProgressFlash] = useState(false);
  const [floatingKi, setFloatingKi] = useState<{ id: number; amount: number } | null>(null);
  const [confettiIntensity, setConfettiIntensity] = useState<'normal' | 'high'>('normal');
  const floatingKiId = useRef(0);

  useEffect(() => {
    setIsDone(false);
    setCooldownMeta(null);
    cooldownRunRef.current = false;
  }, [unitId]);

  useEffect(() => {
    const u = getUnitById(Number(unitId));
    if (!u || !activeProfile) return;
    resetSession();
    const config = getSessionConfig(activeProfile.ageGroup);
    const targetCount = Math.max(10, config.maxNewTechniques + 6);
    const units = getDojo1Units();
    const pool = getTechniquesUpToUnit(units, u.id);
    const generated = generateSessionExercises(u, pool, targetCount);
    setExercises(generated);
    setCurrentIdx(0);
    setSenseiText(getRandomPhrase('greeting', activeProfile.currentBelt).textEs);
    setShowSensei(true);
    const t = setTimeout(() => setShowSensei(false), 2500);
    return () => clearTimeout(t);
  }, [unitId, activeProfile?.id, activeProfile?.ageGroup, resetSession]);

  const currentExercise = exercises[currentIdx];
  const beltColor = unit ? BELT_CSS_COLORS[unit.belt] : '#fbbf24';

  // Reset per-exercise state when exercise changes
  useEffect(() => {
    if (!currentExercise) return;
    setSelectedAnswer(null);
    setAnswerCorrectness(null);
    setMatchedPairs(new Set());
    setSelectedPairItem(null);
    setKataSelected([]);
    kiaiResolvedRef.current = false;
    setKiaiLocked(false);
    if (currentExercise.words) {
      const tiles: KataTile[] = currentExercise.words.map((text, i) => ({
        id: `${currentExercise.id}-k-${i}`,
        text,
      }));
      setKataAvailable(shuffleArray(tiles));
    } else {
      setKataAvailable([]);
    }

  }, [currentIdx, currentExercise?.id]);

  const advance = useCallback(() => {
    const next = currentIdx + 1;
    if (next >= exercises.length) {
      setIsDone(true);
    } else {
      setCurrentIdx(next);
    }
  }, [currentIdx, exercises.length]);

  const flashCorrect = useCallback((kiAmount: number) => {
    setProgressFlash(true);
    setTimeout(() => setProgressFlash(false), 500);
    floatingKiId.current += 1;
    setFloatingKi({ id: floatingKiId.current, amount: kiAmount });
    setTimeout(() => setFloatingKi(null), 1200);
  }, []);

  const handleOptionAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = answer === currentExercise.correctAnswer;
    setAnswerCorrectness(correct);
    recordAnswer(correct);

    if (activeProfile?.id) {
      recordReview(activeProfile.id, currentExercise.linkedTechniqueId ?? currentExercise.id, correct);
    }

    if (correct) {
      const phrase = getRandomPhrase('correct', activeProfile?.currentBelt);
      setSenseiText(phrase.textEs);
      setShowSensei(true);
      setTimeout(() => setShowSensei(false), 1000);
      flashCorrect(10);
    }

    setTimeout(advance, correct ? 900 : 1400);
  }, [selectedAnswer, currentExercise, activeProfile, recordAnswer, advance, flashCorrect]);

  const handleKataSubmit = useCallback(() => {
    const answer = kataSelected.map((t) => t.text).join(' ');
    const correct =
      normalizeSpanishPhrase(answer) === normalizeSpanishPhrase(currentExercise.correctAnswer);
    setAnswerCorrectness(correct);
    recordAnswer(correct);
    if (activeProfile?.id) {
      recordReview(activeProfile.id, currentExercise.linkedTechniqueId ?? currentExercise.id, correct);
    }
    if (correct) flashCorrect(10);
    setTimeout(advance, 1200);
  }, [kataSelected, currentExercise, recordAnswer, activeProfile, advance, flashCorrect]);

  const finalizeKiaiSuccess = useCallback(
    (stars: number) => {
      if (kiaiResolvedRef.current) return;
      kiaiResolvedRef.current = true;
      setKiaiLocked(true);
      setAnswerCorrectness(true);
      recordAnswer(true);
      if (activeProfile?.id) {
        recordReview(activeProfile.id, currentExercise.linkedTechniqueId ?? currentExercise.id, true);
      }
      flashCorrect(15);
      setSenseiText(stars === 3 ? '¡Perfecto!' : '¡Bien hecho!');
      setShowSensei(true);
      setTimeout(() => {
        setShowSensei(false);
        advance();
      }, 1100);
    },
    [currentExercise, activeProfile, recordAnswer, advance, flashCorrect],
  );

  const handleKiaiSpeak = useCallback(async () => {
    if (kiaiResolvedRef.current || kiaiLocked || isListening) return;
    if (!isSpeechRecognitionSupported()) {
      setSenseiText('No hay reconocimiento de voz aquí. Practica en voz alta y usa Omitir.');
      setShowSensei(true);
      setTimeout(() => setShowSensei(false), 2200);
      return;
    }
    setIsListening(true);
    try {
      const result = await listenForSpanish(10000);
      setIsListening(false);
      const { stars } = scorePronunciation(
        currentExercise.correctAnswer,
        result,
        activeProfile?.ageGroup === 'junior',
      );
      const minStars = activeProfile?.ageGroup === 'junior' ? 1 : 2;
      const correct = stars >= minStars;
      if (correct) {
        finalizeKiaiSuccess(stars);
      } else {
        setSenseiText('Casi — inténtalo otra vez.');
        setShowSensei(true);
        setTimeout(() => setShowSensei(false), 1600);
      }
    } catch (err) {
      setIsListening(false);
      const msg = (err as Error)?.message ?? '';
      if (msg === 'no-speech' || msg === 'timeout') {
        setSenseiText('No te escuché. Acércate al micrófono y habla fuerte.');
      } else if (msg === 'not-allowed' || msg === 'service-not-allowed') {
        setSenseiText('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
      } else if (msg === 'network') {
        setSenseiText('Sin conexión para reconocimiento de voz. Usa Omitir por ahora.');
      } else {
        setSenseiText('No te escuché. Toca el micrófono de nuevo.');
      }
      setShowSensei(true);
      setTimeout(() => setShowSensei(false), 2400);
    }
  }, [currentExercise, activeProfile, isListening, kiaiLocked, finalizeKiaiSuccess]);

  const handleKiaiSkip = useCallback(() => {
    if (kiaiResolvedRef.current) return;
    kiaiResolvedRef.current = true;
    setKiaiLocked(true);
    setAnswerCorrectness(false);
    recordAnswer(false);
    if (activeProfile?.id) {
      recordReview(activeProfile.id, currentExercise.linkedTechniqueId ?? currentExercise.id, false);
    }
    advance();
  }, [currentExercise, activeProfile, recordAnswer, advance]);

  const handlePairTap = useCallback((item: string) => {
    if (matchedPairs.has(item)) return;
    if (!selectedPairItem) {
      setSelectedPairItem(item);
      return;
    }
    const pair = currentExercise.pairs?.find(
      (p) =>
        (p.spanish === item && p.english === selectedPairItem) ||
        (p.english === item && p.spanish === selectedPairItem),
    );
    if (pair) {
      const next = new Set(matchedPairs);
      next.add(pair.spanish);
      next.add(pair.english);
      setMatchedPairs(next);
      recordAnswer(true);
      flashCorrect(10);
      if (currentExercise.pairs && next.size >= currentExercise.pairs.length * 2) {
        setTimeout(advance, 700);
      }
    } else {
      recordAnswer(false);
    }
    setSelectedPairItem(null);
  }, [matchedPairs, selectedPairItem, currentExercise, recordAnswer, advance, flashCorrect]);

  // Shuffled english pairs (stable per exercise)
  const shuffledEnglish = useMemo(() => {
    if (!currentExercise?.pairs) return [];
    return [...currentExercise.pairs].sort(() => Math.random() - 0.5);
  }, [currentExercise?.id]);

  useEffect(() => {
    if (!isDone || cooldownRunRef.current || !unit) return;
    const profile = useGameStore.getState().activeProfile;
    if (!profile?.id) return;
    cooldownRunRef.current = true;

    const pid = profile.id;
    const newAcc = sessionTotal > 0 ? sessionCorrect / sessionTotal : 0;
    const sc = sessionCorrect;
    const st = sessionTotal;
    const ski = sessionKi;
    const smc = sessionMaxCombo;
    const ut = unit;

    (async () => {
      const prevBest = await getBestAccuracyForUnit(pid, ut.id);
      setCooldownMeta({
        prevBest,
        newAcc,
        isNewBest: newAcc > prevBest,
      });

      await updateStreak();
      const earnedCoins = Math.floor(sc * 2) + 5;

      await db.sessionResults.add({
        profileId: pid,
        unitId: ut.id,
        completedAt: new Date(),
        kiEarned: ski,
        coinsEarned: earnedCoins,
        accuracy: newAcc,
        exercisesCompleted: st,
        comboMax: smc,
        newTechniquesLearned: ut.techniques.length,
        techniquesReviewed: st,
      });

      const fresh = useGameStore.getState().activeProfile;
      if (!fresh?.id) return;
      const isCurrentUnit = fresh.currentUnit === ut.id;
      const nextUnit = ut.id + 1;
      if (isCurrentUnit && nextUnit <= 8) {
        await updateProfile(pid, {
          currentUnit: nextUnit,
          currentStripe: nextUnit % 2 === 1 ? 1 : 2,
          kiPoints: fresh.kiPoints + ski,
          coins: fresh.coins + earnedCoins,
        });
      } else {
        await updateProfile(pid, {
          kiPoints: fresh.kiPoints + ski,
          coins: fresh.coins + earnedCoins,
        });
      }

      if (newAcc >= 0.8) {
        const starsEarned = newAcc >= 0.96 ? 3 : newAcc >= 0.9 ? 2 : 1;
        setConfettiIntensity(starsEarned >= 3 ? 'high' : 'normal');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), starsEarned >= 3 ? 4000 : 3000);
      }
    })();
  }, [
    isDone,
    unit,
    sessionCorrect,
    sessionTotal,
    sessionKi,
    sessionMaxCombo,
    updateStreak,
    updateProfile,
    getBestAccuracyForUnit,
  ]);

  if (!unit || !activeProfile) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <DojoButton size="lg" onClick={() => navigate('/path')}>Back to Path</DojoButton>
      </div>
    );
  }

  // ──── Cooldown screen ────────────────────────────────────────────

  if (isDone) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    const stars = cooldownMeta ? accuracyToStars(cooldownMeta.newAcc) : accuracyToStars(sessionTotal > 0 ? sessionCorrect / sessionTotal : 0);

    const celebrationTitle = accuracy >= 96 ? 'PERFECT MASTERY!' : accuracy >= 90 ? 'Excellent Form!' : accuracy >= 80 ? 'Good Training!' : 'Training Complete!';

    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
        <VoxelConfetti active={showConfetti} color={beltColor} intensity={confettiIntensity} />
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.h2
            className={`font-baloo text-4xl md:text-5xl font-extrabold ${accuracy >= 80 ? 'text-amber-400' : 'text-white'}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {celebrationTitle}
          </motion.h2>
          <p className="font-poppins text-lg md:text-xl text-white/50">{unit.title}</p>

          {cooldownMeta?.isNewBest && (
            <motion.div
              className="font-baloo text-xl md:text-2xl font-bold text-amber-300 px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-400/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
            >
              New best! {Math.round(cooldownMeta.prevBest * 100)}% → {Math.round(cooldownMeta.newAcc * 100)}%
            </motion.div>
          )}
          {cooldownMeta && !cooldownMeta.isNewBest && cooldownMeta.prevBest > 0 && (
            <p className="font-poppins text-base md:text-lg text-white/50">
              Personal best: {Math.round(cooldownMeta.prevBest * 100)}%
              {cooldownMeta.newAcc < cooldownMeta.prevBest ? ' — keep training to beat it!' : ''}
            </p>
          )}

          <div className="flex gap-2 items-center justify-center" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={`w-4 h-4 md:w-5 md:h-5 rounded-full ${i < stars ? 'bg-amber-400' : 'bg-white/15 border border-white/25'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.3, type: 'spring', stiffness: 300 }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5 w-full max-w-md mt-4">
            {[
              { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 80 ? '#22c55e' : '#f59e0b' },
              { label: 'Ki Earned', value: `+${sessionKi}`, color: '#38bdf8' },
              { label: 'Correct', value: `${sessionCorrect}/${sessionTotal}`, color: '#a855f7' },
              { label: 'Best Combo', value: `${sessionMaxCombo}x`, color: '#ef4444' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1 }}
              >
                <StatBox label={stat.label} value={stat.value} color={stat.color} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
          >
            <DojoButton size="lg" beltColor={beltColor} onClick={() => navigate('/path')} className="mt-4">
              Continue →
            </DojoButton>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ──── Main exercise UI ───────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <VoxelConfetti active={showConfetti} color={beltColor} intensity={confettiIntensity} />

      {/* Top bar */}
      <div className="px-4 md:px-6 pt-4 pb-3 flex items-center gap-4">
        <DojoButton variant="ghost" size="md" className="!min-w-[72px]" onClick={() => navigate('/path')}>Back</DojoButton>
        <ProgressBar value={currentIdx} max={exercises.length} color={beltColor} className="flex-1" flash={progressFlash} />
        <ComboCounter combo={sessionCombo} />
      </div>

      {/* Floating Ki */}
      <AnimatePresence>
        {floatingKi && (
          <motion.div
            key={floatingKi.id}
            className="fixed top-24 right-6 md:right-12 font-baloo font-extrabold text-2xl md:text-3xl text-cyan-400 pointer-events-none z-40"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            +{floatingKi.amount} Ki
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sensei bubble */}
      <AnimatePresence>
        {showSensei && (
          <motion.div
            className="px-6 py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SpeechBubble text={senseiText} typingSpeed={20} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise area */}
      <div className="flex-1 px-5 md:px-8 py-5 md:py-6 overflow-auto">
        <AnimatePresence mode="wait">
          {currentExercise && (
            <motion.div
              key={currentExercise.id + '-' + currentIdx}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderExercise()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom counters */}
      <div className="flex justify-center gap-4 px-4 pb-5 md:pb-6">
        <KiCounter value={sessionKi} type="ki" />
      </div>
    </div>
  );

  // ──── Exercise renderers ─────────────────────────────────────────

  function renderExercise() {
    if (!currentExercise) return null;
    switch (currentExercise.type) {
      case 'kata': return renderKata();
      case 'kiai': return renderKiai();
      case 'speed': return renderSpeedDrill();
      default: return renderMultipleChoice();
    }
  }

  function renderMultipleChoice() {
    const typeLabels: Record<string, string> = {
      strike: 'Strike!',
      counter: 'Counter!',
      block: 'Block!',
      sense: 'Sense!',
      mission: 'Mission!',
    };

    const isSense = currentExercise.type === 'sense';
    const promptHasSpanish = /[""]([^""]+)[""]/.exec(currentExercise.prompt);
    const spanishInPrompt = promptHasSpanish?.[1];

    const optionsAreSpanish =
      currentExercise.type === 'strike' ||
      currentExercise.type === 'block' ||
      (currentExercise.type === 'counter' && currentExercise.options?.includes(currentExercise.correctAnswer) &&
        /^[a-záéíóúñü\s]+$/i.test(currentExercise.correctAnswer));

    return (
      <div className="flex flex-col gap-5 md:gap-6">
        <span className="font-baloo text-lg md:text-xl font-bold tracking-wide" style={{ color: beltColor }}>
          {typeLabels[currentExercise.type] || currentExercise.type}
        </span>

        {isSense && spanishInPrompt ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">Listen and choose the meaning:</h2>
            <motion.button
              type="button"
              className="flex items-center gap-4 px-6 py-4 rounded-2xl md:rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 cursor-pointer self-start group hover:bg-amber-500/30 transition-colors"
              onClick={() => speakSpanish(spanishInPrompt)}
              aria-label="Hear the word"
              whileTap={{ scale: 0.96 }}
            >
              <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-500 flex items-center justify-center font-baloo text-sm md:text-base font-bold text-dojo-dark leading-none">Play</span>
              <span className="font-baloo text-3xl md:text-4xl text-amber-400 group-hover:text-amber-300">"{spanishInPrompt}"</span>
              <span className="font-poppins text-sm md:text-base text-amber-400/60 ml-1">Tap to hear</span>
            </motion.button>
          </div>
        ) : spanishInPrompt && isTTSSupported() ? (
          <motion.button
            type="button"
            className="flex items-center gap-3 cursor-pointer self-start group text-left"
            onClick={() => speakSpanish(spanishInPrompt)}
            whileTap={{ scale: 0.97 }}
          >
            <span className="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center font-baloo text-xs font-bold text-amber-400 shrink-0 leading-none">Play</span>
            <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">{currentExercise.prompt}</h2>
          </motion.button>
        ) : (
          <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">{currentExercise.prompt}</h2>
        )}

        <div className="flex flex-col gap-4 mt-2">
          {currentExercise.options?.map((opt) => (
            <div key={opt} className="flex items-center gap-3">
              {optionsAreSpanish && isTTSSupported() && (
                <button
                  type="button"
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-xl cursor-pointer hover:bg-amber-500/30 transition-colors shrink-0"
                  onClick={(e) => { e.stopPropagation(); speakSpanish(opt); }}
                  aria-label={`Hear ${opt}`}
                >
                  <span className="font-baloo text-xs font-bold text-amber-400 leading-none">Play</span>
                </button>
              )}
              <div className="flex-1">
                <OptionCard
                  text={opt}
                  selected={selectedAnswer === opt}
                  correct={
                    selectedAnswer
                      ? opt === currentExercise.correctAnswer ? true : selectedAnswer === opt ? false : null
                      : null
                  }
                  disabled={selectedAnswer !== null}
                  beltColor={beltColor}
                  onClick={() => handleOptionAnswer(opt)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderKata() {
    return (
      <div className="flex flex-col gap-5 md:gap-6">
        <span className="font-baloo text-lg md:text-xl font-bold" style={{ color: beltColor }}>Kata!</span>
        <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">{currentExercise.prompt}</h2>

        {/* Selected words area */}
        <div className="min-h-[56px] md:min-h-[64px] bg-white/5 rounded-2xl md:rounded-3xl p-4 flex flex-wrap gap-3 border-2 border-white/10">
          {kataSelected.map((tile) => (
            <motion.button
              key={`sel-${tile.id}`}
              type="button"
              className="px-4 py-2.5 md:px-5 md:py-3 bg-amber-400 text-dojo-dark font-baloo font-bold rounded-xl md:rounded-2xl text-lg md:text-xl cursor-pointer min-h-[48px]"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setKataSelected((s) => s.filter((t) => t.id !== tile.id));
                setKataAvailable((a) => [...a, tile]);
              }}
            >
              {tile.text}
            </motion.button>
          ))}
        </div>

        {/* Available words */}
        <div className="flex flex-wrap gap-3">
          {kataAvailable.map((tile) => (
            <div key={`avail-wrap-${tile.id}`} className="flex items-center gap-2">
              {isTTSSupported() && (
                <button
                  type="button"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-lg cursor-pointer hover:bg-amber-500/30 transition-colors shrink-0"
                  onClick={() => speakSpanish(tile.text)}
                  aria-label={`Hear ${tile.text}`}
                >
                  <span className="font-baloo text-xs font-bold text-amber-400 leading-none">Play</span>
                </button>
              )}
              <motion.button
                key={`avail-${tile.id}`}
                type="button"
                className="px-4 py-2.5 md:px-5 md:py-3 bg-white/10 text-white font-baloo font-bold rounded-xl md:rounded-2xl text-lg md:text-xl cursor-pointer hover:bg-white/20 min-h-[48px]"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setKataAvailable((a) => a.filter((t) => t.id !== tile.id));
                  setKataSelected((s) => [...s, tile]);
                }}
              >
                {tile.text}
              </motion.button>
            </div>
          ))}
        </div>

        {kataSelected.length === (currentExercise.words?.length ?? 0) && answerCorrectness === null && (
          <DojoButton size="lg" onClick={handleKataSubmit} className="mt-2">Check Form →</DojoButton>
        )}

        {answerCorrectness !== null && (
          <motion.p
            className={`font-baloo text-xl md:text-2xl font-bold ${answerCorrectness ? 'text-green-400' : 'text-red-400'}`}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
          >
            {answerCorrectness ? '¡Perfecto!' : `Correct: "${currentExercise.correctAnswer}"`}
          </motion.p>
        )}
      </div>
    );
  }

  function renderKiai() {
    const phrase = currentExercise.displayPhrase ?? currentExercise.correctAnswer;
    return (
      <div className="flex flex-col items-center gap-5 md:gap-6 px-2">
        <span className="font-baloo text-lg md:text-xl font-bold" style={{ color: beltColor }}>Kiai!</span>
        <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white text-center leading-tight">{currentExercise.prompt}</h2>

        {/* Phrase with tap-to-hear */}
        <motion.button
          type="button"
          className="flex items-center gap-4 px-6 py-4 rounded-2xl md:rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 cursor-pointer mt-2 group hover:bg-amber-500/30 transition-colors max-w-full"
          onClick={() => speakSpanish(phrase)}
          aria-label="Hear pronunciation"
          whileTap={{ scale: 0.96 }}
        >
          <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-amber-500 flex items-center justify-center font-baloo text-sm md:text-base font-bold text-dojo-dark shrink-0 leading-none">Play</span>
          <span className="font-baloo text-2xl md:text-3xl text-amber-400 text-center leading-snug">"{phrase}"</span>
        </motion.button>
        {isTTSSupported() && (
          <p className="font-poppins text-sm md:text-base text-white/50">Toca para escuchar la pronunciación</p>
        )}

        <motion.button
          type="button"
          className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl cursor-pointer mt-2 ${
            isListening ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={handleKiaiSpeak}
          disabled={isListening || kiaiLocked}
        >
          <span className="font-baloo text-xl md:text-2xl font-bold text-dojo-dark">Mic</span>
        </motion.button>
        <p className="font-poppins text-base md:text-lg text-white/50 text-center max-w-md px-2">
          {isListening
            ? 'Escuchando… habla ahora.'
            : isSpeechRecognitionSupported()
              ? 'Toca el micrófono y di la frase. Necesitas una pronunciación clara para continuar.'
              : 'Este navegador no puede comprobar tu voz. Practica en voz alta y usa Omitir.'}
        </p>
        <DojoButton variant="ghost" size="md" onClick={handleKiaiSkip} disabled={kiaiLocked}>
          Omitir (cuenta como incorrecto) →
        </DojoButton>
      </div>
    );
  }

  function renderSpeedDrill() {
    if (!currentExercise.pairs) return renderMultipleChoice();
    return (
      <div className="flex flex-col gap-5 md:gap-6">
        <span className="font-baloo text-lg md:text-xl font-bold" style={{ color: beltColor }}>Speed Drill!</span>
        <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">{currentExercise.prompt}</h2>
        <div className="grid grid-cols-2 gap-4 md:gap-5 mt-2">
          <div className="flex flex-col gap-3">
            {currentExercise.pairs.map((p) => (
              <div key={p.spanish} className="flex items-center gap-2">
                {isTTSSupported() && (
                  <button
                    type="button"
                    className="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center text-lg cursor-pointer hover:bg-amber-500/30 transition-colors shrink-0"
                    onClick={() => speakSpanish(p.spanish)}
                    aria-label={`Hear ${p.spanish}`}
                  >
                    <span className="font-baloo text-xs font-bold text-amber-400 leading-none">Play</span>
                  </button>
                )}
                <motion.button
                  className={`flex-1 p-4 md:p-5 rounded-xl md:rounded-2xl text-left font-baloo font-bold text-lg md:text-xl cursor-pointer transition-colors min-h-[52px] ${
                    matchedPairs.has(p.spanish)
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : selectedPairItem === p.spanish
                        ? 'bg-amber-400/20 border border-amber-400'
                        : 'bg-white/5 border border-white/10 text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePairTap(p.spanish)}
                  disabled={matchedPairs.has(p.spanish)}
                >
                  {p.spanish}
                </motion.button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {shuffledEnglish.map((p) => (
              <motion.button
                key={p.english}
                className={`p-4 md:p-5 rounded-xl md:rounded-2xl text-left font-poppins text-lg md:text-xl font-medium cursor-pointer transition-colors min-h-[52px] ${
                  matchedPairs.has(p.english)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : selectedPairItem === p.english
                      ? 'bg-amber-400/20 border border-amber-400'
                      : 'bg-white/5 border border-white/10 text-white'
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePairTap(p.english)}
                disabled={matchedPairs.has(p.english)}
              >
                {p.english}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 text-center">
      <span className="font-pixel text-xl md:text-2xl" style={{ color }}>{value}</span>
      <p className="font-poppins text-sm md:text-base text-white/45 mt-1.5">{label}</p>
    </div>
  );
}
