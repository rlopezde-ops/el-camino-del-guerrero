import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import WarriorAvatar, { SKIN_TONES, HAIR_COLORS, WARRIOR_FACE_EXPRESSIONS } from '../components/ui/WarriorAvatar';
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
      <div className="flex items-center px-4 md:px-6 pt-6 pb-3">
        <DojoButton variant="ghost" size="md" onClick={() => navigate('/')}>
          ← Back
        </DojoButton>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 md:px-8 pb-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-md flex flex-col items-center gap-8"
            >
              <h2 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
                What is your warrior name?
              </h2>
              <input
                type="text"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-6 py-4 rounded-2xl md:rounded-3xl bg-white/10 border-2 border-white/20 text-white font-poppins text-xl md:text-2xl text-center focus:outline-none focus:border-amber-400 placeholder:text-white/30 min-h-[56px]"
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
              className="w-full max-w-md flex flex-col items-center gap-8"
            >
              <h2 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
                How old are you?
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((a) => (
                  <motion.button
                    key={a}
                    className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl md:rounded-2xl font-baloo font-bold text-xl md:text-2xl cursor-pointer transition-colors ${
                      age === a ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAge(a)}
                  >
                    {a}
                  </motion.button>
                ))}
                <motion.button
                  className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-xl md:rounded-2xl font-baloo font-bold text-base md:text-lg cursor-pointer transition-colors ${
                    age > 18 ? 'bg-amber-400 text-dojo-dark' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAge(25)}
                >
                  Adult
                </motion.button>
              </div>
              <p className="font-poppins text-base md:text-lg text-white/50 text-center px-2">
                {getAgeLabel(getAgeGroup(age))}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
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
              className="w-full max-w-md flex flex-col items-center gap-6"
            >
              <h2 className="font-baloo text-4xl md:text-5xl font-extrabold text-amber-400 text-center px-2">
                Build your warrior!
              </h2>

              <WarriorAvatar head={head} hair={hair} skinTone={skinTone} size={120} />

              {/* Skin tone */}
              <div className="w-full">
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Skin tone</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {SKIN_TONES.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-full cursor-pointer border-[3px] ${skinTone === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setSkinTone(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Hair */}
              <div className="w-full">
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Hair</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {HAIR_COLORS.map((color, i) => (
                    <motion.button
                      key={i}
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-full cursor-pointer border-[3px] ${hair === i ? 'border-amber-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setHair(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Face */}
              <div className="w-full">
                <p className="font-poppins text-base md:text-lg text-white/55 mb-3 text-center">Face</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {WARRIOR_FACE_EXPRESSIONS.map((face, i) => (
                    <motion.button
                      key={i}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl cursor-pointer ${
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

              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <DojoButton variant="ghost" size="lg" onClick={() => setStep('age')}>← Back</DojoButton>
                <DojoButton size="lg" onClick={handleFinish}>
                  Begin Training!
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
    case 'junior': return 'Junior Warrior (ages 10-12)';
    case 'warrior': return 'Warrior (ages 13-15)';
    case 'elite': return 'Elite Warrior (ages 16-18)';
    case 'master': return 'Master Warrior (adult)';
  }
}
