import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface VoxelConfettiProps {
  count?: number;
  color?: string;
  active?: boolean;
  intensity?: 'normal' | 'high';
}

export default function VoxelConfetti({ count, color, active = true, intensity = 'normal' }: VoxelConfettiProps) {
  const effectiveCount = count ?? (intensity === 'high' ? 60 : 30);
  const multiColor = intensity === 'high';

  const particles = useMemo(() => {
    const colors = multiColor
      ? ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ec4899', '#14b8a6']
      : color
        ? [color]
        : ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];

    return Array.from({ length: effectiveCount }, (_, i) => ({
      id: i,
      x: multiColor ? Math.random() * 120 - 10 : Math.random() * 100,
      color: colors[i % colors.length],
      size: multiColor ? 8 + Math.random() * 10 : 6 + Math.random() * 8,
      delay: Math.random() * (multiColor ? 0.8 : 0.5),
      duration: 1.5 + Math.random() * 1.5,
      rotation: Math.random() * 360,
    }));
  }, [effectiveCount, color, multiColor]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 50,
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
