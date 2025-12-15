import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

interface EducationScreenProps {
  onComplete: () => void;
}

export const EducationScreen = ({ onComplete }: EducationScreenProps) => {
  const gestures = [
    {
      icon: ArrowLeft,
      direction: "Swipe Left",
      description: "Pass stone to previous player",
      color: "text-blue-500",
    },
    {
      icon: ArrowRight,
      direction: "Swipe Right",
      description: "Pass stone to next player",
      color: "text-green-500",
    },
    {
      icon: ArrowUp,
      direction: "Swipe Up",
      description: "Toss stone for anyone to claim",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">How to Play</h1>
          <p className="text-muted-foreground">
            Use swipe gestures to control the stone
          </p>
        </div>

        <div className="space-y-4">
          {gestures.map((gesture, index) => (
            <motion.div
              key={gesture.direction}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="flex items-center gap-4 p-4 bg-card rounded-lg border"
            >
              <div className={`p-3 rounded-full bg-muted ${gesture.color}`}>
                <gesture.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">{gesture.direction}</p>
                <p className="text-sm text-muted-foreground">
                  {gesture.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <Button onClick={onComplete} className="w-full" size="lg">
            Got it!
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
