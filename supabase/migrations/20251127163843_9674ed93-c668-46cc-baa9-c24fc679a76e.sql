-- Create function to increment participant score
CREATE OR REPLACE FUNCTION increment(row_id uuid, game_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE game_participants
  SET score = score + 1
  WHERE user_id = row_id AND game_participants.game_id = increment.game_id;
END;
$$;