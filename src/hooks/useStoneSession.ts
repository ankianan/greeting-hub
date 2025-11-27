import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Participant {
  id: string;
  name: string;
}

interface StoneState {
  currentHolderId: string;
  participants: Participant[];
}

export const useStoneSession = (userName: string) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [stoneState, setStoneState] = useState<StoneState>({
    currentHolderId: "",
    participants: [],
  });
  const [myId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const stoneChannel = supabase.channel("stone-room");

    stoneChannel
      .on("presence", { event: "sync" }, () => {
        const state = stoneChannel.presenceState();
        const allParticipants: Participant[] = [];
        let holder = "";

        Object.keys(state).forEach((key) => {
          const presences = state[key] as unknown as Array<{ id: string; name: string; hasStone?: boolean }>;
          presences.forEach((presence) => {
            allParticipants.push({
              id: presence.id,
              name: presence.name,
            });
            if (presence.hasStone) {
              holder = presence.id;
            }
          });
        });

        setStoneState({
          currentHolderId: holder || allParticipants[0]?.id || "",
          participants: allParticipants,
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const isFirstUser = Object.keys(stoneChannel.presenceState()).length === 0;
          await stoneChannel.track({
            id: myId,
            name: userName,
            hasStone: isFirstUser,
          });
        }
      });

    setChannel(stoneChannel);

    return () => {
      stoneChannel.unsubscribe();
    };
  }, [userName, myId]);

  const passStone = async (direction: "next" | "previous") => {
    if (!channel) return;

    const { participants, currentHolderId } = stoneState;
    const currentIndex = participants.findIndex((p) => p.id === currentHolderId);
    
    let nextIndex: number;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % participants.length;
    } else {
      nextIndex = currentIndex - 1 < 0 ? participants.length - 1 : currentIndex - 1;
    }
    
    const nextHolder = participants[nextIndex];

    // Update everyone's state
    const state = channel.presenceState();
    Object.keys(state).forEach(async (key) => {
      const presences = state[key] as unknown as Array<{ id: string; name: string }>;
      presences.forEach(async (presence) => {
        await channel.track({
          id: presence.id,
          name: presence.name,
          hasStone: presence.id === nextHolder.id,
        });
      });
    });
  };

  const hasStone = stoneState.currentHolderId === myId;

  return {
    stoneState,
    hasStone,
    myId,
    passStone,
  };
};
