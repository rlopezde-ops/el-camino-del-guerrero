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
import { speakSpanish, isTTSSupported } from '../lib/tts';
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
    } else {
      const tiles: KataTile[] = currentExercise.words.map((text, i) => ({
        id: `${currentExercise.id}-bk-${i}`,
        text,
      }));
      setKataSelected([]);
      setKataAvailable(shuffleArray(tiles));
    }

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
    } catch (err) {
      setIsListening(false);
      const msg = (err as Error)?.message ?? '';
      if (msg === 'not-allowed' || msg === 'service-not-allowed') {
        setBeltKiaiHint('Microphone permission denied. Enable it in browser settings.');
      } else {
        setBeltKiaiHint('Did not catch that — speak louder and try again.');
      }
      setTimeout(() => setBeltKiaiHint(''), 2800);
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
            <div className="h-4 w-28 mx-auto rounded-full bg-amber-400/35" aria-hidden />
            <h1 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
              Prueba de Cinturón
            </h1>
            <p className="font-poppins text-lg md:text-xl text-white/65 text-center max-w-md px-2">
              Complete the kata with at least 80% accuracy to earn your belt promotion.
              {exercises.length} techniques to demonstrate.
            </p>

            <WarriorAvatar
              head={activeProfile.avatarHead}
              hair={activeProfile.avatarHair}
              skinTone={activeProfile.avatarSkinTone}
              belt={activeProfile.currentBelt}
              size={120}
            />

            <DojoButton size="lg" onClick={() => setPhase('battle')}>
              Begin Belt Test!
            </DojoButton>
          </motion.div>
        )}

        {/* Battle (exercises) */}
        {phase === 'battle' && currentExercise && (
          <motion.div
            key={`battle-${currentIdx}`}
            className="flex-1 flex flex-col px-5 md:px-8 pt-6 pb-4"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
          >
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-baloo text-lg md:text-xl text-amber-400">Technique {currentIdx + 1}/{exercises.length}</span>
                <span className="font-pixel text-sm md:text-base text-white/45">{accuracy}%</span>
              </div>
              <ProgressBar value={currentIdx} max={exercises.length} color={beltColor} />
            </div>

            {(() => {
              const promptMatch = /[""]([^""]+)[""]/.exec(currentExercise.prompt);
              const spanishInPrompt = promptMatch?.[1];
              const isSense = currentExercise.type === 'sense';

              return (
                <>
                  {isSense && spanishInPrompt ? (
                    <div className="flex flex-col gap-4 mb-5">
                      <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">Listen and choose:</h2>
                      <motion.button
                        type="button"
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl md:rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 cursor-pointer self-start group hover:bg-amber-500/30 transition-colors"
                        onClick={() => speakSpanish(spanishInPrompt)}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center font-baloo text-sm font-bold text-dojo-dark leading-none">Play</span>
                        <span className="font-baloo text-2xl md:text-3xl text-amber-400">"{spanishInPrompt}"</span>
                        <span className="font-poppins text-sm text-amber-400/60 ml-1">Tap to hear</span>
                      </motion.button>
                    </div>
                  ) : spanishInPrompt && isTTSSupported() ? (
                    <motion.button
                      type="button"
                      className="flex items-center gap-3 cursor-pointer self-start group mb-5 text-left"
                      onClick={() => speakSpanish(spanishInPrompt)}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="w-11 h-11 rounded-full bg-amber-500/20 flex items-center justify-center font-baloo text-xs font-bold text-amber-400 shrink-0 leading-none">Play</span>
                      <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white leading-tight">{currentExercise.prompt}</h2>
                    </motion.button>
                  ) : (
                    <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">{currentExercise.prompt}</h2>
                  )}
                </>
              );
            })()}

            {currentExercise.options && (
              <div className="flex flex-col gap-4">
                {currentExercise.options.map((opt) => {
                  const optionsAreSpanish =
                    currentExercise.type === 'strike' ||
                    currentExercise.type === 'block' ||
                    (currentExercise.type === 'counter' &&
                      /^[a-záéíóúñü\s]+$/i.test(currentExercise.correctAnswer));
                  return (
                    <div key={opt} className="flex items-center gap-3">
                      {optionsAreSpanish && isTTSSupported() && (
                        <button
                          type="button"
                          className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-xl cursor-pointer hover:bg-amber-500/30 transition-colors shrink-0"
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
                          onClick={() => handleAnswer(opt)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentExercise.type === 'kata' && currentExercise.words && !currentExercise.options && (
              <div className="flex flex-col gap-5 mt-2">
                <div className="min-h-[56px] bg-white/5 rounded-2xl md:rounded-3xl p-4 flex flex-wrap gap-3 border-2 border-white/10">
                  {kataSelected.map((tile) => (
                    <motion.button
                      key={`bsel-${tile.id}`}
                      type="button"
                      className="px-4 py-2.5 bg-amber-400 text-dojo-dark font-baloo font-bold rounded-xl md:rounded-2xl text-lg md:text-xl cursor-pointer min-h-[48px]"
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
                <div className="flex flex-wrap gap-3">
                  {kataAvailable.map((tile) => (
                    <motion.button
                      key={`bav-${tile.id}`}
                      type="button"
                      className="px-4 py-2.5 bg-white/10 text-white font-baloo font-bold rounded-xl md:rounded-2xl text-lg md:text-xl cursor-pointer hover:bg-white/20 min-h-[48px]"
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
                  <DojoButton size="lg" className="mt-2" onClick={handleKataSubmit}>
                    Check form →
                  </DojoButton>
                )}
              </div>
            )}

            {currentExercise.type === 'kiai' && (
              <div className="flex flex-col items-center gap-5 mt-4 px-2">
                <motion.button
                  type="button"
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl md:rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 cursor-pointer group hover:bg-amber-500/30 transition-colors max-w-full"
                  onClick={() => speakSpanish(currentExercise.displayPhrase ?? currentExercise.correctAnswer)}
                  aria-label="Hear pronunciation"
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center font-baloo text-sm font-bold text-dojo-dark shrink-0 leading-none">Play</span>
                  <span className="font-baloo text-2xl md:text-3xl text-amber-400 text-center leading-snug">
                    "{currentExercise.displayPhrase ?? currentExercise.correctAnswer}"
                  </span>
                </motion.button>
                {isTTSSupported() && (
                  <p className="font-poppins text-sm md:text-base text-white/50">Tap to hear pronunciation</p>
                )}
                {isSpeechRecognitionSupported() ? (
                  <>
                    <motion.button
                      type="button"
                      className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl cursor-pointer ${
                        isListening ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      disabled={isListening || kiaiLocked || selectedAnswer !== null}
                      onClick={handleBeltKiaiSpeak}
                    >
                      <span className="font-baloo text-xl md:text-2xl font-bold text-dojo-dark">Mic</span>
                    </motion.button>
                    <p className="font-poppins text-base md:text-lg text-white/50 text-center max-w-md">
                      {isListening ? 'Listening…' : 'Speak clearly; belt tests need 2-star+ pronunciation (1-star for juniors).'}
                    </p>
                    {beltKiaiHint ? (
                      <p className="font-poppins text-base md:text-lg text-amber-300 text-center px-2">{beltKiaiHint}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="font-poppins text-base text-white/55 text-center">
                    Voice check unavailable in this browser.
                  </p>
                )}
                <DojoButton
                  variant="ghost"
                  size="md"
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
            <div className="h-4 w-24 mx-auto rounded-full bg-white/20" aria-hidden />
            <h2 className="font-baloo text-3xl md:text-4xl font-extrabold text-white text-center px-2">
              Not quite, warrior!
            </h2>
            <p className="font-poppins text-lg md:text-xl text-white/65 text-center max-w-md px-4">
              You scored {accuracy}%. You need 80% to pass. Train more and return stronger.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <DojoButton
                size="lg"
                variant="secondary"
                onClick={() => {
                  setAttemptKey((k) => k + 1);
                  setCurrentIdx(0);
                  setPhase('intro');
                }}
              >
                Retry
              </DojoButton>
              <DojoButton size="lg" onClick={() => navigate('/path')}>
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
              className="h-3 w-20 mx-auto rounded-full bg-amber-400/50"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              aria-hidden
            />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
              <BeltBadge belt="green" size="lg" showLabel />
            </motion.div>

            <h1 className="font-baloo text-4xl md:text-5xl font-extrabold text-center px-2" style={{ color: beltColor }}>
              Belt Promotion!
            </h1>

            <div className="flex gap-2 mt-2 justify-center" aria-hidden>
              {[1, 2, 3].map((s) => (
                <motion.span
                  key={s}
                  className={`w-4 h-4 md:w-5 md:h-5 rounded-full ${s <= stars ? 'bg-amber-400' : 'bg-white/15 border border-white/25'}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + s * 0.2, type: 'spring' }}
                />
              ))}
            </div>

            <p className="font-poppins text-lg md:text-xl text-white/65 text-center max-w-md px-4">
              {stars === 3 ? 'Flawless! You have achieved perfect form.' :
               stars === 2 ? 'Strong performance! Sensei is impressed.' :
               'You passed! But a true warrior can do better.'}
            </p>

            <p className="font-poppins text-base md:text-lg text-amber-400">
              Accuracy: {accuracy}% · +200 Ki · +100 Coins
            </p>

            <DojoButton size="lg" beltColor={beltColor} onClick={claimBelt} className="mt-4">
              Claim Your Belt!
            </DojoButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
