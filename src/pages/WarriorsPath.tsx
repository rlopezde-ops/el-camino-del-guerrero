import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { accuracyToStars } from '../lib/scoreStars';
import KiCounter from '../components/ui/KiCounter';
import BeltBadge from '../components/ui/BeltBadge';
import DojoButton from '../components/ui/DojoButton';
import WarriorAvatar from '../components/ui/WarriorAvatar';
import { dojo1 } from '../data/curriculum';
import { BELT_CSS_COLORS } from '../types';

export default function WarriorsPath() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProfile, getBestScores } = useGameStore();
  const [bestByUnit, setBestByUnit] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    if (!activeProfile?.id) return;
    getBestScores(activeProfile.id).then(setBestByUnit);
  }, [activeProfile?.id, getBestScores, location.key]);

  useEffect(() => {
    if (!activeProfile) {
      navigate('/', { replace: true });
    }
  }, [activeProfile, navigate]);

  if (!activeProfile) {
    return <div className="h-full bg-dojo-dark" />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-3">
        <motion.button
          className="flex items-center gap-3 cursor-pointer min-h-[48px]"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <WarriorAvatar
            head={activeProfile.avatarHead}
            hair={activeProfile.avatarHair}
            skinTone={activeProfile.avatarSkinTone}
            belt={activeProfile.currentBelt}
            size={44}
            animate={false}
          />
          <span className="font-baloo text-lg md:text-xl font-bold text-white">{activeProfile.name}</span>
        </motion.button>
        <div className="flex items-center gap-2 md:gap-3">
          <KiCounter value={activeProfile.kiPoints} type="ki" />
          <KiCounter value={activeProfile.coins} type="coins" />
          <KiCounter value={activeProfile.streakDays} type="streak" />
        </div>
      </div>

      {/* Current belt */}
      <div className="text-center px-4 pt-2 pb-4">
        <BeltBadge belt={activeProfile.currentBelt} size="lg" showLabel pulsing />
      </div>

      {/* Dojo 1 path */}
      <div className="flex-1 px-4 md:px-6 pb-8 overflow-auto">
        <div className="max-w-lg md:max-w-xl mx-auto">
          <motion.h2
            className="font-baloo text-2xl md:text-3xl font-extrabold text-amber-400 mb-5 md:mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {dojo1.name} — {dojo1.cefr}
          </motion.h2>

          {/* Units */}
          <div className="flex flex-col gap-4">
            {dojo1.units.map((unit, idx) => {
              const isCurrent = unit.id === activeProfile.currentUnit;
              const isCompleted = unit.id < activeProfile.currentUnit;
              const isLocked = unit.id > activeProfile.currentUnit;
              const isAccessible = !isLocked;

              const beltColor = BELT_CSS_COLORS[unit.belt];
              const bestAcc = bestByUnit.get(unit.id) ?? 0;
              const stars = accuracyToStars(bestAcc);
              const showNotTrained = isCompleted && bestAcc === 0;

              return (
                <motion.div
                  key={unit.id}
                  className={`relative rounded-2xl md:rounded-3xl border-2 p-4 md:p-5 transition-all ${
                    isCurrent
                      ? 'bg-white/10 border-amber-400'
                      : isCompleted
                        ? 'bg-white/5 border-white/10'
                        : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: isLocked ? 0.4 : 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  style={isCurrent ? { borderColor: beltColor } : undefined}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-baloo font-extrabold text-base md:text-lg"
                      style={{
                        backgroundColor: isCompleted ? beltColor : isCurrent ? `${beltColor}33` : '#1f293722',
                        color: isCompleted ? '#fff' : beltColor,
                      }}
                    >
                      {isCompleted ? 'OK' : unit.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-baloo font-bold text-white text-base md:text-lg truncate">
                          {unit.title}
                        </span>
                        <BeltBadge belt={unit.belt} size="md" earned={isAccessible} />
                      </div>
                      <span className="font-poppins text-sm md:text-base text-white/45">
                        Stripe {unit.stripe} · {unit.techniques.length} techniques
                      </span>
                      {isAccessible && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <div className="flex gap-1 items-center" aria-hidden>
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${i < stars ? 'bg-amber-400' : 'bg-white/15 border border-white/20'}`}
                              />
                            ))}
                          </div>
                          {bestAcc > 0 && (
                            <span className="font-pixel text-xs md:text-sm text-white/50">
                              {Math.round(bestAcc * 100)}%
                            </span>
                          )}
                          {showNotTrained && (
                            <span className="font-poppins text-xs md:text-sm text-amber-400/80">
                              Not trained yet — retrain for stars
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {isAccessible && (
                      <div className="flex flex-col items-end gap-0.5">
                        <DojoButton
                          size="md"
                          beltColor={isCurrent ? beltColor : undefined}
                          variant={isCompleted ? 'ghost' : 'primary'}
                          onClick={() => navigate(`/train/${unit.id}`)}
                        >
                          {isCurrent ? 'Train!' : 'Retrain'}
                        </DojoButton>
                        {bestAcc > 0 && (
                          <span className="font-pixel text-[0.65rem] md:text-xs text-white/40">best {Math.round(bestAcc * 100)}%</span>
                        )}
                      </div>
                    )}
                  </div>

                  {isCurrent && (
                    <motion.div
                      className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 rounded-r-full"
                      style={{ backgroundColor: beltColor }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.div>
              );
            })}

            {/* Belt Test */}
            {(() => {
              const lastUnitId = dojo1.units[dojo1.units.length - 1]?.id ?? 8;
              const reachedEnd = activeProfile.currentUnit >= lastUnitId;
              const placedThrough = activeProfile.placementCompleted;
              const allUnitsTrained = dojo1.units.every((u) => {
                if (placedThrough && u.id < activeProfile.currentUnit) return true;
                return (bestByUnit.get(u.id) ?? 0) > 0;
              });
              const beltTestReady = reachedEnd && allUnitsTrained;
              return (
                <motion.div
                  className={`rounded-2xl md:rounded-3xl border-2 p-5 md:p-6 text-center ${
                    beltTestReady
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-dashed border-amber-400/30'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: reachedEnd ? 1 : 0.3 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="font-baloo text-amber-400 font-bold text-xl md:text-2xl block">Belt Test — Prueba de Cinturón</span>
                  {beltTestReady ? (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: [0.9, 1.05, 1] }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <DojoButton
                        size="lg"
                        beltColor="#22c55e"
                        className="mt-3"
                        onClick={() => navigate('/belt-test/1')}
                      >
                        Take Belt Test!
                      </DojoButton>
                    </motion.div>
                  ) : (
                    <p className="font-poppins text-sm md:text-base text-white/50 mt-3 max-w-sm mx-auto">
                      {reachedEnd
                        ? 'Train every unit at least once to unlock the Belt Test'
                        : 'Complete all units to unlock the Dojo 1 Belt Test'}
                    </p>
                  )}
                </motion.div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
