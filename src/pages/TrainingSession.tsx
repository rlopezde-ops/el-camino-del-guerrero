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
    }

    setTimeout(advance, correct ? 900 : 1400);
  }, [selectedAnswer, currentExercise, activeProfile, recordAnswer, advance]);

  const handleKataSubmit = useCallback(() => {
    const answer = kataSelected.map((t) => t.text).join(' ');
    const correct =
      normalizeSpanishPhrase(answer) === normalizeSpanishPhrase(currentExercise.correctAnswer);
    setAnswerCorrectness(correct);
    recordAnswer(correct);
    if (activeProfile?.id) {
      recordReview(activeProfile.id, currentExercise.linkedTechniqueId ?? currentExercise.id, correct);
    }
    setTimeout(advance, 1200);
  }, [kataSelected, currentExercise, recordAnswer, activeProfile, advance]);

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
      setSenseiText(stars === 3 ? '¡Perfecto!' : '¡Bien hecho!');
      setShowSensei(true);
      setTimeout(() => {
        setShowSensei(false);
        advance();
      }, 1100);
    },
    [currentExercise, activeProfile, recordAnswer, advance],
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
    } catch {
      setIsListening(false);
      setSenseiText('No te escuché. Toca el micrófono de nuevo.');
      setShowSensei(true);
      setTimeout(() => setShowSensei(false), 1800);
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
      if (currentExercise.pairs && next.size >= currentExercise.pairs.length * 2) {
        setTimeout(advance, 700);
      }
    } else {
      recordAnswer(false);
    }
    setSelectedPairItem(null);
  }, [matchedPairs, selectedPairItem, currentExercise, recordAnswer, advance]);

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

      if (newAcc > prevBest) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
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
      <div className="h-full flex items-center justify-center">
        <DojoButton onClick={() => navigate('/path')}>Back to Path</DojoButton>
      </div>
    );
  }

  // ──── Cooldown screen ────────────────────────────────────────────

  if (isDone) {
    const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    const stars = cooldownMeta ? accuracyToStars(cooldownMeta.newAcc) : accuracyToStars(sessionTotal > 0 ? sessionCorrect / sessionTotal : 0);

    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
        <VoxelConfetti active={showConfetti} color={beltColor} />
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl">🏆</div>
          <h2 className="font-baloo text-3xl font-extrabold text-amber-400">Training Complete!</h2>
          <p className="font-poppins text-white/50">{unit.title}</p>

          {cooldownMeta?.isNewBest && (
            <motion.div
              className="font-baloo text-lg font-bold text-amber-300 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              New best! {Math.round(cooldownMeta.prevBest * 100)}% → {Math.round(cooldownMeta.newAcc * 100)}%
            </motion.div>
          )}
          {cooldownMeta && !cooldownMeta.isNewBest && cooldownMeta.prevBest > 0 && (
            <p className="font-poppins text-sm text-white/50">
              Personal best: {Math.round(cooldownMeta.prevBest * 100)}%
              {cooldownMeta.newAcc < cooldownMeta.prevBest ? ' — keep training to beat it!' : ''}
            </p>
          )}

          <div className="flex gap-1 text-2xl" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < stars ? 'text-amber-400' : 'text-white/20'}>★</span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
            <StatBox label="Accuracy" value={`${accuracy}%`} color={accuracy >= 80 ? '#22c55e' : '#f59e0b'} />
            <StatBox label="Ki Earned" value={`+${sessionKi}`} color="#38bdf8" />
            <StatBox label="Correct" value={`${sessionCorrect}/${sessionTotal}`} color="#a855f7" />
            <StatBox label="Best Combo" value={`${sessionMaxCombo}x`} color="#ef4444" />
          </div>

          <DojoButton size="lg" beltColor={beltColor} onClick={() => navigate('/path')} className="mt-4">
            Continue →
          </DojoButton>
        </motion.div>
      </div>
    );
  }

  // ──── Main exercise UI ───────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <VoxelConfetti active={showConfetti} color={beltColor} />

      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <DojoButton variant="ghost" size="sm" onClick={() => navigate('/path')}>✕</DojoButton>
        <ProgressBar value={currentIdx} max={exercises.length} color={beltColor} className="flex-1" />
        <ComboCounter combo={sessionCombo} />
      </div>

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
      <div className="flex-1 px-6 py-4 overflow-auto">
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
      <div className="flex justify-center gap-3 px-4 pb-4">
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
      strike: '⚡ Strike!', counter: '🔄 Counter!', block: '🛡️ Block!',
      sense: '👂 Sense!', mission: '📜 Mission!',
    };
    return (
      <div className="flex flex-col gap-4">
        <span className="font-baloo text-sm font-bold" style={{ color: beltColor }}>
          {typeLabels[currentExercise.type] || currentExercise.type}
        </span>
        <h2 className="font-baloo text-2xl font-extrabold text-white">{currentExercise.prompt}</h2>
        <div className="flex flex-col gap-3 mt-2">
          {currentExercise.options?.map((opt) => (
            <OptionCard
              key={opt}
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
          ))}
        </div>
      </div>
    );
  }

  function renderKata() {
    return (
      <div className="flex flex-col gap-4">
        <span className="font-baloo text-sm font-bold" style={{ color: beltColor }}>🥋 Kata!</span>
        <h2 className="font-baloo text-2xl font-extrabold text-white">{currentExercise.prompt}</h2>

        {/* Selected words area */}
        <div className="min-h-[48px] bg-white/5 rounded-2xl p-3 flex flex-wrap gap-2 border border-white/10">
          {kataSelected.map((tile) => (
            <motion.button
              key={`sel-${tile.id}`}
              type="button"
              className="px-3 py-1.5 bg-amber-400 text-dojo-dark font-baloo font-bold rounded-xl text-sm cursor-pointer"
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
        <div className="flex flex-wrap gap-2">
          {kataAvailable.map((tile) => (
            <motion.button
              key={`avail-${tile.id}`}
              type="button"
              className="px-3 py-1.5 bg-white/10 text-white font-baloo font-bold rounded-xl text-sm cursor-pointer hover:bg-white/20"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setKataAvailable((a) => a.filter((t) => t.id !== tile.id));
                setKataSelected((s) => [...s, tile]);
              }}
            >
              {tile.text}
            </motion.button>
          ))}
        </div>

        {kataSelected.length === (currentExercise.words?.length ?? 0) && answerCorrectness === null && (
          <DojoButton onClick={handleKataSubmit} className="mt-2">Check Form →</DojoButton>
        )}

        {answerCorrectness !== null && (
          <motion.p
            className={`font-baloo text-lg font-bold ${answerCorrectness ? 'text-green-400' : 'text-red-400'}`}
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
      <div className="flex flex-col items-center gap-4">
        <span className="font-baloo text-sm font-bold" style={{ color: beltColor }}>🗣️ Kiai!</span>
        <h2 className="font-baloo text-2xl font-extrabold text-white text-center">{currentExercise.prompt}</h2>
        <p className="font-baloo text-3xl text-amber-400 mt-4 text-center px-2">"{phrase}"</p>
        <motion.button
          type="button"
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl cursor-pointer mt-4 ${
            isListening ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={handleKiaiSpeak}
          disabled={isListening || kiaiLocked}
        >
          🎤
        </motion.button>
        <p className="font-poppins text-sm text-white/40 text-center max-w-xs">
          {isListening
            ? 'Escuchando… habla ahora.'
            : isSpeechRecognitionSupported()
              ? 'Toca el micrófono y di la frase. Necesitas una pronunciación clara para continuar.'
              : 'Este navegador no puede comprobar tu voz. Practica en voz alta y usa Omitir.'}
        </p>
        <DojoButton variant="ghost" size="sm" onClick={handleKiaiSkip} disabled={kiaiLocked}>
          Omitir (cuenta como incorrecto) →
        </DojoButton>
      </div>
    );
  }

  function renderSpeedDrill() {
    if (!currentExercise.pairs) return renderMultipleChoice();
    return (
      <div className="flex flex-col gap-4">
        <span className="font-baloo text-sm font-bold" style={{ color: beltColor }}>⚡ Speed Drill!</span>
        <h2 className="font-baloo text-xl font-extrabold text-white">{currentExercise.prompt}</h2>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex flex-col gap-2">
            {currentExercise.pairs.map((p) => (
              <motion.button
                key={p.spanish}
                className={`p-3 rounded-xl text-left font-baloo font-bold cursor-pointer transition-colors ${
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
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {shuffledEnglish.map((p) => (
              <motion.button
                key={p.english}
                className={`p-3 rounded-xl text-left font-poppins cursor-pointer transition-colors ${
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
    <div className="bg-white/5 rounded-2xl p-3 text-center">
      <span className="font-pixel text-lg" style={{ color }}>{value}</span>
      <p className="font-poppins text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}
