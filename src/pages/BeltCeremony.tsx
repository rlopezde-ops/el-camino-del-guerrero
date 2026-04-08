import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { getDojo1Units } from '../data/curriculum';
import { generateBeltTestExercises, getTechniquesUpToUnit } from '../lib/exerciseGenerator';
import BeltBadge from '../components/ui/BeltBadge';
import DojoButton from '../components/ui/DojoButton';
import VoxelConfetti from '../components/ui/VoxelConfetti';
import WarriorAvatar from '../components/ui/WarriorAvatar';
import OptionCard from '../components/ui/OptionCard';
import ProgressBar from '../components/ui/ProgressBar';
import { BELT_CSS_COLORS, BELT_ORDER, getBeltIndex } from '../types';
import { normalizeSpanishPhrase, listenForSpanish, scorePronunciation, isSpeechRecognitionSupported } from '../lib/speechRecognition';
import { shuffleArray } from '../lib/kataWords';

type Phase = 'intro' | 'battle' | 'result' | 'ceremony';

type KataTile = { id: string; text: string };

export default function BeltCeremony() {
  useParams<{ dojoId: string }>();
  const navigate = useNavigate();
  const { activeProfile, updateProfile, recordAnswer, resetSession, sessionCorrect, sessionTotal } = useGameStore();

  const [attemptKey, setAttemptKey] = useState(0);
  const exercises = useMemo(() => {
    const units = getDojo1Units();
    const pool = getTechniquesUpToUnit(units, 8);
    return generateBeltTestExercises(units, pool, 14);
  }, [attemptKey]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [, setAnswerCorrectness] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [kataAvailable, setKataAvailable] = useState<KataTile[]>([]);
  const [kataSelected, setKataSelected] = useState<KataTile[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [kiaiLocked, setKiaiLocked] = useState(false);
  const [beltKiaiHint, setBeltKiaiHint] = useState('');
  const kiaiResolvedRef = useRef(false);

  const currentExercise = exercises[currentIdx];
  const beltColor = BELT_CSS_COLORS['green'];

  useEffect(() => {
    resetSession();
  }, [attemptKey, resetSession]);

  useEffect(() => {
    kiaiResolvedRef.current = false;
    setKiaiLocked(false);
    setBeltKiaiHint('');
    if (!currentExercise?.words?.length) {
      setKataAvailable([]);
      setKataSelected([]);
      return;
    }
    const tiles: KataTile[] = currentExercise.words.map((text, i) => ({
      id: `${currentExercise.id}-bk-${i}`,
      text,
    }));
    setKataSelected([]);
    setKataAvailable(shuffleArray(tiles));
  }, [currentIdx, currentExercise?.id, currentExercise?.words]);

  function goToNextBattleQuestion(correct: boolean) {
    setAnswerCorrectness(correct);
    recordAnswer(correct);
    setTimeout(() => {
      setSelectedAnswer(null);
      setAnswerCorrectness(null);
      const next = currentIdx + 1;
      if (next >= exercises.length) {
        evaluateResult();
      } else {
        setCurrentIdx(next);
      }
    }, 1000);
  }

  function handleAnswer(answer: string) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const correct = answer === currentExercise.correctAnswer;
    goToNextBattleQuestion(correct);
  }

  function handleKataSubmit() {
    if (selectedAnswer !== null || !currentExercise.words) return;
    setSelectedAnswer('kata');
    const built = kataSelected.map((t) => t.text).join(' ');
    const correct =
      normalizeSpanishPhrase(built) === normalizeSpanishPhrase(currentExercise.correctAnswer);
    goToNextBattleQuestion(correct);
  }

  async function handleBeltKiaiSpeak() {
    if (kiaiResolvedRef.current || kiaiLocked || isListening || selectedAnswer !== null) return;
    if (!isSpeechRecognitionSupported()) return;
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
      if (stars >= minStars) {
        kiaiResolvedRef.current = true;
        setKiaiLocked(true);
        setSelectedAnswer('kiai');
        goToNextBattleQuestion(true);
      } else {
        setBeltKiaiHint('Not quite — tap the mic and try again.');
        setTimeout(() => setBeltKiaiHint(''), 2200);
      }
    } catch {
      setIsListening(false);
      setBeltKiaiHint('Did not catch that — try again.');
      setTimeout(() => setBeltKiaiHint(''), 2200);
    }
  }

  function handleBeltKiaiSkip() {
    if (kiaiResolvedRef.current || selectedAnswer !== null) return;
    kiaiResolvedRef.current = true;
    setKiaiLocked(true);
    setSelectedAnswer('kiai-skip');
    goToNextBattleQuestion(false);
  }

  function evaluateResult() {
    const { sessionCorrect: sc, sessionTotal: st } = useGameStore.getState();
    const accuracy = st > 0 ? sc / st : 0;
    if (accuracy >= 0.8) {
      setPhase('ceremony');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } else {
      setPhase('result');
    }
  }

  async function claimBelt() {
    if (!activeProfile?.id) return;
    const nextBeltIdx = Math.min(getBeltIndex(activeProfile.currentBelt) + 1, BELT_ORDER.length - 1);
    const newBelt = BELT_ORDER[nextBeltIdx];
    await updateProfile(activeProfile.id, {
      currentBelt: newBelt,
      coins: activeProfile.coins + 100,
      kiPoints: activeProfile.kiPoints + 200,
    });
    navigate('/path');
  }

  if (!activeProfile) {
    navigate('/');
    return null;
  }

  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
  const stars = accuracy >= 96 ? 3 : accuracy >= 90 ? 2 : accuracy >= 80 ? 1 : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <VoxelConfetti active={showConfetti} color={beltColor} />

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
            <div className="text-6xl">🏯</div>
            <h1 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
              Prueba de Cinturón
            </h1>
            <p className="font-poppins text-white/60 text-center max-w-xs">
              Complete the kata with at least 80% accuracy to earn your belt promotion.
              {exercises.length} techniques to demonstrate.
            </p>

            <WarriorAvatar
              head={activeProfile.avatarHead}
              hair={activeProfile.avatarHair}
              skinTone={activeProfile.avatarSkinTone}
              belt={activeProfile.currentBelt}
              size={100}
            />

            <DojoButton size="lg" onClick={() => setPhase('battle')}>
              Begin Belt Test! ⚔️
            </DojoButton>
          </motion.div>
        )}

        {/* Battle (exercises) */}
        {phase === 'battle' && currentExercise && (
          <motion.div
            key={`battle-${currentIdx}`}
            className="flex-1 flex flex-col px-6 pt-6"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-baloo text-sm text-amber-400">Technique {currentIdx + 1}/{exercises.length}</span>
                <span className="font-pixel text-xs text-white/40">{accuracy}%</span>
              </div>
              <ProgressBar value={currentIdx} max={exercises.length} color={beltColor} />
            </div>

            <h2 className="font-baloo text-2xl font-extrabold text-white mb-4">{currentExercise.prompt}</h2>

            {currentExercise.options && (
              <div className="flex flex-col gap-3">
                {currentExercise.options.map((opt) => (
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
                    onClick={() => handleAnswer(opt)}
                  />
                ))}
              </div>
            )}

            {currentExercise.type === 'kata' && currentExercise.words && !currentExercise.options && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="min-h-[48px] bg-white/5 rounded-2xl p-3 flex flex-wrap gap-2 border border-white/10">
                  {kataSelected.map((tile) => (
                    <motion.button
                      key={`bsel-${tile.id}`}
                      type="button"
                      className="px-3 py-1.5 bg-amber-400 text-dojo-dark font-baloo font-bold rounded-xl text-sm cursor-pointer"
                      whileTap={{ scale: 0.9 }}
                      disabled={selectedAnswer !== null}
                      onClick={() => {
                        setKataSelected((s) => s.filter((t) => t.id !== tile.id));
                        setKataAvailable((a) => [...a, tile]);
                      }}
                    >
                      {tile.text}
                    </motion.button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {kataAvailable.map((tile) => (
                    <motion.button
                      key={`bav-${tile.id}`}
                      type="button"
                      className="px-3 py-1.5 bg-white/10 text-white font-baloo font-bold rounded-xl text-sm cursor-pointer hover:bg-white/20"
                      whileTap={{ scale: 0.9 }}
                      disabled={selectedAnswer !== null}
                      onClick={() => {
                        setKataAvailable((a) => a.filter((t) => t.id !== tile.id));
                        setKataSelected((s) => [...s, tile]);
                      }}
                    >
                      {tile.text}
                    </motion.button>
                  ))}
                </div>
                {kataSelected.length === currentExercise.words.length && selectedAnswer === null && (
                  <DojoButton size="sm" className="mt-2" onClick={handleKataSubmit}>
                    Check form →
                  </DojoButton>
                )}
              </div>
            )}

            {currentExercise.type === 'kiai' && (
              <div className="flex flex-col items-center gap-4 mt-4">
                <p className="font-baloo text-2xl text-amber-400 text-center px-2">
                  "{currentExercise.displayPhrase ?? currentExercise.correctAnswer}"
                </p>
                {isSpeechRecognitionSupported() ? (
                  <>
                    <motion.button
                      type="button"
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl cursor-pointer ${
                        isListening ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      disabled={isListening || kiaiLocked || selectedAnswer !== null}
                      onClick={handleBeltKiaiSpeak}
                    >
                      🎤
                    </motion.button>
                    <p className="font-poppins text-xs text-white/40 text-center max-w-xs">
                      {isListening ? 'Listening…' : 'Speak clearly; belt tests need 2★+ pronunciation (1★ for juniors).'}
                    </p>
                    {beltKiaiHint ? (
                      <p className="font-poppins text-sm text-amber-300 text-center">{beltKiaiHint}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="font-poppins text-xs text-white/50 text-center">
                    Voice check unavailable in this browser.
                  </p>
                )}
                <DojoButton
                  variant="ghost"
                  size="sm"
                  disabled={kiaiLocked || selectedAnswer !== null}
                  onClick={handleBeltKiaiSkip}
                >
                  Skip (counts wrong) →
                </DojoButton>
              </div>
            )}
          </motion.div>
        )}

        {/* Failed result */}
        {phase === 'result' && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl">💪</div>
            <h2 className="font-baloo text-2xl font-extrabold text-white text-center">
              Not quite, warrior!
            </h2>
            <p className="font-poppins text-white/60 text-center max-w-xs">
              You scored {accuracy}%. You need 80% to pass. Train more and return stronger.
            </p>
            <div className="flex gap-3 mt-4">
              <DojoButton
                variant="secondary"
                onClick={() => {
                  setAttemptKey((k) => k + 1);
                  setCurrentIdx(0);
                  setPhase('intro');
                }}
              >
                Retry
              </DojoButton>
              <DojoButton onClick={() => navigate('/path')}>
                Back to Training
              </DojoButton>
            </div>
          </motion.div>
        )}

        {/* Belt ceremony */}
        {phase === 'ceremony' && (
          <motion.div
            key="ceremony"
            className="flex-1 flex flex-col items-center justify-center px-6 gap-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Sensei tying belt animation */}
            <motion.div
              className="text-6xl"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              🥋
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <BeltBadge belt="green" size="lg" showLabel />
            </motion.div>

            <h1 className="font-baloo text-3xl font-extrabold text-center" style={{ color: beltColor }}>
              Belt Promotion!
            </h1>

            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map((s) => (
                <motion.span
                  key={s}
                  className="text-3xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + s * 0.2, type: 'spring' }}
                >
                  {s <= stars ? '⭐' : '☆'}
                </motion.span>
              ))}
            </div>

            <p className="font-poppins text-white/60 text-center">
              {stars === 3 ? 'Flawless! You have achieved perfect form.' :
               stars === 2 ? 'Strong performance! Sensei is impressed.' :
               'You passed! But a true warrior can do better.'}
            </p>

            <p className="font-poppins text-sm text-amber-400">
              Accuracy: {accuracy}% · +200 Ki · +100 Coins
            </p>

            <DojoButton size="lg" beltColor={beltColor} onClick={claimBelt} className="mt-4">
              Claim Your Belt! 🎉
            </DojoButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
