import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar from '../components/ui/WarriorAvatar';
import DojoButton from '../components/ui/DojoButton';
import BeltBadge from '../components/ui/BeltBadge';
import type { WarriorProfile } from '../types';

export default function DojoEntrance() {
  const navigate = useNavigate();
  const { profiles, isLoading, loadProfiles, setActiveProfile, deleteProfile } = useGameStore();
  const [showDelete, setShowDelete] = useState<number | null>(null);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  function handleSelect(profile: WarriorProfile) {
    setActiveProfile(profile);
    navigate('/path');
  }

  function handleDelete(id: number) {
    deleteProfile(id);
    setShowDelete(null);
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-dojo-dark">
        <motion.div
          className="font-baloo text-2xl text-amber-400"
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
        <div className="text-5xl mb-2">⛩️</div>
        <h1 className="font-baloo text-4xl font-extrabold text-amber-400 drop-shadow-lg">
          El Camino del Guerrero
        </h1>
        <p className="font-poppins text-white/50 text-sm mt-1">Choose your warrior</p>
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
      <div className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <AnimatePresence mode="popLayout">
            {profiles.map((profile, idx) => (
              <motion.div
                key={profile.id}
                className="relative bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                onClick={() => handleSelect(profile)}
                onContextMenu={(e) => { e.preventDefault(); setShowDelete(profile.id!); }}
              >
                <WarriorAvatar
                  head={profile.avatarHead}
                  hair={profile.avatarHair}
                  skinTone={profile.avatarSkinTone}
                  belt={profile.currentBelt}
                  size={56}
                />
                <span className="font-baloo font-bold text-white text-sm text-center truncate w-full">
                  {profile.name}
                </span>
                <BeltBadge belt={profile.currentBelt} size="sm" />
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <span>🔥</span>
                  <span className="font-pixel text-[0.6rem]">{profile.streakDays}</span>
                </div>

                {showDelete === profile.id && (
                  <motion.div
                    className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center gap-2 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-poppins text-xs text-white/70 px-2 text-center">Delete this warrior?</p>
                    <div className="flex gap-2">
                      <DojoButton size="sm" variant="danger" onClick={() => handleDelete(profile.id!)}>
                        Delete
                      </DojoButton>
                      <DojoButton size="sm" variant="ghost" onClick={() => setShowDelete(null)}>
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
              className="bg-white/5 rounded-2xl p-4 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 hover:border-amber-400/50 transition-all min-h-[160px]"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/new-warrior')}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: profiles.length * 0.1 + 0.1 }}
            >
              <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center">
                <span className="text-2xl text-amber-400">+</span>
              </div>
              <span className="font-baloo font-bold text-amber-400/70 text-sm">New Warrior</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
