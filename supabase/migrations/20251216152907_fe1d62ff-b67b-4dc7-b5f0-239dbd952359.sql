-- Add is_public column to games table
ALTER TABLE public.games ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create index for efficient public game queries
CREATE INDEX idx_games_public_waiting ON public.games (is_public, status) WHERE is_public = true AND status = 'waiting';