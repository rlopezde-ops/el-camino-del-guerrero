import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar from '../components/ui/WarriorAvatar';
import DojoButton from '../components/ui/DojoButton';
import BeltBadge from '../components/ui/BeltBadge';
import type { WarriorProfile } from '../types';
import { primeTTS } from '../lib/tts';

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

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      {/* Dojo gate header */}
      <motion.div
        className="text-center pt-10 pb-6 px-4"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="h-3 w-24 mx-auto mb-6 rounded-full bg-amber-400/40" aria-hidden />
        <h1 className="font-baloo text-4xl md:text-5xl lg:text-6xl font-extrabold text-amber-400 drop-shadow-lg px-2">
          El Camino del Guerrero
        </h1>
        <p className="font-poppins text-white/55 text-lg md:text-xl mt-2">Choose your warrior</p>
      </motion.div>

      {/* Cherry blossom petals (decorative) */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none overflow-hidden h-40 opacity-30">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-pink-300"
            style={{ left: `${10 + i * 12}%` }}
            animate={{
              y: [0, 160],
              x: [0, Math.sin(i) * 30],
              rotate: [0, 360],
              opacity: [0.8, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4 + i * 0.5,
              delay: i * 0.8,
              ease: 'easeIn',
            }}
          />
        ))}
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
                transition={{ delay: idx * 0.1, type: 'spring' }}
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
                <div className="flex items-center gap-1.5 text-sm md:text-base text-white/45">
                  <span className="font-poppins text-xs uppercase tracking-wide text-white/35">Streak</span>
                  <span className="font-pixel text-sm">{profile.streakDays}</span>
                </div>

                {/* Edit / Delete action row */}
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

                {/* Delete confirmation overlay */}
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
                    <div className="flex flex-col gap-3 w-full max-w-full min-w-0 mt-1">
                      <DojoButton
                        size="md"
                        variant="danger"
                        className="w-full max-w-full shrink-0"
                        onClick={() => handleDelete(profile.id!)}
                      >
                        Delete
                      </DojoButton>
                      <DojoButton
                        size="md"
                        variant="ghost"
                        className="w-full max-w-full shrink-0 !bg-white/10 hover:!bg-white/15"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </DojoButton>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* New Warrior button */}
          {profiles.length < 6 && (
            <motion.div
              className="bg-white/5 rounded-2xl md:rounded-3xl p-5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 hover:border-amber-400/50 transition-all min-h-[180px] md:min-h-[200px]"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/new-warrior')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: profiles.length * 0.1 + 0.1 }}
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
