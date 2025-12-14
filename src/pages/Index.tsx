import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoneCircle } from "@/components/StoneCircle";
import { ParticipantList } from "@/components/ParticipantList";
import { ArrowLeft, ArrowRight, LogOut, History } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGame } from "@/hooks/useGame";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [gameView, setGameView] = useState<"menu" | "create" | "join" | "playing" | "guessing">("menu");
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [selectedGuess, setSelectedGuess] = useState<string>("");
  const [lastAction, setLastAction] = useState<{ direction: "next" | "previous"; to: string } | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  
  const gameHook = useGame(user?.id || "");

  const loadParticipants = useCallback(async (gameId: string) => {
    const { data } = await supabase
      .from("game_participants")
      .select(`
        user_id,
        profiles (name)
      `)
      .eq("game_id", gameId);

    setParticipants(data || []);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (!currentGame?.id) return;

    const gameId = currentGame.id;
    
    loadParticipants(gameId);

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const newGame = payload.new as any;
          setCurrentGame(newGame);
          setLastStatus((prev) => {
            const wasActive = prev === "active";
            const isActive = newGame?.status === "active";

            if (!wasActive && isActive) {
              setGameView("playing");
              setTimeRemaining(60);
              setLastAction(null);
            } else if (newGame?.status === "guessing") {
              setGameView("guessing");
            }

            return newGame?.status ?? prev;
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_participants",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadParticipants(gameId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGame?.id, loadParticipants]);

  useEffect(() => {
    if (gameView === "playing" && currentGame?.status === "active") {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameView, currentGame?.status]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select()
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data);
  };

  const handleCreateGame = async () => {
    try {
      const game = await gameHook.createGame();
      setCurrentGame(game);
      setGameView("create");
      toast.success(`Game created! Code: ${game.join_code}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleJoinGame = async () => {
    try {
      const game = await gameHook.joinGame(joinCode);
      setCurrentGame(game);
      setGameView("create");
      toast.success("Joined game successfully!");
    } catch (error: any) {
      toast.error("Failed to join game");
    }
  };

  const handleStartGame = async () => {
    try {
      await gameHook.startGame(currentGame.id);
      
      const firstParticipant = participants[0];
      await gameHook.passStone(currentGame.id, firstParticipant.user_id);
      
      setGameView("playing");
      setTimeRemaining(60);
      toast.success("Game started!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePassStone = async (direction: "next" | "previous") => {
    if (!currentGame || !participants.length) return;

    const currentIndex = participants.findIndex(
      (p) => p.user_id === currentGame.current_holder_id
    );
    let nextIndex = direction === "next"
      ? (currentIndex + 1) % participants.length
      : currentIndex - 1 < 0 ? participants.length - 1 : currentIndex - 1;

    const nextHolder = participants[nextIndex];
    await gameHook.passStone(currentGame.id, nextHolder.user_id);
    setLastAction({ direction, to: nextHolder.user_id });
  };

  const endGame = async () => {
    if (!currentGame) return;
    await supabase
      .from("games")
      .update({ status: "guessing" })
      .eq("id", currentGame.id);
  };

  const handleSubmitGuess = async () => {
    if (!selectedGuess) {
      toast.error("Please select a player");
      return;
    }

    try {
      await gameHook.submitGuess(currentGame.id, selectedGuess);
      
      const { data: guesses } = await supabase
        .from("game_guesses")
        .select()
        .eq("game_id", currentGame.id);

      if (guesses && guesses.length === participants.length) {
        await calculateScores();
      }

      toast.success("Guess submitted!");
      setGameView("menu");
      setCurrentGame(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateScores = async () => {
    if (!currentGame) return;

    const { data: guesses } = await supabase
      .from("game_guesses")
      .select()
      .eq("game_id", currentGame.id);

    for (const guess of guesses || []) {
      const isCorrect = guess.guessed_user_id === currentGame.current_holder_id;
      
      await supabase
        .from("game_guesses")
        .update({ is_correct: isCorrect })
        .eq("id", guess.id);

      if (isCorrect) {
        await supabase.rpc("increment", {
          row_id: guess.user_id,
          game_id: currentGame.id,
        });
      }
    }

    await supabase
      .from("games")
      .update({ status: "finished", ended_at: new Date().toISOString() })
      .eq("id", currentGame.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (gameView === "menu") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">The Passing Stone</h1>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/history")} variant="outline">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button onClick={signOut} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Game</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateGame} className="w-full">
                  Create New Game
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Join Code</Label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleJoinGame} className="w-full">
                  Join Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameView === "create") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Waiting for Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Share this code:</p>
                <p className="text-4xl font-bold tracking-wider">{currentGame?.join_code}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Players:</p>
                <div className="space-y-2">
                  {participants.map((p: any) => (
                    <div key={p.user_id} className="p-2 bg-muted rounded">
                      {p.profiles?.name}
                    </div>
                  ))}
                </div>
              </div>

              {currentGame?.creator_id === user?.id && (
                <Button
                  onClick={handleStartGame}
                  disabled={participants.length < 2}
                  className="w-full"
                >
                  Start Game ({participants.length} players)
                </Button>
              )}
              {currentGame?.creator_id !== user?.id && (
                <p className="text-center text-muted-foreground">
                  Waiting for host to start the game...
                </p>
              )}

              <Button onClick={() => setGameView("menu")} variant="outline" className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameView === "guessing") {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Who has the stone?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((p: any) => (
                <Button
                  key={p.user_id}
                  onClick={() => setSelectedGuess(p.user_id)}
                  variant={selectedGuess === p.user_id ? "default" : "outline"}
                  className="w-full"
                >
                  {p.profiles?.name}
                </Button>
              ))}
              <Button onClick={handleSubmitGuess} className="w-full mt-4">
                Submit Guess
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">The Passing Stone</h1>
          <p className="text-2xl font-bold text-primary">
            Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <StoneCircle hasStone={currentGame?.current_holder_id === user?.id} />

          <div className="flex gap-4">
            <Button
              onClick={() => handlePassStone("previous")}
              disabled={currentGame?.current_holder_id !== user?.id}
              size="lg"
              variant="outline"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => handlePassStone("next")}
              disabled={currentGame?.current_holder_id !== user?.id}
              size="lg"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {lastAction && (
            <p className="text-sm text-muted-foreground">
              Last action: Passed {lastAction.direction} to {participants.find(p => p.user_id === lastAction.to)?.profiles?.name}
            </p>
          )}

          <ParticipantList
            participants={participants.map((p: any) => ({
              id: p.user_id,
              name: p.profiles?.name,
            }))}
            currentHolderId=""
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
