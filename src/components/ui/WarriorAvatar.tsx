import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { buildAvatarDataUrl, SKIN_TONES, HAIR_COLORS } from '../../lib/avatarUtils';
import { BELT_CSS_COLORS, type BeltColor } from '../../types';

export { SKIN_TONES, HAIR_COLORS };

interface WarriorAvatarProps {
  head?: number;
  hair?: number;
  skinTone?: number;
  belt?: BeltColor;
  size?: number;
  animate?: boolean;
  className?: string;
}

export default function WarriorAvatar({
  head = 0,
  hair = 0,
  skinTone = 0,
  belt,
  size = 80,
  animate: shouldAnimate = true,
  className = '',
}: WarriorAvatarProps) {
  const beltColor   = belt ? BELT_CSS_COLORS[belt] : undefined;
  const isBlackBelt = belt?.startsWith('black');

  const dataUrl = useMemo(
    () => buildAvatarDataUrl({ head, hair, skinTone }),
    [head, hair, skinTone],
  );

  const stripH = beltColor ? Math.max(5, size * 0.09) : 0;
  const totalH = size + (beltColor ? stripH + 4 : 0);

  return (
    <motion.div
      className={`relative flex flex-col items-center ${className}`}
      style={{ width: size, height: totalH }}
      animate={shouldAnimate ? { y: [0, -4, 0] } : undefined}
      transition={
        shouldAnimate
          ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
          : undefined
      }
    >
      <img
        src={dataUrl}
        alt="Warrior avatar"
        width={size}
        height={size}
        style={{ borderRadius: '50%', display: 'block' }}
        draggable={false}
      />

      {beltColor && (
        <motion.div
          className="relative rounded-full mt-1 overflow-hidden"
          style={{
            width:           size * 0.65,
            height:          stripH,
            backgroundColor: beltColor,
            border:          belt === 'white' ? '1px solid #ccc' : undefined,
            boxShadow:       `0 0 ${size * 0.1}px ${beltColor}88`,
          }}
          animate={shouldAnimate ? { opacity: [0.6, 1, 0.6] } : undefined}
          transition={
            shouldAnimate
              ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
              : undefined
          }
        >
          {isBlackBelt && (
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-amber-400"
              style={{ width: stripH * 0.55 }}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
