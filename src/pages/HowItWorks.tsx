import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DojoButton from '../components/ui/DojoButton';
import { BELT_ORDER, BELT_CSS_COLORS, BELT_DISPLAY_NAMES } from '../types';

const SHOWN_BELTS = BELT_ORDER.filter((b) => !b.startsWith('black-') || b === 'black-1');

const STEPS = [
  {
    icon: '📖',
    title: 'Train 2 Lessons',
    body: 'Every belt has 2 lessons. Each lesson teaches you new Spanish words and lets you practice them.',
  },
  {
    icon: '⭐',
    title: 'Earn Stars',
    body: 'Answer correctly to earn stars. The more you get right, the more Ki points and coins you collect.',
  },
  {
    icon: '🥋',
    title: 'Pass the Belt Test',
    body: "Finish both lessons and you'll unlock the Belt Test. Pass it to earn your next belt!",
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-dojo-dark via-dojo-navy to-dojo-dark overflow-auto">
      {/* Header */}
      <motion.div
        className="text-center pt-10 pb-2 px-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-5xl mb-3">🎌</div>
        <h1 className="font-baloo text-3xl md:text-4xl font-extrabold text-amber-400">
          How Belts Work
        </h1>
        <p className="font-poppins text-white/55 text-base mt-1">
          Your path from White to Black
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col gap-6 px-5 md:px-8 pt-4 pb-10 max-w-lg mx-auto w-full">

        {/* Belt progression strip */}
        <motion.div
          className="rounded-2xl bg-white/5 border border-white/10 p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="font-baloo text-white/40 text-xs text-center uppercase tracking-widest mb-3">
            Belt Order
          </p>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {SHOWN_BELTS.map((belt, i) => {
              const isBlack = belt.startsWith('black');
              const isLast = i === SHOWN_BELTS.length - 1;
              return (
                <div key={belt} className="flex items-center gap-1">
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300 }}
                  >
                    {/* Belt swatch */}
                    <div
                      className="rounded-md border border-white/10"
                      style={{
                        width: 28,
                        height: 14,
                        backgroundColor: BELT_CSS_COLORS[belt],
                        boxShadow: `0 0 6px ${BELT_CSS_COLORS[belt]}55`,
                      }}
                    />
                    <span
                      className="font-poppins capitalize"
                      style={{ fontSize: 9, color: BELT_CSS_COLORS[belt], opacity: 0.85 }}
                    >
                      {isBlack ? 'Black' : BELT_DISPLAY_NAMES[belt].split(' ')[1]}
                    </span>
                  </motion.div>
                  {!isLast && (
                    <span className="text-white/20 text-xs mb-3">›</span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* The loop — visual diagram */}
        <motion.div
          className="rounded-2xl bg-white/5 border border-white/10 p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <p className="font-baloo text-white/40 text-xs text-center uppercase tracking-widest mb-4">
            The Loop — Repeat for Every Belt
          </p>
          <div className="flex items-stretch gap-2">
            {/* Lesson 1 */}
            <div className="flex-1 flex flex-col items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-400/30 p-3">
              <span className="text-2xl">📖</span>
              <span className="font-baloo text-amber-300 font-bold text-sm text-center leading-tight">
                Lesson 1
              </span>
              <span className="font-poppins text-white/50 text-xs text-center">
                Learn new words
              </span>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-white/30 text-lg font-bold self-center">→</div>

            {/* Lesson 2 */}
            <div className="flex-1 flex flex-col items-center gap-2 rounded-xl bg-amber-400/10 border border-amber-400/30 p-3">
              <span className="text-2xl">📖</span>
              <span className="font-baloo text-amber-300 font-bold text-sm text-center leading-tight">
                Lesson 2
              </span>
              <span className="font-poppins text-white/50 text-xs text-center">
                More words
              </span>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-white/30 text-lg font-bold self-center">→</div>

            {/* Belt Test */}
            <div className="flex-1 flex flex-col items-center gap-2 rounded-xl bg-green-500/10 border border-green-400/40 p-3">
              <span className="text-2xl">🥋</span>
              <span className="font-baloo text-green-300 font-bold text-sm text-center leading-tight">
                Belt Test
              </span>
              <span className="font-poppins text-white/50 text-xs text-center">
                Level up!
              </span>
            </div>
          </div>

          {/* Repeat arrow */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-poppins text-white/30 text-xs">Repeat for the next belt</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
        </motion.div>

        {/* 3 tips */}
        <div className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
            >
              <span className="text-2xl mt-0.5">{step.icon}</span>
              <div>
                <p className="font-baloo text-white font-bold text-base">{step.title}</p>
                <p className="font-poppins text-white/55 text-sm leading-snug mt-0.5">{step.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="flex flex-col items-center gap-3 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <DojoButton size="lg" onClick={() => navigate('/placement')}>
            Got it — Let's Train! 🥋
          </DojoButton>
          <p className="font-poppins text-white/30 text-xs text-center px-4">
            Next: a quick quiz to find your starting belt
          </p>
        </motion.div>
      </div>
    </div>
  );
}
