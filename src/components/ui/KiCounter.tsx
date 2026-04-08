import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

interface KiCounterProps {
  value: number;
  type: 'ki' | 'coins' | 'streak';
}

const icons: Record<string, { label: string; color: string }> = {
  ki: { label: 'Ki', color: '#38bdf8' },
  coins: { label: 'Coins', color: '#fbbf24' },
  streak: { label: 'Streak', color: '#f97316' },
};

export default function KiCounter({ value, type }: KiCounterProps) {
  const { label, color } = icons[type];
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
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm min-h-[44px]"
      animate={value > 0 ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ duration: 0.3 }}
      key={value}
    >
      <span
        className="text-xs md:text-sm font-baloo font-bold uppercase tracking-wide shrink-0 w-14 text-center"
        style={{ color }}
      >
        {label}
      </span>
      <motion.span
        className="font-pixel text-base md:text-lg"
        style={{ color }}
      >
        {display}
      </motion.span>
    </motion.div>
  );
}
