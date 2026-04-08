import { motion } from 'framer-motion';

interface OptionCardProps {
  text: string;
  subtext?: string;
  selected?: boolean;
  correct?: boolean | null;
  disabled?: boolean;
  beltColor?: string;
  onClick: () => void;
}

export default function OptionCard({
  text,
  subtext,
  selected,
  correct,
  disabled,
  beltColor = '#fbbf24',
  onClick,
}: OptionCardProps) {
  let borderColor = 'border-white/20';
  let bgColor = 'bg-white/5';

  if (correct === true) {
    borderColor = 'border-green-400';
    bgColor = 'bg-green-400/20';
  } else if (correct === false) {
    borderColor = 'border-red-400';
    bgColor = 'bg-red-400/20';
  } else if (selected) {
    borderColor = 'border-amber-400';
    bgColor = 'bg-amber-400/10';
  }

  return (
    <motion.button
      className={`w-full p-5 md:p-6 rounded-2xl md:rounded-3xl border-[3px] text-left transition-colors cursor-pointer ${borderColor} ${bgColor} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      animate={correct === false ? { x: [0, -4, 4, -4, 4, 0] } : undefined}
      transition={correct === false ? { duration: 0.4 } : { type: 'spring', stiffness: 400 }}
      onClick={onClick}
      disabled={disabled}
      style={selected ? { borderColor: beltColor } : undefined}
    >
      <span className="font-baloo font-bold text-xl md:text-2xl text-white leading-snug">{text}</span>
      {subtext && (
        <span className="block font-poppins text-base md:text-lg text-white/50 mt-1">{subtext}</span>
      )}
    </motion.button>
  );
}
