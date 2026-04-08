import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface VoxelConfettiProps {
  count?: number;
  color?: string;
  active?: boolean;
}

export default function VoxelConfetti({ count = 30, color, active = true }: VoxelConfettiProps) {
  const particles = useMemo(() => {
    const colors = color
      ? [color]
      : ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f97316'];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      rotation: Math.random() * 360,
    }));
  }, [count, color]);

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
