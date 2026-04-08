import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SpeechBubbleProps {
  text: string;
  typingSpeed?: number;
  onComplete?: () => void;
  className?: string;
}

export default function SpeechBubble({
  text,
  typingSpeed = 30,
  onComplete,
  className = '',
}: SpeechBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, typingSpeed);
    return () => clearInterval(interval);
  }, [text, typingSpeed, onComplete]);

  return (
    <motion.div
      className={`relative bg-white/90 backdrop-blur-sm text-dojo-dark rounded-2xl px-5 py-3 max-w-sm ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <p className="font-poppins text-base leading-relaxed">
        {displayed}
        {!done && (
          <motion.span
            className="inline-block w-0.5 h-4 bg-dojo-dark ml-0.5 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}
      </p>
      <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white/90 rotate-45" />
    </motion.div>
  );
}
