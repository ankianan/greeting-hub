import { User } from "lucide-react";
import { motion } from "framer-motion";

interface Participant {
  id: string;
  name: string;
}

interface ParticipantListProps {
  participants: Participant[];
  currentHolderId: string;
}

export const ParticipantList = ({ participants, currentHolderId }: ParticipantListProps) => {
  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Participants</h2>
      <div className="space-y-2">
        {participants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              participant.id === currentHolderId
                ? "bg-secondary text-secondary-foreground"
                : "bg-card text-card-foreground"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              participant.id === currentHolderId
                ? "bg-secondary-foreground/20"
                : "bg-muted"
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{participant.name}</p>
            </div>
            {participant.id === currentHolderId && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 rounded-full bg-secondary-foreground"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
