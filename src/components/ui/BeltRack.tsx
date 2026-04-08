import { motion } from 'framer-motion';
import { BELT_ORDER, type BeltColor } from '../../types';
import BeltBadge from './BeltBadge';

interface BeltRackProps {
  currentBelt: BeltColor | null;
  earnedBelts: BeltColor[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export default function BeltRack({
  currentBelt,
  earnedBelts,
  orientation = 'vertical',
  className = '',
}: BeltRackProps) {
  const beltsToShow = BELT_ORDER;

  const containerClass = orientation === 'vertical'
    ? 'flex flex-col-reverse gap-2'
    : 'flex flex-row gap-2 flex-wrap';

  return (
    <div className={`${containerClass} ${className}`}>
      {beltsToShow.map((belt, idx) => {
        const isEarned = earnedBelts.includes(belt);
        const isCurrent = belt === currentBelt;

        return (
          <motion.div
            key={belt}
            initial={{ opacity: 0, x: orientation === 'vertical' ? -20 : 0, y: orientation === 'horizontal' ? 20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <BeltBadge
              belt={belt}
              earned={isEarned}
              size="md"
              pulsing={isCurrent}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
