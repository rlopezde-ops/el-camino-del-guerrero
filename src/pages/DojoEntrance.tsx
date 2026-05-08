import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar from '../components/ui/WarriorAvatar';
import DojoButton from '../components/ui/DojoButton';
import BeltBadge from '../components/ui/BeltBadge';
import type { WarriorProfile } from '../types';
import { BELT_ORDER, BELT_CSS_COLORS } from '../types';
import { primeTTS } from '../lib/tts';

// Main belt colors — skip the extra black-belt dans for the preview strip
const BELT_PREVIEW = BELT_ORDER.filter((b) => !b.startsWith('black') || b === 'black-1');

export default function DojoEntrance() {
  const navigate = useNavigate();
  const { profiles, isLoading, loadProfiles, setActiveProfile, deleteProfile } = useGameStore();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  function handleSelect(profile: WarriorProfile) {
    if (confirmDelete) return;
    primeTTS();
    setActiveProfile(profile);
    navigate('/path');
  }

  function handleDelete(id: number) {
    deleteProfile(id);
    setConfirmDelete(null);
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-dojo-dark">
        <motion.div
          className="font-baloo text-3xl md:text-4xl text-amber-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Entering the Dojo...
        </motion.div>
      </div>
    );
  }

  // ─── HERO — first-time visitor ────────────────────────────────────────────

  if (profiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark px-6 overflow-auto">

        {/* Radial glow — subtle gold warmth behind the title */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '90vw',
            maxWidth: 640,
            height: 420,
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.13) 0%, transparent 68%)',
          }}
          aria-hidden
        />

        {/* Title */}
        <motion.div
          className="text-center relative z-10"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="h-1 w-16 mx-auto mb-7 rounded-full bg-amber-400/50" aria-hidden />
          <h1 className="font-baloo text-5xl md:text-6xl lg:text-7xl font-extrabold text-amber-400 leading-none">
            El Camino
          </h1>
          <p className="font-baloo text-2xl md:text-3xl font-bold text-white/65 mt-1 tracking-wide">
            del Guerrero
          </p>
          <p className="font-poppins text-white/45 text-base md:text-lg mt-5 leading-relaxed">
            Earn your belts.&nbsp;&nbsp;Learn Spanish.&nbsp;&nbsp;Train like a warrior.
          </p>
        </motion.div>

        {/* Belt progression strip */}
        <motion.div
          className="flex items-center justify-center mt-10 mb-10 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {BELT_PREVIEW.map((belt, i) => (
            <div key={belt} className="flex items-center">
              <motion.div
                style={{
                  width: 28,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: BELT_CSS_COLORS[belt],
                  border: belt === 'white' ? '1px solid rgba(255,255,255,0.2)' : undefined,
                  boxShadow: `0 0 6px ${BELT_CSS_COLORS[belt]}44`,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
              />
              {i < BELT_PREVIEW.length - 1 && (
                <div style={{ width: 7, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
              )}
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          <DojoButton size="lg" onClick={() => navigate('/new-warrior')}>
            Start Training →
          </DojoButton>
        </motion.div>
      </div>
    );
  }

  // ─── RETURNING USER — warrior selection ───────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">

      {/* Header with radial glow */}
      <div className="relative text-center pt-10 pb-6 px-4">
        <div
          className="absolute pointer-events-none"
          style={{
            width: '70vw',
            maxWidth: 480,
            height: 180,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.09) 0%, transparent 70%)',
          }}
          aria-hidden
        />
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10"
        >
          <div className="h-1 w-16 mx-auto mb-5 rounded-full bg-amber-400/40" aria-hidden />
          <h1 className="font-baloo text-4xl md:text-5xl lg:text-6xl font-extrabold text-amber-400">
            El Camino del Guerrero
          </h1>
          <p className="font-poppins text-white/40 text-base md:text-lg mt-2">
            Choose your warrior
          </p>
        </motion.div>
      </div>

      {/* Warrior grid */}
      <div className="flex-1 px-5 md:px-8 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5 max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {profiles.map((profile, idx) => (
              <motion.div
                key={profile.id}
                className="relative overflow-hidden bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 border-2 border-white/10 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
                onClick={() => handleSelect(profile)}
              >
                <WarriorAvatar
                  head={profile.avatarHead}
                  hair={profile.avatarHair}
                  skinTone={profile.avatarSkinTone}
                  belt={profile.currentBelt}
                  size={72}
                />
                <span className="font-baloo font-bold text-white text-base md:text-lg text-center truncate w-full">
                  {profile.name}
                </span>
                <BeltBadge belt={profile.currentBelt} size="md" />
                <div className="flex items-center gap-1.5 text-white/45">
                  <span className="font-poppins text-xs uppercase tracking-wide text-white/35">Streak</span>
                  <span className="font-pixel text-sm">{profile.streakDays}</span>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-white/10 text-white/70 text-sm font-poppins font-medium cursor-pointer hover:bg-white/20 hover:text-white transition-colors min-h-[44px]"
                    onClick={(e) => { e.stopPropagation(); navigate(`/edit-warrior/${profile.id}`); }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400/80 text-sm font-poppins font-medium cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors min-h-[44px]"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id!); }}
                  >
                    Delete
                  </button>
                </div>

                {confirmDelete === profile.id && (
                  <motion.div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-4 bg-black/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-poppins text-base md:text-lg text-white/90 text-center px-1">
                      Delete <span className="font-bold text-white">{profile.name}</span>?
                    </p>
                    <p className="font-poppins text-sm text-white/50 text-center px-1">
                      All progress will be lost.
                    </p>
                    <div className="flex flex-col gap-3 w-full mt-1">
                      <DojoButton size="md" variant="danger" className="w-full" onClick={() => handleDelete(profile.id!)}>
                        Delete
                      </DojoButton>
                      <DojoButton size="md" variant="ghost" className="w-full !bg-white/10 hover:!bg-white/15" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </DojoButton>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {profiles.length < 6 && (
            <motion.div
              className="bg-white/5 rounded-2xl md:rounded-3xl p-5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 hover:border-amber-400/50 transition-all min-h-[180px] md:min-h-[200px]"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/new-warrior')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: profiles.length * 0.08 + 0.1, type: 'spring', stiffness: 300, damping: 24 }}
            >
              <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center">
                <span className="text-4xl text-amber-400">+</span>
              </div>
              <span className="font-baloo font-bold text-amber-400/80 text-lg md:text-xl">New Warrior</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
