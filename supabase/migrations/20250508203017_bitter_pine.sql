/*
  # Create game sessions table

  1. New Tables
    - `game_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `score` (integer)
      - `highest_tile` (integer)
      - `moves_count` (integer)
      - `duration_seconds` (integer)
      - `grid_size` (integer)
      - `game_mode` (text)
      - `completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `game_sessions` table
    - Add policies for authenticated users to read own game sessions
    - Add policies for authenticated users to create and update own game sessions
    - Add policies for public read access to high scores
*/

CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  highest_tile INTEGER NOT NULL DEFAULT 2,
  moves_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  grid_size INTEGER NOT NULL DEFAULT 4,
  game_mode TEXT NOT NULL DEFAULT 'classic',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own game sessions
CREATE POLICY "Users can read own game sessions"
  ON game_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to create their own game sessions
CREATE POLICY "Users can create own game sessions"
  ON game_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own game sessions
CREATE POLICY "Users can update own game sessions"
  ON game_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for public access to high scores for leaderboards
CREATE POLICY "Public can view high scores"
  ON game_sessions
  FOR SELECT
  TO anon
  USING (completed = true)
  WITH CHECK (completed = true);

-- Trigger to update updated_at on game session changes
CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster user_id lookups
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);

-- Create index for leaderboard queries
CREATE INDEX idx_game_sessions_score ON game_sessions(score DESC, created_at);

-- Create index for game mode filtering
CREATE INDEX idx_game_sessions_game_mode ON game_sessions(game_mode, completed);

-- Create index for highest tile achievements
CREATE INDEX idx_game_sessions_highest_tile ON game_sessions(highest_tile DESC);