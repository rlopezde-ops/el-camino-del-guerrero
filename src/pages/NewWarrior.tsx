import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar, { SKIN_TONES, HAIR_COLORS } from '../components/ui/WarriorAvatar';
import DojoButton from '../components/ui/DojoButton';
import { getAgeGroup, type AgeGroup } from '../types';

type Step = 'name' | 'age' | 'avatar' | 'done';

export default function NewWarrior() {
  const navigate = useNavigate();
  const { createProfile, setActiveProfile } = useGameStore();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [age, setAge] = useState(12);
  const [head, setHead] = useState(0);
  const [hair, setHair] = useState(0);
  const [skinTone, setSkinTone] = useState(0);

  async function handleFinish() {
    const ageGroup = getAgeGroup(age);
    const profile = await createProfile({
      name: name.trim(),
      age,
      ageGroup,
      createdAt: new Date(),
      avatarHead: head,
      avatarHair: hair,
      avatarSkinTone: skinTone,
      avatarGiPattern: 0,
      avatarAccessories: [],
      currentBelt: 'white',
      currentDojo: 1,
      currentUnit: 1,
      currentStripe: 1,
      kiPoints: 0,
      coins: 50,
      streakDays: 0,
      streakLastDate: null,
      streakFreezes: 0,
      placementBelt: null,
      placementCompleted: false,
    });
    setActiveProfile(profile);
    navigate('/placement');
  }

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      <div className="flex items-center px-4 pt-6 pb-2">
        <DojoButton variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back
        </DojoButton>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm flex flex-col items-center gap-6"
            >
              <h2 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
                What is your warrior name?
              </h2>
              <input
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-poppins text-lg text-center focus:outline-none focus:border-amber-400 placeholder:text-white/30"
                autoFocus
              />
              <DojoButton
                size="lg"
                disabled={name.trim().length === 0}
                onClick={() => setStep('age')}
                className={name.trim().length === 0 ? 'opacity-40' : ''}
              >
                Continue →
              </DojoButton>
            </motion.div>
          )}

          {/* Step 2: Age */}
          {step === 'age' && (
            <motion.div
              key="age"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm flex flex-col items-center gap-6"
            >
              <h2 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
                How old are you?
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((a) => (
                  <motion.button
                    key={a}
                    className={`w-14 h-14 rounded-xl font-baloo font-bold text-lg cursor-pointer transition-colors ${
                      age === a ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAge(a)}
                  >
                    {a}
                  </motion.button>
                ))}
                <motion.button
                  className={`w-14 h-14 rounded-xl font-baloo font-bold text-sm cursor-pointer transition-colors ${
                    age > 18 ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAge(25)}
                >
                  Adult
                </motion.button>
              </div>
              <p className="font-poppins text-sm text-white/40">
                {getAgeLabel(getAgeGroup(age))}
              </p>
              <div className="flex gap-3">
                <DojoButton variant="ghost" size="md" onClick={() => setStep('name')}>← Back</DojoButton>
                <DojoButton size="lg" onClick={() => setStep('avatar')}>Continue →</DojoButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Avatar */}
          {step === 'avatar' && (
            <motion.div
              key="avatar"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-sm flex flex-col items-center gap-5"
            >
              <h2 className="font-baloo text-3xl font-extrabold text-amber-400 text-center">
                Build your warrior!
              </h2>

              <WarriorAvatar head={head} hair={hair} skinTone={skinTone} size={100} />

              {/* Skin tone */}
              <div className="w-full">
                <p className="font-poppins text-sm text-white/50 mb-2">Skin tone</p>
                <div className="flex gap-2 justify-center">
                  {SKIN_TONES.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-9 h-9 rounded-full cursor-pointer border-2 ${skinTone === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setSkinTone(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Hair */}
              <div className="w-full">
                <p className="font-poppins text-sm text-white/50 mb-2">Hair</p>
                <div className="flex gap-2 justify-center">
                  {HAIR_COLORS.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-9 h-9 rounded-full cursor-pointer border-2 ${hair === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setHair(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Face */}
              <div className="w-full">
                <p className="font-poppins text-sm text-white/50 mb-2">Face</p>
                <div className="flex gap-2 justify-center">
                  {['◠‿◠', '◕‿◕', '•‿•', '◉‿◉', '◔‿◔', '⊙‿⊙'].map((face, i) => (
                    <motion.button
                      key={i}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-pointer ${
                        head === i ? 'bg-amber-400/20 border border-amber-400' : 'bg-white/10'
                      }`}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setHead(i)}
                    >
                      {face}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <DojoButton variant="ghost" size="md" onClick={() => setStep('age')}>← Back</DojoButton>
                <DojoButton size="lg" onClick={handleFinish}>
                  Begin Training! 🥋
                </DojoButton>
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
    case 'junior': return '🐉 Junior Warrior (ages 10-12)';
    case 'warrior': return '⚔️ Warrior (ages 13-15)';
    case 'elite': return '🏆 Elite Warrior (ages 16-18)';
    case 'master': return '🥋 Master Warrior (adult)';
  }
}
