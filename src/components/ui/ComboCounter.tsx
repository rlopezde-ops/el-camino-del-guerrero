import { motion, AnimatePresence } from 'framer-motion';

interface ComboCounterProps {
  combo: number;
}

export default function ComboCounter({ combo }: ComboCounterProps) {
  if (combo < 2) return null;

  const label = combo >= 5 ? '¡PERFECT FORM!' : combo >= 3 ? '¡COMBO STRIKE!' : `${combo}x`;
  const color = combo >= 5 ? '#f59e0b' : combo >= 3 ? '#ef4444' : '#38bdf8';

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={combo}
        className="font-baloo font-extrabold text-3xl md:text-4xl text-center drop-shadow-lg"
        style={{ color }}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {label}
        {combo >= 3 && (
          <motion.div
            className="text-base font-poppins font-normal text-white/60 mt-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            +{combo >= 5 ? 20 : 15} Ki bonus
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
