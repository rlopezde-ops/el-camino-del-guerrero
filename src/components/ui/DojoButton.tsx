import { motion, type HTMLMotionProps } from 'framer-motion';

interface DojoButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  beltColor?: string;
}

const variantStyles = {
  primary: 'bg-amber-500 text-dojo-dark shadow-[0_4px_0_0_#b45309] hover:bg-amber-400 active:shadow-[0_1px_0_0_#b45309] active:translate-y-[3px]',
  secondary: 'bg-dojo-indigo text-white shadow-[0_4px_0_0_#0a1f3d] hover:bg-dojo-indigo/90 active:shadow-[0_1px_0_0_#0a1f3d] active:translate-y-[3px]',
  danger: 'bg-red-600 text-white shadow-[0_4px_0_0_#991b1b] hover:bg-red-500 active:shadow-[0_1px_0_0_#991b1b] active:translate-y-[3px]',
  ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/10',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export default function DojoButton({
  children,
  variant = 'primary',
  size = 'md',
  beltColor,
  className = '',
  ...props
}: DojoButtonProps) {
  const style = beltColor
    ? { backgroundColor: beltColor, boxShadow: `0 4px 0 0 color-mix(in srgb, ${beltColor} 70%, black)` }
    : undefined;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`font-baloo font-bold cursor-pointer transition-all duration-100 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
}
