import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { StoneCircle } from "./StoneCircle";

interface SwipeableStoneProps {
  hasStone: boolean;
  isFloating: boolean;
  exitDirection: "left" | "right" | null;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onClaim: () => void;
  disabled: boolean;
}

export const SwipeableStone = ({
  hasStone,
  isFloating,
  exitDirection,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onClaim,
  disabled,
}: SwipeableStoneProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) => {
      const distance = Math.sqrt(latestX ** 2 + latestY ** 2);
      return Math.max(1 - distance / 300, 0.5);
    }
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    const { offset, velocity } = info;

    // Check for swipe up first (priority)
    if (offset.y < -threshold || velocity.y < -500) {
      onSwipeUp();
      return;
    }

    // Check for horizontal swipes
    if (offset.x > threshold || velocity.x > 500) {
      onSwipeRight();
    } else if (offset.x < -threshold || velocity.x < -500) {
      onSwipeLeft();
    }
  };

  // If stone is floating, show claim UI
  if (isFloating) {
    return (
      <motion.div
        className="cursor-pointer"
        onClick={onClaim}
        whileTap={{ scale: 0.95 }}
      >
        <StoneCircle hasStone={false} isFloating={true} exitDirection={exitDirection} />
        <p className="text-center mt-4 text-muted-foreground">Tap to claim!</p>
      </motion.div>
    );
  }

  // If user doesn't have the stone, show static view
  if (!hasStone || disabled) {
    return <StoneCircle hasStone={hasStone} isFloating={false} exitDirection={exitDirection} />;
  }

  // User has the stone - show swipeable
  return (
    <div className="relative touch-none">
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        style={{ x, y, rotate, opacity }}
        whileDrag={{ scale: 1.05 }}
        className="cursor-grab active:cursor-grabbing"
      >
        <StoneCircle hasStone={true} isFloating={false} exitDirection={exitDirection} />
      </motion.div>
      
      {/* Swipe hints */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          className="absolute -left-16 text-muted-foreground/50 text-sm"
          animate={{ x: [-5, 0, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ← Prev
        </motion.div>
        <motion.div
          className="absolute -right-16 text-muted-foreground/50 text-sm"
          animate={{ x: [5, 0, 5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Next →
        </motion.div>
        <motion.div
          className="absolute -top-8 text-muted-foreground/50 text-sm"
          animate={{ y: [-5, 0, -5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ↑ Toss
        </motion.div>
      </div>
    </div>
  );
};
