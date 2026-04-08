import { motion } from 'framer-motion';
import { BELT_CSS_COLORS, type BeltColor } from '../../types';

interface WarriorAvatarProps {
  head?: number;
  hair?: number;
  skinTone?: number;
  belt?: BeltColor;
  size?: number;
  animate?: boolean;
  className?: string;
}

const SKIN_TONES = ['#fde2b3', '#e8c99b', '#d4a574', '#c68642', '#8d5524', '#5c3310'];
const HAIR_COLORS = ['#2c1b0e', '#5a3825', '#8b4513', '#cd853f', '#daa520', '#c0392b', '#2c3e50', '#e74c3c'];
const HAIR_STYLES = ['▄▄▄', '▓▓▓', '███', '▀▀▀', '░░░', '▒▒▒'];

/** Face style indices for avatar + warrior editors (plain text, no emoji). */
export const WARRIOR_FACE_EXPRESSIONS = ['(^.^)', '(>.<)', '(-_-)', '(o.o)', '(O.O)', '(^o^)'] as const;

export default function WarriorAvatar({
  head = 0,
  hair = 0,
  skinTone = 0,
  belt,
  size = 80,
  animate: shouldAnimate = true,
  className = '',
}: WarriorAvatarProps) {
  const skin = SKIN_TONES[skinTone % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[hair % HAIR_COLORS.length];
  const beltColor = belt ? BELT_CSS_COLORS[belt] : undefined;
  const isBlack = belt?.startsWith('black');

  const face = WARRIOR_FACE_EXPRESSIONS[head % WARRIOR_FACE_EXPRESSIONS.length];
  const hairStyle = HAIR_STYLES[hair % HAIR_STYLES.length];

  return (
    <motion.div
      className={`relative flex flex-col items-center ${className}`}
      style={{ width: size, height: size * 1.4 }}
      animate={shouldAnimate ? { y: [0, -3, 0] } : undefined}
      transition={shouldAnimate ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : undefined}
    >
      {/* Hair */}
      <div
        className="text-center font-bold leading-none"
        style={{ fontSize: size * 0.25, color: hairColor }}
      >
        {hairStyle}
      </div>

      {/* Head */}
      <div
        className="rounded-lg flex items-center justify-center"
        style={{
          width: size * 0.6,
          height: size * 0.5,
          backgroundColor: skin,
        }}
      >
        <span style={{ fontSize: size * 0.18 }}>{face}</span>
      </div>

      {/* Body (Gi) */}
      <div
        className="rounded-b-lg relative"
        style={{
          width: size * 0.65,
          height: size * 0.5,
          backgroundColor: '#f0f0f0',
          marginTop: -2,
        }}
      >
        {/* Belt */}
        {beltColor && (
          <div
            className="absolute left-0 right-0 flex items-center justify-center"
            style={{
              top: '30%',
              height: size * 0.08,
              backgroundColor: beltColor,
              border: belt === 'white' ? '1px solid #ccc' : undefined,
            }}
          >
            {isBlack && (
              <div className="w-1 h-full bg-amber-400 rounded-sm" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { SKIN_TONES, HAIR_COLORS };
