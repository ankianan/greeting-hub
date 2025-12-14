import { motion, AnimatePresence, Easing } from "framer-motion";

interface StoneCircleProps {
  hasStone: boolean;
  isFloating?: boolean;
  exitDirection?: "left" | "right" | null;
}

export const StoneCircle = ({ hasStone, isFloating = false, exitDirection = null }: StoneCircleProps) => {
  const easeInOut: Easing = "easeInOut";
  
  const getAnimationProps = () => {
    if (isFloating) {
      return {
        animate: {
          y: [0, -15, 0],
          scale: [1, 1.02, 1],
          rotate: [0, 3, -3, 0],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: easeInOut,
        },
      };
    }

    if (hasStone) {
      return {
        animate: {
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: easeInOut,
        },
      };
    }

    return {
      animate: { scale: 1, rotate: 0 },
      transition: { duration: 0.3 },
    };
  };

  const animationProps = getAnimationProps();

  return (
    <div className="relative h-52 flex items-center justify-center overflow-visible">
      <AnimatePresence mode="wait">
        <motion.div
          key={isFloating ? "floating" : hasStone ? "holding" : "empty"}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-stone-light to-stone flex items-center justify-center"
          style={{
            boxShadow: isFloating 
              ? "0 20px 40px rgba(0,0,0,0.3), var(--shadow-stone), inset 0 4px 12px rgba(0,0,0,0.1)"
              : "var(--shadow-stone), inset 0 4px 12px rgba(0,0,0,0.1)",
          }}
          initial={{ 
            x: exitDirection === "left" ? 200 : exitDirection === "right" ? -200 : 0,
            rotate: exitDirection ? (exitDirection === "right" ? -180 : 180) : 0,
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
            ...animationProps.animate,
          }}
          exit={{
            x: exitDirection === "right" ? 200 : exitDirection === "left" ? -200 : 0,
            rotate: exitDirection === "right" ? 360 : exitDirection === "left" ? -360 : 0,
            opacity: 0,
          }}
          transition={{
            x: { duration: 0.4, ease: "easeOut" as Easing },
            opacity: { duration: 0.3 },
            rotate: { duration: 0.4 },
            scale: animationProps.transition,
            y: animationProps.transition,
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
            
            {(hasStone || isFloating) && (
              <motion.div
                className={`absolute inset-0 rounded-full ${isFloating ? "bg-primary/30" : "bg-secondary/20"}`}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: isFloating ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: isFloating ? 1.5 : 2,
                  repeat: Infinity,
                  ease: easeInOut,
                }}
              />
            )}

            {isFloating && (
              <motion.p
                className="text-xs font-medium text-primary-foreground/80 z-10"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Grab me!
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
