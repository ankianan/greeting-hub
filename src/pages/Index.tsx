import { useState } from "react";
import { StoneCircle } from "@/components/StoneCircle";
import { ParticipantList } from "@/components/ParticipantList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoneSession } from "@/hooks/useStoneSession";
import { motion } from "framer-motion";

const Index = () => {
  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const { stoneState, hasStone, passStone } = useStoneSession(userName);

  const handleJoin = () => {
    if (userName.trim()) {
      setHasJoined(true);
    }
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">The Passing Stone</h1>
            <p className="text-muted-foreground">Enter your name to join the circle</p>
          </div>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              className="text-lg"
            />
            <Button onClick={handleJoin} size="lg" className="w-full">
              Join Circle
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">The Passing Stone</h1>
          <p className="text-muted-foreground">
            {hasStone ? "You hold the stone" : `${stoneState.participants.find(p => p.id === stoneState.currentHolderId)?.name || "Someone"} holds the stone`}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12">
          <div className="flex items-center gap-8">
            <Button
              onClick={() => passStone("previous")}
              disabled={!hasStone || stoneState.participants.length < 2}
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full p-0"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <StoneCircle hasStone={hasStone} />

            <Button
              onClick={() => passStone("next")}
              disabled={!hasStone || stoneState.participants.length < 2}
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full p-0"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          <ParticipantList
            participants={stoneState.participants}
            currentHolderId={stoneState.currentHolderId}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
