import { motion } from 'framer-motion';
import { BELT_CSS_COLORS, BELT_DISPLAY_NAMES, type BeltColor } from '../../types';

interface BeltBadgeProps {
  belt: BeltColor;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulsing?: boolean;
}

export default function BeltBadge({
  belt,
  earned = true,
  size = 'md',
  showLabel = false,
  pulsing = false,
}: BeltBadgeProps) {
  const color = BELT_CSS_COLORS[belt];
  const isBlack = belt.startsWith('black');
  const danCount = isBlack ? parseInt(belt.split('-')[1]) : 0;

  const sizes = {
    sm: { width: 40, height: 12, fontSize: '0.6rem' },
    md: { width: 64, height: 18, fontSize: '0.75rem' },
    lg: { width: 96, height: 24, fontSize: '0.875rem' },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className="relative rounded-sm"
        style={{
          width: s.width,
          height: s.height,
          backgroundColor: earned ? color : '#374151',
          opacity: earned ? 1 : 0.35,
          border: belt === 'white' && earned ? '1px solid #d1d5db' : undefined,
        }}
        animate={pulsing ? { scale: [1, 1.08, 1] } : undefined}
        transition={pulsing ? { repeat: Infinity, duration: 1.5 } : undefined}
      >
        {isBlack && earned && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {Array.from({ length: danCount }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-full bg-amber-400 rounded-sm"
              />
            ))}
          </div>
        )}
        {!earned && (
          <motion.div
            className="absolute inset-0 rounded-sm bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: [-s.width, s.width] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        )}
      </motion.div>
      {showLabel && (
        <span
          className="font-poppins text-center leading-tight"
          style={{ fontSize: s.fontSize, color: earned ? color : '#6b7280' }}
        >
          {BELT_DISPLAY_NAMES[belt]}
        </span>
      )}
    </div>
  );
}
