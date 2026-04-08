import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar, { SKIN_TONES, HAIR_COLORS, WARRIOR_FACE_EXPRESSIONS } from '../components/ui/WarriorAvatar';
import DojoButton from '../components/ui/DojoButton';
import { getAgeGroup, type AgeGroup } from '../types';

type Tab = 'info' | 'avatar';

export default function EditWarrior() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profiles, updateProfile, setActiveProfile, loadProfiles, isLoading } = useGameStore();

  const [tab, setTab] = useState<Tab>('avatar');
  const [name, setName] = useState('');
  const [age, setAge] = useState(12);
  const [head, setHead] = useState(0);
  const [hair, setHair] = useState(0);
  const [skinTone, setSkinTone] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const profile = profiles.find((p) => p.id === Number(id));

  useEffect(() => {
    if (isLoading) {
      loadProfiles();
      return;
    }
    if (!profile) return;
    setName(profile.name);
    setAge(profile.age);
    setHead(profile.avatarHead);
    setHair(profile.avatarHair);
    setSkinTone(profile.avatarSkinTone);
  }, [profile?.id, isLoading]);

  function markDirty() { setDirty(true); }

  async function handleSave() {
    if (!profile?.id || !name.trim()) return;
    setSaving(true);
    await updateProfile(profile.id, {
      name: name.trim(),
      age,
      ageGroup: getAgeGroup(age),
      avatarHead: head,
      avatarHair: hair,
      avatarSkinTone: skinTone,
    });
    const updated = useGameStore.getState().profiles.find((p) => p.id === profile.id);
    if (updated) setActiveProfile(updated);
    setSaving(false);
    navigate(-1);
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-dojo-dark">
        <motion.div
          className="font-baloo text-3xl text-amber-400"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dojo-dark gap-4">
        <p className="font-poppins text-lg text-white/65">Warrior not found.</p>
        <DojoButton size="lg" onClick={() => navigate('/')}>Back to Dojo</DojoButton>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-6 pb-3">
        <DojoButton variant="ghost" size="md" onClick={() => navigate(-1)}>
          ← Back
        </DojoButton>
        <DojoButton
          size="md"
          disabled={!dirty || saving || !name.trim()}
          onClick={handleSave}
          className={!dirty ? 'opacity-40' : ''}
        >
          {saving ? 'Saving...' : 'Save'}
        </DojoButton>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 md:px-8 pb-12">
        <h1 className="font-baloo text-3xl md:text-4xl font-extrabold text-amber-400 mb-5 text-center px-2">Edit Warrior</h1>

        {/* Live preview */}
        <WarriorAvatar head={head} hair={hair} skinTone={skinTone} belt={profile.currentBelt} size={110} />

        <p className="font-baloo text-xl md:text-2xl text-white mt-3">{name || profile.name}</p>

        {/* Tabs */}
        <div className="flex gap-3 mt-5 mb-8">
          {(['avatar', 'info'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`px-5 py-3 rounded-xl md:rounded-2xl font-baloo font-bold text-base md:text-lg cursor-pointer transition-colors min-h-[48px] ${
                tab === t ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              onClick={() => setTab(t)}
            >
              {t === 'avatar' ? 'Appearance' : 'Name & Age'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'avatar' && (
            <motion.div
              key="avatar"
              className="w-full max-w-md flex flex-col gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Skin tone */}
              <div>
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Skin tone</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {SKIN_TONES.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-full cursor-pointer border-[3px] ${skinTone === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { setSkinTone(i); markDirty(); }}
                    />
                  ))}
                </div>
              </div>

              {/* Hair */}
              <div>
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Hair</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {HAIR_COLORS.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-full cursor-pointer border-[3px] ${hair === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { setHair(i); markDirty(); }}
                    />
                  ))}
                </div>
              </div>

              {/* Face */}
              <div>
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Face</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {WARRIOR_FACE_EXPRESSIONS.map((face, i) => (
                    <motion.button
                      key={i}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl cursor-pointer ${
                        head === i ? 'bg-amber-400/20 border border-amber-400' : 'bg-white/10'
                      }`}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { setHead(i); markDirty(); }}
                    >
                      {face}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'info' && (
            <motion.div
              key="info"
              className="w-full max-w-md flex flex-col gap-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Name */}
              <div>
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3">Warrior name</p>
                <input
                  type="text"
                  maxLength={20}
                  value={name}
                  onChange={(e) => { setName(e.target.value); markDirty(); }}
                  className="w-full px-6 py-4 rounded-2xl md:rounded-3xl bg-white/10 border-2 border-white/20 text-white font-poppins text-xl md:text-2xl text-center focus:outline-none focus:border-amber-400 placeholder:text-white/30 min-h-[56px]"
                />
              </div>

              {/* Age */}
              <div>
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3">Age</p>
                <div className="grid grid-cols-5 gap-3">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((a) => (
                    <motion.button
                      key={a}
                      className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl md:rounded-2xl font-baloo font-bold text-xl md:text-2xl cursor-pointer transition-colors ${
                        age === a ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setAge(a); markDirty(); }}
                    >
                      {a}
                    </motion.button>
                  ))}
                  <motion.button
                    className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl md:rounded-2xl font-baloo font-bold text-base md:text-lg cursor-pointer transition-colors ${
                      age > 18 ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setAge(25); markDirty(); }}
                  >
                    Adult
                  </motion.button>
                </div>
                <p className="font-poppins text-base md:text-lg text-white/50 text-center mt-3">
                  {getAgeLabel(getAgeGroup(age))}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function getAgeLabel(group: AgeGroup): string {
  switch (group) {
    case 'junior': return 'Junior Warrior (ages 10-12)';
    case 'warrior': return 'Warrior (ages 13-15)';
    case 'elite': return 'Elite Warrior (ages 16-18)';
    case 'master': return 'Master Warrior (adult)';
  }
}
