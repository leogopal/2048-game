/*
  # Create game stats table for analytics

  1. New Tables
    - `game_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `games_played` (integer)
      - `games_won` (integer)
      - `total_score` (integer)
      - `highest_score` (integer)
      - `highest_tile` (integer)
      - `total_play_time_seconds` (integer)
      - `favorite_game_mode` (text)
      - `last_played_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `game_stats` table
    - Add policies for authenticated users to read own stats
    - Add policies for public read access to top stats
*/

CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_score BIGINT NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  highest_tile INTEGER NOT NULL DEFAULT 2,
  total_play_time_seconds INTEGER NOT NULL DEFAULT 0,
  favorite_game_mode TEXT,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own stats
CREATE POLICY "Users can read own game stats"
  ON game_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to update their own stats (should be done by triggers but as fallback)
CREATE POLICY "Users can update own game stats"
  ON game_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for public access to top stats for leaderboards
CREATE POLICY "Public can view top game stats"
  ON game_stats
  FOR SELECT
  TO anon
  USING (true);

-- Trigger to update updated_at on game stats changes
CREATE TRIGGER update_game_stats_updated_at
BEFORE UPDATE ON game_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX idx_game_stats_highest_score ON game_stats(highest_score DESC);
CREATE INDEX idx_game_stats_highest_tile ON game_stats(highest_tile DESC);
CREATE INDEX idx_game_stats_games_played ON game_stats(games_played DESC);

-- Function to initialize user stats on first game
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO game_stats (user_id, last_played_at)
  VALUES (NEW.user_id, now())
  ON CONFLICT (user_id) 
  DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create stats entry on first game
CREATE TRIGGER on_first_game_session
AFTER INSERT ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION initialize_user_stats();

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  game_mode_count INTEGER;
  current_favorite TEXT;
BEGIN
  -- Only process completed games
  IF NEW.completed = true THEN
    -- Get current favorite game mode
    SELECT favorite_game_mode INTO current_favorite FROM game_stats WHERE user_id = NEW.user_id;
    
    -- Count this game mode occurrences
    SELECT COUNT(*) INTO game_mode_count 
    FROM game_sessions 
    WHERE user_id = NEW.user_id AND game_mode = NEW.game_mode;
    
    -- Update user stats
    UPDATE game_stats
    SET 
      games_played = games_played + 1,
      games_won = CASE WHEN NEW.highest_tile >= 2048 THEN games_won + 1 ELSE games_won END,
      total_score = total_score + NEW.score,
      highest_score = GREATEST(highest_score, NEW.score),
      highest_tile = GREATEST(highest_tile, NEW.highest_tile),
      total_play_time_seconds = total_play_time_seconds + NEW.duration_seconds,
      favorite_game_mode = CASE 
        WHEN game_mode_count > (SELECT COUNT(*) FROM game_sessions WHERE user_id = NEW.user_id AND game_mode = current_favorite)
        THEN NEW.game_mode
        ELSE current_favorite
      END,
      last_played_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when a game is completed
CREATE TRIGGER on_game_completion
AFTER UPDATE OF completed ON game_sessions
FOR EACH ROW
WHEN (OLD.completed = false AND NEW.completed = true)
EXECUTE FUNCTION update_user_stats();