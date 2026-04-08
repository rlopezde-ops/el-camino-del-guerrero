import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  className?: string;
  flash?: boolean;
}

export default function ProgressBar({
  value,
  max,
  color = '#fbbf24',
  height = 22,
  showLabel = false,
  className = '',
  flash = false,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className={`relative w-full ${className}`}>
      <motion.div
        className="w-full rounded-full bg-white/10 overflow-hidden"
        style={{ height }}
        animate={flash ? { boxShadow: ['0 0 0px #22c55e00', '0 0 12px #22c55e', '0 0 0px #22c55e00'] } : undefined}
        transition={flash ? { duration: 0.5 } : undefined}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </motion.div>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-pixel text-white drop-shadow">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
