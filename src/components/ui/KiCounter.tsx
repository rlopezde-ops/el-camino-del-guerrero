import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface KiCounterProps {
  value: number;
  type: 'ki' | 'coins' | 'streak';
}

const icons: Record<string, { emoji: string; color: string }> = {
  ki: { emoji: '⚡', color: '#38bdf8' },
  coins: { emoji: '🪙', color: '#fbbf24' },
  streak: { emoji: '🔥', color: '#f97316' },
};

export default function KiCounter({ value, type }: KiCounterProps) {
  const { emoji, color } = icons[type];
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.6,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, motionVal]);

  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm"
      animate={value > 0 ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ duration: 0.3 }}
      key={value}
    >
      <span className="text-lg">{emoji}</span>
      <motion.span
        className="font-pixel text-sm"
        style={{ color }}
      >
        {display}
      </motion.span>
    </motion.div>
  );
}
