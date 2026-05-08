import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { buildAvatarDataUrl, FACE_COMBOS } from '../../lib/avatarUtils';

interface FacePickerProps {
  value: number;
  onChange: (index: number) => void;
  /** Pass current skinTone + hair so previews match the live avatar */
  skinTone: number;
  hair: number;
}

export default function FacePicker({ value, onChange, skinTone, hair }: FacePickerProps) {
  // Pre-build all 6 face preview data URLs
  const previews = useMemo(
    () => FACE_COMBOS.map((_, i) => buildAvatarDataUrl({ head: i, hair, skinTone })),
    [hair, skinTone],
  );

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {previews.map((src, i) => {
        const isSelected = value === i;
        return (
          <motion.button
            key={i}
            type="button"
            className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
              isSelected
                ? 'ring-[3px] ring-amber-400 ring-offset-2 ring-offset-dojo-dark'
                : 'opacity-60 hover:opacity-90'
            }`}
            style={{ width: 64, height: 64 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => onChange(i)}
            aria-label={`Face option ${i + 1}`}
            aria-pressed={isSelected}
          >
            <img
              src={src}
              alt={`Face ${i + 1}`}
              width={64}
              height={64}
              style={{ borderRadius: 12, display: 'block' }}
              draggable={false}
            />
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-amber-400/60 pointer-events-none"
                layoutId="face-selection-ring"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
