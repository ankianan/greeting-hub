import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface GameHistory {
  id: string;
  join_code: string;
  created_at: string;
  status: string;
  score: number;
}

export default function GameHistory() {
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("game_participants")
        .select(`
          score,
          game_id,
          games (
            id,
            join_code,
            created_at,
            status
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      const formattedGames = data?.map((item: any) => ({
        id: item.games.id,
        join_code: item.games.join_code,
        created_at: item.games.created_at,
        status: item.games.status,
        score: item.score,
      })) || [];

      setGames(formattedGames);
    } catch (error) {
      console.error("Error loading game history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Game History</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : games.length === 0 ? (
          <p className="text-muted-foreground">No games played yet.</p>
        ) : (
          <div className="grid gap-4">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Code: {game.join_code}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {new Date(game.created_at).toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground capitalize">
                        Status: {game.status}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        Score: {game.score}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
