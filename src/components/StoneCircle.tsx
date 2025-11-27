import { motion } from "framer-motion";

interface StoneCircleProps {
  hasStone: boolean;
}

export const StoneCircle = ({ hasStone }: StoneCircleProps) => {
  return (
    <div className="relative">
      <motion.div
        className="w-48 h-48 rounded-full bg-gradient-to-br from-stone-light to-stone flex items-center justify-center"
        style={{
          boxShadow: "var(--shadow-stone), inset 0 4px 12px rgba(0,0,0,0.1)",
        }}
        animate={{
          scale: hasStone ? [1, 1.05, 1] : 1,
          rotate: hasStone ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: hasStone ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="w-40 h-40 rounded-full bg-gradient-to-br from-stone to-stone-dark flex items-center justify-center relative overflow-hidden"
          style={{
            boxShadow: "inset 0 8px 16px rgba(0,0,0,0.3), 0 2px 8px rgba(255,255,255,0.1)",
          }}
        >
          {/* Stone texture overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
                <feColorMatrix values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.4 0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
          </div>
          
          {hasStone && (
            <motion.div
              className="absolute inset-0 bg-secondary/20 rounded-full"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
