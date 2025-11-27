import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Participant {
  id: string;
  name: string;
  hasStone?: boolean;
}

interface GameState {
  gameId: string | null;
  joinCode: string;
  status: "waiting" | "active" | "guessing" | "finished";
  participants: Participant[];
  currentHolderId: string;
  creatorId: string;
  timeRemaining: number;
}

export const useGame = (userId: string) => {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    joinCode: "",
    status: "waiting",
    participants: [],
    currentHolderId: "",
    creatorId: "",
    timeRemaining: 60,
  });

  const createGame = async () => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        creator_id: userId,
        join_code: await generateJoinCode(),
        status: "waiting",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("game_participants").insert({
      game_id: data.id,
      user_id: userId,
    });

    return data;
  };

  const joinGame = async (joinCode: string) => {
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select()
      .eq("join_code", joinCode)
      .eq("status", "waiting")
      .single();

    if (gameError) throw gameError;

    const { error: participantError } = await supabase
      .from("game_participants")
      .insert({
        game_id: game.id,
        user_id: userId,
      });

    if (participantError) throw participantError;

    return game;
  };

  const startGame = async (gameId: string) => {
    const { error } = await supabase
      .from("games")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", gameId);

    if (error) throw error;
  };

  const passStone = async (gameId: string, nextHolderId: string) => {
    const { error } = await supabase
      .from("games")
      .update({ current_holder_id: nextHolderId })
      .eq("id", gameId);

    if (error) throw error;
  };

  const submitGuess = async (gameId: string, guessedUserId: string) => {
    const { error } = await supabase.from("game_guesses").insert({
      game_id: gameId,
      user_id: userId,
      guessed_user_id: guessedUserId,
    });

    if (error) throw error;
  };

  const generateJoinCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc("generate_join_code");
    if (error) throw error;
    return data;
  };

  return {
    gameState,
    setGameState,
    channel,
    setChannel,
    createGame,
    joinGame,
    startGame,
    passStone,
    submitGuess,
  };
};
