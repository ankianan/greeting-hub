-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone in a game context
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Create games table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'guessing', 'finished')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  current_holder_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Games are viewable by everyone
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

-- Only creators can insert games
CREATE POLICY "Creators can insert games"
  ON public.games FOR INSERT
  WITH CHECK (true);

-- Create game_participants table
CREATE TABLE public.game_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Enable RLS
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Participants are viewable by everyone in the game
CREATE POLICY "Participants are viewable by everyone"
  ON public.game_participants FOR SELECT
  USING (true);

-- Users can join games
CREATE POLICY "Users can join games"
  ON public.game_participants FOR INSERT
  WITH CHECK (true);

-- Users can update their own participation
CREATE POLICY "Users can update their participation"
  ON public.game_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Now add the games update policy that references game_participants
CREATE POLICY "Creators and participants can update games"
  ON public.games FOR UPDATE
  USING (creator_id = auth.uid() OR id IN (
    SELECT game_id FROM public.game_participants WHERE user_id = auth.uid()
  ));

-- Create game_guesses table
CREATE TABLE public.game_guesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  guessed_user_id UUID NOT NULL REFERENCES public.profiles(id),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Enable RLS
ALTER TABLE public.game_guesses ENABLE ROW LEVEL SECURITY;

-- Guesses are viewable by everyone in the game
CREATE POLICY "Guesses are viewable by everyone"
  ON public.game_guesses FOR SELECT
  USING (true);

-- Users can insert their own guesses
CREATE POLICY "Users can insert guesses"
  ON public.game_guesses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create function to generate random join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for all game tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_guesses;